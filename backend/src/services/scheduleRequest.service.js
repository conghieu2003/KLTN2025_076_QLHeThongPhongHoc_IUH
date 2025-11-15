const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

        console.log('Backend received requestData:', requestData);
        console.log('movedToDayOfWeek:', movedToDayOfWeek);
        console.log('movedToTimeSlotId:', movedToTimeSlotId);

        const scheduleRequest = await prisma.scheduleRequest.create({
            data: {
                requestTypeId,
                classScheduleId: classScheduleId || null,
                classRoomId: classRoomId || null,
                requesterId,
                requestStatusId: 1, // pending status
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
                        // Bỏ timeSlot vì không có relation trực tiếp
                    }
                },
                // Bỏ timeSlot vì không có relation trực tiếp
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
                            // Bỏ timeSlot vì không có relation trực tiếp
                        }
                    },
                    // Bỏ timeSlot vì không có relation trực tiếp
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

const updateScheduleRequestStatus = async (requestId, status, approverId, note, selectedRoomId = null) => {
    try {
        // First, get the request details to understand what needs to be updated
        const requestDetails = await prisma.scheduleRequest.findUnique({
            where: { id: parseInt(requestId) },
            include: {
                RequestType: true,
                classSchedule: true
            }
        });

        if (!requestDetails) {
            throw new Error('Schedule request not found');
        }

        // Lưu lại dayOfWeek cũ trước khi cập nhật
        const oldDayOfWeek = requestDetails.classSchedule?.dayOfWeek;
        const oldTimeSlotId = requestDetails.classSchedule?.timeSlotId;

        // Update the schedule request status
        const scheduleRequest = await prisma.scheduleRequest.update({
            where: {
                id: parseInt(requestId)
            },
            data: {
                requestStatusId: status,
                approvedBy: approverId,
                approvedAt: new Date(),
                note: note || null
            },
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
                        // Bỏ timeSlot vì không có relation trực tiếp
                    }
                },
                // Bỏ timeSlot vì không có relation trực tiếp
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

            // For room change requests, update classRoomId
            if (requestDetails.RequestType?.name === 'Đổi phòng' ||
                requestDetails.RequestType?.name === 'Xin phòng mới') {
                updateData.classRoomId = parseInt(selectedRoomId);
                updateData.statusId = 2;
                updateData.assignedBy = approverId;
                updateData.assignedAt = new Date();
                console.log('Updating classRoomId to:', selectedRoomId);
                console.log('Updating statusId to 2 (Đã phân phòng)');
            }

            // For schedule change requests, update dayOfWeek and timeSlotId
            if (requestDetails.RequestType?.name === 'Đổi lịch') {
                if (requestDetails.movedToDayOfWeek) {
                    updateData.dayOfWeek = requestDetails.movedToDayOfWeek;
                    console.log('Updating dayOfWeek to:', requestDetails.movedToDayOfWeek);
                }
                if (requestDetails.movedToTimeSlotId) {
                    updateData.timeSlotId = requestDetails.movedToTimeSlotId;
                    console.log('Updating timeSlotId to:', requestDetails.movedToTimeSlotId);
                }
                // Also update room if selected
                if (selectedRoomId) {
                    updateData.classRoomId = parseInt(selectedRoomId);
                    console.log('Updating classRoomId to:', selectedRoomId);
                }
                if (selectedRoomId) {
                    updateData.statusId = 2;
                    updateData.assignedBy = approverId;
                    updateData.assignedAt = new Date();
                    console.log('Updating statusId to 2 (Đã phân phòng)');
                }
            }

            // Update ClassSchedule if we have changes to make
            if (Object.keys(updateData).length > 0) {
                await prisma.classSchedule.update({
                    where: { id: requestDetails.classScheduleId },
                    data: updateData
                });
                console.log('ClassSchedule updated successfully');

                // ⭐ MỚI: Cập nhật các ngoại lệ liên quan khi dayOfWeek hoặc timeSlotId thay đổi
                if (updateData.dayOfWeek && oldDayOfWeek && updateData.dayOfWeek !== oldDayOfWeek) {
                    console.log('Updating exceptions for dayOfWeek change:', {
                        oldDayOfWeek,
                        newDayOfWeek: updateData.dayOfWeek,
                        classScheduleId: requestDetails.classScheduleId
                    });

                    // Lấy tất cả các ngoại lệ liên quan đến classSchedule này
                    const relatedExceptions = await prisma.scheduleRequest.findMany({
                        where: {
                            classScheduleId: requestDetails.classScheduleId,
                            exceptionDate: { not: null },
                            requestTypeId: { in: [3, 4, 5, 6, 7, 8, 9] } // Các loại ngoại lệ
                        }
                    });

                    console.log(`Found ${relatedExceptions.length} exceptions to update`);

                    // Cập nhật từng ngoại lệ
                    for (const exception of relatedExceptions) {
                        const newExceptionDate = recalculateExceptionDate(
                            exception.exceptionDate,
                            oldDayOfWeek,
                            updateData.dayOfWeek
                        );

                        // Kiểm tra xem ngày mới có nằm trong khoảng thời gian của lớp không
                        const classInfo = await prisma.classSchedule.findUnique({
                            where: { id: requestDetails.classScheduleId },
                            include: { class: true }
                        });

                        if (classInfo && classInfo.class) {
                            const newDate = new Date(newExceptionDate);
                            const startDate = new Date(classInfo.class.startDate);
                            const endDate = new Date(classInfo.class.endDate);

                            // Chỉ cập nhật nếu ngày mới nằm trong khoảng thời gian của lớp
                            if (newDate >= startDate && newDate <= endDate) {
                                await prisma.scheduleRequest.update({
                                    where: { id: exception.id },
                                    data: {
                                        exceptionDate: newExceptionDate
                                    }
                                });
                                console.log(`Updated exception ${exception.id}: ${exception.exceptionDate} -> ${newExceptionDate.toISOString().split('T')[0]}`);
                            } else {
                                console.log(`Skipped exception ${exception.id}: new date ${newExceptionDate.toISOString().split('T')[0]} is outside class period`);
                            }
                        }
                    }
                }

                // ⭐ MỚI: Cập nhật timeSlotId trong các ngoại lệ nếu timeSlotId thay đổi
                if (updateData.timeSlotId && oldTimeSlotId && updateData.timeSlotId !== oldTimeSlotId) {
                    console.log('Updating exceptions for timeSlotId change:', {
                        oldTimeSlotId,
                        newTimeSlotId: updateData.timeSlotId,
                        classScheduleId: requestDetails.classScheduleId
                    });

                    // Cập nhật timeSlotId trong các ngoại lệ có timeSlotId cũ
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

                    // Cập nhật movedToTimeSlotId nếu có
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

                    // Cập nhật newTimeSlotId nếu có
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
