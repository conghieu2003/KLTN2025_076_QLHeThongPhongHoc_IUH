const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SocketClient = require('../utils/socketClient');

const createScheduleRequest = async (requestData) => {
    try {
        const {
            requestTypeId,
            classScheduleId,
            classRoomId,
            requesterId,
            requestDate,
            timeSlotId,
            changeType,
            oldClassRoomId,
            newClassRoomId,
            oldTimeSlotId,
            newTimeSlotId,
            exceptionDate,
            exceptionType,
            movedToDate,
            movedToTimeSlotId,
            movedToClassRoomId,
            movedToDayOfWeek,
            substituteTeacherId,
            reason
        } = requestData;

        const scheduleRequest = await prisma.scheduleRequest.create({
            data: {
                requestTypeId,
                classScheduleId: classScheduleId || null,
                classRoomId: classRoomId || null,
                requesterId,
                requestStatusId: 1, 
                requestDate: new Date(requestDate),
                timeSlotId,
                changeType: changeType || null,
                oldClassRoomId: oldClassRoomId || null,
                newClassRoomId: newClassRoomId || null,
                oldTimeSlotId: oldTimeSlotId || null,
                newTimeSlotId: newTimeSlotId || null,
                exceptionDate: exceptionDate ? new Date(exceptionDate) : null,
                exceptionType: exceptionType || null,
                movedToDate: movedToDate ? new Date(movedToDate) : null,
                movedToTimeSlotId: movedToTimeSlotId || null,
                movedToClassRoomId: movedToClassRoomId || null,
                movedToDayOfWeek: movedToDayOfWeek || null,
                substituteTeacherId: substituteTeacherId || null,
                reason
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                RequestType: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                RequestStatus: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                classSchedule: {
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
                    }
                },
                oldClassRoom: {
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
                newClassRoom: {
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
                }
            }
        });

        const relatedUserIds = [];
        try {
          if (scheduleRequest.classScheduleId) {
            const classSchedule = await prisma.classSchedule.findUnique({
              where: { id: scheduleRequest.classScheduleId },
              include: {
                class: {
                  include: {
                    teacher: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            });

            if (classSchedule?.class?.teacher?.user?.id) {
              relatedUserIds.push(classSchedule.class.teacher.user.id);
            }

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
              if (admin.id) {
                relatedUserIds.push(admin.id);
              }
            });
          }
        } catch (error) {
          console.error('[Schedule Request] Lỗi khi lấy danh sách users:', error);
        }

        try {
          await SocketClient.emitScheduleRequestCreated({
            requestId: scheduleRequest.id,
            requestTypeId: scheduleRequest.requestTypeId,
            requesterId: scheduleRequest.requesterId,
            requestStatusId: scheduleRequest.requestStatusId,
            createdAt: scheduleRequest.createdAt,
            userIds: relatedUserIds
          });

          if (scheduleRequest.exceptionDate || scheduleRequest.movedToDate) {
            const dates = [];
            if (scheduleRequest.exceptionDate) dates.push(new Date(scheduleRequest.exceptionDate));
            if (scheduleRequest.movedToDate) dates.push(new Date(scheduleRequest.movedToDate));
            
            for (const date of dates) {
              const dayOfWeek = date.getDay();
              const startOfWeek = new Date(date);
              startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
              const weekStartDate = startOfWeek.toISOString().split('T')[0];
              
              await SocketClient.emitScheduleExceptionUpdated({
                exceptionId: scheduleRequest.id,
                classScheduleId: scheduleRequest.classScheduleId,
                weekStartDate: weekStartDate,
                requestStatusId: scheduleRequest.requestStatusId,
                userIds: relatedUserIds
              });
            }
          }
        } catch (socketError) {
          console.error('[Schedule Request] Lỗi khi emit socket event:', socketError);
        }

        return scheduleRequest;
    } catch (error) {
        console.error('Error creating schedule request:', error);
        throw error;
    }
};

const getScheduleRequests = async (filters = {}) => {
    try {
        const {
            status,
            requestType,
            requesterId,
            page = 1,
            limit = 10
        } = filters;

        const where = {};
        if (status) where.requestStatusId = parseInt(status);
        if (requestType) where.requestTypeId = parseInt(requestType);
        if (requesterId) where.requesterId = parseInt(requesterId);

        const skip = (page - 1) * limit;

        const [scheduleRequests, total] = await Promise.all([
            prisma.scheduleRequest.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: {
                    requester: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    },
                    RequestType: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    RequestStatus: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    classSchedule: {
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
                        }
                    },
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
                    oldClassRoom: {
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
                    newClassRoom: {
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
                    approver: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.scheduleRequest.count({ where })
        ]);

        return {
            success: true,
            data: scheduleRequests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error getting schedule requests:', error);
        throw error;
    }
};

// Lấy danh sách lớp học của giảng viên (chỉ những lớp đã có phòng)
const getTeacherSchedules = async (userId) => {
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
                }
                // Bỏ timeSlot vì không có relation trực tiếp
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { timeSlotId: 'asc' }
            ]
        });

        return classSchedules;
    } catch (error) {
        console.error('Error getting teacher schedules:', error);
        throw error;
    }
};

