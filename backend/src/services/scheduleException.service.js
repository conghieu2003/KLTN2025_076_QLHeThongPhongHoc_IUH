const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SocketClient = require('../utils/socketClient');

// Tạo ngoại lệ lịch học
const createScheduleException = async (data) => {
  const {
    classScheduleId,
    exceptionDate,
    exceptionType,
    requestTypeId,
    newTimeSlotId,
    newClassRoomId,
    newDate,
    substituteTeacherId,
    reason,
    note,
    requesterId
  } = data;
  
  try {
    // Validation
    if (!classScheduleId || !exceptionDate || !exceptionType || !requestTypeId || !requesterId || !reason) {
      throw new Error('Thiếu thông tin bắt buộc');
    }

    // Kiểm tra lịch học có tồn tại không
    const schedule = await prisma.classSchedule.findFirst({
      where: {
        id: classScheduleId,
        statusId: 2 // active status
      },
      include: {
        class: true,
        teacher: {
          include: {
            user: true
          }
        },
        classRoom: true,
        timeSlot: true
      }
    });

    if (!schedule) {
      throw new Error('Không tìm thấy lịch học hoặc lịch học không hoạt động');
    }

    // Kiểm tra ngày ngoại lệ có nằm trong khoảng thời gian của lịch học không
    const exceptionDateObj = new Date(exceptionDate);
    const startDate = new Date(schedule.class.startDate);
    const endDate = new Date(schedule.class.endDate);

    if (exceptionDateObj < startDate || exceptionDateObj > endDate) {
      throw new Error('Ngày ngoại lệ phải nằm trong khoảng thời gian của lịch học');
    }

    // Kiểm tra đã có ngoại lệ cho ngày này chưa
    const existingException = await prisma.scheduleRequest.findFirst({
      where: {
        classScheduleId: classScheduleId,
        exceptionDate: new Date(exceptionDate),
        requestTypeId: requestTypeId
      }
    });

    if (existingException) {
      throw new Error('Đã có ngoại lệ cho ngày này');
    }

    // Kiểm tra phòng nếu có newClassRoomId hoặc movedToClassRoomId
    if (newClassRoomId || (newDate && newTimeSlotId)) {
      const targetRoomId = newClassRoomId || null;
      const targetDate = newDate ? new Date(newDate) : new Date(exceptionDate);
      const targetTimeSlotId = newTimeSlotId || schedule.timeSlotId;
      const targetDayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

      // Kiểm tra phòng có đang bận không (có lớp học hoặc exception khác)
      if (targetRoomId) {
        // Kiểm tra có lớp học nào đang sử dụng phòng này không
        const occupiedSchedule = await prisma.classSchedule.findFirst({
          where: {
            dayOfWeek: targetDayOfWeek,
            timeSlotId: targetTimeSlotId,
            classRoomId: parseInt(targetRoomId),
            statusId: { in: [2, 3] }, // Đã phân phòng hoặc đang hoạt động
            id: { not: classScheduleId } // Loại trừ lịch hiện tại
          }
        });

        if (occupiedSchedule) {
          throw new Error('Phòng học đang được sử dụng bởi lớp học khác');
        }

        // Kiểm tra có exception nào khác đã sắp vào phòng này không (cho cùng ngày và timeSlot)
        const targetDateStart = new Date(targetDate);
        targetDateStart.setHours(0, 0, 0, 0);
        const targetDateEnd = new Date(targetDate);
        targetDateEnd.setHours(23, 59, 59, 999);

        const existingExceptionInRoom = await prisma.scheduleRequest.findFirst({
          where: {
            AND: [
              {
                OR: [
                  { newClassRoomId: parseInt(targetRoomId) },
                  { movedToClassRoomId: parseInt(targetRoomId) }
                ]
              },
              {
                OR: [
                  { 
                    exceptionDate: {
                      gte: targetDateStart,
                      lte: targetDateEnd
                    }
                  },
                  { 
                    movedToDate: {
                      gte: targetDateStart,
                      lte: targetDateEnd
                    }
                  }
                ]
              }
            ],
            requestStatusId: 2, // Chỉ kiểm tra exception đã duyệt
            id: { not: existingException?.id || -1 } // Loại trừ exception hiện tại nếu có
          },
          include: {
            classSchedule: {
              include: {
                timeSlot: true
              }
            }
          }
        });

        if (existingExceptionInRoom) {
          // Kiểm tra timeSlot có trùng không
          const exceptionTimeSlotId = existingExceptionInRoom.movedToTimeSlotId || 
                                     existingExceptionInRoom.newTimeSlotId || 
                                     existingExceptionInRoom.classSchedule?.timeSlotId;
          
          if (exceptionTimeSlotId === targetTimeSlotId) {
            // Kiểm tra xem exception này có phải là tạm ngưng không (phòng trống)
            const isSuspended = existingExceptionInRoom.requestTypeId === 3 || 
                              existingExceptionInRoom.exceptionType === 'cancelled';
            
            if (!isSuspended) {
              throw new Error('Phòng học đang được sử dụng bởi ngoại lệ khác trong cùng khung giờ');
            }
            // Nếu là tạm ngưng, phòng trống, có thể sử dụng
          }
        }
      }
    }

    // Tạo ngoại lệ lịch học
    // Admin tạo ngoại lệ sẽ được tự động duyệt (requestStatusId = 2)
    const newException = await prisma.scheduleRequest.create({
      data: {
        requestTypeId: requestTypeId,
        classScheduleId: classScheduleId,
        requesterId: requesterId,
        requestDate: new Date(),
        timeSlotId: schedule.timeSlotId,
        exceptionDate: new Date(exceptionDate),
        exceptionType: exceptionType,
        newTimeSlotId: newTimeSlotId || null,
        newClassRoomId: newClassRoomId || null,
        movedToDate: newDate ? new Date(newDate) : null,
        movedToTimeSlotId: newTimeSlotId || null,
        movedToClassRoomId: newClassRoomId || null,
        substituteTeacherId: substituteTeacherId || null,
        reason: reason,
        requestStatusId: 2, // Auto-approved for admin (Đã duyệt)
        approvedBy: requesterId, // Admin tự duyệt
        approvedAt: new Date(), // Thời gian duyệt
        note: note || null
      },
      include: {
        classSchedule: {
          include: {
            class: true,
            teacher: {
              include: {
                user: true
              }
            },
            classRoom: true,
            timeSlot: true
          }
        },
        RequestStatus: true,
        requester: true
      }
    });

    // Lấy danh sách users liên quan (admin + teacher + students)
    const relatedUserIds = [];
    try {
      // Thêm teacher
      if (schedule.teacher?.user?.id) {
        relatedUserIds.push(schedule.teacher.user.id);
      }

      // Lấy students của class
      const classStudents = await prisma.classStudent.findMany({
        where: {
          classId: schedule.classId
        },
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      });

      classStudents.forEach(cs => {
        if (cs.student?.user?.id) {
          relatedUserIds.push(cs.student.user.id);
        }
      });

      // Thêm tất cả admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          account: {
            role: 'admin'
          }
        },
        select: {
          id: true
        }
      });

      adminUsers.forEach(admin => {
        if (admin.id && !relatedUserIds.includes(admin.id)) {
          relatedUserIds.push(admin.id);
        }
      });
    } catch (error) {
      console.error('[Schedule Exception] Lỗi khi lấy danh sách users:', error);
    }

    // Emit socket event để cập nhật real-time - chỉ gửi đến users liên quan
    try {
      const exceptionDate = newException.exceptionDate;
      const movedToDate = newException.movedToDate;
      
      // Tính weekStartDate từ exceptionDate
      if (exceptionDate) {
        const date = new Date(exceptionDate);
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const weekStartDate = startOfWeek.toISOString().split('T')[0];
        
        await SocketClient.emitScheduleExceptionUpdated({
          exceptionId: newException.id,
          classScheduleId: newException.classScheduleId,
          weekStartDate: weekStartDate,
          userIds: relatedUserIds
        });
      }
      
      // Nếu có movedToDate, cũng emit cho tuần đó
      if (movedToDate) {
        const date = new Date(movedToDate);
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const weekStartDate = startOfWeek.toISOString().split('T')[0];
        
        await SocketClient.emitScheduleExceptionUpdated({
          exceptionId: newException.id,
          classScheduleId: newException.classScheduleId,
          weekStartDate: weekStartDate,
          userIds: relatedUserIds
        });
      }
    } catch (socketError) {
      console.error('[Schedule Exception] Lỗi khi emit socket event:', socketError);
    }

    return newException;

  } catch (error) {
    throw error;
  }
};

