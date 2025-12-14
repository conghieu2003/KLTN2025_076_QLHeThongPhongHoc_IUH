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
  // lấy danh sách phòng học
  async getAllRooms() {
    try {
      const rooms = await prisma.classRoom.findMany({
        include: {
          ClassRoomType: true,
          department: true
        }
      });
      return rooms.map(room => this.processRoomData(room));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách phòng học: ${error.message}`);
    }
  }

  // Lấy phòng học theo khoa và loại phòng
  async getRoomsByDepartmentAndType(departmentId, classRoomTypeId) {
    try {
      const whereClause = {
        isAvailable: true
      };

      if (departmentId && departmentId !== 'all') {
        whereClause.OR = [
          { departmentId: parseInt(departmentId) },
          { departmentId: null } 
        ];
      }
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
      return rooms.map(room => this.processRoomData(room));
    } catch (error) {
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

  // Lấy thông tin chi tiết phòng học bao gồm equipment và issues
  async getRoomDetails(roomId) {
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

      // Lấy thiết bị của phòng
      const equipment = await prisma.$queryRaw`
        SELECT 
          cre.id,
          cre.classRoomId,
          cre.equipmentId,
          cre.quantity,
          cre.isWorking,
          cre.lastMaintenanceDate,
          cre.nextMaintenanceDate,
          cre.note,
          e.code AS equipmentCode,
          e.name AS equipmentName,
          e.category AS equipmentCategory,
          e.description AS equipmentDescription
        FROM ClassRoomEquipment cre
        INNER JOIN Equipment e ON cre.equipmentId = e.id
        WHERE cre.classRoomId = ${parseInt(roomId)}
        ORDER BY e.category, e.name
      `;

      // Lấy vấn đề phòng học (chỉ lấy các vấn đề chưa giải quyết hoặc đang xử lý)
      const issues = await prisma.$queryRaw`
        SELECT 
          ri.id,
          ri.classRoomId,
          ri.reportedBy,
          ri.issueType,
          ri.title,
          ri.description,
          ri.severity,
          ri.startDate,
          ri.endDate,
          ri.status,
          ri.affectedEquipmentId,
          ri.autoCreateException,
          ri.exceptionCreated,
          ri.resolvedBy,
          ri.resolvedAt,
          ri.resolutionNote,
          ri.createdAt,
          ri.updatedAt,
          cr.code AS roomCode,
          cr.name AS roomName,
          u.fullName AS reporterName,
          u.email AS reporterEmail,
          ru.fullName AS resolverName,
          e.name AS equipmentName,
          e.code AS equipmentCode
        FROM RoomIssue ri
        INNER JOIN ClassRoom cr ON ri.classRoomId = cr.id
        INNER JOIN [User] u ON ri.reportedBy = u.id
        LEFT JOIN [User] ru ON ri.resolvedBy = ru.id
        LEFT JOIN Equipment e ON ri.affectedEquipmentId = e.id
        WHERE ri.classRoomId = ${parseInt(roomId)}
          AND ri.status IN ('open', 'in_progress')
        ORDER BY ri.severity DESC, ri.createdAt DESC
      `;

      return {
        room: this.processRoomData(room),
        equipment: equipment.map(eq => ({
          id: eq.id.toString(),
          classRoomId: eq.classRoomId.toString(),
          equipmentId: eq.equipmentId.toString(),
          quantity: eq.quantity,
          isWorking: eq.isWorking,
          lastMaintenanceDate: eq.lastMaintenanceDate,
          nextMaintenanceDate: eq.nextMaintenanceDate,
          note: eq.note,
          equipment: {
            id: eq.equipmentId.toString(),
            code: eq.equipmentCode,
            name: eq.equipmentName,
            category: eq.equipmentCategory,
            description: eq.equipmentDescription
          }
        })),
        issues: issues.map(issue => ({
          id: issue.id.toString(),
          classRoomId: issue.classRoomId.toString(),
          reportedBy: issue.reportedBy.toString(),
          issueType: issue.issueType,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          startDate: issue.startDate,
          endDate: issue.endDate,
          status: issue.status,
          affectedEquipmentId: issue.affectedEquipmentId ? issue.affectedEquipmentId.toString() : null,
          autoCreateException: issue.autoCreateException,
          exceptionCreated: issue.exceptionCreated,
          resolvedBy: issue.resolvedBy ? issue.resolvedBy.toString() : null,
          resolvedAt: issue.resolvedAt,
          resolutionNote: issue.resolutionNote,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          reporterName: issue.reporterName,
          reporterEmail: issue.reporterEmail,
          resolverName: issue.resolverName,
          equipmentName: issue.equipmentName,
          equipmentCode: issue.equipmentCode
        }))
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thông tin chi tiết phòng học: ${error.message}`);
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
              not: null
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

  // Lấy lịch học theo time slot và thứ trong tuần
  async getSchedulesByTimeSlotAndDate(timeSlotId, dayOfWeek, specificDate = null) {
    try {
      const schedules = await prisma.classSchedule.findMany({
        where: {
          timeSlotId: parseInt(timeSlotId),
          dayOfWeek: parseInt(dayOfWeek)
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
              requestStatusId: 2, 
              requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] }
            },
            include: {
              RequestType: true
            }
          } : false
        }
      });

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

      const specificDateObj = new Date(specificDate);

      return schedules
        .filter(schedule => {
          const classStartDate = new Date(schedule.class.startDate);
          const classEndDate = new Date(schedule.class.endDate);
          
          if (specificDateObj < classStartDate || specificDateObj > classEndDate) {
            return false;
          }
          
          return true;
        })
        .map(schedule => {
          const hasException = schedule.scheduleRequests && schedule.scheduleRequests.length > 0;
          const exception = hasException ? schedule.scheduleRequests[0] : null;
          
          if (exception) {
            const shouldFreeRoom = [3, 4, 5].includes(exception.requestTypeId) ||
                                   ['cancelled', 'exam'].includes(exception.exceptionType);
            
            if (shouldFreeRoom) {
              console.log(`[DEBUG] Freeing room ${schedule.classRoom?.name} due to exception type ${exception.exceptionType || exception.RequestType?.name}`);
              return {
                id: schedule.id,
                classRoomId: null,
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
                originalClassRoom: schedule.classRoom
              };
            }
          }
          
          if (exception && (exception.exceptionType === 'moved' || exception.requestTypeId === 6)) {
            return {
              id: schedule.id,
              classRoomId: null,
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

  async getAvailableRoomsForException(timeSlotId, dayOfWeek, specificDate, requiredCapacity = 0, classRoomTypeId = null, departmentId = null) {
    try {
      const whereClause = {
        isAvailable: true
      };

      if (classRoomTypeId && classRoomTypeId !== 'all') {
        const parsedClassRoomTypeId = parseInt(classRoomTypeId);
        whereClause.classRoomTypeId = parsedClassRoomTypeId;
        if (parsedClassRoomTypeId !== 2 && requiredCapacity > 0) {
          whereClause.capacity = { gte: parseInt(requiredCapacity) };
        }
      } 

      if (departmentId && departmentId !== 'all') {
        whereClause.OR = [
          { departmentId: parseInt(departmentId) },
          { departmentId: null } 
        ];
      }

      const allRooms = await prisma.classRoom.findMany({
        where: whereClause,
        include: {
          ClassRoomType: true,
          department: true
        }
      });
      const schedules = await this.getSchedulesByTimeSlotAndDate(
        timeSlotId,
        dayOfWeek,
        specificDate
      );

      console.log(`[getAvailableRoomsForException] Found ${schedules.length} schedules for this time slot`);

      const specificDateObj = specificDate ? new Date(specificDate) : null;
      let movedToRoomIds = [];
      
      if (specificDateObj) {
        const dateStart = new Date(specificDateObj);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(specificDateObj);
        dateEnd.setHours(23, 59, 59, 999);
        const movedExceptions = await prisma.scheduleRequest.findMany({
          where: {
            requestStatusId: 2,
            AND: [
              {
                OR: [
                  { exceptionType: 'moved' },
                  { requestTypeId: 6 }, // Thi giữa kỳ
                  { requestTypeId: 8 }, // Đổi lịch
                  { requestTypeId: 10 } // Thi cuối kỳ
                ]
              },
              {
                OR: [
                  {
                    movedToDate: {
                      gte: dateStart,
                      lte: dateEnd
                    }
                  },
                  {
                    exceptionDate: {
                      gte: dateStart,
                      lte: dateEnd
                    }
                  }
                ]
              },
              {
                OR: [
                  { movedToTimeSlotId: timeSlotId },
                  { newTimeSlotId: timeSlotId }
                ]
              }
            ]
          },
          select: {
            movedToClassRoomId: true,
            newClassRoomId: true
          }
        });

        movedExceptions.forEach(exception => {
          if (exception.movedToClassRoomId) {
            movedToRoomIds.push(exception.movedToClassRoomId);
          }
          if (exception.newClassRoomId) {
            movedToRoomIds.push(exception.newClassRoomId);
          }
        });

        movedToRoomIds = [...new Set(movedToRoomIds)];
        console.log(`[getAvailableRoomsForException] Found ${movedToRoomIds.length} rooms occupied by moved exceptions`);
      }

      const occupiedRoomIds = schedules
        .filter(s => s.classRoomId && !s.hasException)
        .map(s => s.classRoomId);

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

      const allOccupiedRoomIds = [...new Set([...occupiedRoomIds, ...movedToRoomIds])];
      const categorizedRooms = allRooms.map(room => {
        const isOccupied = allOccupiedRoomIds.includes(room.id);
        const freedInfo = freedRoomInfo.find(f => f.roomId === room.id);
        const isFreedByException = !!freedInfo;
        const isOccupiedByMovedException = movedToRoomIds.includes(room.id);

        const processedRoom = this.processRoomData(room);

        return {
          ...processedRoom,
          status: isOccupied ? 'occupied' : 'available',
          isFreedByException,
          isOccupiedByMovedException,
          exceptionInfo: isFreedByException ? freedInfo : null
        };
      });
      const result = {
        normalRooms: categorizedRooms.filter(r => r.status === 'available' && !r.isFreedByException && !r.isOccupiedByMovedException),
        freedRooms: categorizedRooms.filter(r => r.isFreedByException && !r.isOccupiedByMovedException),
        occupiedRooms: categorizedRooms.filter(r => r.status === 'occupied' || r.isOccupiedByMovedException),
        totalAvailable: categorizedRooms.filter(r => r.status === 'available' && !r.isOccupiedByMovedException).length
      };

      return result;
    } catch (error) {
      console.error('Error in getAvailableRoomsForException:', error);
      throw new Error(`Lỗi lấy phòng available: ${error.message}`);
    }
  }
}

module.exports = new RoomService();