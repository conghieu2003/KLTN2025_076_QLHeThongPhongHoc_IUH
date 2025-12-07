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

      // Lọc chỉ lấy lớp có classSchedules 
      const classesWithSchedules = classes.filter(cls => {
        return cls.classSchedules && cls.classSchedules.length > 0;
      });

      return classesWithSchedules.map(cls => {
         // Xác định trạng thái lớp
         const allSchedulesAssigned = cls.classSchedules.length > 0 && cls.classSchedules.every(schedule => schedule.statusId === 2);
         const classStatusId = allSchedulesAssigned ? 2 : 1;
         
         const allSchedules = cls.classSchedules;
        
        return {
          id: cls.id.toString(),
          classId: cls.id,
          className: cls.className || '',
          code: cls.code || cls.subjectCode || `CLASS${cls.id}`, 
          subjectCode: cls.subjectCode,
          subjectName: cls.subjectName,
          teacherName: cls.teacher?.user?.fullName || '',
          departmentName: cls.department?.name || '',
          department: cls.department,
          majorName: cls.major?.name || '',
          maxStudents: cls.maxStudents,
          classRoomTypeId: cls.classRoomTypeId,
          classRoomTypeName: cls.ClassRoomType?.name || '',
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
              classRoomTypeName: schedule.ClassRoomType?.name || '',
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
      const totalSchedules = await prisma.classSchedule.count();
      const pendingSchedules = await prisma.classSchedule.count({
        where: { statusId: 1 }
      });
      const assignedSchedules = await prisma.classSchedule.count({
        where: { statusId: 2 }
      });

      const allClasses = await prisma.class.findMany({
        include: { classSchedules: true }
      });

      let assignedClasses = 0;
      let pendingClasses = 0;

      allClasses.forEach(cls => {
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
          timeSlot: true 
        }
      });

      if (!schedule) {
        throw new Error('Không tìm thấy lịch học');
      }

      const whereClause = {
        classRoomTypeId: schedule.classRoomTypeId, 
        isAvailable: true,
        OR: [
          { departmentId: schedule.class.departmentId }, 
          { departmentId: null } 
        ]
      };

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
          { departmentId: 'asc' }, 
          { capacity: 'asc' }
        ]
      });

      const conflictingSchedules = await prisma.classSchedule.findMany({
        where: {
          dayOfWeek: schedule.dayOfWeek,
          timeSlotId: schedule.timeSlotId, 
          classRoomId: { not: null },
          statusId: { in: [2, 3] }, 
          id: { not: parseInt(scheduleId) } 
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
          const conflictInfo = conflictingSchedules.find(s => s.classRoomId === room.id);
          
          return {
          id: room.id,
          code: room.code,
          name: room.name,
          capacity: room.capacity,
          building: room.building,
          floor: room.floor,
          type: room.ClassRoomType.name,
          department: room.department?.name || '',
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


      if (schedule.classRoomId && schedule.statusId === 2) {
        throw new Error('Lịch học đã được gán phòng');
      }

      const room = await prisma.classRoom.findUnique({
        where: { id: parseInt(roomId) }
      });

      if (!room || !room.isAvailable) {
        throw new Error('Phòng học không khả dụng');
      }

      const conflict = await prisma.classSchedule.findFirst({
        where: {
          dayOfWeek: schedule.dayOfWeek,
          timeSlotId: schedule.timeSlotId,
          classRoomId: parseInt(roomId),
           statusId: { in: [2, 3] }, 
           id: { not: parseInt(scheduleId) } 
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
         throw new Error(`Phòng học đã được sử dụng trong khung giờ bởi lớp ${conflictClass} (${conflictTeacher})`);
      }

      const updatedSchedule = await prisma.classSchedule.update({
        where: { id: parseInt(scheduleId) },
        data: {
          classRoomId: parseInt(roomId),
          statusId: 2, 
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

      const classInfo = await prisma.class.findUnique({
        where: { id: updatedSchedule.classId },
        include: { classSchedules: true }
      });

       const allSchedulesAssigned = classInfo?.classSchedules.every(schedule => schedule.statusId === 2) || false;
       const classStatusId = allSchedulesAssigned ? 2 : 1; 

      const result = {
        scheduleId: updatedSchedule.id,
        scheduleStatusId: 2, 
        scheduleStatusName: 'Đã phân phòng',
        
        classId: updatedSchedule.classId,
        className: updatedSchedule.class.className,
        classStatusId: classStatusId, 
        
        roomId: updatedSchedule.classRoomId,
        roomName: updatedSchedule.classRoom.name,
        roomCode: updatedSchedule.classRoom.code,
        roomType: updatedSchedule.classRoom.ClassRoomType?.name || '',
        
        classRoomTypeId: updatedSchedule.classRoomTypeId,
        classRoomTypeName: updatedSchedule.ClassRoomType?.name || '',
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

      try {
        await SocketClient.emitRoomAssigned(result);
        await SocketClient.emitScheduleUpdated({
          ...result,
          weekStartDate: null 
        });
        
        const stats = await this.getSchedulingStats();
        await SocketClient.emitStatsUpdated(stats);
      } catch (socketError) {
        console.error('Error emitting socket event:', socketError);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Lỗi gán phòng: ${error.message}`);
    }
  }

  // Hủy gán phòng cho lịch học
  async unassignRoomFromSchedule(scheduleId) {
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

      try {
        await SocketClient.emitRoomUnassigned(result);
        
        await SocketClient.emitScheduleUpdated({
          ...result,
          weekStartDate: null
        });
        
        const stats = await this.getSchedulingStats();
        await SocketClient.emitStatsUpdated(stats);
      } catch (socketError) {
        console.error('Error emitting socket event:', socketError);
      }

      return result;
    } catch (error) {
      throw new Error(`Lỗi hủy gán phòng: ${error.message}`);
    }
  }

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
        departmentName: teacher.department?.name || ''
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách giảng viên: ${error.message}`);
    }
  }

  // Lấy danh sách giảng viên trống vào thời điểm cụ thể
  async getAvailableTeachers(date, timeSlotId, departmentId = null, excludeTeacherId = null) {
    try {
      const targetDate = new Date(date);
      const jsDay = targetDate.getDay(); 
      const dayOfWeek = jsDay === 0 ? 1 : jsDay + 1; 

      // Lấy tất cả giảng viên
      const whereClause = {};
      if (departmentId) {
        whereClause.departmentId = parseInt(departmentId);
      }

      const targetDateStart = new Date(targetDate);
      targetDateStart.setHours(0, 0, 0, 0);
      const targetDateEnd = new Date(targetDate);
      targetDateEnd.setHours(23, 59, 59, 999);

      const allTeachers = await prisma.teacher.findMany({
        where: whereClause,
        include: {
          user: true,
          department: true,
          classSchedules: {
            where: {
              dayOfWeek: dayOfWeek,
              timeSlotId: parseInt(timeSlotId),
              statusId: { in: [2, 3] } 
            },
            include: {
              scheduleRequests: {
                where: {
                  exceptionDate: {
                    gte: targetDateStart,
                    lte: targetDateEnd
                  },
                  requestStatusId: { in: [2, 4] }, 
                  requestTypeId: { in: [5, 6, 7, 8, 9, 10] } 
                }
              }
            }
          },
          scheduleRequestSubstitutes: {
            where: {
              exceptionDate: {
                gte: targetDateStart,
                lte: targetDateEnd
              },
              requestStatusId: { in: [2, 4] },
              requestTypeId: { in: [9, 10] }
            },
            include: {
              classSchedule: true,
              class: {
                include: {
                  teacher: true
                }
              },
              newTimeSlot: true
            }
          }
        },
        orderBy: { user: { fullName: 'asc' } }
      });

      // Lọc giảng viên trống
      const availableTeachers = allTeachers.filter(teacher => {
        if (excludeTeacherId && teacher.id === parseInt(excludeTeacherId)) {
          return false;
        }

        if (teacher.scheduleRequestSubstitutes && teacher.scheduleRequestSubstitutes.length > 0) {
          const hasConflictSubstitute = teacher.scheduleRequestSubstitutes.some(request => {
            if (request.requestTypeId === 10) {
              if (!request.newTimeSlot) {
                return false;
              }
              const conflictTimeSlotId = request.newTimeSlot.id;
              return conflictTimeSlotId === parseInt(timeSlotId);
            }
            
            if (!request.classSchedule) {
              return false;
            }
            // So sánh dayOfWeek và timeSlotId
            const conflictDayOfWeek = request.classSchedule.dayOfWeek;
            const conflictTimeSlotId = request.classSchedule.timeSlotId;
            return conflictDayOfWeek === dayOfWeek && conflictTimeSlotId === parseInt(timeSlotId);
          });
          
          if (hasConflictSubstitute) {
            return false; 
          }
        }
        if (teacher.classSchedules.length === 0) {
          return true;
        }

        // Kiểm tra xem có lịch nào đang hoạt động (giảng viên bận) không
        const hasActiveSchedule = teacher.classSchedules.some(schedule => {
          const exceptions = schedule.scheduleRequests || [];
          const hasCancelledException = exceptions.some(
            req => req.requestTypeId === 5
          );
          
          const hasMovedException = exceptions.some(
            req => req.requestTypeId === 8
          );

          // Nếu lịch bị tạm ngưng hoặc chuyển đi, giảng viên trống 
          if (hasCancelledException || hasMovedException) {
            return false; 
          }

          const hasSubstituteException = exceptions.some(
            req => req.requestTypeId === 9 && req.substituteTeacherId
          );

          if (hasSubstituteException) {
            return false;
          }

          return true; 
        });

        const isAvailable = !hasActiveSchedule;

        return isAvailable;
      });

      return availableTeachers.map(teacher => ({
        id: teacher.id,
        fullName: teacher.user.fullName,
        name: teacher.user.fullName,
        code: teacher.teacherCode,
        teacherCode: teacher.teacherCode,
        departmentId: teacher.departmentId,
        departmentName: teacher.department?.name || ''
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách giảng viên trống: ${error.message}`);
    }
  }

  // Lấy danh sách RequestType
  async getRequestTypes() {
    try {
      const requestTypes = await prisma.requestType.findMany({
        where: { id: { lte: 6 } },
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

  async getWeeklySchedule(weekStartDate, filters = {}, userRole = 'admin', userId = null) {
    try {
      const startDate = new Date(weekStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      const earliestClass = await prisma.class.findFirst({
        orderBy: { startDate: 'asc' },
        select: { startDate: true }
      });
      
      const semesterStartDate = earliestClass?.startDate ? new Date(earliestClass.startDate) : new Date('2025-09-01');
      const currentWeek = Math.floor((startDate - semesterStartDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
      
      let whereCondition = {
        startWeek: { lte: currentWeek },
        endWeek: { gte: currentWeek },
        class: {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
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

      if (userRole === 'teacher' && userId) {
        const teacher = await prisma.teacher.findFirst({
          where: { userId: parseInt(userId) },
          select: { id: true }
        });
        
        if (!teacher) {
          return [];
        }
        
        whereCondition.OR = [
          {
            teacherId: teacher.id,
            OR: [
              { statusId: { in: [2, 3] } }, 
              { 
                AND: [
                  { statusId: 1 },
                  { classRoomId: { not: null } } 
                ]
              }
            ]
          },
          {
            scheduleRequests: {
              some: {
                substituteTeacherId: teacher.id,
                requestStatusId: { in: [2, 4] },
                requestTypeId: 9,
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
        whereCondition.OR = [
          { statusId: { in: [2, 3] } }, 
          { 
            AND: [
              { statusId: 1 },
              { classRoomId: { not: null } } 
            ]
          }
        ];
      } else {
        whereCondition.OR = [
          { statusId: { in: [2, 3] } }, 
          { 
            AND: [
              { statusId: 1 },
              { classRoomId: { not: null } } 
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
          // Gồm thông tin ngoại lệ
          scheduleRequests: {
            where: {
              requestStatusId: 2,
              requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9, 10] } 
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
      // Lấy các exceptions có movedToDate trong tuần này
      const standaloneExceptions = await prisma.scheduleRequest.findMany({
        where: {
          OR: [
            {
              exceptionType: { in: ['exam', 'moved'] },
              movedToDate: {
                gte: startDate,
                lte: endDate
              },
              requestStatusId: 2,
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
              requestTypeId: 10,
              exceptionDate: {
                gte: startDate,
                lte: endDate
              },
              requestStatusId: 2,
              classScheduleId: null 
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

      // Lọc thêm theo department nếu có filter 
      const filteredStandaloneExceptions = standaloneExceptions.filter(exception => {
        if (exception.requestTypeId === 10 && !exception.classScheduleId) {
          if (!exception.class) return false;
          
          if (filters.departmentId) {
            if (exception.class.departmentId !== parseInt(filters.departmentId)) {
              return false;
            }
          }
          
          if (filters.classId) {
            if (exception.class.id !== parseInt(filters.classId)) {
              return false;
            }
          }
          
          const substituteTeacher = exception.substituteTeacher;
          const originalTeacherId = exception.class.teacherId;
          
          if (filters.teacherId) {
            const targetTeacherId = parseInt(filters.teacherId);
            
            if (substituteTeacher) {
              if (substituteTeacher.id !== targetTeacherId) {
                return false;
              }
            } else {
              if (originalTeacherId !== targetTeacherId) {
                return false;
              }
            }
          }
          
          if (userRole === 'teacher' && userId) {
            const originalTeacher = exception.class.teacher;
            const targetUserId = parseInt(userId);
            
            if (substituteTeacher) {
              if (substituteTeacher.userId !== targetUserId) {
                return false;
              }
            } else {
              if (!originalTeacher || originalTeacher.userId !== targetUserId) {
                return false;
              }
            }
          } else if (userRole === 'student' && userId) {
            return true;
          }
          
          return true;
        }
        
        if (!exception.classSchedule) return false;
        
        if (filters.departmentId) {
          return exception.classSchedule.class.departmentId === parseInt(filters.departmentId);
        }
        
        if (userRole === 'teacher' && userId) {
          const teacher = exception.classSchedule.class.teacher;
          return teacher && teacher.userId === parseInt(userId);
        } else if (userRole === 'student' && userId) {
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
        
        const relevantExceptions = schedule.scheduleRequests.filter(request => {
          if (!request.exceptionDate) {
            return false;
          }
          
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
      
        const cancelledException = relevantExceptions.find(ex => 
          ex.exceptionType === 'cancelled' || 
          ex.requestTypeId === 5 || 
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
        
        const substituteException = relevantExceptions.find(ex => 
          ex.exceptionType === 'substitute'
        );
        
        if (substituteException) {
          if (!mergedException) {
            mergedException = substituteException;
          }
          substituteTeacher = substituteException.substituteTeacher || substituteTeacher;
        }
        
        if (roomChangeException) {
          if (!newRoom) {
            newRoom = roomChangeException.newClassRoom;
          }
          if (roomChangeException.substituteTeacher) {
            substituteTeacher = roomChangeException.substituteTeacher;
          }
          if (!mergedException) {
            mergedException = roomChangeException;
          }
        }
        
        if (!mergedException && relevantExceptions.length > 0) {
          mergedException = relevantExceptions[0];
          substituteTeacher = mergedException.substituteTeacher;
          newRoom = mergedException.newClassRoom;
        }
        
        const exception = mergedException;
        
        let isMovedToThisWeek = false;
        let movedToDayOfWeek = null;
        let isMovedToDifferentDay = false;
        let isMovedToSameDate = false; 
        
        if (isMoved && movedToDate) {
          const movedDate = new Date(movedToDate);
          const startDateObj = new Date(weekStartDate);
          const endDateObj = new Date(startDateObj);
          endDateObj.setDate(startDateObj.getDate() + 6);
          
          if (exception && exception.exceptionDate) {
            const exceptionDate = new Date(exception.exceptionDate);
            const movedDateStr = movedDate.toISOString().split('T')[0];
            const exceptionDateStr = exceptionDate.toISOString().split('T')[0];
            isMovedToSameDate = movedDateStr === exceptionDateStr;
          }
          
          if (movedDate >= startDateObj && movedDate <= endDateObj) {
            isMovedToThisWeek = true;
            const movedDayJS = movedDate.getDay(); 
            movedToDayOfWeek = movedDayJS === 0 ? 1 : movedDayJS + 1;
            
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
          const displayRoom = newRoom || schedule.classRoom;
          const displayTimeSlot = newTimeSlot || timeSlot;
          const displayShift = newTimeSlot ? this.getShiftFromTimeSlot(newTimeSlot.shift) : shift;
          const displayTeacher = substituteTeacher || schedule.class.teacher;
          
          if (userRole === 'teacher' && currentTeacherId && substituteTeacher) {
            if (substituteTeacher.id !== currentTeacherId) {
              return; 
            }
          }
          
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
          teacherName: displayTeacher?.user?.fullName || schedule.class.teacher?.user?.fullName || '',
          teacherCode: displayTeacher?.teacherCode || schedule.class.teacher?.teacherCode || '',
          roomId: displayRoom?.id || schedule.classRoomId,
          roomName: displayRoom?.name || (schedule.statusId === 1 ? '' : ''),
          roomCode: displayRoom?.code || schedule.classRoom?.code || '',
          roomType: displayRoom?.ClassRoomType?.name || schedule.classRoom?.ClassRoomType?.name || (schedule.statusId === 1 ? 'Chờ phân phòng' : ''),
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
          departmentName: schedule.class.department?.name || '',
          majorId: schedule.class.majorId,
          majorName: schedule.class.major?.name || '',
          timeSlotOrder: this.getTimeSlotOrder(displayTimeSlot.shift),
          assignedAt: schedule.assignedAt,
          note: schedule.note,
          // Thông tin ngoại lệ 
          exceptionDate: displayException?.exceptionDate || exception?.exceptionDate || null,
          exceptionType: displayException?.exceptionType || exception?.exceptionType || null,
          exceptionReason: displayException?.reason || exception?.reason || null,
          exceptionStatus: displayException?.RequestStatus?.name || exception?.RequestStatus?.name || null,
          requestTypeId: displayException?.requestTypeId || exception?.requestTypeId || null,
          isOriginalSchedule: true
        });
        }
        if (isMovedToThisWeek && movedToDayOfWeek && isMovedToDifferentDay && !isMovedToSameDate && exception) {

          const movedTimeSlot = newTimeSlot || exception.movedToTimeSlot || exception.newTimeSlot;
          const movedRoom = newRoom || exception.movedToClassRoom || exception.newClassRoom;
          const movedSubstituteTeacher = substituteTeacher || exception.substituteTeacher;
          const movedShift = movedTimeSlot ? this.getShiftFromTimeSlot(movedTimeSlot.shift) : shift;
          
          weeklySchedules.push({
            id: schedule.id + 100000,
            classId: schedule.classId,
            className: schedule.class.className,
            classCode: schedule.class.code,
            subjectCode: schedule.class.subjectCode,
            subjectName: schedule.class.subjectName,
            teacherId: movedSubstituteTeacher ? movedSubstituteTeacher.id : schedule.teacherId,
            teacherName: movedSubstituteTeacher ? movedSubstituteTeacher.user.fullName : (schedule.class.teacher?.user?.fullName || ''),
            teacherCode: movedSubstituteTeacher ? movedSubstituteTeacher.teacherCode : (schedule.class.teacher?.teacherCode || ''),
            roomId: movedRoom ? movedRoom.id : schedule.classRoomId,
            roomName: movedRoom ? movedRoom.name : (schedule.classRoom?.name || ''),
            roomCode: movedRoom ? movedRoom.code : (schedule.classRoom?.code || ''),
            roomType: movedRoom ? (movedRoom.ClassRoomType?.name || '') : (schedule.classRoom?.ClassRoomType?.name || ''),
            dayOfWeek: movedToDayOfWeek, 
            dayName: this.getDayName(movedToDayOfWeek),
            timeSlot: movedTimeSlot ? movedTimeSlot.slotName : timeSlot.slotName,
            timeRange: movedTimeSlot ? `${movedTimeSlot.startTime}-${movedTimeSlot.endTime}` : `${timeSlot.startTime}-${timeSlot.endTime}`,
            startTime: movedTimeSlot ? movedTimeSlot.startTime : timeSlot.startTime,
            endTime: movedTimeSlot ? movedTimeSlot.endTime : timeSlot.endTime,
            shift: movedShift.key,
            shiftName: movedShift.name,
            type: this.getScheduleType(schedule.classRoomTypeId),
            status: exception.RequestType?.name || 'Đổi lịch',
            statusId: exception.requestTypeId || 8,
            weekPattern: schedule.weekPattern,
            startWeek: schedule.startWeek,
            endWeek: schedule.endWeek,
            practiceGroup: schedule.practiceGroup,
            maxStudents: schedule.class.maxStudents,
            departmentId: schedule.class.departmentId,
            departmentName: schedule.class.department?.name || '',
            majorId: schedule.class.majorId,
            majorName: schedule.class.major?.name || '',
            timeSlotOrder: movedTimeSlot ? this.getTimeSlotOrder(movedTimeSlot.shift) : this.getTimeSlotOrder(timeSlot.shift),
            assignedAt: schedule.assignedAt,
            note: `Đã chuyển từ ${this.getDayName(schedule.dayOfWeek)} - ${timeSlot.slotName}`,
            // Thông tin ngoại lệ
            exceptionDate: exception.exceptionDate || null,
            exceptionType: exception.exceptionType || null,
            exceptionReason: exception.reason || null,
            exceptionStatus: exception.RequestStatus?.name || null,
            requestTypeId: exception.requestTypeId || null,
            isMovedSchedule: true, 
            originalDayOfWeek: schedule.dayOfWeek,
            originalTimeSlot: timeSlot.slotName
          });
        }
      });

      filteredStandaloneExceptions.forEach(exception => {
        if (exception.requestTypeId === 10 && !exception.classScheduleId && exception.class) {
          const classInfo = exception.class;
          const exceptionDate = new Date(exception.exceptionDate);
          const exceptionDayJS = exceptionDate.getDay(); // 0=CN, 1=T2, ..., 6=T7
          const exceptionDayOfWeek = exceptionDayJS === 0 ? 1 : exceptionDayJS + 1; 
          
          const timeSlot = exception.newTimeSlot || exception.movedToTimeSlot;
          const room = exception.newClassRoom || exception.movedToClassRoom;
          const examSubstituteTeacher = exception.substituteTeacher;
          
          if (!timeSlot) {
            return;
          }
          
          const shift = this.getShiftFromTimeSlot(timeSlot.shift);
          
          weeklySchedules.push({
            id: 200000 + exception.id,
            classId: classInfo.id,
            className: classInfo.className,
            classCode: classInfo.code,
            subjectCode: classInfo.subjectCode,
            subjectName: classInfo.subjectName,
            teacherId: examSubstituteTeacher ? examSubstituteTeacher.id : classInfo.teacherId,
            teacherName: examSubstituteTeacher ? examSubstituteTeacher.user.fullName : (classInfo.teacher?.user?.fullName || ''),
            teacherCode: examSubstituteTeacher ? examSubstituteTeacher.teacherCode : (classInfo.teacher?.teacherCode || ''),
            roomId: room ? room.id : null,
            roomName: room ? room.name : '',
            roomCode: room ? room.code : '',
            roomType: room ? (room.ClassRoomType?.name || '') : (classInfo.ClassRoomType?.name || ''),
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
            departmentName: classInfo.department?.name || '',
            majorId: classInfo.majorId,
            majorName: classInfo.major?.name || '',
            timeSlotOrder: this.getTimeSlotOrder(timeSlot.shift),
            assignedAt: exception.approvedAt,
            note: 'Thi cuối kỳ',
            // Thông tin ngoại lệ
            exceptionDate: exception.exceptionDate,
            exceptionType: exception.exceptionType,
            exceptionReason: exception.reason,
            exceptionStatus: exception.RequestStatus.name,
            requestTypeId: exception.requestTypeId,
            isStandaloneException: true, 
            isMovedSchedule: false
          });
          return;
        }
        
        const schedule = exception.classSchedule;
        
        if (schedule && processedScheduleIds.has(schedule.id)) {
          return;
        }
        
        if (!exception.movedToDate) {
          return;
        }
        
        const movedDate = new Date(exception.movedToDate);
        const movedDayJS = movedDate.getDay(); 
        const movedToDayOfWeek = movedDayJS === 0 ? 1 : movedDayJS + 1; 
        
        const movedTimeSlot = exception.movedToTimeSlot || exception.newTimeSlot;
        const movedRoom = exception.movedToClassRoom || exception.newClassRoom;
        const standaloneSubstituteTeacher = exception.substituteTeacher;
        
        if (!movedTimeSlot) {
          return;
        }
        
        let classInfo, teacherInfo, originalTimeSlot, classRoomTypeId;
        
        if (schedule) {
          classInfo = schedule.class;
          teacherInfo = schedule.class.teacher;
          originalTimeSlot = schedule.timeSlot;
          classRoomTypeId = schedule.classRoomTypeId;
        } else if (exception.class) {
          classInfo = exception.class;
          teacherInfo = exception.class.teacher;
          originalTimeSlot = null; 
          classRoomTypeId = exception.class.classRoomTypeId;
        } else {
          return;
        }
        
        if (!classInfo) {
          return;
        }
        
        const movedShift = movedTimeSlot ? this.getShiftFromTimeSlot(movedTimeSlot.shift) : 
                          (originalTimeSlot ? this.getShiftFromTimeSlot(originalTimeSlot.shift) : 
                          this.getShiftFromTimeSlot(movedTimeSlot.shift));
        // tạo ngoại lệ ảo để tránh trùng
        weeklySchedules.push({
          id: schedule ? (schedule.id + 100000 + exception.id) : (300000 + exception.id), 
          classId: classInfo.id,
          className: classInfo.className,
          classCode: classInfo.code,
          subjectCode: classInfo.subjectCode,
          subjectName: classInfo.subjectName,
          teacherId: standaloneSubstituteTeacher ? standaloneSubstituteTeacher.id : (teacherInfo?.id || classInfo.teacherId),
          teacherName: standaloneSubstituteTeacher ? standaloneSubstituteTeacher.user.fullName : (teacherInfo?.user?.fullName || classInfo.teacher?.user?.fullName || ''),
          teacherCode: standaloneSubstituteTeacher ? standaloneSubstituteTeacher.teacherCode : (teacherInfo?.teacherCode || classInfo.teacher?.teacherCode || ''),
          roomId: movedRoom ? movedRoom.id : (schedule?.classRoomId || null),
          roomName: movedRoom ? movedRoom.name : (schedule?.classRoom?.name || ''),
          roomCode: movedRoom ? movedRoom.code : (schedule?.classRoom?.code || ''),
          roomType: movedRoom ? (movedRoom.ClassRoomType?.name || '') : (schedule?.classRoom?.ClassRoomType?.name || ''),
          dayOfWeek: movedToDayOfWeek, 
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
          departmentName: classInfo.department?.name || '',
          majorId: classInfo.majorId,
          majorName: schedule.class.major?.name || '',
          timeSlotOrder: movedTimeSlot ? this.getTimeSlotOrder(movedTimeSlot.shift) : this.getTimeSlotOrder(originalTimeSlot.shift),
          assignedAt: schedule.assignedAt,
          note: `Đã chuyển từ ${this.getDayName(schedule.dayOfWeek)} - ${originalTimeSlot.slotName}`,
          // Thông tin ngoại lệ
          exceptionDate: exception.exceptionDate,
          exceptionType: exception.exceptionType,
          exceptionReason: exception.reason,
          exceptionStatus: exception.RequestStatus.name,
          requestTypeId: exception.requestTypeId,
          isMovedSchedule: true, 
          isStandaloneException: true, 
          originalDayOfWeek: schedule.dayOfWeek,
          originalTimeSlot: originalTimeSlot.slotName
        });
      });

      return weeklySchedules;
    } catch (error) {
      throw new Error(`Lỗi lấy lịch học theo tuần: ${error.message}`);
    }
  }

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
    return statuses[statusId] || '';
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
    if (typeof shift === 'number' && shift >= 1 && shift <= 3) {
      return shift;
    }
    return 1;
  }
}

module.exports = new ScheduleManagementService();