// Lấy danh sách ngoại lệ lịch học
const getScheduleExceptions = async (params) => {
  const { page, limit, scheduleId, exceptionType, userId, getAll } = params;
  const offset = page && limit ? (page - 1) * limit : undefined;

  try {
    const whereConditions = {
      requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] } // Lấy tất cả loại ngoại lệ (ID 3-9)
    };

    if (scheduleId) {
      whereConditions.classScheduleId = parseInt(scheduleId);
    }

    if (exceptionType) {
      whereConditions.exceptionType = exceptionType;
    }

    if (userId) {
      whereConditions.requesterId = parseInt(userId);
    }

    // Query options
    const queryOptions = {
      where: whereConditions,
      include: {
        classSchedule: {
          include: {
            class: true,
            teacher: {
              include: {
                user: true
              }
            },
            classRoom: true,
            timeSlot: true
          }
        },
        RequestStatus: true,
        RequestType: true,
        requester: true,
        newClassRoom: true,
        newTimeSlot: true,
        movedToClassRoom: true,
        movedToTimeSlot: true,
        substituteTeacher: {
          include: {
            user: true
          }
        }
      },
      orderBy: [
        { exceptionDate: 'desc' },
        { createdAt: 'desc' }
      ]
    };

    // Chỉ thêm skip/take nếu có pagination
    if (!getAll && offset !== undefined && limit !== undefined) {
      queryOptions.skip = offset;
      queryOptions.take = limit;
    }

    const [exceptions, total] = await Promise.all([
      prisma.scheduleRequest.findMany(queryOptions),
      prisma.scheduleRequest.count({
        where: whereConditions
      })
    ]);

    // Format dữ liệu để trả về frontend
    const formattedExceptions = exceptions.map(exception => ({
      id: exception.id,
      classScheduleId: exception.classScheduleId,
      className: exception.classSchedule?.class?.className || 'Chưa có tên lớp',
      classCode: exception.classSchedule?.class?.code || 'Chưa có mã lớp',
      teacherName: exception.classSchedule?.teacher?.user?.fullName || 'Chưa có tên giảng viên',
      roomName: exception.classSchedule?.classRoom?.name || 'Chưa phân phòng',
      roomCode: exception.classSchedule?.classRoom?.code || '',
      slotName: exception.classSchedule?.timeSlot?.slotName || 'Chưa có tiết',
      startTime: exception.classSchedule?.timeSlot?.startTime ? exception.classSchedule.timeSlot.startTime.toTimeString().slice(0, 5) : '00:00',
      endTime: exception.classSchedule?.timeSlot?.endTime ? exception.classSchedule.timeSlot.endTime.toTimeString().slice(0, 5) : '00:00',
      exceptionDate: exception.exceptionDate ? exception.exceptionDate.toISOString().split('T')[0] : '',
      exceptionType: exception.exceptionType || 'cancelled',
      // Thông tin chuyển đến (cho moved/exam)
      newTimeSlotId: exception.newTimeSlotId || exception.movedToTimeSlotId,
      newTimeSlotName: exception.movedToTimeSlot?.slotName || exception.newTimeSlot?.slotName,
      newTimeSlotStart: exception.movedToTimeSlot?.startTime ? exception.movedToTimeSlot.startTime.toTimeString().slice(0, 5) : 
                        exception.newTimeSlot?.startTime ? exception.newTimeSlot.startTime.toTimeString().slice(0, 5) : null,
      newTimeSlotEnd: exception.movedToTimeSlot?.endTime ? exception.movedToTimeSlot.endTime.toTimeString().slice(0, 5) : 
                      exception.newTimeSlot?.endTime ? exception.newTimeSlot.endTime.toTimeString().slice(0, 5) : null,
      newClassRoomId: exception.newClassRoomId || exception.movedToClassRoomId,
      newClassRoomName: exception.movedToClassRoom?.name || exception.newClassRoom?.name,
      newClassRoomCode: exception.movedToClassRoom?.code || exception.newClassRoom?.code,
      newDate: exception.movedToDate ? exception.movedToDate.toISOString().split('T')[0] : exception.newDate ? exception.newDate.toISOString().split('T')[0] : null,
      // Thông tin giảng viên thay thế (cho substitute)
      substituteTeacherId: exception.substituteTeacherId,
      substituteTeacherName: exception.substituteTeacher?.user?.fullName,
      substituteTeacherCode: exception.substituteTeacher?.teacherCode,
      reason: exception.reason || '',
      note: exception.note || '',
      requestStatusId: exception.requestStatusId,
      statusName: exception.RequestStatus?.name || 'Chưa xác định',
      requestTypeName: exception.RequestType?.name || 'Chưa xác định',
      requesterName: exception.requester?.fullName || 'Chưa xác định',
      createdAt: exception.createdAt ? exception.createdAt.toISOString() : '',
      updatedAt: exception.updatedAt ? exception.updatedAt.toISOString() : ''
    }));

  // Nếu getAll=true, trả về tất cả không có pagination
  if (getAll) {
    return {
      data: formattedExceptions
    };
  }

  return {
      data: formattedExceptions,
    pagination: {
      page: page || 1,
      limit: limit || total,
      total,
      totalPages: limit ? Math.ceil(total / limit) : 1
    }
  };

  } catch (error) {
    throw error;
  }
};