const recalculateExceptionDate = (oldExceptionDate, oldDayOfWeek, newDayOfWeek) => {
    if (!oldExceptionDate || !oldDayOfWeek || !newDayOfWeek || oldDayOfWeek === newDayOfWeek) {
        return oldExceptionDate; // Không cần thay đổi
    }

    const exceptionDate = new Date(oldExceptionDate);
    const dayDiff = newDayOfWeek - oldDayOfWeek;
    
    // Tính toán ngày mới: giữ nguyên tuần, chỉ đổi thứ
    const newExceptionDate = new Date(exceptionDate);
    newExceptionDate.setDate(exceptionDate.getDate() + dayDiff);
    
    return newExceptionDate;
};

const updateScheduleRequestStatus = async (requestId, status, approverId, note, selectedRoomId = null, substituteTeacherId = null) => {
    try {
        // First, get the request details to understand what needs to be updated
        const requestDetails = await prisma.scheduleRequest.findUnique({
            where: { id: parseInt(requestId) },
            include: {
                RequestType: true,
                classSchedule: true,
                newTimeSlot: true,
                newClassRoom: true,
                class: {
                    include: {
                        teacher: true
                    }
                }
            }
        });

        if (!requestDetails) {
            throw new Error('Schedule request not found');
        }

        // Lưu lại dayOfWeek cũ trước khi cập nhật
        const oldDayOfWeek = requestDetails.classSchedule?.dayOfWeek;
        const oldTimeSlotId = requestDetails.classSchedule?.timeSlotId;

        // Chuẩn bị dữ liệu cập nhật cho schedule request
        const scheduleRequestUpdatePayload = {
            requestStatusId: status,
            approvedBy: approverId,
            approvedAt: new Date(),
            note: note || null
        };
        
        // Cập nhật substituteTeacherId nếu có (cho yêu cầu đổi giáo viên)
        if (substituteTeacherId) {
            // Kiểm tra xung đột giảng viên cho thi cuối kỳ
            const isFinalExam = requestDetails.requestTypeId === 10;
            if (isFinalExam && requestDetails.exceptionDate && requestDetails.newTimeSlotId) {
                const exceptionDateObj = new Date(requestDetails.exceptionDate);
                const exceptionDateStart = new Date(exceptionDateObj);
                exceptionDateStart.setHours(0, 0, 0, 0);
                const exceptionDateEnd = new Date(exceptionDateObj);
                exceptionDateEnd.setHours(23, 59, 59, 999);

                // Kiểm tra xem giảng viên đã được gán cho thi cuối kỳ khác cùng ngày và cùng tiết chưa
                // Loại trừ yêu cầu hiện tại (có thể đang cập nhật)
                const existingTeacherAssignment = await prisma.scheduleRequest.findFirst({
                    where: {
                        requestTypeId: 10, // Thi cuối kỳ
                        substituteTeacherId: parseInt(substituteTeacherId),
                        requestStatusId: { in: [2, 4] }, // Đã duyệt hoặc hoàn thành
                        exceptionDate: {
                            gte: exceptionDateStart,
                            lte: exceptionDateEnd
                        },
                        newTimeSlotId: parseInt(requestDetails.newTimeSlotId),
                        id: { not: parseInt(requestId) } // Loại trừ yêu cầu hiện tại
                    },
                    include: {
                        newTimeSlot: true,
                        newClassRoom: true,
                        class: {
                            include: {
                                teacher: true
                            }
                        }
                    }
                });

                if (existingTeacherAssignment) {
                    const conflictDate = existingTeacherAssignment.exceptionDate 
                        ? new Date(existingTeacherAssignment.exceptionDate).toLocaleDateString('vi-VN')
                        : 'ngày không xác định';
                    const conflictTimeSlot = existingTeacherAssignment.newTimeSlot?.slotName || `tiết ${existingTeacherAssignment.newTimeSlotId}`;
                    const conflictRoom = existingTeacherAssignment.newClassRoom?.name || 'phòng không xác định';
                    throw new Error(
                        `Giảng viên đã được gán cho thi cuối kỳ khác vào ${conflictDate}, ${conflictTimeSlot} tại ${conflictRoom}. ` +
                        `Không thể gán cùng một giảng viên cho nhiều phòng thi cùng lúc.`
                    );
                }
            }
            
            scheduleRequestUpdatePayload.substituteTeacherId = parseInt(substituteTeacherId);
        }
        
        // Cập nhật exceptionType cho yêu cầu đổi giáo viên
        if (requestDetails.RequestType?.name === 'Đổi giáo viên' || requestDetails.requestTypeId === 9) {
            scheduleRequestUpdatePayload.exceptionType = 'substitute';
            // Đảm bảo có exceptionDate nếu chưa có
            if (!requestDetails.exceptionDate && requestDetails.classSchedule) {
                // Dùng ngày hiện tại hoặc ngày đầu tiên của lớp
                scheduleRequestUpdatePayload.exceptionDate = new Date();
            }
        }
        
        // Update the schedule request status
        const scheduleRequest = await prisma.scheduleRequest.update({
            where: {
                id: parseInt(requestId)
            },
            data: scheduleRequestUpdatePayload,
            include: {
                requester: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                classSchedule: {
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
                    }
                },
                class: {
                    include: {
                        teacher: {
                            include: {
                                user: {
                                    select: {
                                        id: true
                                    }
                                }
                            }
                        }
                    }
                },
                substituteTeacher: {
                    include: {
                        user: {
                            select: {
                                id: true
                            }
                        }
                    }
                },
                oldClassRoom: {
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
                newClassRoom: {
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
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });

        // If request is approved (status = 2) and we have a selected room, update ClassSchedule
        if (status === 2 && selectedRoomId && requestDetails.classScheduleId) {
            console.log('Updating ClassSchedule for approved request:', {
                requestId,
                requestType: requestDetails.RequestType?.name,
                classScheduleId: requestDetails.classScheduleId,
                selectedRoomId
            });

            const updateData = {};

            // cập nhật classRoomId, statusId, assignedBy, assignedAt
            if (requestDetails.RequestType?.name === 'Đổi phòng' ||
                requestDetails.RequestType?.name === 'Xin phòng mới') {
                updateData.classRoomId = parseInt(selectedRoomId);
                updateData.statusId = 2;
                updateData.assignedBy = approverId;
                updateData.assignedAt = new Date();
            }
            if (requestDetails.RequestType?.name === 'Đổi lịch' || requestDetails.requestTypeId === 8) {
                const scheduleRequestUpdateData = {
                    exceptionType: 'moved',
                    requestStatusId: status
                };
                
                if (requestDetails.movedToDate) {
                    scheduleRequestUpdateData.movedToDate = new Date(requestDetails.movedToDate);
                } else if (requestDetails.exceptionDate) {
                    scheduleRequestUpdateData.movedToDate = new Date(requestDetails.exceptionDate);
                }
                
                if (requestDetails.movedToDayOfWeek) {
                    scheduleRequestUpdateData.movedToDayOfWeek = requestDetails.movedToDayOfWeek;
                } else if (scheduleRequestUpdateData.movedToDate) {
                    const movedDate = new Date(scheduleRequestUpdateData.movedToDate);
                    scheduleRequestUpdateData.movedToDayOfWeek = movedDate.getDay() === 0 ? 1 : movedDate.getDay() + 1; // 1=CN, 2=T2, ..., 7=T7
                }
                
                if (requestDetails.movedToTimeSlotId) {
                    scheduleRequestUpdateData.movedToTimeSlotId = requestDetails.movedToTimeSlotId;
                }
                
                if (selectedRoomId) {
                    scheduleRequestUpdateData.movedToClassRoomId = parseInt(selectedRoomId);
                } else if (requestDetails.movedToClassRoomId) {
                    scheduleRequestUpdateData.movedToClassRoomId = requestDetails.movedToClassRoomId;
                }
                
                if (!requestDetails.exceptionDate && requestDetails.classSchedule) {
                    let targetWeekStart;
                    if (scheduleRequestUpdateData.movedToDate) {
                        const movedDate = new Date(scheduleRequestUpdateData.movedToDate);
                        const dayOfWeek = movedDate.getDay(); 
                        targetWeekStart = new Date(movedDate);
                        targetWeekStart.setDate(movedDate.getDate() - dayOfWeek); 
                    } else {
                        targetWeekStart = new Date();
                        targetWeekStart.setDate(targetWeekStart.getDate() - targetWeekStart.getDay()); 
                    }
                    
                    const scheduleDayOffset = requestDetails.classSchedule.dayOfWeek === 1 ? 6 : requestDetails.classSchedule.dayOfWeek - 2;
                    const exceptionDate = new Date(targetWeekStart);
                    exceptionDate.setDate(targetWeekStart.getDate() + scheduleDayOffset);
                    scheduleRequestUpdateData.exceptionDate = exceptionDate;
                } else if (requestDetails.exceptionDate) {
                    scheduleRequestUpdateData.exceptionDate = new Date(requestDetails.exceptionDate);
                }
                
                await prisma.scheduleRequest.update({
                    where: { id: parseInt(requestId) },
                    data: scheduleRequestUpdateData
                });
                
            }

            if (Object.keys(updateData).length > 0) {
                await prisma.classSchedule.update({
                    where: { id: requestDetails.classScheduleId },
                    data: updateData
                });

                if (updateData.dayOfWeek && oldDayOfWeek && updateData.dayOfWeek !== oldDayOfWeek) {

                    // Lấy tất cả các ngoại lệ liên quan đến classSchedule 
                    const relatedExceptions = await prisma.scheduleRequest.findMany({
                        where: {
                            classScheduleId: requestDetails.classScheduleId,
                            exceptionDate: { not: null },
                            requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] } 
                        }
                    });


                    // Cập nhật từng ngoại lệ
                    for (const exception of relatedExceptions) {
                        const newExceptionDate = recalculateExceptionDate(
                            exception.exceptionDate,
                            oldDayOfWeek,
                            updateData.dayOfWeek
                        );

                        const classInfo = await prisma.classSchedule.findUnique({
                            where: { id: requestDetails.classScheduleId },
                            include: { class: true }
                        });

                        if (classInfo && classInfo.class) {
                            const newDate = new Date(newExceptionDate);
                            const startDate = new Date(classInfo.class.startDate);
                            const endDate = new Date(classInfo.class.endDate);

                            if (newDate >= startDate && newDate <= endDate) {
                                await prisma.scheduleRequest.update({
                                    where: { id: exception.id },
                                    data: {
                                        exceptionDate: newExceptionDate
                                    }
                                });
                            }
                        }
                    }
                }

                if (updateData.timeSlotId && oldTimeSlotId && updateData.timeSlotId !== oldTimeSlotId) {
                    await prisma.scheduleRequest.updateMany({
                        where: {
                            classScheduleId: requestDetails.classScheduleId,
                            timeSlotId: oldTimeSlotId,
                            requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] }
                        },
                        data: {
                            timeSlotId: updateData.timeSlotId
                        }
                    });

                    await prisma.scheduleRequest.updateMany({
                        where: {
                            classScheduleId: requestDetails.classScheduleId,
                            movedToTimeSlotId: oldTimeSlotId,
                            requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] }
                        },
                        data: {
                            movedToTimeSlotId: updateData.timeSlotId
                        }
                    });

                    await prisma.scheduleRequest.updateMany({
                        where: {
                            classScheduleId: requestDetails.classScheduleId,
                            newTimeSlotId: oldTimeSlotId,
                            requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] }
                        },
                        data: {
                            newTimeSlotId: updateData.timeSlotId
                        }
                    });
                }
            }
        }

        const relatedUserIds = [];
        try {
          const isFinalExam = scheduleRequest.requestTypeId === 10;
          
          if (scheduleRequest.classScheduleId) {
            const classSchedule = await prisma.classSchedule.findUnique({
              where: { id: scheduleRequest.classScheduleId },
              include: {
                class: {
                  include: {
                    teacher: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            });

            if (classSchedule?.class?.teacher?.user?.id) {
              relatedUserIds.push(classSchedule.class.teacher.user.id);
            }

            if (classSchedule?.classId) {
              const classStudents = await prisma.classStudent.findMany({
                where: {
                  classId: classSchedule.classId
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
          } else if (isFinalExam && scheduleRequest.classId) {
            if (scheduleRequest.class?.teacher?.user?.id) {
              relatedUserIds.push(scheduleRequest.class.teacher.user.id);
            }

            const classStudents = await prisma.classStudent.findMany({
              where: {
                classId: scheduleRequest.classId
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

          if (scheduleRequest.substituteTeacher?.user?.id) {
            const substituteTeacherUserId = scheduleRequest.substituteTeacher.user.id;
            if (!relatedUserIds.includes(substituteTeacherUserId)) {
              relatedUserIds.push(substituteTeacherUserId);
            }
          }

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
          console.error('[Schedule Request] Lỗi khi lấy danh sách users:', error);
        }

        try {
          const isFinalExam = scheduleRequest.requestTypeId === 10;
          const targetDate = scheduleRequest.exceptionDate || scheduleRequest.movedToDate;
          
          if (targetDate) {
            const date = new Date(targetDate);
            const dayOfWeek = date.getDay();
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            const weekStartDate = startOfWeek.toISOString().split('T')[0];
            
            await SocketClient.emitScheduleExceptionUpdated({
              exceptionId: scheduleRequest.id,
              classScheduleId: scheduleRequest.classScheduleId,
              classId: isFinalExam ? scheduleRequest.classId : null, 
              weekStartDate: weekStartDate,
              requestStatusId: scheduleRequest.requestStatusId,
              userIds: relatedUserIds
            });
          }
        } catch (socketError) {
          console.error('[Schedule Request] Lỗi khi emit socket event:', socketError);
        }

        return scheduleRequest;
    } catch (error) {
        console.error('Error updating schedule request status:', error);
        throw error;
    }
};

const getScheduleRequestById = async (requestId) => {
    try {
        const scheduleRequest = await prisma.scheduleRequest.findUnique({
            where: {
                id: parseInt(requestId)
            },
            include: {
                requester: {
                    include: {
                        teacher: true
                    }
                },
                RequestType: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                RequestStatus: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                classSchedule: {
                    include: {
                        class: {
                            include: {
                                teacher: {
                                    include: {
                                        user: true
                                    }
                                }
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
                                startTime: true,
                                endTime: true
                            }
                        }
                    }
                },
                oldClassRoom: {
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
                newClassRoom: {
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
                oldTimeSlot: {
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true
                    }
                },
                newTimeSlot: {
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true
                    }
                },
                movedToTimeSlot: {
                    select: {
                        id: true,
                        startTime: true,
                        endTime: true
                    }
                },
                approver: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                // Class cho thi cuối kỳ (requestTypeId = 10)
                class: {
                    include: {
                        teacher: {
                            include: {
                                user: true
                            }
                        },
                        ClassRoomType: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        return scheduleRequest;
    } catch (error) {
        console.error('Error getting schedule request by id:', error);
        throw error;
    }
};

module.exports = {
    createScheduleRequest,
    getScheduleRequests,
    getTeacherSchedules,
    updateScheduleRequestStatus,
    getScheduleRequestById
};