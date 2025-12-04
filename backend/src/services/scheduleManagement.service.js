const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SocketClient = require('../utils/socketClient');

class ScheduleManagementService {
  async getClassesForScheduling() {
    try {
      const classes = await prisma.class.findMany({
        include: {
          teacher: {
            include: {
              user: true,
              department: true
            }
          },
          department: true,
          major: true,
          ClassRoomType: true,
          classSchedules: {
            include: {
              timeSlot: true,
              classRoom: true,
              ClassRoomType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Lọc chỉ lấy lớp có classSchedules (có lịch học)
      const classesWithSchedules = classes.filter(cls => {
        return cls.classSchedules && cls.classSchedules.length > 0;
      });

      return classesWithSchedules.map(cls => {
         // Xác định trạng thái lớp: chỉ khi TẤT CẢ lịch học đều có phòng mới coi là "Đã phân phòng"
         const allSchedulesAssigned = cls.classSchedules.length > 0 && cls.classSchedules.every(schedule => schedule.statusId === 2);
         const classStatusId = allSchedulesAssigned ? 2 : 1;
         
         // Lấy TẤT CẢ schedules (bao gồm cả schedules chưa có phòng)
         const allSchedules = cls.classSchedules;
        
        return {
          id: cls.id.toString(),
          classId: cls.id,
          className: cls.className || 'Chưa có tên',
          code: cls.code || cls.subjectCode || `CLASS${cls.id}`, 
          subjectCode: cls.subjectCode,
          subjectName: cls.subjectName,
          teacherName: cls.teacher?.user?.fullName || 'Chưa xác định',
          departmentName: cls.department?.name || 'Chưa xác định',
          department: cls.department,
          majorName: cls.major?.name || 'Chưa xác định',
          maxStudents: cls.maxStudents,
          classRoomTypeId: cls.classRoomTypeId,
          classRoomTypeName: cls.ClassRoomType?.name || 'Chưa xác định',
          departmentId: cls.departmentId,
          statusId: classStatusId,
          startDate: cls.startDate ? (() => {
            try {
              if (cls.startDate instanceof Date) {
                return cls.startDate.toISOString().split('T')[0];
              }
              const dateStr = String(cls.startDate);
              return dateStr.split('T')[0].split(' ')[0];
            } catch (e) {
              console.error('Error formatting startDate:', e);
              return null;
            }
          })() : null,
          endDate: cls.endDate ? (() => {
            try {
              if (cls.endDate instanceof Date) {
                return cls.endDate.toISOString().split('T')[0];
              }
              const dateStr = String(cls.endDate);
              return dateStr.split('T')[0].split(' ')[0];
            } catch (e) {
              console.error('Error formatting endDate:', e);
              return null;
            }
          })() : null,
          schedules: allSchedules.map(schedule => ({
              id: schedule.id,
              dayOfWeek: schedule.dayOfWeek,
              dayName: this.getDayName(schedule.dayOfWeek),
              timeSlot: schedule.timeSlot.slotName,
              roomId: schedule.classRoomId,
              roomName: schedule.classRoom?.name || null,
              roomCode: schedule.classRoom?.code || null,
              classRoomTypeId: schedule.classRoomTypeId,
              classRoomTypeName: schedule.ClassRoomType?.name || 'Chưa xác định',
              practiceGroup: schedule.practiceGroup,
              statusId: schedule.statusId,
              statusName: this.getStatusName(schedule.statusId)
            }))
        };
      });
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách lớp học: ${error.message}`);
    }
  }

  // Lấy thống kê sắp xếp phòng
  async getSchedulingStats() {
    try {
      // Đếm lịch học theo statusId
      const totalSchedules = await prisma.classSchedule.count();
      const pendingSchedules = await prisma.classSchedule.count({
        where: { statusId: 1 }
      });
      const assignedSchedules = await prisma.classSchedule.count({
        where: { statusId: 2 }
      });

      // Đếm lớp học
      const allClasses = await prisma.class.findMany({
        include: { classSchedules: true }
      });

      let assignedClasses = 0;
      let pendingClasses = 0;

      allClasses.forEach(cls => {
         // Chỉ coi là "đã phân phòng" khi TẤT CẢ lịch học đều có phòng
         const allSchedulesAssigned = cls.classSchedules.length > 0 && cls.classSchedules.every(schedule => schedule.statusId === 2);
         if (allSchedulesAssigned) {
          assignedClasses++;
        } else {
          pendingClasses++;
        }
      });

      return {
        totalClasses: allClasses.length,
        pendingClasses,
        assignedClasses,
        totalSchedules,
        pendingSchedules,
        assignedSchedules,
        assignmentRate: totalSchedules > 0 ? Math.round((assignedSchedules / totalSchedules) * 100) : 0
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thống kê: ${error.message}`);
    }
  }

  // Lấy danh sách phòng khả dụng cho lịch học
  async getAvailableRoomsForSchedule(scheduleId) {
    try {
      const schedule = await prisma.classSchedule.findUnique({
        where: { id: parseInt(scheduleId) },
        include: {
          class: {
            include: { 
              ClassRoomType: true,
              department: true
            }
          },
          timeSlot: true // Lấy thông tin timeSlot để kiểm tra khung giờ
        }
      });

      if (!schedule) {
        throw new Error('Không tìm thấy lịch học');
      }

      // Lấy phòng phù hợp với loại phòng và khoa
      // Đối với phòng thực hành (classRoomTypeId === 2), không kiểm tra capacity vì có nhiều nhóm
      const whereClause = {
        classRoomTypeId: schedule.classRoomTypeId, // Sử dụng classRoomTypeId từ ClassSchedule
        isAvailable: true,
        OR: [
          { departmentId: schedule.class.departmentId }, // Phòng cùng khoa
          { departmentId: null } // Phòng chung
        ]
      };

      // Chỉ kiểm tra capacity cho phòng lý thuyết (classRoomTypeId !== 2)
      if (schedule.classRoomTypeId !== 2) {
        whereClause.capacity = { gte: schedule.class.maxStudents };
      }

      const availableRooms = await prisma.classRoom.findMany({
        where: whereClause,
        include: {
          ClassRoomType: true,
          department: true
        },
        orderBy: [
          { departmentId: 'asc' }, // Phòng cùng khoa trước
          { capacity: 'asc' }
        ]
      });

      // Kiểm tra xung đột thời gian - phòng chỉ bận trong khung giờ cụ thể
      const conflictingSchedules = await prisma.classSchedule.findMany({
        where: {
          dayOfWeek: schedule.dayOfWeek,
          timeSlotId: schedule.timeSlotId, // Cùng tiết học = cùng khung giờ
          classRoomId: { not: null },
          statusId: { in: [2, 3] }, // Đã phân phòng hoặc đang hoạt động
          id: { not: parseInt(scheduleId) } // Loại trừ lịch hiện tại
        },
        include: {
          timeSlot: true,
          class: {
            include: {
              teacher: {
                include: { user: true }
              }
            }
          }
        }
      });

      const conflictingRoomIds = conflictingSchedules.map(s => s.classRoomId);
      
      
      return availableRooms
        .filter(room => !conflictingRoomIds.includes(room.id))
        .map(room => {
          // Tìm thông tin conflict nếu có
          const conflictInfo = conflictingSchedules.find(s => s.classRoomId === room.id);
          
          return {
          id: room.id,
          code: room.code,
          name: room.name,
          capacity: room.capacity,
          building: room.building,
          floor: room.floor,
          type: room.ClassRoomType.name,
          department: room.department?.name || 'Phòng chung',
            isSameDepartment: room.departmentId === schedule.class.departmentId,
            isAvailable: !conflictingRoomIds.includes(room.id),
            conflictInfo: conflictInfo ? {
              time: `${conflictInfo.timeSlot.startTime}-${conflictInfo.timeSlot.endTime}`,
              className: conflictInfo.class.className,
              teacherName: conflictInfo.class.teacher.user.fullName
            } : null
          };
        });
    } catch (error) {
      throw new Error(`Lỗi lấy phòng khả dụng: ${error.message}`);
    }
  }

  // =====================================================
  // 2. GÁN PHÒNG CHO LỊCH HỌC
  // =====================================================
  
  // Gán phòng cho lịch học
  async assignRoomToSchedule(scheduleId, roomId, assignedBy) {
    try {
      
      const schedule = await prisma.classSchedule.findUnique({
        where: { id: parseInt(scheduleId) },
        include: {
          class: {
            include: {
              teacher: {
                include: { user: true }
              }
            }
          },
          timeSlot: true
        }
      });

      if (!schedule) {
        throw new Error('Không tìm thấy lịch học');
      }


      // Chỉ kiểm tra nếu lịch học đã có phòng VÀ statusId = 2 (Đã phân phòng)
      if (schedule.classRoomId && schedule.statusId === 2) {
        throw new Error('Lịch học đã được gán phòng');
      }

      // Kiểm tra phòng có khả dụng không
      const room = await prisma.classRoom.findUnique({
        where: { id: parseInt(roomId) }
      });

      if (!room || !room.isAvailable) {
        throw new Error('Phòng học không khả dụng');
      }

       // Kiểm tra xung đột - phòng chỉ bận trong khung giờ cụ thể
      const conflict = await prisma.classSchedule.findFirst({
        where: {
          dayOfWeek: schedule.dayOfWeek,
          timeSlotId: schedule.timeSlotId,
          classRoomId: parseInt(roomId),
           statusId: { in: [2, 3] }, // Chỉ kiểm tra lịch đã phân phòng và đang hoạt động
           id: { not: parseInt(scheduleId) } // Loại trừ lịch hiện tại
         },
         include: {
           timeSlot: true,
           class: {
             include: {
               teacher: {
                 include: { user: true }
               }
             }
           }
        }
      });

      if (conflict) {
         const conflictTime = `${conflict.timeSlot.startTime}-${conflict.timeSlot.endTime}`;
         const conflictClass = conflict.class.className;
         const conflictTeacher = conflict.class.teacher.user.fullName;
         throw new Error(`Phòng học đã được sử dụng trong khung giờ ${conflictTime} bởi lớp ${conflictClass} (${conflictTeacher})`);
      }

      // Cập nhật lịch học với statusId = 2 (Đã phân phòng)
      const updatedSchedule = await prisma.classSchedule.update({
        where: { id: parseInt(scheduleId) },
        data: {
          classRoomId: parseInt(roomId),
          statusId: 2, // RequestType ID cho "Đã phân phòng"
          assignedBy: parseInt(assignedBy),
          assignedAt: new Date()
        },
        include: {
          class: {
            include: {
              teacher: {
                include: { user: true }
              }
            }
          },
          classRoom: {
            include: {
              ClassRoomType: true
            }
          },
          ClassRoomType: true,
          timeSlot: true
        }
      });

      // Xác định trạng thái lớp sau khi gán
      const classInfo = await prisma.class.findUnique({
        where: { id: updatedSchedule.classId },
        include: { classSchedules: true }
      });

       // Kiểm tra xem TẤT CẢ lịch học của lớp đã được phân phòng chưa
       const allSchedulesAssigned = classInfo?.classSchedules.every(schedule => schedule.statusId === 2) || false;
       const classStatusId = allSchedulesAssigned ? 2 : 1; // Chỉ khi TẤT CẢ lịch đều có phòng mới coi là "Đã phân phòng"

      const result = {
        // Thông tin lịch học
        scheduleId: updatedSchedule.id,
        scheduleStatusId: 2, // RequestType ID
        scheduleStatusName: 'Đã phân phòng',
        
        // Thông tin lớp học
        classId: updatedSchedule.classId,
        className: updatedSchedule.class.className,
        classStatusId: classStatusId, // Trả về trực tiếp RequestType ID
        
        // Thông tin phòng học
        roomId: updatedSchedule.classRoomId,
        roomName: updatedSchedule.classRoom.name,
        roomCode: updatedSchedule.classRoom.code,
        roomType: updatedSchedule.classRoom.ClassRoomType?.name || 'Chưa xác định',
        
        // Thông tin loại phòng/lớp
        classRoomTypeId: updatedSchedule.classRoomTypeId,
        classRoomTypeName: updatedSchedule.ClassRoomType?.name || 'Chưa xác định',
        practiceGroup: updatedSchedule.practiceGroup,
        
        // Thông tin giảng viên
        teacherId: updatedSchedule.class.teacherId,
        teacherName: updatedSchedule.class.teacher.user.fullName,
        
        // Thông tin thời gian
        dayOfWeek: updatedSchedule.dayOfWeek,
        dayName: this.getDayName(updatedSchedule.dayOfWeek),
        timeSlot: updatedSchedule.timeSlot.slotName,
        startTime: updatedSchedule.timeSlot.startTime,
        endTime: updatedSchedule.timeSlot.endTime,
        assignedAt: updatedSchedule.assignedAt,
        assignedBy: assignedBy
      };

      // Emit socket event for real-time updates
      try {
        await SocketClient.emitRoomAssigned(result);
        
        // Emit schedule updated event for weekly schedule view (student/teacher)
        // This will broadcast to all weekly-schedule rooms
        await SocketClient.emitScheduleUpdated({
          ...result,
          // Include weekStartDate: null to broadcast to all weekly-schedule rooms
          weekStartDate: null // null means broadcast to all weekly-schedule rooms
        });
        
        // Emit updated stats
        const stats = await this.getSchedulingStats();
        await SocketClient.emitStatsUpdated(stats);
      } catch (socketError) {
        console.error('Error emitting socket event:', socketError);
        // Don't fail the operation if socket fails
      }
      
      return result;
    } catch (error) {
      throw new Error(`Lỗi gán phòng: ${error.message}`);
    }
  }

  // Hủy gán phòng cho lịch học
  async unassignRoomFromSchedule(scheduleId) {
    try {
      // Get schedule info before update
      const schedule = await prisma.classSchedule.findUnique({
        where: { id: parseInt(scheduleId) },
        include: {
          class: {
            include: {
              teacher: {
                include: { user: true }
              }
            }
          },
          timeSlot: true,
          ClassRoomType: true
        }
      });

      if (!schedule) {
        throw new Error('Không tìm thấy lịch học');
      }

      const updatedSchedule = await prisma.classSchedule.update({
        where: { id: parseInt(scheduleId) },
        data: {
          classRoomId: null,
          statusId: 1, 
          assignedBy: null,
          assignedAt: null
        },
        include: {
          class: {
            include: {
              teacher: {
                include: { user: true }
              }
            }
          },
          timeSlot: true,
          ClassRoomType: true
        }
      });

      // Determine class status after unassignment
      const classInfo = await prisma.class.findUnique({
        where: { id: updatedSchedule.classId },
        include: { classSchedules: true }
      });

      const allSchedulesAssigned = classInfo?.classSchedules.every(s => s.statusId === 2) || false;
      const classStatusId = allSchedulesAssigned ? 2 : 1;

      const result = {
        scheduleId: updatedSchedule.id,
        scheduleStatusId: 1,
        scheduleStatusName: 'Chờ phân phòng',
        classId: updatedSchedule.classId,
        className: updatedSchedule.class.className,
        classStatusId: classStatusId,
        dayOfWeek: updatedSchedule.dayOfWeek,
        dayName: this.getDayName(updatedSchedule.dayOfWeek),
        timeSlot: updatedSchedule.timeSlot.slotName,
        startTime: updatedSchedule.timeSlot.startTime,
        endTime: updatedSchedule.timeSlot.endTime,
        message: 'Đã hủy gán phòng thành công'
      };

      // Emit socket event for real-time updates
      try {
        await SocketClient.emitRoomUnassigned(result);
        
        // Emit schedule updated event for weekly schedule view (student/teacher)
        // This will broadcast to all weekly-schedule rooms
        await SocketClient.emitScheduleUpdated({
          ...result,
          // Include weekStartDate: null to broadcast to all weekly-schedule rooms
          weekStartDate: null // null means broadcast to all weekly-schedule rooms
        });
        
        // Emit updated stats
        const stats = await this.getSchedulingStats();
        await SocketClient.emitStatsUpdated(stats);
      } catch (socketError) {
        console.error('Error emitting socket event:', socketError);
        // Don't fail the operation if socket fails
      }

      return result;
    } catch (error) {
      throw new Error(`Lỗi hủy gán phòng: ${error.message}`);
    }
  }

  // =====================================================
  // 3. LẤY DỮ LIỆU FILTER
  // =====================================================
  
  // Lấy danh sách khoa
  async getDepartments() {
    try {
      return await prisma.department.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách khoa: ${error.message}`);
    }
  }

  // Lấy danh sách giảng viên
  async getTeachers() {
    try {
      const teachers = await prisma.teacher.findMany({
        include: {
          user: true,
          department: true
        },
        orderBy: { user: { fullName: 'asc' } }
      });

      return teachers.map(teacher => ({
        id: teacher.id,
        fullName: teacher.user.fullName,
        name: teacher.user.fullName,
        code: teacher.teacherCode,
        departmentId: teacher.departmentId,
        departmentName: teacher.department?.name || 'Chưa xác định'
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách giảng viên: ${error.message}`);
    }
  }

  // Lấy danh sách giảng viên trống vào thời điểm cụ thể
  async getAvailableTeachers(date, timeSlotId, departmentId = null) {
    try {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay(); // 1 = Monday, 7 = Sunday

      // Lấy tất cả giảng viên
      const whereClause = {};
      if (departmentId) {
        whereClause.departmentId = parseInt(departmentId);
      }

      const allTeachers = await prisma.teacher.findMany({
        where: whereClause,
        include: {
          user: true,
          department: true,
          classSchedules: {
            where: {
              dayOfWeek: dayOfWeek,
              timeSlotId: parseInt(timeSlotId),
              statusId: { in: [2, 3] } // Đã phân phòng hoặc đang hoạt động
            },
            include: {
              scheduleRequests: {
                where: {
                  exceptionDate: targetDate,
                  requestStatusId: { in: [2, 4] }, // Đã duyệt hoặc hoàn thành
                  requestTypeId: { in: [5, 6, 7, 8, 9, 10] } // Các ngoại lệ
                }
              }
            }
          }
        },
        orderBy: { user: { fullName: 'asc' } }
      });

      // Lọc giảng viên trống (không có lịch vào thời điểm đó)
      const availableTeachers = allTeachers.filter(teacher => {
        // Nếu không có lịch học vào thời điểm đó, giảng viên trống
        if (teacher.classSchedules.length === 0) {
          return true;
        }

        // Kiểm tra xem có lịch nào đang hoạt động (giảng viên bận) không
        const hasActiveSchedule = teacher.classSchedules.some(schedule => {
          // Kiểm tra các ngoại lệ vào ngày đó
          const exceptions = schedule.scheduleRequests || [];
          
          // Nếu có ngoại lệ tạm ngưng (requestTypeId = 5) vào ngày đó, lịch không hoạt động
          const hasCancelledException = exceptions.some(
            req => req.requestTypeId === 5
          );
          
          // Nếu có ngoại lệ đổi lịch (requestTypeId = 8) vào ngày đó, lịch đã được chuyển đi
          const hasMovedException = exceptions.some(
            req => req.requestTypeId === 8
          );

          // Nếu lịch bị tạm ngưng hoặc chuyển đi, giảng viên trống (không bận)
          if (hasCancelledException || hasMovedException) {
            return false; // Lịch không hoạt động, giảng viên trống
          }

          // Nếu có ngoại lệ thi (requestTypeId = 6, 10) hoặc đổi phòng (requestTypeId = 7) hoặc đổi giáo viên (requestTypeId = 9)
          // Lịch vẫn hoạt động nhưng có thể có giảng viên thay thế
          // Nhưng nếu không có ngoại lệ đổi giáo viên, giảng viên vẫn bận
          const hasSubstituteException = exceptions.some(
            req => req.requestTypeId === 9 && req.substituteTeacherId
          );

          // Nếu có ngoại lệ đổi giáo viên và đã có giảng viên thay thế, giảng viên gốc trống
          if (hasSubstituteException) {
            return false; // Giảng viên gốc không dạy, trống
          }

          // Nếu không có ngoại lệ hoặc ngoại lệ không làm giảng viên trống, lịch vẫn hoạt động
          return true; // Giảng viên bận
        });

        // Giảng viên trống nếu không có lịch hoạt động (không bận)
        return !hasActiveSchedule;
      });

      return availableTeachers.map(teacher => ({
        id: teacher.id,
        fullName: teacher.user.fullName,
        name: teacher.user.fullName,
        code: teacher.teacherCode,
        teacherCode: teacher.teacherCode,
        departmentId: teacher.departmentId,
        departmentName: teacher.department?.name || 'Chưa xác định'
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách giảng viên trống: ${error.message}`);
    }
  }

  // Lấy danh sách RequestType (trạng thái lịch học)
  async getRequestTypes() {
    try {
      const requestTypes = await prisma.requestType.findMany({
        where: { id: { lte: 6 } }, // Chỉ lấy trạng thái lịch học (1-6)
        orderBy: { id: 'asc' }
      });

      return requestTypes.map(type => ({
        id: type.id,
        name: type.name
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách trạng thái: ${error.message}`);
    }
  }

  // =====================================================
  // 4. LỊCH HỌC THEO TUẦN
  // =====================================================
  
  // Lấy lịch học theo tuần - hỗ trợ role-based access
  async getWeeklySchedule(weekStartDate, filters = {}, userRole = 'admin', userId = null) {
    try {
      // Tính toán ngày bắt đầu và kết thúc tuần
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      // Tính tuần học hiện tại (dựa trên ngày bắt đầu học kỳ)
      // Lấy ngày bắt đầu học kỳ từ lớp học đầu tiên hoặc sử dụng ngày mặc định
      const earliestClass = await prisma.class.findFirst({
        orderBy: { startDate: 'asc' },
        select: { startDate: true }
      });
      
      const semesterStartDate = earliestClass?.startDate ? new Date(earliestClass.startDate) : new Date('2025-09-01');
      const currentWeek = Math.floor((startDate - semesterStartDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
      
      // Xây dựng điều kiện where dựa trên role
      let whereCondition = {
        // Filter theo tuần học: chỉ lấy lịch trong khoảng startWeek và endWeek
        startWeek: { lte: currentWeek }, // Lịch học bắt đầu trước hoặc trong tuần này
        endWeek: { gte: currentWeek }, // Lịch học kết thúc sau hoặc trong tuần này
        // Filter theo thời gian: chỉ lấy lịch trong khoảng startDate và endDate của lớp
        class: {
          startDate: { lte: endDate }, // Lớp học bắt đầu trước hoặc trong tuần này
          endDate: { gte: startDate }, // Lớp học kết thúc sau hoặc trong tuần này
          ...(filters.departmentId && {
            departmentId: parseInt(filters.departmentId)
          })
        },
        ...(filters.classId && {
          classId: parseInt(filters.classId)
        }),
        ...(filters.teacherId && {
          teacherId: parseInt(filters.teacherId)
        })
      };

      // Role-based filtering
      if (userRole === 'teacher' && userId) {
        // Lấy teacherId từ userId
        const teacher = await prisma.teacher.findFirst({
          where: { userId: parseInt(userId) },
          select: { id: true }
        });
        
        if (!teacher) {
          return [];
        }
        
        // Giáo viên chỉ xem lịch học của lớp họ dạy HOẶC lịch họ được thay thế
        whereCondition.OR = [
          {
            teacherId: teacher.id,
            OR: [
              { statusId: { in: [2, 3] } }, // Đã phân phòng, Đang hoạt động
              { 
                AND: [
                  { statusId: 1 }, // Chờ phân phòng
                  { classRoomId: { not: null } } // Nhưng đã có phòng
                ]
              }
            ]
          },
          {
            scheduleRequests: {
              some: {
                substituteTeacherId: teacher.id,
                requestStatusId: { in: [2, 4] }, // Đã duyệt hoặc hoàn thành
                requestTypeId: 9, // Đổi giáo viên
                exceptionDate: {
                  gte: startDate,
                  lte: endDate
                }
              }
            },
            OR: [
              { statusId: { in: [2, 3] } },
              { 
                AND: [
                  { statusId: 1 },
                  { classRoomId: { not: null } }
                ]
              }
            ]
          }
        ];
      } else if (userRole === 'student' && userId) {
        // Lấy studentId từ userId
        const student = await prisma.student.findFirst({
          where: { userId: parseInt(userId) },
          select: { id: true }
        });
        
        if (!student) {
          return [];
        }
        whereCondition.class = {
          ...whereCondition.class,
          classStudents: {
            some: {
              studentId: student.id
            }
          }
        };
        // Sinh viên chỉ xem lịch đã có phòng
        whereCondition.OR = [
          { statusId: { in: [2, 3] } }, // Đã phân phòng, Đang hoạt động
          { 
            AND: [
              { statusId: 1 }, // Chờ phân phòng
              { classRoomId: { not: null } } // Nhưng đã có phòng
            ]
          }
        ];
      } else {
        // Admin/Manager xem tất cả lịch đã có phòng
        whereCondition.OR = [
          { statusId: { in: [2, 3] } }, // Đã phân phòng, Đang hoạt động
          { 
            AND: [
              { statusId: 1 }, // Chờ phân phòng
              { classRoomId: { not: null } } // Nhưng đã có phòng (từ yêu cầu đã được chấp nhận)
            ]
          }
        ];
      }

      // Lấy lịch học theo điều kiện đã xây dựng
      const schedules = await prisma.classSchedule.findMany({
        where: whereCondition,
        include: {
          class: {
            include: {
              teacher: {
                include: {
                  user: true,
                  department: true
                }
              },
              department: true,
              major: true,
              ClassRoomType: true
            }
          },
          classRoom: {
            include: {
              ClassRoomType: true,
              department: true
            }
          },
          timeSlot: true,
          ClassRoomType: true,
          // Include thông tin ngoại lệ
          scheduleRequests: {
            where: {
              requestStatusId: 2, // Chỉ lấy các yêu cầu đã được phê duyệt
              requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9, 10] } // Lấy tất cả loại ngoại lệ (ID 3-10, bao gồm thi cuối kỳ)
            },
            include: {
              RequestType: true,
              RequestStatus: true,
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
          { timeSlotId: 'asc' }
        ]
      });

      // =====================================================
      // QUERY THÊM: Lấy các exceptions có movedToDate trong tuần này
      // nhưng schedule gốc không nằm trong điều kiện filter
      // (Ví dụ: Thi ngày 17/12/2025 nhưng lớp học kết thúc 15/12/2025)
      // VÀ các exception thi cuối kỳ (RequestType 10) không có classScheduleId
      // =====================================================
      
      const standaloneExceptions = await prisma.scheduleRequest.findMany({
        where: {
          OR: [
            {
              // Exception có movedToDate trong tuần này
              exceptionType: { in: ['exam', 'moved'] },
              movedToDate: {
                gte: startDate,
                lte: endDate
              },
              requestStatusId: 2,
              // Áp dụng filters giống như schedules
              ...(filters.classId && {
                classSchedule: {
                  classId: parseInt(filters.classId)
                }
              }),
              ...(filters.teacherId && {
                classSchedule: {
                  teacherId: parseInt(filters.teacherId)
                }
              })
            },
            {
              // Exception thi cuối kỳ (RequestType 10) - không có classScheduleId
              requestTypeId: 10,
              exceptionDate: {
                gte: startDate,
                lte: endDate
              },
              requestStatusId: 2,
              classScheduleId: null // Thi cuối kỳ không có classScheduleId
            }
          ]
        },
        include: {
          classSchedule: {
            include: {
              class: {
                include: {
                  teacher: {
                    include: {
                      user: true,
                      department: true
                    }
                  },
                  department: true,
                  major: true,
                  ClassRoomType: true
                }
              },
              classRoom: {
                include: {
                  ClassRoomType: true,
                  department: true
                }
              },
              timeSlot: true,
              ClassRoomType: true
            }
          },
          class: {
            include: {
              teacher: {
                include: {
                  user: true,
                  department: true
                }
              },
              department: true,
              major: true,
              ClassRoomType: true
            }
          },
          RequestType: true,
          RequestStatus: true,
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
      });

      // Lọc thêm theo department nếu có filter (vì không thể filter trực tiếp trong where)
      const filteredStandaloneExceptions = standaloneExceptions.filter(exception => {
        // Thi cuối kỳ (RequestType 10) không có classSchedule, có class
        if (exception.requestTypeId === 10 && !exception.classScheduleId) {
          if (!exception.class) return false;
          
          // Apply department filter if exists
          if (filters.departmentId) {
            return exception.class.departmentId === parseInt(filters.departmentId);
          }
          
          // Apply classId filter if exists
          if (filters.classId) {
            return exception.class.id === parseInt(filters.classId);
          }
          
          // Role-based filtering for final exam exceptions
          if (userRole === 'teacher' && userId) {
            const teacher = exception.class.teacher;
            return teacher && teacher.userId === parseInt(userId);
          } else if (userRole === 'student' && userId) {
            // Cần check xem student có trong lớp không
            // (Tạm thời bỏ qua, cần implement nếu cần thiết)
            return true;
          }
          
          return true;
        }
        
        if (!exception.classSchedule) return false;
        
        // Apply department filter if exists
        if (filters.departmentId) {
          return exception.classSchedule.class.departmentId === parseInt(filters.departmentId);
        }
        
        // Role-based filtering for standalone exceptions
        if (userRole === 'teacher' && userId) {
          const teacher = exception.classSchedule.class.teacher;
          return teacher && teacher.userId === parseInt(userId);
        } else if (userRole === 'student' && userId) {
          // Cần check xem student có trong lớp không
          // (Tạm thời bỏ qua, cần implement nếu cần thiết)
          return true;
        }
        
        return true;
      });
      const weeklySchedules = [];
      const processedScheduleIds = new Set(); 
      
      let currentTeacherId = null;
      if (userRole === 'teacher' && userId) {
        const currentTeacher = await prisma.teacher.findFirst({
          where: { userId: parseInt(userId) },
          select: { id: true }
        });
        if (currentTeacher) {
          currentTeacherId = currentTeacher.id;
        }
      }
      
      schedules.forEach(schedule => {
        processedScheduleIds.add(schedule.id);
        const timeSlot = schedule.timeSlot;
        if (!timeSlot) {
          return;
        }
        const shift = this.getShiftFromTimeSlot(timeSlot.shift);
        
        // Filter scheduleRequests theo ngày chính xác trong tuần
        const relevantExceptions = schedule.scheduleRequests.filter(request => {
          if (!request.exceptionDate) {
            return false;
          }
          
          const exceptionDate = new Date(request.exceptionDate);
          const exceptionDateStr = exceptionDate.toISOString().split('T')[0]; // YYYY-MM-DD
          
          // Tính ngày của schedule trong tuần hiện tại
          const startDateObj = new Date(weekStartDate);
          let scheduleDayOffset;
          if (schedule.dayOfWeek === 1) { // Chủ nhật
            scheduleDayOffset = 6;
          } else {
            scheduleDayOffset = schedule.dayOfWeek - 2;
          }
          const scheduleDate = new Date(startDateObj);
          scheduleDate.setDate(startDateObj.getDate() + scheduleDayOffset);
          const scheduleDateStr = scheduleDate.toISOString().split('T')[0];
          
          return exceptionDateStr === scheduleDateStr;
        });
        
        // Merge tất cả exceptions cùng ngày để áp dụng các thay đổi
        let mergedException = null;
        let substituteTeacher = null;
        let newRoom = null;
        let newTimeSlot = null;
        let movedToDate = null;
        let isMoved = false;
        let isCancelled = false;
        
        // Tạm ngưng có thể có requestTypeId = 5 (Tạm ngưng) hoặc exceptionType = 'cancelled'
        const cancelledException = relevantExceptions.find(ex => 
          ex.exceptionType === 'cancelled' || 
          ex.requestTypeId === 5 || // RequestType 5 = Tạm ngưng
          ex.RequestType?.name?.toLowerCase().includes('tạm ngưng') ||
          ex.RequestType?.name?.toLowerCase().includes('suspended')
        );
        if (cancelledException) {
          isCancelled = true;
          if (!mergedException) {
            mergedException = cancelledException;
          }
        }
        
        const roomChangeException = relevantExceptions.find(ex => 
          ex.requestTypeId === 7 
        );

        const movedException = relevantExceptions.find(ex => 
          ex.exceptionType === 'moved' || ex.exceptionType === 'exam'
        );
        
        if (movedException) {
          mergedException = movedException;
          isMoved = true;
          movedToDate = movedException.movedToDate;
          newRoom = movedException.movedToClassRoom || movedException.newClassRoom;
          newTimeSlot = movedException.movedToTimeSlot || movedException.newTimeSlot;
          substituteTeacher = movedException.substituteTeacher;
        }
        
        // Tìm exception substitute (đổi giáo viên) - có thể kết hợp với moved/exam
        const substituteException = relevantExceptions.find(ex => 
          ex.exceptionType === 'substitute'
        );
        
        if (substituteException) {
          // Nếu chưa có mergedException, dùng substitute làm base
          if (!mergedException) {
            mergedException = substituteException;
          }
          // Luôn lấy substituteTeacher từ exception này (ưu tiên cao hơn)
          substituteTeacher = substituteException.substituteTeacher || substituteTeacher;
        }
        
        if (roomChangeException) {
          // Nếu chưa có newRoom từ moved, lấy từ roomChange
          if (!newRoom) {
            newRoom = roomChangeException.newClassRoom;
          }
          // Nếu có substituteTeacher trong roomChange, lấy nó
          if (roomChangeException.substituteTeacher) {
            substituteTeacher = roomChangeException.substituteTeacher;
          }
          if (!mergedException) {
            mergedException = roomChangeException;
          }
        }
        
        // Nếu không có exception nào, dùng exception đầu tiên (nếu có)
        if (!mergedException && relevantExceptions.length > 0) {
          mergedException = relevantExceptions[0];
          substituteTeacher = mergedException.substituteTeacher;
          newRoom = mergedException.newClassRoom;
        }
        
        const exception = mergedException;
        
        // Kiểm tra ngày chuyển đến có trong tuần này không
        let isMovedToThisWeek = false;
        let movedToDayOfWeek = null;
        let isMovedToDifferentDay = false;
        let isMovedToSameDate = false; // Kiểm tra xem movedToDate có trùng với exceptionDate không
        
        if (isMoved && movedToDate) {
          const movedDate = new Date(movedToDate);
          const startDateObj = new Date(weekStartDate);
          const endDateObj = new Date(startDateObj);
          endDateObj.setDate(startDateObj.getDate() + 6);
          
          // Kiểm tra xem movedToDate có trùng với exceptionDate không
          if (exception && exception.exceptionDate) {
            const exceptionDate = new Date(exception.exceptionDate);
            const movedDateStr = movedDate.toISOString().split('T')[0];
            const exceptionDateStr = exceptionDate.toISOString().split('T')[0];
            isMovedToSameDate = movedDateStr === exceptionDateStr;
          }
          
          if (movedDate >= startDateObj && movedDate <= endDateObj) {
            isMovedToThisWeek = true;
            const movedDayJS = movedDate.getDay(); // 0=CN, 1=T2, ..., 6=T7
            movedToDayOfWeek = movedDayJS === 0 ? 1 : movedDayJS + 1; // Convert to 1=CN, 2=T2, ..., 7=T7
            
            // Kiểm tra xem có chuyển sang ngày khác không
            isMovedToDifferentDay = movedToDayOfWeek !== schedule.dayOfWeek;
          }
        }
        
        const shouldShowOriginal = !exception || 
                                   isCancelled || 
                                   exception.exceptionType === 'cancelled' ||
                                   exception.requestTypeId === 5 ||
                                   exception.RequestType?.name?.toLowerCase().includes('tạm ngưng') ||
                                   exception.RequestType?.name?.toLowerCase().includes('suspended') ||
                                   exception.exceptionType === 'substitute' ||
                                   exception.requestTypeId === 7 ||  
                                   (isMoved && (!movedToDate || !isMovedToDifferentDay || isMovedToSameDate));
        
        if (shouldShowOriginal) {
          // Áp dụng các thay đổi từ exceptions
          const displayRoom = newRoom || schedule.classRoom;
          const displayTimeSlot = newTimeSlot || timeSlot;
          const displayShift = newTimeSlot ? this.getShiftFromTimeSlot(newTimeSlot.shift) : shift;
          const displayTeacher = substituteTeacher || schedule.class.teacher;
          
          if (userRole === 'teacher' && currentTeacherId && substituteTeacher) {
            if (substituteTeacher.id !== currentTeacherId) {
              return; 
            }
          }
          
          // Xác định statusId và status dựa trên exception
          let displayStatusId = schedule.statusId;
          let displayStatus = this.getStatusName(schedule.statusId);
          let displayException = exception;
          
          if (isCancelled) {
            displayStatusId = 5; 
            displayStatus = 'Tạm ngưng';
            displayException = cancelledException || exception;
          } else if (roomChangeException) {
            displayException = roomChangeException;
            displayStatusId = roomChangeException.requestTypeId || schedule.statusId;
            displayStatus = roomChangeException.RequestType?.name || this.getStatusName(schedule.statusId);
          } else if (exception) {
            displayStatusId = exception.requestTypeId || schedule.statusId;
            displayStatus = exception.RequestType?.name || this.getStatusName(schedule.statusId);
          }
          
          weeklySchedules.push({
          id: schedule.id,
          classId: schedule.classId,
          className: schedule.class.className,
          classCode: schedule.class.code,
          subjectCode: schedule.class.subjectCode,
          subjectName: schedule.class.subjectName,
          teacherId: displayTeacher?.id || schedule.teacherId,
          teacherName: displayTeacher?.user?.fullName || schedule.class.teacher?.user?.fullName || 'Chưa xác định',
          teacherCode: displayTeacher?.teacherCode || schedule.class.teacher?.teacherCode || '',
          roomId: displayRoom?.id || schedule.classRoomId,
          roomName: displayRoom?.name || (schedule.statusId === 1 ? 'Chưa phân phòng' : 'Chưa xác định'),
          roomCode: displayRoom?.code || schedule.classRoom?.code || '',
          roomType: displayRoom?.ClassRoomType?.name || schedule.classRoom?.ClassRoomType?.name || (schedule.statusId === 1 ? 'Chờ phân phòng' : 'Chưa xác định'),
          dayOfWeek: schedule.dayOfWeek,
          dayName: this.getDayName(schedule.dayOfWeek),
          timeSlot: displayTimeSlot.slotName,
          timeRange: `${displayTimeSlot.startTime}-${displayTimeSlot.endTime}`,
          startTime: displayTimeSlot.startTime,
          endTime: displayTimeSlot.endTime,
          shift: displayShift.key,
          shiftName: displayShift.name,
          type: this.getScheduleType(schedule.classRoomTypeId),
          status: displayStatus,
          statusId: displayStatusId,
          weekPattern: schedule.weekPattern,
          startWeek: schedule.startWeek,
          endWeek: schedule.endWeek,
          practiceGroup: schedule.practiceGroup,
          maxStudents: schedule.class.maxStudents,
          departmentId: schedule.class.departmentId,
          departmentName: schedule.class.department?.name || 'Chưa xác định',
          majorId: schedule.class.majorId,
          majorName: schedule.class.major?.name || 'Chưa xác định',
          timeSlotOrder: this.getTimeSlotOrder(displayTimeSlot.shift),
          assignedAt: schedule.assignedAt,
          note: schedule.note,
          // Thông tin ngoại lệ - merge từ tất cả exceptions
          exceptionDate: displayException?.exceptionDate || exception?.exceptionDate || null,
          exceptionType: displayException?.exceptionType || exception?.exceptionType || null,
          exceptionReason: displayException?.reason || exception?.reason || null,
          exceptionStatus: displayException?.RequestStatus?.name || exception?.RequestStatus?.name || null,
          requestTypeId: displayException?.requestTypeId || exception?.requestTypeId || null,
          isOriginalSchedule: true
        });
        }
        
        // Nếu có lịch được chuyển đến trong tuần này, tạo entry mới
        // ⭐ QUAN TRỌNG: Hiển thị lịch mới ở ngày chuyển đến khi:
        // - movedToDate nằm trong tuần này
        // - Chuyển SANG NGÀY KHÁC (isMovedToDifferentDay = true)
        // - KHÔNG trùng với exceptionDate (isMovedToSameDate = false) - để tránh duplicate khi thi/chuyển tại chỗ
        // Khi admin duyệt yêu cầu đổi lịch, movedToDate sẽ khác exceptionDate, nên lịch mới sẽ hiển thị
        if (isMovedToThisWeek && movedToDayOfWeek && isMovedToDifferentDay && !isMovedToSameDate) {
          // Sử dụng giá trị đã merge từ các exceptions
          const movedTimeSlot = newTimeSlot || exception.movedToTimeSlot || exception.newTimeSlot;
          const movedRoom = newRoom || exception.movedToClassRoom || exception.newClassRoom;
          // Sử dụng substituteTeacher đã merge (có thể từ nhiều exceptions)
          const movedSubstituteTeacher = substituteTeacher || exception.substituteTeacher;
          const movedShift = movedTimeSlot ? this.getShiftFromTimeSlot(movedTimeSlot.shift) : shift;
          
          weeklySchedules.push({
            id: schedule.id + 100000, // ID ảo để tránh trùng
            classId: schedule.classId,
            className: schedule.class.className,
            classCode: schedule.class.code,
            subjectCode: schedule.class.subjectCode,
            subjectName: schedule.class.subjectName,
            teacherId: movedSubstituteTeacher ? movedSubstituteTeacher.id : schedule.teacherId,
            teacherName: movedSubstituteTeacher ? movedSubstituteTeacher.user.fullName : (schedule.class.teacher?.user?.fullName || 'Chưa xác định'),
            teacherCode: movedSubstituteTeacher ? movedSubstituteTeacher.teacherCode : (schedule.class.teacher?.teacherCode || ''),
            roomId: movedRoom ? movedRoom.id : schedule.classRoomId,
            roomName: movedRoom ? movedRoom.name : (schedule.classRoom?.name || 'Chưa xác định'),
            roomCode: movedRoom ? movedRoom.code : (schedule.classRoom?.code || ''),
            roomType: movedRoom ? (movedRoom.ClassRoomType?.name || 'Chưa xác định') : (schedule.classRoom?.ClassRoomType?.name || 'Chưa xác định'),
            dayOfWeek: movedToDayOfWeek, // Ngày mới được chuyển đến
            dayName: this.getDayName(movedToDayOfWeek),
            timeSlot: movedTimeSlot ? movedTimeSlot.slotName : timeSlot.slotName,
            timeRange: movedTimeSlot ? `${movedTimeSlot.startTime}-${movedTimeSlot.endTime}` : `${timeSlot.startTime}-${timeSlot.endTime}`,
            startTime: movedTimeSlot ? movedTimeSlot.startTime : timeSlot.startTime,
            endTime: movedTimeSlot ? movedTimeSlot.endTime : timeSlot.endTime,
            shift: movedShift.key,
            shiftName: movedShift.name,
            type: this.getScheduleType(schedule.classRoomTypeId),
            status: exception.RequestType.name,
            statusId: exception.requestTypeId,
            weekPattern: schedule.weekPattern,
            startWeek: schedule.startWeek,
            endWeek: schedule.endWeek,
            practiceGroup: schedule.practiceGroup,
            maxStudents: schedule.class.maxStudents,
            departmentId: schedule.class.departmentId,
            departmentName: schedule.class.department?.name || 'Chưa xác định',
            majorId: schedule.class.majorId,
            majorName: schedule.class.major?.name || 'Chưa xác định',
            timeSlotOrder: movedTimeSlot ? this.getTimeSlotOrder(movedTimeSlot.shift) : this.getTimeSlotOrder(timeSlot.shift),
            assignedAt: schedule.assignedAt,
            note: `Đã chuyển từ ${this.getDayName(schedule.dayOfWeek)} - ${timeSlot.slotName}`,
            // Thông tin ngoại lệ
            exceptionDate: exception.exceptionDate,
            exceptionType: exception.exceptionType,
            exceptionReason: exception.reason,
            exceptionStatus: exception.RequestStatus.name,
            requestTypeId: exception.requestTypeId,
            isMovedSchedule: true, // Đánh dấu đây là lịch đã được chuyển
            originalDayOfWeek: schedule.dayOfWeek,
            originalTimeSlot: timeSlot.slotName
          });
        }
      });

      // =====================================================
      // XỬ LÝ STANDALONE EXCEPTIONS
      // (Exceptions có movedToDate trong tuần này nhưng schedule gốc không được query ra)
      // =====================================================
      
      filteredStandaloneExceptions.forEach(exception => {
        // Xử lý thi cuối kỳ (RequestType 10) không có classSchedule
        if (exception.requestTypeId === 10 && !exception.classScheduleId && exception.class) {
          const classInfo = exception.class;
          const exceptionDate = new Date(exception.exceptionDate);
          const exceptionDayJS = exceptionDate.getDay(); // 0=CN, 1=T2, ..., 6=T7
          const exceptionDayOfWeek = exceptionDayJS === 0 ? 1 : exceptionDayJS + 1; // Convert to 1=CN, 2=T2, ..., 7=T7
          
          const timeSlot = exception.newTimeSlot || exception.movedToTimeSlot;
          const room = exception.newClassRoom || exception.movedToClassRoom;
          // Sử dụng substituteTeacher nếu có (cho phép chọn giáo viên thay thế)
          const examSubstituteTeacher = exception.substituteTeacher;
          
          if (!timeSlot) {
            return;
          }
          
          const shift = this.getShiftFromTimeSlot(timeSlot.shift);
          
          // Tạo virtual schedule cho thi cuối kỳ
          weeklySchedules.push({
            id: 200000 + exception.id, // ID ảo để tránh trùng
            classId: classInfo.id,
            className: classInfo.className,
            classCode: classInfo.code,
            subjectCode: classInfo.subjectCode,
            subjectName: classInfo.subjectName,
            teacherId: examSubstituteTeacher ? examSubstituteTeacher.id : classInfo.teacherId,
            teacherName: examSubstituteTeacher ? examSubstituteTeacher.user.fullName : (classInfo.teacher?.user?.fullName || 'Chưa xác định'),
            teacherCode: examSubstituteTeacher ? examSubstituteTeacher.teacherCode : (classInfo.teacher?.teacherCode || ''),
            roomId: room ? room.id : null,
            roomName: room ? room.name : 'Chưa xác định',
            roomCode: room ? room.code : '',
            roomType: room ? (room.ClassRoomType?.name || 'Chưa xác định') : (classInfo.ClassRoomType?.name || 'Chưa xác định'),
            dayOfWeek: exceptionDayOfWeek,
            dayName: this.getDayName(exceptionDayOfWeek),
            timeSlot: timeSlot.slotName,
            timeRange: `${timeSlot.startTime}-${timeSlot.endTime}`,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            shift: shift.key,
            shiftName: shift.name,
            type: this.getScheduleType(classInfo.classRoomTypeId),
            status: exception.RequestType.name,
            statusId: exception.requestTypeId,
            weekPattern: 'weekly',
            startWeek: 1,
            endWeek: 1,
            practiceGroup: null,
            maxStudents: classInfo.maxStudents,
            departmentId: classInfo.departmentId,
            departmentName: classInfo.department?.name || 'Chưa xác định',
            majorId: classInfo.majorId,
            majorName: classInfo.major?.name || 'Chưa xác định',
            timeSlotOrder: this.getTimeSlotOrder(timeSlot.shift),
            assignedAt: exception.approvedAt,
            note: 'Thi cuối kỳ',
            // Thông tin ngoại lệ
            exceptionDate: exception.exceptionDate,
            exceptionType: exception.exceptionType,
            exceptionReason: exception.reason,
            exceptionStatus: exception.RequestStatus.name,
            requestTypeId: exception.requestTypeId,
            isStandaloneException: true, // Đánh dấu đây là exception độc lập (thi cuối kỳ)
            isMovedSchedule: false
          });
          return;
        }
        
        const schedule = exception.classSchedule;
        
        // Bỏ qua nếu schedule đã được xử lý ở trên
        if (schedule && processedScheduleIds.has(schedule.id)) {
          return;
        }
        
        // Chỉ xử lý exceptions có movedToDate trong tuần này
        if (!exception.movedToDate) {
          return;
        }
        
        const movedDate = new Date(exception.movedToDate);
        const movedDayJS = movedDate.getDay(); // 0=CN, 1=T2, ..., 6=T7
        const movedToDayOfWeek = movedDayJS === 0 ? 1 : movedDayJS + 1; // Convert to 1=CN, 2=T2, ..., 7=T7
        
        const movedTimeSlot = exception.movedToTimeSlot || exception.newTimeSlot;
        const movedRoom = exception.movedToClassRoom || exception.newClassRoom;
        // Sử dụng substituteTeacher nếu có (cho phép chọn giáo viên thay thế)
        const standaloneSubstituteTeacher = exception.substituteTeacher;
        
        // Nếu không có movedTimeSlot, không thể hiển thị
        if (!movedTimeSlot) {
          return;
        }
        
        // Nếu có schedule, lấy thông tin từ schedule
        // Nếu không có schedule (phòng đã tạm ngưng), cần lấy thông tin từ exception hoặc class
        let classInfo, teacherInfo, originalTimeSlot, classRoomTypeId;
        
        if (schedule) {
          classInfo = schedule.class;
          teacherInfo = schedule.class.teacher;
          originalTimeSlot = schedule.timeSlot;
          classRoomTypeId = schedule.classRoomTypeId;
        } else if (exception.class) {
          // Trường hợp exception không có schedule (có thể là phòng đã tạm ngưng)
          classInfo = exception.class;
          teacherInfo = exception.class.teacher;
          originalTimeSlot = null; // Không có schedule gốc
          classRoomTypeId = exception.class.classRoomTypeId;
        } else {
          // Không có thông tin để hiển thị
          return;
        }
        
        if (!classInfo) {
          return;
        }
        
        const movedShift = movedTimeSlot ? this.getShiftFromTimeSlot(movedTimeSlot.shift) : 
                          (originalTimeSlot ? this.getShiftFromTimeSlot(originalTimeSlot.shift) : 
                          this.getShiftFromTimeSlot(movedTimeSlot.shift));
        
        // Tạo virtual schedule cho standalone exception
        weeklySchedules.push({
          id: schedule ? (schedule.id + 100000 + exception.id) : (300000 + exception.id), // ID ảo để tránh trùng
          classId: classInfo.id,
          className: classInfo.className,
          classCode: classInfo.code,
          subjectCode: classInfo.subjectCode,
          subjectName: classInfo.subjectName,
          teacherId: standaloneSubstituteTeacher ? standaloneSubstituteTeacher.id : (teacherInfo?.id || classInfo.teacherId),
          teacherName: standaloneSubstituteTeacher ? standaloneSubstituteTeacher.user.fullName : (teacherInfo?.user?.fullName || classInfo.teacher?.user?.fullName || 'Chưa xác định'),
          teacherCode: standaloneSubstituteTeacher ? standaloneSubstituteTeacher.teacherCode : (teacherInfo?.teacherCode || classInfo.teacher?.teacherCode || ''),
          roomId: movedRoom ? movedRoom.id : (schedule?.classRoomId || null),
          roomName: movedRoom ? movedRoom.name : (schedule?.classRoom?.name || 'Chưa xác định'),
          roomCode: movedRoom ? movedRoom.code : (schedule?.classRoom?.code || ''),
          roomType: movedRoom ? (movedRoom.ClassRoomType?.name || 'Chưa xác định') : (schedule?.classRoom?.ClassRoomType?.name || 'Chưa xác định'),
          dayOfWeek: movedToDayOfWeek, // Ngày mới được chuyển đến
          dayName: this.getDayName(movedToDayOfWeek),
          timeSlot: movedTimeSlot ? movedTimeSlot.slotName : (originalTimeSlot?.slotName || movedTimeSlot.slotName),
          timeRange: movedTimeSlot ? `${movedTimeSlot.startTime}-${movedTimeSlot.endTime}` : (originalTimeSlot ? `${originalTimeSlot.startTime}-${originalTimeSlot.endTime}` : `${movedTimeSlot.startTime}-${movedTimeSlot.endTime}`),
          startTime: movedTimeSlot ? movedTimeSlot.startTime : (originalTimeSlot?.startTime || movedTimeSlot.startTime),
          endTime: movedTimeSlot ? movedTimeSlot.endTime : (originalTimeSlot?.endTime || movedTimeSlot.endTime),
          shift: movedShift.key,
          shiftName: movedShift.name,
          type: this.getScheduleType(classRoomTypeId || classInfo.classRoomTypeId),
          status: exception.RequestType.name,
          statusId: exception.requestTypeId,
          weekPattern: schedule?.weekPattern || 'weekly',
          startWeek: schedule?.startWeek || 1,
          endWeek: schedule?.endWeek || 1,
          practiceGroup: schedule?.practiceGroup || null,
          maxStudents: classInfo.maxStudents,
          departmentId: classInfo.departmentId,
          departmentName: classInfo.department?.name || 'Chưa xác định',
          majorId: classInfo.majorId,
          majorName: schedule.class.major?.name || 'Chưa xác định',
          timeSlotOrder: movedTimeSlot ? this.getTimeSlotOrder(movedTimeSlot.shift) : this.getTimeSlotOrder(originalTimeSlot.shift),
          assignedAt: schedule.assignedAt,
          note: `Đã chuyển từ ${this.getDayName(schedule.dayOfWeek)} - ${originalTimeSlot.slotName}`,
          // Thông tin ngoại lệ
          exceptionDate: exception.exceptionDate,
          exceptionType: exception.exceptionType,
          exceptionReason: exception.reason,
          exceptionStatus: exception.RequestStatus.name,
          requestTypeId: exception.requestTypeId,
          isMovedSchedule: true, // Đánh dấu đây là lịch đã được chuyển
          isStandaloneException: true, // Đánh dấu đây là exception độc lập (nằm ngoài khoảng thời gian học)
          originalDayOfWeek: schedule.dayOfWeek,
          originalTimeSlot: originalTimeSlot.slotName
        });
      });

      return weeklySchedules;
    } catch (error) {
      throw new Error(`Lỗi lấy lịch học theo tuần: ${error.message}`);
    }
  }

  // =====================================================
  // 5. HELPER METHODS
  // =====================================================
  
  getDayName(dayOfWeek) {
    const days = {
      1: 'Chủ nhật',
      2: 'Thứ 2',
      3: 'Thứ 3',
      4: 'Thứ 4',
      5: 'Thứ 5',
      6: 'Thứ 6',
      7: 'Thứ 7'
    };
    return days[dayOfWeek] || 'Không xác định';
  }

  getStatusName(statusId) {
    const statuses = {
      1: 'Chờ phân phòng',
      2: 'Đã phân phòng',
      3: 'Đang hoạt động',
      4: 'Đã hủy',
      5: 'Tạm ngưng',
      6: 'Thi'
    };
    return statuses[statusId] || 'Không xác định';
  }

  getShiftFromTimeSlot(shiftId) {
    const shifts = {
      1: { key: 'morning', name: 'Sáng' },
      2: { key: 'afternoon', name: 'Chiều' },
      3: { key: 'evening', name: 'Tối' }
    };
    return shifts[shiftId] || { key: 'morning', name: 'Sáng' };
  }

  getScheduleType(classRoomTypeId) {
    const types = {
      1: 'theory',
      2: 'practice',
      3: 'online'
    };
    return types[classRoomTypeId] || 'theory';
  }

  getTimeSlotOrder(shift) {
    // Dựa trên shift của TimeSlot: 1 = Sáng, 2 = Chiều, 3 = Tối
    // shift trực tiếp là 1, 2, 3 nên có thể return luôn
    if (typeof shift === 'number' && shift >= 1 && shift <= 3) {
      return shift;
    }
    // Fallback: nếu shift không hợp lệ, mặc định là sáng
    return 1;
  }
}

module.exports = new ScheduleManagementService();