// Lấy chi tiết ngoại lệ lịch học
const getScheduleExceptionById = async (id) => {
  try {
    const exception = await prisma.scheduleRequest.findFirst({
      where: {
        id: parseInt(id),
        requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] } // Lấy tất cả loại ngoại lệ
      },
      include: {
        classSchedule: {
          include: {
            class: true,
            teacher: {
              include: {
                user: true
              }
            },
            classRoom: true,
            timeSlot: true
          }
        },
        RequestStatus: true,
        requester: true,
        newClassRoom: true,
        newTimeSlot: true,
        substituteTeacher: {
          include: {
            user: true
          }
        }
      }
    });

    return exception;

  } catch (error) {
    throw error;
  }
};

// Cập nhật ngoại lệ lịch học
const updateScheduleException = async (id, updateData, userId) => {
  const {
    exceptionType,
    newTimeSlotId,
    newClassRoomId,
    newDate,
    substituteTeacherId,
    reason,
    note,
    requestStatusId,
    requestTypeId,
    exceptionDate
  } = updateData;
  
  try {
    // Kiểm tra ngoại lệ có tồn tại không và lấy thông tin lịch học
    const existingException = await prisma.scheduleRequest.findFirst({
      where: {
        id: parseInt(id),
        requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] } // Lấy tất cả loại ngoại lệ
      },
      include: {
        classSchedule: {
          include: {
            class: true,
            teacher: {
              include: {
                user: true
              }
            },
            classRoom: true,
            timeSlot: true
          }
        }
      }
    });

    if (!existingException) {
      throw new Error('Không tìm thấy ngoại lệ lịch học');
    }

    const schedule = existingException.classSchedule;
    if (!schedule) {
      throw new Error('Không tìm thấy lịch học liên quan');
    }

    // Xác định giá trị cuối cùng cho các trường
    const finalExceptionType = exceptionType || existingException.exceptionType;
    const finalExceptionDate = exceptionDate ? new Date(exceptionDate) : existingException.exceptionDate;
    const finalNewDate = newDate ? new Date(newDate) : existingException.movedToDate;
    const finalNewTimeSlotId = newTimeSlotId !== undefined ? newTimeSlotId : (existingException.movedToTimeSlotId || existingException.newTimeSlotId);
    const finalNewClassRoomId = newClassRoomId !== undefined ? newClassRoomId : (existingException.movedToClassRoomId || existingException.newClassRoomId);

    // Kiểm tra ngày ngoại lệ có nằm trong khoảng thời gian của lịch học không (cho phép ngoài thời gian kết thúc như tạo ngoại lệ)
    if (finalExceptionDate) {
      const startDate = new Date(schedule.class.startDate);
      // Cho phép ngoại lệ có thể sắp ngoài thời gian kết thúc (như logic tạo ngoại lệ)
      if (finalExceptionDate < startDate) {
        throw new Error('Ngày ngoại lệ không được sớm hơn ngày bắt đầu của lịch học');
      }
    }

    // Validation: Nếu đổi sang loại exam hoặc moved, cần có thông tin chuyển đến
    if ((finalExceptionType === 'exam' || finalExceptionType === 'moved') && 
        (!finalNewDate || !finalNewTimeSlotId || !finalNewClassRoomId)) {
      throw new Error('Loại ngoại lệ này yêu cầu thông tin chuyển đến (ngày mới, tiết mới, phòng mới)');
    }

    // Kiểm tra phòng conflict nếu có newClassRoomId hoặc newDate mới
    if (finalNewClassRoomId || (finalNewDate && finalNewTimeSlotId)) {
      const targetRoomId = finalNewClassRoomId;
      const targetDate = finalNewDate || finalExceptionDate;
      const targetTimeSlotId = finalNewTimeSlotId || schedule.timeSlotId;
      const targetDayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay();

      if (targetRoomId) {
        // Kiểm tra có lớp học nào đang sử dụng phòng này không
        const occupiedSchedule = await prisma.classSchedule.findFirst({
          where: {
            dayOfWeek: targetDayOfWeek,
            timeSlotId: targetTimeSlotId,
            classRoomId: parseInt(targetRoomId),
            statusId: { in: [2, 3] }, // Đã phân phòng hoặc đang hoạt động
            id: { not: schedule.id } // Loại trừ lịch hiện tại
          }
        });

        if (occupiedSchedule) {
          throw new Error('Phòng học đang được sử dụng bởi lớp học khác');
        }

        // Kiểm tra có exception nào khác đã sắp vào phòng này không
        const targetDateStart = new Date(targetDate);
        targetDateStart.setHours(0, 0, 0, 0);
        const targetDateEnd = new Date(targetDate);
        targetDateEnd.setHours(23, 59, 59, 999);

        const existingExceptionInRoom = await prisma.scheduleRequest.findFirst({
          where: {
            AND: [
              {
                OR: [
                  { newClassRoomId: parseInt(targetRoomId) },
                  { movedToClassRoomId: parseInt(targetRoomId) }
                ]
              },
              {
                OR: [
                  { 
                    exceptionDate: {
                      gte: targetDateStart,
                      lte: targetDateEnd
                    }
                  },
                  { 
                    movedToDate: {
                      gte: targetDateStart,
                      lte: targetDateEnd
                    }
                  }
                ]
              }
            ],
            requestStatusId: 2, // Chỉ kiểm tra exception đã duyệt
            id: { not: parseInt(id) } // Loại trừ exception hiện tại
          },
          include: {
            classSchedule: {
              include: {
                timeSlot: true
              }
            }
          }
        });

        if (existingExceptionInRoom) {
          const exceptionTimeSlotId = existingExceptionInRoom.movedToTimeSlotId || 
                                     existingExceptionInRoom.newTimeSlotId || 
                                     existingExceptionInRoom.classSchedule?.timeSlotId;
          
          if (exceptionTimeSlotId === targetTimeSlotId) {
            const isSuspended = existingExceptionInRoom.requestTypeId === 3 || 
                              existingExceptionInRoom.exceptionType === 'cancelled';
            
            if (!isSuspended) {
              throw new Error('Phòng học đang được sử dụng bởi ngoại lệ khác trong cùng khung giờ');
            }
          }
        }
      }
    }

    // Chuẩn bị dữ liệu cập nhật
    const updatePayload = {
      exceptionType: finalExceptionType,
      exceptionDate: finalExceptionDate,
      newTimeSlotId: finalNewTimeSlotId || null,
      newClassRoomId: finalNewClassRoomId || null,
      movedToDate: finalNewDate || null,
      movedToTimeSlotId: finalNewTimeSlotId || null,
      movedToClassRoomId: finalNewClassRoomId || null,
      substituteTeacherId: substituteTeacherId !== undefined ? substituteTeacherId : existingException.substituteTeacherId,
      reason: reason || existingException.reason,
      note: note !== undefined ? note : existingException.note,
      requestStatusId: requestStatusId !== undefined ? requestStatusId : existingException.requestStatusId
    };

    // Nếu có requestTypeId mới, cập nhật
    if (requestTypeId) {
      updatePayload.requestTypeId = requestTypeId;
    }

    // Nếu trạng thái được đổi thành "Đã duyệt" (2), tự động cập nhật approvedBy và approvedAt
    if (requestStatusId === 2 && existingException.requestStatusId !== 2) {
      updatePayload.approvedBy = userId;
      updatePayload.approvedAt = new Date();
    }

    // Cập nhật ngoại lệ
    const updatedException = await prisma.scheduleRequest.update({
      where: {
        id: parseInt(id)
      },
      data: updatePayload,
      include: {
        classSchedule: {
          include: {
            class: true,
            teacher: {
              include: {
                user: true
              }
            },
            classRoom: true,
            timeSlot: true
          }
        },
        RequestStatus: true,
        RequestType: true,
        requester: true,
        newClassRoom: true,
        newTimeSlot: true,
        movedToClassRoom: true,
        movedToTimeSlot: true,
        substituteTeacher: {
          include: {
            user: true
          }
        }
      }
    });

    // Lấy danh sách users liên quan (admin + teacher + students)
    const relatedUserIds = [];
    try {
      // Thêm teacher
      if (updatedException.classSchedule?.teacher?.user?.id) {
        relatedUserIds.push(updatedException.classSchedule.teacher.user.id);
      }

      // Lấy students của class
      if (updatedException.classSchedule?.classId) {
        const classStudents = await prisma.classStudent.findMany({
          where: {
            classId: updatedException.classSchedule.classId
          },
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        });

        classStudents.forEach(cs => {
          if (cs.student?.user?.id) {
            relatedUserIds.push(cs.student.user.id);
          }
        });
      }

      // Thêm tất cả admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          account: {
            role: 'admin'
          }
        },
        select: {
          id: true
        }
      });

      adminUsers.forEach(admin => {
        if (admin.id && !relatedUserIds.includes(admin.id)) {
          relatedUserIds.push(admin.id);
        }
      });
    } catch (error) {
      console.error('[Schedule Exception] Lỗi khi lấy danh sách users:', error);
    }

    // Emit socket event để cập nhật real-time - chỉ gửi đến users liên quan
    try {
      const exceptionDate = updatedException.exceptionDate;
      const movedToDate = updatedException.movedToDate;
      
      // Tính weekStartDate từ exceptionDate
      if (exceptionDate) {
        const date = new Date(exceptionDate);
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const weekStartDate = startOfWeek.toISOString().split('T')[0];
        
        await SocketClient.emitScheduleExceptionUpdated({
          exceptionId: updatedException.id,
          classScheduleId: updatedException.classScheduleId,
          weekStartDate: weekStartDate,
          requestStatusId: updatedException.requestStatusId,
          userIds: relatedUserIds
        });
      }
      
      // Nếu có movedToDate, cũng emit cho tuần đó
      if (movedToDate) {
        const date = new Date(movedToDate);
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const weekStartDate = startOfWeek.toISOString().split('T')[0];
        
        await SocketClient.emitScheduleExceptionUpdated({
          exceptionId: updatedException.id,
          classScheduleId: updatedException.classScheduleId,
          weekStartDate: weekStartDate,
          requestStatusId: updatedException.requestStatusId,
          userIds: relatedUserIds
        });
      }
    } catch (socketError) {
      console.error('[Schedule Exception] Lỗi khi emit socket event:', socketError);
    }

    return updatedException;

  } catch (error) {
    throw error;
  }
};

