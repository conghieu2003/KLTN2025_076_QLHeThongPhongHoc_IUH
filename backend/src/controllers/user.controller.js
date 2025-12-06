const userService = require('../services/user.service');

class UserController {
    // lấy danh sách user
    async list(req, res) {
        try {
            const { role, username } = req.body || {};
            if (username) {
                if (!req.user || !req.user.accountId) {
                    return res.status(401).json({ success: false, message: 'Thiếu thông tin xác thực' });
                }
                if (req.user.username && req.user.username !== username) {
                    return res.status(403).json({ success: false, message: 'Không khớp người yêu cầu' });
                }
            }
            const data = await userService.listUsers(role);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // lấy mã tiếp theo
    async nextCode(req, res) {
        try {
            const { role } = req.query;
            if (!role || !['teacher', 'student'].includes(role)) {
                return res.status(400).json({ success: false, message: 'role không hợp lệ' });
            }
            const data = await userService.getFormInit(role);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // lấy danh sách khoa
    async departments(req, res) {
        try {
            const data = await userService.getDepartments();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // lấy danh sách chuyên ngành
    async majors(req, res) {
        try {
            const { departmentId } = req.query;
            const data = await userService.getMajors(departmentId);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // tạo user
    async create(req, res) {
        try {
            const userData = req.body;
            const result = await userService.createUser(userData);
            return res.status(201).json(result);
        } catch (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }
    }

    // cập nhật user
    async update(req, res) {
        try {
            const { userId } = req.params;
            const updateData = req.body;
            const result = await userService.updateUser(parseInt(userId), updateData);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ 
                success: false, 
                message: error.message 
            });
        }
    }

    // gửi email
    async sendEmail(req, res) {
        try {
            const { userId, subject, content, includeCredentials } = req.body;
            
            if (!userId || !subject || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc: userId, subject, content'
                });
            }

            const result = await userService.sendEmailToUser({
                userId: parseInt(userId),
                subject,
                content,
                includeCredentials: includeCredentials || false
            });

            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new UserController();


