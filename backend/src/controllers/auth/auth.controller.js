const jwt = require('jsonwebtoken');
const authService = require('../../services/auth.service');
const prisma = require('../../config/db.config');

class AuthController {
    async register(req, res) {
        try {
            const result = await authService.register(req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async login(req, res) {
        try {
            const { username, identifier, password } = req.body;

            if (!(identifier || username) || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin đăng nhập'
                });
            }

            const result = await authService.login(identifier || username, password);
            res.status(200).json(result);
        } catch (error) {
            let errorCode = 'LOGIN_FAILED';
            let statusCode = 401;
            
            // Xác định errorCode cụ thể
            if (error.message.includes('không tồn tại')) {
                errorCode = 'ACCOUNT_NOT_FOUND';
            } else if (error.message.includes('đã bị khóa')) {
                errorCode = 'ACCOUNT_INACTIVE';
            } else if (error.message.includes('không chính xác')) {
                errorCode = 'INVALID_PASSWORD';
            } else if (error.message.includes('Lỗi đăng nhập')) {
                errorCode = 'SYSTEM_ERROR';
                statusCode = 500;
            }
            
            res.status(statusCode).json({
                success: false,
                message: error.message,
                errorCode: errorCode
            });
        }
    }

    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới'
                });
            }

            const result = await authService.changePassword(userId, oldPassword, newPassword);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    account: true,
                    teacher: true,
                    student: true
                }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin người dùng'
                });
            }

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông tin người dùng'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { fullName, email, phone, address } = req.body;

            // Kiểm tra email đã tồn tại
            if (email) {
                const existingUser = await prisma.user.findFirst({
                    where: {
                        email,
                        NOT: {
                            id: userId
                        }
                    }
                });

                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email đã được sử dụng'
                    });
                }
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    fullName,
                    email,
                    phone,
                    address
                },
                include: {
                    account: true,
                    teacher: true,
                    student: true
                }
            });

            res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin thành công',
                data: updatedUser
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật thông tin người dùng'
            });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { identifier } = req.body;

            if (!identifier) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập mã số sinh viên/giảng viên'
                });
            }

            const result = await authService.forgotPassword(identifier);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Có lỗi xảy ra khi xử lý yêu cầu'
            });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, newPassword, confirmPassword } = req.body;

            if (!token || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu xác nhận không khớp'
                });
            }

            const result = await authService.resetPassword(token, newPassword);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Có lỗi xảy ra khi đặt lại mật khẩu'
            });
        }
    }
}

module.exports = new AuthController(); 