// Xóa ngoại lệ lịch học
const deleteScheduleException = async (id, userId) => {
  try {
    // Lấy thông tin exception trước khi xóa để emit socket
    const exceptionToDelete = await prisma.scheduleRequest.findFirst({
      where: {
        id: parseInt(id),
        requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] }
      },
      include: {
        classSchedule: {
          include: {
            class: true,
            teacher: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!exceptionToDelete) {
      throw new Error('Không tìm thấy ngoại lệ lịch học');
    }

    // Xóa exception
    const result = await prisma.scheduleRequest.deleteMany({
      where: {
        id: parseInt(id),
        requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] }
      }
    });

    if (result.count === 0) {
      return false;
    }

    // Lấy danh sách users liên quan để emit socket
    const relatedUserIds = [];
    try {
      // Thêm teacher
      if (exceptionToDelete.classSchedule?.teacher?.user?.id) {
        relatedUserIds.push(exceptionToDelete.classSchedule.teacher.user.id);
      }

      // Lấy students của class
      if (exceptionToDelete.classSchedule?.classId) {
        const classStudents = await prisma.classStudent.findMany({
          where: {
            classId: exceptionToDelete.classSchedule.classId
          },
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        });

        classStudents.forEach(cs => {
          if (cs.student?.user?.id) {
            relatedUserIds.push(cs.student.user.id);
          }
        });
      }

      // Thêm tất cả admin users
      const adminUsers = await prisma.user.findMany({
        where: {
          account: {
            role: 'admin'
          }
        },
        select: {
          id: true
        }
      });

      adminUsers.forEach(admin => {
        if (admin.id && !relatedUserIds.includes(admin.id)) {
          relatedUserIds.push(admin.id);
        }
      });
    } catch (error) {
      console.error('[Schedule Exception] Lỗi khi lấy danh sách users:', error);
    }

    // Emit socket event để cập nhật real-time
    try {
      const exceptionDate = exceptionToDelete.exceptionDate;
      const movedToDate = exceptionToDelete.movedToDate;
      
      // Tính weekStartDate từ exceptionDate
      if (exceptionDate) {
        const date = new Date(exceptionDate);
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const weekStartDate = startOfWeek.toISOString().split('T')[0];
        
        await SocketClient.emitScheduleExceptionUpdated({
          exceptionId: null,
          classScheduleId: exceptionToDelete.classScheduleId,
          weekStartDate: weekStartDate,
          requestStatusId: null,
          userIds: relatedUserIds
        });
      }
      
      // Nếu có movedToDate, cũng emit cho tuần đó
      if (movedToDate) {
        const date = new Date(movedToDate);
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const weekStartDate = startOfWeek.toISOString().split('T')[0];
        
        await SocketClient.emitScheduleExceptionUpdated({
          exceptionId: null,
          classScheduleId: exceptionToDelete.classScheduleId,
          weekStartDate: weekStartDate,
          requestStatusId: null,
          userIds: relatedUserIds
        });
      }
    } catch (socketError) {
      console.error('[Schedule Exception] Lỗi khi emit socket event:', socketError);
    }

    return true;

  } catch (error) {
    throw error;
  }
};

