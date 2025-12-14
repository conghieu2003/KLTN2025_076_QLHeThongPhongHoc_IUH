const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'classroom_management_secret_key');

        // Kiểm tra tài khoản có tồn tại và còn active
        const account = await prisma.account.findFirst({
            where: { 
                id: decoded.id,
                isActive: true
            },
            include: {
                user: true
            }
        });

        if (!account) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc tài khoản đã bị khóa'
            });
        }

        // Thêm thông tin user vào request
        req.user = {
            id: account.user.id,
            accountId: account.id,
            role: account.role,
            username: account.username
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        // Admin có quyền truy cập tất cả
        if (req.user.role === 'admin') {
            return next();
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    authorize
}; 