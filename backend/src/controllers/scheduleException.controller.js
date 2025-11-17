const scheduleExceptionService = require('../services/scheduleException.service');

const createScheduleException = async (req, res) => {
    try {
        const { 
            classScheduleId, 
            exceptionDate, 
            exceptionType, 
            requestTypeId,
            newDate, 
            newTimeSlotId, 
            newClassRoomId, 
            substituteTeacherId, 
            reason, 
            note 
        } = req.body;
        const requesterId = req.user.id;

        const result = await scheduleExceptionService.createScheduleException({
            classScheduleId,
            exceptionDate,
            exceptionType,
            requestTypeId,
            newDate,
            newTimeSlotId,
            newClassRoomId,
            substituteTeacherId,
            reason,
            note,
            requesterId
        });

        res.status(201).json({
            success: true,
            message: 'Tạo ngoại lệ lịch học thành công',
            data: result
        });
    } catch (error) {
        console.error('Error creating schedule exception:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo ngoại lệ lịch học'
        });
    }
};

const getScheduleExceptions = async (req, res) => {
    try {
        const { page, limit, scheduleId, exceptionType, getAll } = req.query;
        const userId = req.user.id;

        // Nếu getAll=true, lấy tất cả không phân trang
        const result = await scheduleExceptionService.getScheduleExceptions({
            page: getAll === 'true' ? undefined : parseInt(page || 1),
            limit: getAll === 'true' ? undefined : parseInt(limit || 1000),
            scheduleId,
            exceptionType,
            userId,
            getAll: getAll === 'true'
        });

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách ngoại lệ lịch học thành công',
            data: result
        });
    } catch (error) {
        console.error('Error getting schedule exceptions:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách ngoại lệ lịch học'
        });
    }
};

const getScheduleExceptionById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await scheduleExceptionService.getScheduleExceptionById(id, userId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ngoại lệ lịch học'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Lấy chi tiết ngoại lệ lịch học thành công',
            data: result
        });
    } catch (error) {
        console.error('Error getting schedule exception by id:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy chi tiết ngoại lệ lịch học'
        });
    }
};

const updateScheduleException = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            exceptionType, 
            exceptionDate,
            reason, 
            note,
            newDate,
            newTimeSlotId,
            newClassRoomId,
            substituteTeacherId,
            requestStatusId,
            requestTypeId
        } = req.body;
        const userId = req.user.id;

        const result = await scheduleExceptionService.updateScheduleException(id, {
            exceptionType,
            exceptionDate,
            reason,
            note,
            newDate,
            newTimeSlotId,
            newClassRoomId,
            substituteTeacherId,
            requestStatusId,
            requestTypeId
        }, userId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ngoại lệ lịch học'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cập nhật ngoại lệ lịch học thành công',
            data: result
        });
    } catch (error) {
        console.error('Error updating schedule exception:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật ngoại lệ lịch học'
        });
    }
};

const deleteScheduleException = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await scheduleExceptionService.deleteScheduleException(id, userId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ngoại lệ lịch học'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa ngoại lệ lịch học thành công'
        });
    } catch (error) {
        console.error('Error deleting schedule exception:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xóa ngoại lệ lịch học'
        });
    }
};

const getAvailableSchedules = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const userId = req.user.id;

        const result = await scheduleExceptionService.getAvailableSchedules({
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            userId
        });

        res.status(200).json({
            success: true,
            message: 'Lấy danh sách lịch học có thể tạo ngoại lệ thành công',
            data: result
        });
    } catch (error) {
        console.error('Error getting available schedules:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi lấy danh sách lịch học có thể tạo ngoại lệ'
        });
    }
};

module.exports = {
    createScheduleException,
    getScheduleExceptions,
    getScheduleExceptionById,
    updateScheduleException,
    deleteScheduleException,
    getAvailableSchedules
};
