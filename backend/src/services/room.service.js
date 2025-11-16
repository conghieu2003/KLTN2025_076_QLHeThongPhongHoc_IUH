const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RoomService {
  // Helper method để xử lý dữ liệu phòng
  processRoomData(room) {
    return {
      id: room.id.toString(),
      roomNumber: room.code,
      name: room.name,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      type: room.ClassRoomType?.name || '',
      campus: room.campus,
      department: room.department?.name || '',
      description: room.description,
      isAvailable: room.isAvailable
    };
  }

  async getAllRooms() {
    try {
      const rooms = await prisma.classRoom.findMany({
        include: {
          ClassRoomType: true,
          department: true
        }
      });

      console.log('Found rooms:', rooms.length);
      return rooms.map(room => this.processRoomData(room));
    } catch (error) {
      console.error('Error in getAllRooms:', error);
      throw new Error(`Lỗi lấy danh sách phòng học: ${error.message}`);
    }
  }

  // Lấy phòng học theo khoa và loại phòng
  async getRoomsByDepartmentAndType(departmentId, classRoomTypeId) {
    try {
      const whereClause = {
        isAvailable: true
      };

      // Lọc theo khoa nếu có
      if (departmentId && departmentId !== 'all') {
        whereClause.OR = [
          { departmentId: parseInt(departmentId) },
          { departmentId: null } // Phòng chung
        ];
      }

      // Lọc theo loại phòng nếu có
      if (classRoomTypeId && classRoomTypeId !== 'all') {
        whereClause.classRoomTypeId = parseInt(classRoomTypeId);
      }

      const rooms = await prisma.classRoom.findMany({
        where: whereClause,
        include: {
          ClassRoomType: true,
          department: true
        },
        orderBy: [
          { building: 'asc' },
          { floor: 'asc' },
          { code: 'asc' }
        ]
      });

      console.log(`Found ${rooms.length} rooms for department ${departmentId} and type ${classRoomTypeId}`);
      return rooms.map(room => this.processRoomData(room));
    } catch (error) {
      console.error('Error in getRoomsByDepartmentAndType:', error);
      throw new Error(`Lỗi lấy danh sách phòng học: ${error.message}`);
    }
  }

  async getRoomById(roomId) {
    try {
      const room = await prisma.classRoom.findUnique({
        where: { id: parseInt(roomId) },
        include: {
          ClassRoomType: true,
          department: true
        }
      });

      if (!room) {
        throw new Error('Không tìm thấy phòng học');
      }

      return this.processRoomData(room);
    } catch (error) {
      throw new Error(`Lỗi lấy thông tin phòng học: ${error.message}`);
    }
  }

  async createRoom(roomData) {
    try {
      const room = await prisma.classRoom.create({
        data: {
          code: roomData.code,
          name: roomData.name,
          capacity: parseInt(roomData.capacity),
          building: roomData.building,
          floor: parseInt(roomData.floor),
          campus: roomData.campus,
          classRoomTypeId: parseInt(roomData.classRoomTypeId),
          departmentId: roomData.departmentId ? parseInt(roomData.departmentId) : null,
          isAvailable: roomData.isAvailable !== false,
          description: roomData.description
        },
        include: {
          ClassRoomType: true,
          department: true
        }
      });

      return this.processRoomData(room);
    } catch (error) {
      throw new Error(`Lỗi tạo phòng học: ${error.message}`);
    }
  }

  async updateRoom(roomId, roomData) {
    try {
      const room = await prisma.classRoom.update({
        where: { id: parseInt(roomId) },
        data: {
          code: roomData.code,
          name: roomData.name,
          capacity: parseInt(roomData.capacity),
          building: roomData.building,
          floor: parseInt(roomData.floor),
          campus: roomData.campus,
          classRoomTypeId: parseInt(roomData.classRoomTypeId),
          departmentId: roomData.departmentId ? parseInt(roomData.departmentId) : null,
          isAvailable: roomData.isAvailable !== false,
          description: roomData.description
        },
        include: {
          ClassRoomType: true,
          department: true
        }
      });

      return this.processRoomData(room);
    } catch (error) {
      throw new Error(`Lỗi cập nhật phòng học: ${error.message}`);
    }
  }

  async deleteRoom(roomId) {
    try {
      // Kiểm tra xem phòng có đang được sử dụng không
      const schedules = await prisma.classSchedule.findMany({
        where: { classRoomId: parseInt(roomId) }
      });

      if (schedules.length > 0) {
        throw new Error('Không thể xóa phòng học đang được sử dụng');
      }

      await prisma.classRoom.delete({
        where: { id: parseInt(roomId) }
      });

      return { message: 'Xóa phòng học thành công' };
    } catch (error) {
      throw new Error(`Lỗi xóa phòng học: ${error.message}`);
    }
  }

  // Helper methods cho các API khác
  async getClassRoomTypes() {
    try {
      return await prisma.classRoomType.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách loại phòng: ${error.message}`);
    }
  }


  async getRequestTypes() {
    try {
      return await prisma.requestType.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách loại yêu cầu: ${error.message}`);
    }
  }

  async getRequestStatuses() {
    try {
      return await prisma.requestStatus.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách trạng thái yêu cầu: ${error.message}`);
    }
  }

  async getTimeSlots() {
    try {
      const timeSlots = await prisma.timeSlot.findMany({
        orderBy: { startTime: 'asc' }
      });

      return timeSlots.map(slot => ({
        id: slot.id,
        slotName: slot.slotName,
        startTime: slot.startTime.toTimeString().slice(0, 8),
        endTime: slot.endTime.toTimeString().slice(0, 8),
        shift: slot.shift
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách tiết học: ${error.message}`);
    }
  }


  // Lấy danh sách lớp học của giảng viên
  async getTeacherSchedules(userId) {
    try {
      // Tìm Teacher ID từ User ID
      const teacher = await prisma.teacher.findFirst({
        where: {
          userId: parseInt(userId)
        },
        select: {
          id: true
        }
      });

      if (!teacher) {
        return [];
      }

      const classSchedules = await prisma.classSchedule.findMany({
        where: {
          teacherId: teacher.id,
          classRoomId: {
            not: null  // Chỉ lấy những lớp đã có phòng
          }
        },
        include: {
          class: {
            select: {
              id: true,
              code: true,
              className: true,
              subjectName: true,
              subjectCode: true,
              maxStudents: true
            }
          },
          classRoom: {
            select: {
              id: true,
              code: true,
              name: true,
              capacity: true,
              ClassRoomType: {
                select: {
                  name: true
                }
              }
            }
          },
          timeSlot: {
            select: {
              id: true,
              slotName: true,
              startTime: true,
              endTime: true,
              shift: true
            }
          }
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { timeSlotId: 'asc' }
        ]
      });

      return classSchedules.map(schedule => ({
        id: schedule.id,
        classId: schedule.classId,
        teacherId: schedule.teacherId,
        classRoomId: schedule.classRoomId,
        dayOfWeek: schedule.dayOfWeek,
        timeSlotId: schedule.timeSlotId,
        weekPattern: schedule.weekPattern,
        startWeek: schedule.startWeek,
        endWeek: schedule.endWeek,
        status: schedule.statusId,
        class: {
          id: schedule.class.id,
          code: schedule.class.code,
          className: schedule.class.className,
          subjectName: schedule.class.subjectName,
          subjectCode: schedule.class.subjectCode,
          maxStudents: schedule.class.maxStudents
        },
        classRoom: schedule.classRoom ? {
          id: schedule.classRoom.id,
          code: schedule.classRoom.code,
          name: schedule.classRoom.name,
          capacity: schedule.classRoom.capacity,
          type: schedule.classRoom.ClassRoomType?.name || ''
        } : null,
        timeSlot: {
          id: schedule.timeSlot.id,
          slotName: schedule.timeSlot.slotName,
          startTime: schedule.timeSlot.startTime.toTimeString().slice(0, 8),
          endTime: schedule.timeSlot.endTime.toTimeString().slice(0, 8),
          shift: schedule.timeSlot.shift
        }
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách lớp học của giảng viên: ${error.message}`);
    }
  }

  // Lấy thông tin chi tiết của một lớp học
  async getClassScheduleById(scheduleId) {
    try {
      const schedule = await prisma.classSchedule.findUnique({
        where: {
          id: parseInt(scheduleId)
        },
        include: {
          class: {
            select: {
              id: true,
              code: true,
              className: true,
              subjectName: true,
              subjectCode: true,
              maxStudents: true,
              credits: true,
              semester: true,
              academicYear: true
            }
          },
          classRoom: {
            select: {
              id: true,
              code: true,
              name: true,
              capacity: true,
              building: true,
              floor: true,
              ClassRoomType: {
                select: {
                  name: true
                }
              }
            }
          },
          timeSlot: {
            select: {
              id: true,
              slotName: true,
              startTime: true,
              endTime: true,
              shift: true
            }
          },
          teacher: {
            select: {
              id: true,
              teacherCode: true,
              user: {
                select: {
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!schedule) {
        throw new Error('Không tìm thấy lớp học');
      }

      return {
        id: schedule.id,
        classId: schedule.classId,
        teacherId: schedule.teacherId,
        classRoomId: schedule.classRoomId,
        dayOfWeek: schedule.dayOfWeek,
        timeSlotId: schedule.timeSlotId,
        weekPattern: schedule.weekPattern,
        startWeek: schedule.startWeek,
        endWeek: schedule.endWeek,
        status: schedule.statusId,
        class: {
          id: schedule.class.id,
          code: schedule.class.code,
          className: schedule.class.className,
          subjectName: schedule.class.subjectName,
          subjectCode: schedule.class.subjectCode,
          maxStudents: schedule.class.maxStudents,
          credits: schedule.class.credits,
          semester: schedule.class.semester,
          academicYear: schedule.class.academicYear
        },
        classRoom: schedule.classRoom ? {
          id: schedule.classRoom.id,
          code: schedule.classRoom.code,
          name: schedule.classRoom.name,
          capacity: schedule.classRoom.capacity,
          type: schedule.classRoom.ClassRoomType?.name || '',
          building: schedule.classRoom.building,
          floor: schedule.classRoom.floor
        } : null,
        timeSlot: {
          id: schedule.timeSlot.id,
          slotName: schedule.timeSlot.slotName,
          startTime: schedule.timeSlot.startTime.toTimeString().slice(0, 8),
          endTime: schedule.timeSlot.endTime.toTimeString().slice(0, 8),
          shift: schedule.timeSlot.shift
        },
        teacher: {
          id: schedule.teacher.id,
          teacherCode: schedule.teacher.teacherCode,
          fullName: schedule.teacher.user.fullName,
          email: schedule.teacher.user.email
        }
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thông tin lớp học: ${error.message}`);
    }
  }

  // Lấy lịch học theo time slot và thứ trong tuần (có hỗ trợ kiểm tra ngoại lệ cho ngày cụ thể)
  async getSchedulesByTimeSlotAndDate(timeSlotId, dayOfWeek, specificDate = null) {
    try {
      const schedules = await prisma.classSchedule.findMany({
        where: {
          timeSlotId: parseInt(timeSlotId),
          dayOfWeek: parseInt(dayOfWeek) // dayOfWeek (1-7)
        },
        include: {
          class: {
            select: {
              id: true,
              className: true,
              subjectName: true,
              startDate: true,
              endDate: true
            }
          },
          classRoom: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          teacher: {
            select: {
              id: true,
              teacherCode: true,
              user: {
                select: {
                  fullName: true
                }
              }
            }
          },
          scheduleRequests: specificDate ? {
            where: {
              exceptionDate: new Date(specificDate),
              requestStatusId: 2, // Chỉ lấy ngoại lệ đã hoàn thành
              requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] } // Lấy tất cả loại ngoại lệ
            },
            include: {
              RequestType: true
            }
          } : false
        }
      });

      // Nếu KHÔNG có ngày cụ thể → trả về lịch cố định như cũ
      if (!specificDate) {
        return schedules.map(schedule => ({
          id: schedule.id,
          classRoomId: schedule.classRoomId,
          classRoom: schedule.classRoom,
          class: schedule.class,
          teacher: schedule.teacher,
          dayOfWeek: schedule.dayOfWeek,
          timeSlotId: schedule.timeSlotId,
          hasException: false
        }));
      }

      // Nếu CÓ ngày cụ thể → kiểm tra ngoại lệ
      const specificDateObj = new Date(specificDate);

      return schedules
        .filter(schedule => {
          // Kiểm tra ngày có nằm trong khoảng thời gian của lớp không
          const classStartDate = new Date(schedule.class.startDate);
          const classEndDate = new Date(schedule.class.endDate);
          
          if (specificDateObj < classStartDate || specificDateObj > classEndDate) {
            return false; // Lớp chưa bắt đầu hoặc đã kết thúc
          }
          
          return true;
        })
        .map(schedule => {
          const hasException = schedule.scheduleRequests && schedule.scheduleRequests.length > 0;
          const exception = hasException ? schedule.scheduleRequests[0] : null;
          
          // RequestTypeId: 3=Tạm ngưng, 4=Thi, 5=Nghỉ, 6=Đổi lịch, ...
          if (exception) {
            const shouldFreeRoom = [3, 4, 5].includes(exception.requestTypeId) || // Tạm ngưng, Thi, Nghỉ
                                   ['cancelled', 'exam'].includes(exception.exceptionType);
            
            if (shouldFreeRoom) {
              return {
                id: schedule.id,
                classRoomId: null, // ← Phòng TRỐNG
                classRoom: null,
                class: schedule.class,
                teacher: schedule.teacher,
                dayOfWeek: schedule.dayOfWeek,
                timeSlotId: schedule.timeSlotId,
                hasException: true,
                exceptionType: exception.exceptionType || 'exception',
                exceptionReason: exception.reason,
                exceptionTypeName: exception.RequestType?.name || exception.exceptionType,
                requestTypeId: exception.requestTypeId,
                // Giữ thông tin phòng gốc
                originalClassRoom: schedule.classRoom
              };
            }
          }
          
          // Nếu ngoại lệ 'moved' → Phòng gốc TRỐNG
          if (exception && (exception.exceptionType === 'moved' || exception.requestTypeId === 6)) {
            return {
              id: schedule.id,
              classRoomId: null, // Phòng gốc trống
              classRoom: null,
              class: schedule.class,
              teacher: schedule.teacher,
              dayOfWeek: schedule.dayOfWeek,
              timeSlotId: schedule.timeSlotId,
              hasException: true,
              exceptionType: 'moved',
              exceptionReason: exception.reason,
              movedToClassRoomId: exception.movedToClassRoomId,
              movedToTimeSlotId: exception.movedToTimeSlotId,
              movedToDate: exception.movedToDate,
              originalClassRoom: schedule.classRoom
            };
          }
          
          // Không có ngoại lệ → giữ nguyên lịch cố định
          return {
            id: schedule.id,
            classRoomId: schedule.classRoomId,
            classRoom: schedule.classRoom,
            class: schedule.class,
            teacher: schedule.teacher,
            dayOfWeek: schedule.dayOfWeek,
            timeSlotId: schedule.timeSlotId,
            hasException: false
          };
        });
    } catch (error) {
      console.error('Error getting schedules by time slot and date:', error);
      throw new Error(`Lỗi lấy lịch học: ${error.message}`);
    }
  }

  // Lấy danh sách phòng available cho ngoại lệ (bao gồm cả phòng trống do ngoại lệ khác)
  async getAvailableRoomsForException(timeSlotId, dayOfWeek, specificDate, requiredCapacity = 0, classRoomTypeId = null, departmentId = null) {
    try {
      // Step 1: Lấy TẤT CẢ phòng phù hợp với các điều kiện
      const whereClause = {
        isAvailable: true,
        capacity: { gte: parseInt(requiredCapacity) || 0 }
      };

      // Lọc theo loại phòng nếu có
      if (classRoomTypeId && classRoomTypeId !== 'all') {
        whereClause.classRoomTypeId = parseInt(classRoomTypeId);
      }

      // Lọc theo khoa nếu có
      if (departmentId && departmentId !== 'all') {
        whereClause.OR = [
          { departmentId: parseInt(departmentId) },
          { departmentId: null } // Phòng chung
        ];
      }

      const allRooms = await prisma.classRoom.findMany({
        where: whereClause,
        include: {
          ClassRoomType: true,
          department: true
        }
      });

      // Step 2: Lấy schedules với exceptions cho ngày cụ thể
      const schedules = await this.getSchedulesByTimeSlotAndDate(
        timeSlotId,
        dayOfWeek,
        specificDate
      );

      const movedToWhereClause = {
        movedToTimeSlotId: parseInt(timeSlotId),
        movedToClassRoomId: { not: null },
        requestStatusId: 2, // Chỉ lấy ngoại lệ đã hoàn thành
        requestTypeId: { in: [6, 7, 8, 9] }, // Đổi lịch, Thi, Thay thế, v.v.
        OR: [
          { exceptionType: 'moved' },
          { exceptionType: 'exam' }
        ]
      };

      const movedToExceptionsAll = await prisma.scheduleRequest.findMany({
        where: {
          movedToTimeSlotId: parseInt(timeSlotId),
          movedToClassRoomId: { not: null },
          requestStatusId: 2, // Chỉ lấy ngoại lệ đã hoàn thành
          requestTypeId: { in: [6, 7, 8, 9] }, // Đổi lịch, Thi, Thay thế, v.v.
          OR: [
            { exceptionType: 'moved' },
            { exceptionType: 'exam' }
          ]
        },
        include: {
          classSchedule: {
            include: {
              class: {
                select: {
                  id: true,
                  className: true,
                  subjectName: true
                }
              }
            }
          },
          movedToClassRoom: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          RequestType: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Filter lại theo ngày nếu có specificDate (so sánh chính xác YYYY-MM-DD)
      const movedToExceptions = specificDate 
        ? movedToExceptionsAll.filter(ex => {
            if (!ex.movedToDate) return false;
            const exDate = new Date(ex.movedToDate);
            const exDateStr = exDate.toISOString().split('T')[0]; // YYYY-MM-DD
            const targetDate = new Date(specificDate);
            const targetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
            return exDateStr === targetDateStr;
          })
        : movedToExceptionsAll;

      // Danh sách phòng đang được "đổi lịch" đến (occupied by moved exceptions)
      const movedToRoomIds = movedToExceptions
        .filter(ex => ex.movedToClassRoomId)
        .map(ex => ex.movedToClassRoomId);


      // Step 4: Phân loại phòng
      const occupiedRoomIds = schedules
        .filter(s => s.classRoomId && !s.hasException)
        .map(s => s.classRoomId);

      // Thêm các phòng đang được "đổi lịch" đến vào danh sách occupied
      movedToRoomIds.forEach(roomId => {
        if (!occupiedRoomIds.includes(roomId)) {
          occupiedRoomIds.push(roomId);
        }
      });

      const freedRoomInfo = schedules
        .filter(s => s.hasException && s.originalClassRoom)
        .map(s => ({
          roomId: s.originalClassRoom.id,
          className: s.class.className,
          exceptionType: s.exceptionType,
          exceptionReason: s.exceptionReason,
          exceptionTypeName: s.exceptionTypeName
        }));

      const freedRoomIds = freedRoomInfo.map(r => r.roomId);

      // Tạo thông tin chi tiết về các phòng đang được "đổi lịch" đến
      const movedToRoomInfo = movedToExceptions
        .filter(ex => ex.movedToClassRoomId)
        .map(ex => ({
          roomId: ex.movedToClassRoomId,
          className: ex.classSchedule?.class?.className || 'Không xác định',
          exceptionType: ex.exceptionType || 'moved',
          exceptionReason: ex.reason || 'Đổi lịch',
          exceptionTypeName: ex.RequestType?.name || 'Đổi lịch'
        }));


      // Step 5: Tạo danh sách phòng với thông tin chi tiết
      // QUAN TRỌNG: Nếu phòng vừa "freed" (do tạm ngưng) vừa "occupied" (do đổi lịch), 
      // thì ưu tiên "occupied" vì đổi lịch chiếm phòng thực tế
      const categorizedRooms = allRooms.map(room => {
        const freedInfo = freedRoomInfo.find(f => f.roomId === room.id);
        const movedToInfo = movedToRoomInfo.find(m => m.roomId === room.id);
        const isFreedByException = !!freedInfo;
        const isOccupiedByMovedException = !!movedToInfo;
        
        // Kiểm tra xem phòng có bị "occupied" không (ưu tiên hơn "freed")
        // Phòng bị occupied nếu:
        // 1. Có trong occupiedRoomIds (schedule bình thường hoặc moved exception)
        // 2. HOẶC có movedToInfo (đang được đổi lịch đến)
        const isOccupied = occupiedRoomIds.includes(room.id) || isOccupiedByMovedException;

        const processedRoom = this.processRoomData(room);

        return {
          ...processedRoom,
          status: isOccupied ? 'occupied' : 'available',
          // Chỉ đánh dấu "freed" nếu KHÔNG bị "occupied" bởi moved exception
          isFreedByException: isFreedByException && !isOccupiedByMovedException,
          isOccupiedByMovedException,
          exceptionInfo: (isFreedByException && !isOccupiedByMovedException) ? freedInfo : null,
          movedToExceptionInfo: isOccupiedByMovedException ? movedToInfo : null
        };
      });

      // Step 6: Lọc và sắp xếp
      const result = {
        normalRooms: categorizedRooms.filter(r => r.status === 'available' && !r.isFreedByException),
        freedRooms: categorizedRooms.filter(r => r.isFreedByException),
        occupiedRooms: categorizedRooms.filter(r => r.status === 'occupied'),
        totalAvailable: categorizedRooms.filter(r => r.status === 'available').length
      };


      return result;
    } catch (error) {
      console.error('Error in getAvailableRoomsForException:', error);
      throw new Error(`Lỗi lấy phòng available: ${error.message}`);
    }
  }
}

module.exports = new RoomService();