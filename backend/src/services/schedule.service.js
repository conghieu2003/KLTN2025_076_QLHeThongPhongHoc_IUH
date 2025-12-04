const db = require('../config/db.config');
const PDFDocument = require('pdfkit');

// Lấy danh sách lịch học với filter
const getSchedules = async (filters = {}) => {
  try {
    let query = `
      SELECT 
        cs.id,
        cs.classId,
        c.className,
        c.code as classCode,
        c.subjectCode,
        cs.teacherId,
        u.fullName as teacherName,
        cs.classRoomId,
        cr.name as roomName,
        cs.dayOfWeek,
        ts.slotName as timeSlot,
        CONCAT(ts.startTime, '-', ts.endTime) as timeRange,
        ts.shift,
        CASE 
          WHEN c.classType = 'theory' THEN 'theory'
          WHEN c.classType = 'practice' THEN 'practice'
          WHEN c.classType = 'mixed' THEN 'theory'
          ELSE 'theory'
        END as type,
        cs.status,
        cs.weekPattern,
        cs.startWeek,
        cs.endWeek
      FROM ClassSchedule cs
      INNER JOIN Class c ON cs.classId = c.id
      INNER JOIN Teacher t ON cs.teacherId = t.id
      INNER JOIN [User] u ON t.userId = u.id
      INNER JOIN TimeSlot ts ON cs.timeSlotId = ts.id
      LEFT JOIN ClassRoom cr ON cs.classRoomId = cr.id
      WHERE 1=1
    `;

    const params = [];

    // Filter theo khoa
    if (filters.departmentId) {
      query += ' AND c.departmentId = ?';
      params.push(filters.departmentId);
    }

    // Filter theo lớp
    if (filters.classId) {
      query += ' AND cs.classId = ?';
      params.push(filters.classId);
    }

    // Filter theo giảng viên
    if (filters.teacherId) {
      query += ' AND cs.teacherId = ?';
      params.push(filters.teacherId);
    }

    // Filter theo loại lịch
    if (filters.scheduleType && filters.scheduleType !== 'all') {
      if (filters.scheduleType === 'study') {
        query += ' AND c.classType IN (?, ?)';
        params.push('theory', 'practice');
      } else if (filters.scheduleType === 'exam') {
        query += ' AND cs.status = ?';
        params.push('exam');
      }
    }

    // Filter theo ngày
    if (filters.startDate) {
      query += ' AND cs.createdAt >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND cs.createdAt <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY cs.dayOfWeek, ts.startTime';

    const result = await db.query(query, params);
    return result.recordset;
  } catch (error) {
    console.error('Error in getSchedules:', error);
    throw error;
  }
};

// Lấy lịch học theo tuần với thông tin ngoại lệ
const getWeeklySchedule = async (weekStartDate, filters = {}) => {
  try {
    // Tính toán ngày bắt đầu và kết thúc tuần
    const startDate = new Date(weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const whereClause = {
      OR: [
        { statusId: { in: [2, 3, 5, 6] } },
        { 
          AND: [
            { statusId: 1 },
            { classRoomId: { not: null } } 
          ]
        }
      ]
    };

    // Filter theo khoa
    if (filters.departmentId) {
      whereClause.class = {
        departmentId: filters.departmentId
      };
    }

    // Filter theo lớp
    if (filters.classId) {
      whereClause.classId = filters.classId;
    }

    // Filter theo giảng viên
    if (filters.teacherId) {
      whereClause.teacherId = filters.teacherId;
    }

    // Filter theo loại lịch
    if (filters.scheduleType && filters.scheduleType !== 'all') {
      if (filters.scheduleType === 'study') {
        whereClause.OR = [
          { statusId: { in: [2, 3] } }, 
          { 
            AND: [
              { statusId: 1 }, 
              { classRoomId: { not: null } } 
            ]
          }
        ];
      } else if (filters.scheduleType === 'exam') {
        whereClause.OR = [
          { statusId: 6 } 
        ];
      }
    }

    const schedules = await db.classSchedule.findMany({
      where: whereClause,
      include: {
        class: {
          include: {
            department: true,
            major: true
          }
        },
        teacher: {
          include: {
            user: true
          }
        },
        timeSlot: true,
        classRoom: true,
        ClassRoomType: true,
        RequestType: true,
         scheduleRequests: {
           where: {
             requestStatusId: 2, 
             requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9, 10] } 
           },
           include: {
             RequestType: true,
             movedToTimeSlot: true,
             movedToClassRoom: true,
             newTimeSlot: true,
             newClassRoom: true,
             substituteTeacher: {
               include: {
                 user: true
               }
             }
           }
         }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { timeSlot: { startTime: 'asc' } }
      ]
    });
    const result = [];
    
    schedules.forEach(schedule => {
      const relevantExceptions = schedule.scheduleRequests.filter(request => {
        if (!request.exceptionDate) return false;
        
        const exceptionDate = new Date(request.exceptionDate);
        const exceptionDateStr = exceptionDate.toISOString().split('T')[0]; 
        const startDateObj = new Date(weekStartDate);
        let scheduleDayOffset;
        if (schedule.dayOfWeek === 1) { 
          scheduleDayOffset = 6; 
        } else {
          scheduleDayOffset = schedule.dayOfWeek - 2; 
        }
        const scheduleDate = new Date(startDateObj);
        scheduleDate.setDate(startDateObj.getDate() + scheduleDayOffset);
        const scheduleDateStr = scheduleDate.toISOString().split('T')[0]; 
        // Chỉ lấy ngoại lệ khi ngày ngoại lệ khớp chính xác với ngày của schedule
        const isRelevant = exceptionDateStr === scheduleDateStr;
        
        return isRelevant;
      });
      const exception = relevantExceptions.length > 0 ? relevantExceptions[0] : null;
      
      // Nếu có ngoại lệ moved hoặc exam
      const isMoved = exception && (exception.exceptionType === 'moved' || exception.exceptionType === 'exam');
      const movedToDate = exception?.movedToDate;
      let isMovedToThisWeek = false;
      let movedToDayOfWeek = null;
      
      if (isMoved && movedToDate) {
        const movedDate = new Date(movedToDate);
        const startDateObj = new Date(weekStartDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + 6);
        
        // Kiểm tra movedDate có nằm trong tuần hiện tại không
        if (movedDate >= startDateObj && movedDate <= endDateObj) {
          isMovedToThisWeek = true;
          
          // Tính dayOfWeek từ movedDate
          const movedDayJS = movedDate.getDay(); 7
          movedToDayOfWeek = movedDayJS === 0 ? 1 : movedDayJS + 1; 
        }
      }

      const shouldShowOriginal = !isMoved;
      
      if (shouldShowOriginal) {
        result.push({
          id: schedule.id,
          classId: schedule.classId,
          className: schedule.class.className,
          classCode: schedule.class.code,
          subjectCode: schedule.class.subjectCode,
          subjectName: schedule.class.subjectName,
          teacherId: schedule.teacherId,
          teacherName: schedule.teacher.user.fullName,
          teacherCode: schedule.teacher.teacherCode,
          roomId: schedule.classRoomId,
          roomName: schedule.classRoom?.name || null,
          roomCode: schedule.classRoom?.code || null,
          roomType: schedule.ClassRoomType.name,
          dayOfWeek: schedule.dayOfWeek,
          timeSlot: schedule.timeSlot.slotName,
          timeRange: `${schedule.timeSlot.startTime}-${schedule.timeSlot.endTime}`,
          startTime: schedule.timeSlot.startTime,
          endTime: schedule.timeSlot.endTime,
          shift: schedule.timeSlot.shift,
          shiftName: schedule.timeSlot.shift === 1 ? 'morning' : 
                     schedule.timeSlot.shift === 2 ? 'afternoon' : 'evening',
          type: schedule.ClassRoomType.name === 'Lý thuyết' ? 'theory' :
                schedule.ClassRoomType.name === 'Thực hành' ? 'practice' : 'online',
          status: schedule.RequestType.name,
          statusId: schedule.statusId,
          weekPattern: schedule.weekPattern,
          startWeek: schedule.startWeek,
          endWeek: schedule.endWeek,
          practiceGroup: schedule.practiceGroup,
          maxStudents: schedule.class.maxStudents,
          departmentId: schedule.class.departmentId,
          departmentName: schedule.class.department?.name || null,
          majorId: schedule.class.majorId,
          majorName: schedule.class.major?.name || null,
          timeSlotOrder: schedule.timeSlot.id,
          assignedAt: schedule.assignedAt,
          note: schedule.note,

          exceptionDate: exception?.exceptionDate || null,
          exceptionType: exception?.exceptionType || null,
          exceptionReason: exception?.reason || null,
          exceptionStatus: exception?.RequestType?.name || null,
          requestTypeId: exception?.requestTypeId || null,
          isOriginalSchedule: true
        });
      }
      
      // Nếu có lịch được chuyển đến trong tuần này
      if (isMovedToThisWeek && movedToDayOfWeek) {
        const movedTimeSlot = exception.movedToTimeSlot || exception.newTimeSlot;
        const movedRoom = exception.movedToClassRoom || exception.newClassRoom;
        const substituteTeacher = exception.substituteTeacher;
        
        result.push({
          id: schedule.id + 100000, 
          classId: schedule.classId,
          className: schedule.class.className,
          classCode: schedule.class.code,
          subjectCode: schedule.class.subjectCode,
          subjectName: schedule.class.subjectName,
          teacherId: substituteTeacher ? substituteTeacher.id : schedule.teacherId,
          teacherName: substituteTeacher ? substituteTeacher.user.fullName : schedule.teacher.user.fullName,
          teacherCode: substituteTeacher ? substituteTeacher.teacherCode : schedule.teacher.teacherCode,
          roomId: movedRoom ? movedRoom.id : schedule.classRoomId,
          roomName: movedRoom ? movedRoom.name : schedule.classRoom?.name || null,
          roomCode: movedRoom ? movedRoom.code : schedule.classRoom?.code || null,
          roomType: schedule.ClassRoomType.name,
          dayOfWeek: movedToDayOfWeek, 
          timeSlot: movedTimeSlot ? movedTimeSlot.slotName : schedule.timeSlot.slotName,
          timeRange: movedTimeSlot ? `${movedTimeSlot.startTime}-${movedTimeSlot.endTime}` : `${schedule.timeSlot.startTime}-${schedule.timeSlot.endTime}`,
          startTime: movedTimeSlot ? movedTimeSlot.startTime : schedule.timeSlot.startTime,
          endTime: movedTimeSlot ? movedTimeSlot.endTime : schedule.timeSlot.endTime,
          shift: movedTimeSlot ? movedTimeSlot.shift : schedule.timeSlot.shift,
          shiftName: movedTimeSlot ? 
                     (movedTimeSlot.shift === 1 ? 'morning' : movedTimeSlot.shift === 2 ? 'afternoon' : 'evening') :
                     (schedule.timeSlot.shift === 1 ? 'morning' : schedule.timeSlot.shift === 2 ? 'afternoon' : 'evening'),
          type: schedule.ClassRoomType.name === 'Lý thuyết' ? 'theory' :
                schedule.ClassRoomType.name === 'Thực hành' ? 'practice' : 'online',
          status: exception.RequestType.name,
          statusId: exception.requestTypeId,
          weekPattern: schedule.weekPattern,
          startWeek: schedule.startWeek,
          endWeek: schedule.endWeek,
          practiceGroup: schedule.practiceGroup,
          maxStudents: schedule.class.maxStudents,
          departmentId: schedule.class.departmentId,
          departmentName: schedule.class.department?.name || null,
          majorId: schedule.class.majorId,
          majorName: schedule.class.major?.name || null,
          timeSlotOrder: movedTimeSlot ? movedTimeSlot.id : schedule.timeSlot.id,
          assignedAt: schedule.assignedAt,
          note: `Đã chuyển từ ${schedule.dayOfWeek === 1 ? 'CN' : 'T' + (schedule.dayOfWeek)} - ${schedule.timeSlot.slotName}`,
          exceptionDate: exception.exceptionDate,
          exceptionType: exception.exceptionType,
          exceptionReason: exception.reason,
          exceptionStatus: exception.RequestType.name,
          requestTypeId: exception.requestTypeId,
          isMovedSchedule: true, 
          originalDayOfWeek: schedule.dayOfWeek,
          originalTimeSlot: schedule.timeSlot.slotName
        });
      }
    });

    return result;
  } catch (error) {
    console.error('Error in getWeeklySchedule:', error);
    throw error;
  }
};

