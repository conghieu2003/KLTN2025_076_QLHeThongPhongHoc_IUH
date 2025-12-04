const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ClassService {
  // LẤY DANH SÁCH LỚP HỌC
  async getAllClasses() {
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
              classRoom: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: classes.map(cls => {
          // Xác định trạng thái lớp dựa trên statusId của lịch học
          const hasAssignedSchedule = cls.classSchedules.some(schedule => schedule.statusId === 2);
          const classStatusId = hasAssignedSchedule ? 2 : 1; // 1: Chờ phân phòng, 2: Đã phân phòng
          
          return {
            id: cls.id,
            code: cls.code,
            className: cls.className,
            subjectName: cls.subjectName,
            subjectCode: cls.subjectCode,
            credits: cls.credits,
            maxStudents: cls.maxStudents,
            semester: cls.semester,
            academicYear: cls.academicYear,
            startDate: cls.startDate,
            endDate: cls.endDate,
            description: cls.description,
            teacherId: cls.teacherId,
            teacherName: cls.teacher.user.fullName,
            teacherCode: cls.teacher.teacherCode,
            departmentId: cls.departmentId,
            departmentName: cls.department.name,
            majorId: cls.majorId,
            majorName: cls.major?.name || 'Chưa xác định',
            classRoomTypeId: cls.classRoomTypeId,
            classRoomTypeName: cls.ClassRoomType.name,
            statusId: classStatusId,
            statusName: classStatusId === 1 ? 'Chờ phân phòng' : 'Đã phân phòng',
            schedules: cls.classSchedules.map(schedule => ({
              id: schedule.id,
              dayOfWeek: schedule.dayOfWeek,
              dayName: this.getDayName(schedule.dayOfWeek),
              timeSlotId: schedule.timeSlotId,
              timeSlotName: schedule.timeSlot.slotName,
              roomId: schedule.classRoomId,
              roomName: schedule.classRoom?.name || null,
              roomCode: schedule.classRoom?.code || null,
              statusId: schedule.statusId,
              statusName: this.getStatusName(schedule.statusId)
            })),
            createdAt: cls.createdAt,
            updatedAt: cls.updatedAt
          };
        })
      };
    } catch (error) {
      console.error('[ClassService.getAllClasses] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy danh sách lớp học: ${error.message}`
      };
    }
  }

  // Lấy lớp học theo ID
  async getClassById(id) {
    try {
      const cls = await prisma.class.findUnique({
        where: { id: parseInt(id) },
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
              classRoom: true
            }
          }
        }
      });

      if (!cls) {
        return {
          success: false,
          message: 'Không tìm thấy lớp học'
        };
      }

      // Xác định trạng thái lớp dựa trên statusId của lịch học
      const hasAssignedSchedule = cls.classSchedules.some(schedule => schedule.statusId === 2);
      const classStatusId = hasAssignedSchedule ? 2 : 1;

      return {
        success: true,
        data: {
          id: cls.id,
          code: cls.code,
          className: cls.className,
          subjectName: cls.subjectName,
          subjectCode: cls.subjectCode,
          credits: cls.credits,
          maxStudents: cls.maxStudents,
          semester: cls.semester,
          academicYear: cls.academicYear,
          startDate: cls.startDate,
          endDate: cls.endDate,
          description: cls.description,
          teacherId: cls.teacherId,
          teacherName: cls.teacher.user.fullName,
          teacherCode: cls.teacher.teacherCode,
          departmentId: cls.departmentId,
          departmentName: cls.department.name,
          majorId: cls.majorId,
          majorName: cls.major?.name || 'Chưa xác định',
          classRoomTypeId: cls.classRoomTypeId,
          classRoomTypeName: cls.ClassRoomType.name,
          statusId: classStatusId,
          statusName: classStatusId === 1 ? 'Chờ phân phòng' : 'Đã phân phòng',
          schedules: cls.classSchedules.map(schedule => ({
            id: schedule.id,
            dayOfWeek: schedule.dayOfWeek,
            dayName: this.getDayName(schedule.dayOfWeek),
            timeSlotId: schedule.timeSlotId,
            timeSlotName: schedule.timeSlot.slotName,
            roomId: schedule.classRoomId,
            roomName: schedule.classRoom?.name || null,
            roomCode: schedule.classRoom?.code || null,
            statusId: schedule.statusId,
            statusName: this.getStatusName(schedule.statusId)
          })),
          createdAt: cls.createdAt,
          updatedAt: cls.updatedAt
        }
      };
    } catch (error) {
      console.error('[ClassService.getClassById] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy thông tin lớp học: ${error.message}`
      };
    }
  }

  // Lấy lớp học theo khoa
  async getClassesByDepartment(departmentId) {
    try {
      const classes = await prisma.class.findMany({
        where: { departmentId: parseInt(departmentId) },
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
              classRoom: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: classes.map(cls => {
          const hasAssignedSchedule = cls.classSchedules.some(schedule => schedule.statusId === 2);
          const classStatusId = hasAssignedSchedule ? 2 : 1;
          
          return {
            id: cls.id,
            code: cls.code,
            className: cls.className,
            subjectName: cls.subjectName,
            subjectCode: cls.subjectCode,
            credits: cls.credits,
            maxStudents: cls.maxStudents,
            semester: cls.semester,
            academicYear: cls.academicYear,
            teacherId: cls.teacherId,
            teacherName: cls.teacher.user.fullName,
            teacherCode: cls.teacher.teacherCode,
            departmentId: cls.departmentId,
            departmentName: cls.department.name,
            majorId: cls.majorId,
            majorName: cls.major?.name || '',
            classRoomTypeId: cls.classRoomTypeId,
            classRoomTypeName: cls.ClassRoomType.name,
            statusId: classStatusId,
            statusName: classStatusId === 1 ? 'Chờ phân phòng' : 'Đã phân phòng'
          };
        })
      };
    } catch (error) {
      console.error('[ClassService.getClassesByDepartment] Error:', error);
      return {
        success: false,
        message: `Lỗi lấy danh sách lớp học theo khoa: ${error.message}`
      };
    }
  }

  // Lấy lớp học theo giảng viên
  async getClassesByTeacher(teacherId) {
    try {
      const classes = await prisma.class.findMany({
        where: { teacherId: parseInt(teacherId) },
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
              classRoom: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: classes.map(cls => {
          const hasAssignedSchedule = cls.classSchedules.some(schedule => schedule.statusId === 2);
          const classStatusId = hasAssignedSchedule ? 2 : 1;
          
          return {
            id: cls.id,
            code: cls.code,
            className: cls.className,
            subjectName: cls.subjectName,
            subjectCode: cls.subjectCode,
            credits: cls.credits,
            maxStudents: cls.maxStudents,
            semester: cls.semester,
            academicYear: cls.academicYear,
            teacherId: cls.teacherId,
            teacherName: cls.teacher.user.fullName,
            teacherCode: cls.teacher.teacherCode,
            departmentId: cls.departmentId,
            departmentName: cls.department.name,
            majorId: cls.majorId,
            majorName: cls.major?.name || '',
            classRoomTypeId: cls.classRoomTypeId,
            classRoomTypeName: cls.ClassRoomType.name,
            statusId: classStatusId,
            statusName: classStatusId === 1 ? 'Chờ phân phòng' : 'Đã phân phòng'
          };
        })
      };
    } catch (error) {
      return {
        success: false,
        message: `Lỗi lấy danh sách lớp học theo giảng viên: ${error.message}`
      };
    }
  }

  // Tạo lớp học mới
  async createClass(classData) {
    try {
      const {
        code,
        className,
        subjectName,
        subjectCode,
        credits,
        teacherId,
        departmentId,
        majorId,
        semester,
        academicYear,
        maxStudents,
        totalWeeks,
        startDate,
        endDate,
        classRoomTypeId,
        description
      } = classData;

      const existingClass = await prisma.class.findUnique({
        where: { code }
      });

      if (existingClass) {
        return {
          success: false,
          message: 'Mã lớp học đã tồn tại'
        };
      }

      const teacher = await prisma.teacher.findUnique({
        where: { id: parseInt(teacherId) }
      });

      if (!teacher) {
        return {
          success: false,
          message: 'Không tìm thấy giảng viên'
        };
      }

      const department = await prisma.department.findUnique({
        where: { id: parseInt(departmentId) }
      });

      if (!department) {
        return {
          success: false,
          message: 'Không tìm thấy khoa'
        };
      }

      const cls = await prisma.class.create({
        data: {
          code,
          className,
          subjectName,
          subjectCode,
          credits: parseInt(credits),
          teacherId: parseInt(teacherId),
          departmentId: parseInt(departmentId),
          majorId: majorId ? parseInt(majorId) : null,
          semester,
          academicYear,
          maxStudents: parseInt(maxStudents),
          totalWeeks: parseInt(totalWeeks),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          classRoomTypeId: parseInt(classRoomTypeId),
          description
        },
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
      });

      return {
        success: true,
        data: {
          id: cls.id,
          code: cls.code,
          className: cls.className,
          subjectName: cls.subjectName,
          subjectCode: cls.subjectCode,
          credits: cls.credits,
          maxStudents: cls.maxStudents,
          semester: cls.semester,
          academicYear: cls.academicYear,
          startDate: cls.startDate,
          endDate: cls.endDate,
          description: cls.description,
          teacherId: cls.teacherId,
          teacherName: cls.teacher.user.fullName,
          teacherCode: cls.teacher.teacherCode,
          departmentId: cls.departmentId,
          departmentName: cls.department.name,
          majorId: cls.majorId,
          majorName: cls.major?.name || 'Chưa xác định',
          classRoomTypeId: cls.classRoomTypeId,
          classRoomTypeName: cls.ClassRoomType.name,
          statusId: 1, // Mới tạo = Chờ phân phòng
          statusName: 'Chờ phân phòng'
        },
        message: 'Tạo lớp học thành công'
      };
    } catch (error) {
      console.error('[ClassService.createClass] Error:', error);
      return {
        success: false,
        message: `Lỗi tạo lớp học: ${error.message}`
      };
    }
  }
  // trả về tên thứ trong tuần
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

  // trả về tên trạng thái lớp học
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
}

module.exports = new ClassService();