// Lấy lịch học có thể tạo ngoại lệ
const getAvailableSchedules = async (params) => {
  const { page, limit, search, userId } = params;
  const offset = (page - 1) * limit;
  
  try {
    const whereConditions = {
      statusId: 2 // active status
    };

    // Thêm điều kiện tìm kiếm nếu có
    if (search) {
      whereConditions.OR = [
        {
          class: {
            className: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          class: {
            code: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          teacher: {
            user: {
              fullName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    // Debug: Kiểm tra dữ liệu trong database
    const allSchedules = await prisma.classSchedule.findMany({
      where: whereConditions,
      include: {
        class: {
          include: {
            department: true
          }
        },
        teacher: {
          include: {
            user: true
          }
        },
        classRoom: true,
        timeSlot: true,
        ClassRoomType: true 
      },
      take: 5 // Chỉ lấy 5 records đầu để debug
    });

    console.log('Raw database data (first 5 records):', JSON.stringify(allSchedules, null, 2));

    const [schedules, total] = await Promise.all([
      prisma.classSchedule.findMany({
        where: whereConditions,
        include: {
          class: {
            include: {
              department: true
            }
          },
          teacher: {
            include: {
              user: true
            }
          },
          classRoom: true,
          timeSlot: true,
          ClassRoomType: true
        },
        orderBy: [
          { class: { className: 'asc' } },
          { dayOfWeek: 'asc' },
          { timeSlot: { startTime: 'asc' } }
        ],
        skip: offset,
        take: limit
      }),
      prisma.classSchedule.count({
        where: whereConditions
      })
    ]);

    // Format dữ liệu để match với AvailableSchedule interface
    const formattedSchedules = schedules.map(schedule => {
      // Tính toán ngày học tiếp theo dựa trên lịch học
      const today = new Date();
      const dayOfWeek = schedule.dayOfWeek; // 1=Chủ nhật, 2=Thứ 2, ..., 7=Thứ 7
      
      // Tìm ngày học tiếp theo
      const nextClassDate = getNextClassDate(today, dayOfWeek, schedule.class.startDate, schedule.class.endDate);
      
      // Xác định loại lớp (lý thuyết/thực hành) dựa trên ClassRoomType
      const classType = getClassType(schedule.ClassRoomType?.name);
      
      return {
        id: schedule.id,
        className: schedule.class.className || schedule.class.subjectName || 'Chưa có tên lớp',
        classCode: schedule.class.code || 'Chưa có mã lớp',
        departmentId: schedule.class.departmentId,
        departmentName: schedule.class.department?.name || 'Chưa xác định',
        teacherName: schedule.teacher.user.fullName || 'Chưa có tên giảng viên',
        teacherCode: schedule.teacher.teacherCode || 'Chưa có mã giảng viên',
        roomName: schedule.classRoom?.name || 'Chưa phân phòng',
        roomCode: schedule.classRoom?.code || '',
        slotName: schedule.timeSlot.slotName || 'Chưa có tiết',
        startTime: schedule.timeSlot.startTime ? schedule.timeSlot.startTime.toTimeString().slice(0, 8) : '00:00:00',
        endTime: schedule.timeSlot.endTime ? schedule.timeSlot.endTime.toTimeString().slice(0, 8) : '00:00:00',
        shift: schedule.timeSlot.shift || 1,
        dayOfWeek: schedule.dayOfWeek,
        startDate: schedule.class.startDate ? schedule.class.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: schedule.class.endDate ? schedule.class.endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        nextClassDate: nextClassDate.toISOString().split('T')[0],
        dayName: getDayName(schedule.dayOfWeek),
        // Thêm thông tin về loại lớp và nhóm thực hành
        classType: classType, // 'theory' hoặc 'practice'
        classRoomType: schedule.ClassRoomType?.name || 'Chưa xác định',
        practiceGroup: schedule.practiceGroup || null
        // Bỏ availableDates vì không cần hiển thị ngày tạo ngoại lệ trên card
      };
    });

    return {
      data: formattedSchedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

  } catch (error) {
    throw error;
  }
};

// Helper function để tính ngày học tiếp theo
const getNextClassDate = (today, dayOfWeek, classStartDate, classEndDate) => {
  const todayDate = new Date(today);
  const startDate = new Date(classStartDate);
  const endDate = new Date(classEndDate);
  
  // Nếu lớp đã kết thúc, trả về ngày kết thúc
  if (todayDate > endDate) {
    return endDate;
  }
  
  // Nếu lớp chưa bắt đầu, trả về ngày bắt đầu
  if (todayDate < startDate) {
    return startDate;
  }
  
  // Tính ngày học tiếp theo trong tuần
  const currentDayOfWeek = todayDate.getDay(); // 0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7
  const targetDayOfWeek = dayOfWeek === 1 ? 0 : dayOfWeek - 1; // Convert to JavaScript day format
  
  let daysUntilNext = targetDayOfWeek - currentDayOfWeek;
  if (daysUntilNext <= 0) {
    daysUntilNext += 7; // Next week
  }
  
  const nextDate = new Date(todayDate);
  nextDate.setDate(todayDate.getDate() + daysUntilNext);
  
  // Đảm bảo ngày không vượt quá ngày kết thúc lớp
  if (nextDate > endDate) {
    return endDate;
  }
  
  return nextDate;
};

// Helper function để lấy tên thứ
const getDayName = (dayOfWeek) => {
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
};

// Helper function để xác định loại lớp
const getClassType = (classRoomTypeName) => {
  if (!classRoomTypeName) return 'theory';
  
  const typeName = classRoomTypeName.toLowerCase();
  if (typeName.includes('thực hành') || typeName.includes('practice') || typeName.includes('lab')) {
    return 'practice';
  }
  return 'theory';
};


module.exports = {
  createScheduleException,
  getScheduleExceptions,
  getScheduleExceptionById,
  updateScheduleException,
  deleteScheduleException,
  getAvailableSchedules
};