// Lấy danh sách khoa
const getDepartments = async () => {
  try {
    const query = 'SELECT id, code, name FROM Department ORDER BY name';
    const result = await db.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Error in getDepartments:', error);
    throw error;
  }
};

// Lấy danh sách lớp học
const getClasses = async (departmentId) => {
  try {
    let query = 'SELECT id, code, className, departmentId FROM Class';
    const params = [];

    if (departmentId) {
      query += ' WHERE departmentId = ?';
      params.push(departmentId);
    }

    query += ' ORDER BY className';

    const result = await db.query(query, params);
    return result.recordset;
  } catch (error) {
    console.error('Error in getClasses:', error);
    throw error;
  }
};

// Lấy danh sách giảng viên
const getTeachers = async (departmentId) => {
  try {
    let query = `
      SELECT t.id, u.fullName as name, t.teacherCode as code, t.departmentId
      FROM Teacher t
      INNER JOIN [User] u ON t.userId = u.id
    `;
    const params = [];

    if (departmentId) {
      query += ' WHERE t.departmentId = ?';
      params.push(departmentId);
    }

    query += ' ORDER BY u.fullName';

    const result = await db.query(query, params);
    return result.recordset;
  } catch (error) {
    console.error('Error in getTeachers:', error);
    throw error;
  }
};

// Tạo lịch học mới
const createSchedule = async (scheduleData) => {
  try {
    const {
      classId,
      teacherId,
      classRoomId,
      dayOfWeek,
      timeSlotId,
      weekPattern,
      startWeek,
      endWeek,
      status,
      assignedBy,
      note
    } = scheduleData;

    const query = `
      INSERT INTO ClassSchedule 
      (classId, teacherId, classRoomId, dayOfWeek, timeSlotId, weekPattern, startWeek, endWeek, status, assignedBy, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      classId,
      teacherId,
      classRoomId,
      dayOfWeek,
      timeSlotId,
      weekPattern,
      startWeek,
      endWeek,
      status || 'pending',
      assignedBy,
      note
    ];

    const result = await db.query(query, params);
    return { id: result.recordset.insertId, ...scheduleData };
  } catch (error) {
    console.error('Error in createSchedule:', error);
    throw error;
  }
};

// Cập nhật lịch học
const updateSchedule = async (id, scheduleData) => {
  try {
    const {
      classId,
      teacherId,
      classRoomId,
      dayOfWeek,
      timeSlotId,
      weekPattern,
      startWeek,
      endWeek,
      status,
      assignedBy,
      note
    } = scheduleData;

    const query = `
      UPDATE ClassSchedule 
      SET classId = ?, teacherId = ?, classRoomId = ?, dayOfWeek = ?, timeSlotId = ?, 
          weekPattern = ?, startWeek = ?, endWeek = ?, status = ?, assignedBy = ?, note = ?,
          updatedAt = GETDATE()
      WHERE id = ?
    `;

    const params = [
      classId,
      teacherId,
      classRoomId,
      dayOfWeek,
      timeSlotId,
      weekPattern,
      startWeek,
      endWeek,
      status,
      assignedBy,
      note,
      id
    ];

    await db.query(query, params);
    return { id, ...scheduleData };
  } catch (error) {
    console.error('Error in updateSchedule:', error);
    throw error;
  }
};

// Xóa lịch học
const deleteSchedule = async (id) => {
  try {
    const query = 'DELETE FROM ClassSchedule WHERE id = ?';
    await db.query(query, [id]);
  } catch (error) {
    console.error('Error in deleteSchedule:', error);
    throw error;
  }
};

// In lịch học (tạo PDF)
const printSchedule = async (filters = {}) => {
  try {
    const schedules = await getSchedules(filters);
    
    const doc = new PDFDocument();
    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      // PDF generation completed
    });

    // Header
    doc.fontSize(20).text('Lịch học, lịch thi theo tuần', 50, 50);
    doc.fontSize(12).text(`Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`, 50, 80);

    // Table headers
    let y = 120;
    doc.fontSize(10);
    doc.text('Lớp học', 50, y);
    doc.text('Giảng viên', 150, y);
    doc.text('Phòng', 250, y);
    doc.text('Thứ', 300, y);
    doc.text('Tiết', 350, y);
    doc.text('Trạng thái', 400, y);

    y += 20;
    doc.moveTo(50, y).lineTo(500, y).stroke();

    // Schedule data
    schedules.forEach(schedule => {
      y += 20;
      doc.text(schedule.className || '', 50, y);
      doc.text(schedule.teacherName || '', 150, y);
      doc.text(schedule.roomName || 'Chưa sắp xếp', 250, y);
      doc.text(schedule.dayOfWeek ? `Thứ ${schedule.dayOfWeek}` : '', 300, y);
      doc.text(schedule.timeSlot || '', 350, y);
      doc.text(schedule.status || '', 400, y);
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
    });
  } catch (error) {
    console.error('Error in printSchedule:', error);
    throw error;
  }
};

module.exports = {
  getSchedules,
  getWeeklySchedule,
  getDepartments,
  getClasses,
  getTeachers,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  printSchedule
};