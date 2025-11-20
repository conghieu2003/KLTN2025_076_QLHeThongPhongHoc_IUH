const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcryptConfig = require('../config/bcrypt.config');
const emailService = require('./email.service');
const config = require('../config/env.config');

const prisma = new PrismaClient();

// Hàm validate mật khẩu mạnh
function validateStrongPassword(password) {
    if (!password || password.length < 6) {
        return {
            isValid: false,
            message: 'Mật khẩu phải có ít nhất 6 ký tự'
        };
    }

    // Kiểm tra có chữ in hoa
    const hasUpperCase = /[A-Z]/.test(password);
    // Kiểm tra có số
    const hasNumber = /[0-9]/.test(password);
    // Kiểm tra có ký tự đặc biệt
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase) {
        return {
            isValid: false,
            message: 'Mật khẩu phải có ít nhất một chữ cái in hoa (A-Z)'
        };
    }

    if (!hasNumber) {
        return {
            isValid: false,
            message: 'Mật khẩu phải có ít nhất một số (0-9)'
        };
    }

    if (!hasSpecialChar) {
        return {
            isValid: false,
            message: 'Mật khẩu phải có ít nhất một ký tự đặc biệt (!@#$%^&*()_+-=[]{}|;:,.<>?)'
        };
    }

    return {
        isValid: true,
        message: 'Mật khẩu hợp lệ'
    };
}

class AuthService {
    async register(userData) {
        const { username, password, role, fullName, email, phone, address } = userData;

        try {
            // Kiểm tra username đã tồn tại
            const existingAccount = await prisma.account.findUnique({
                where: { username }
            });

            if (existingAccount) {
                throw new Error('Username đã tồn tại');
            }

            // Kiểm tra email đã tồn tại
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                throw new Error('Email đã tồn tại');
            }

            // Hash password
            const hashedPassword = await bcryptConfig.hashPassword(password);

            // Tạo transaction để đảm bảo tính nhất quán
            const result = await prisma.$transaction(async (tx) => {
                // Tạo account
                const account = await tx.account.create({
                    data: {
                        username,
                        password: hashedPassword,
                        role,
                        isActive: true
                    }
                });

                // Tạo user
                const user = await tx.user.create({
                    data: {
                        accountId: account.id,
                        fullName,
                        email,
                        phone,
                        address
                    }
                });

                // Tạo thêm bản ghi teacher hoặc student tùy theo role
                if (role === 'teacher') {
                    await tx.teacher.create({
                        data: {
                            userId: user.id,
                            teacherCode: `TC${user.id}`
                        }
                    });
                } else if (role === 'student') {
                    await tx.student.create({
                        data: {
                            userId: user.id,
                            studentCode: `ST${user.id}`
                        }
                    });
                }

                return { account, user };
            });

            return {
                success: true,
                message: 'Đăng ký thành công',
                data: result
            };
        } catch (error) {
            throw new Error(`Lỗi đăng ký: ${error.message}`);
        }
    }

    async login(identifier, password) {
        try {
            let account = null;

            // 1) Teacher login via teacherCode
            if (!account) {
                const teacherRecord = await prisma.teacher.findUnique({
                    where: { teacherCode: identifier },
                    include: {
                        user: { include: { account: true, teacher: true, student: true } }
                    }
                });
                if (teacherRecord?.user?.account && teacherRecord.user.account.role === 'teacher') {
                    account = { ...teacherRecord.user.account, user: teacherRecord.user };
                }
            }

            // 2) Student login via studentCode
            if (!account) {
                const studentRecord = await prisma.student.findUnique({
                    where: { studentCode: identifier },
                    include: {
                        user: { include: { account: true, teacher: true, student: true } }
                    }
                });
                if (studentRecord?.user?.account && studentRecord.user.account.role === 'student') {
                    account = { ...studentRecord.user.account, user: studentRecord.user };
                }
            }

            // 3) Admin login via userId (numeric)
            if (!account) {
                const userIdAsInt = Number(identifier);
                if (!Number.isNaN(userIdAsInt)) {
                    const adminUser = await prisma.user.findUnique({
                        where: { id: userIdAsInt },
                        include: { account: true, teacher: true, student: true }
                    });
                    if (adminUser && adminUser.account && adminUser.account.role === 'admin') {
                        account = { ...adminUser.account, user: adminUser };
                    }
                }
            }

            // 4) Backward compatibility: login via account.username
            if (!account) {
                const acc = await prisma.account.findUnique({
                    where: { username: identifier },
                    include: {
                        user: { include: { teacher: true, student: true } }
                    }
                });
                if (acc) account = acc;
            }

            if (!account) {
                throw new Error('Tài khoản không tồn tại');
            }

            if (!account.isActive) {
                throw new Error('Tài khoản đã bị khóa');
            }

            // Kiểm tra password
            const isValidPassword = await bcryptConfig.comparePassword(password, account.password);
            if (!isValidPassword) {
                throw new Error('Mật khẩu không chính xác');
            }

            const token = jwt.sign(
                {
                    id: account.id,
                    username: account.username,
                    role: account.role
                },
                process.env.JWT_SECRET || 'classroom_management_secret_key',
                { expiresIn: '24h' }
            );

            return {
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    token,
                    user: {
                        username: account.username,
                        id: account.user.id,
                        fullName: account.user.fullName,
                        email: account.user.email,
                        role: account.role,
                        teacherCode: account.user.teacher?.teacherCode,
                        studentCode: account.user.student?.studentCode
                    }
                }
            };
        } catch (error) {
            throw new Error(`Lỗi đăng nhập: ${error.message}`);
        }
    }

    async changePassword(userId, oldPassword, newPassword) {
        try {
            const account = await prisma.account.findFirst({
                where: {
                    user: {
                        id: userId
                    }
                }
            });

            if (!account) {
                throw new Error('Tài khoản không tồn tại');
            }

            // Kiểm tra mật khẩu cũ
            const isValidPassword = await bcryptConfig.comparePassword(oldPassword, account.password);
            if (!isValidPassword) {
                throw new Error('Mật khẩu cũ không chính xác');
            }

            // Validate mật khẩu mạnh
            const passwordValidation = validateStrongPassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.message);
            }

            // Hash mật khẩu mới
            const hashedPassword = await bcryptConfig.hashPassword(newPassword);

            // Cập nhật mật khẩu
            await prisma.account.update({
                where: { id: account.id },
                data: { password: hashedPassword }
            });

            return {
                success: true,
                message: 'Đổi mật khẩu thành công'
            };
        } catch (error) {
            throw new Error(`Lỗi đổi mật khẩu: ${error.message}`);
        }
    }

    async forgotPassword(identifier) {
        try {
            if (!identifier || !identifier.trim()) {
                return {
                    success: false,
                    message: 'Vui lòng nhập mã số sinh viên/giảng viên'
                };
            }

            let user = null;
            const trimmedIdentifier = identifier.trim();

            console.log('ForgotPassword - Searching for identifier:', trimmedIdentifier);
            try {
                let studentRecord = await prisma.student.findUnique({
                    where: { studentCode: trimmedIdentifier },
                    include: {
                        user: { 
                            include: { 
                                account: true 
                            } 
                        }
                    }
                });
                
                // Nếu không tìm thấy, thử tìm case-insensitive (nếu là string)
                if (!studentRecord && trimmedIdentifier) {
                    studentRecord = await prisma.student.findFirst({
                        where: {
                            studentCode: {
                                equals: trimmedIdentifier,
                                mode: 'insensitive'
                            }
                        },
                        include: {
                            user: { 
                                include: { 
                                    account: true 
                                } 
                            }
                        }
                    });
                }
                
                console.log('Student search result:', studentRecord ? `Found studentCode: ${studentRecord.studentCode}` : 'Not found');
                if (studentRecord?.user) {
                    user = studentRecord.user;
                    console.log('Found student user:', user.id, user.email, user.fullName);
                }
            } catch (err) {
                console.error('Error searching student:', err);
                console.error('Error details:', err.message, err.stack);
            }

            // 2) Tìm teacher theo teacherCode
            if (!user) {
                try {
                    let teacherRecord = await prisma.teacher.findUnique({
                        where: { teacherCode: trimmedIdentifier },
                        include: {
                            user: { 
                                include: { 
                                    account: true 
                                } 
                            }
                        }
                    });
                    
                    // Nếu không tìm thấy, thử tìm case-insensitive
                    if (!teacherRecord && trimmedIdentifier) {
                        teacherRecord = await prisma.teacher.findFirst({
                            where: {
                                teacherCode: {
                                    equals: trimmedIdentifier,
                                    mode: 'insensitive'
                                }
                            },
                            include: {
                                user: { 
                                    include: { 
                                        account: true 
                                    } 
                                }
                            }
                        });
                    }
                    
                    console.log('Teacher search result:', teacherRecord ? `Found teacherCode: ${teacherRecord.teacherCode}` : 'Not found');
                    if (teacherRecord?.user) {
                        user = teacherRecord.user;
                        console.log('Found teacher user:', user.id, user.email, user.fullName);
                    }
                } catch (err) {
                    console.error('Error searching teacher:', err);
                    console.error('Error details:', err.message, err.stack);
                }
            }

            // 3) Tìm admin theo userId (numeric) - chỉ khi identifier là số thuần VÀ không tìm thấy student/teacher
            // Và chỉ tìm admin nếu số đó nhỏ hơn 1000 (vì admin thường có id nhỏ)
            if (!user && /^\d+$/.test(trimmedIdentifier)) {
                try {
                    const userIdAsInt = Number(trimmedIdentifier);
                    // Chỉ tìm admin nếu số nhỏ hơn 1000 (tránh nhầm với mã số sinh viên)
                    if (!Number.isNaN(userIdAsInt) && userIdAsInt < 1000) {
                        const adminUser = await prisma.user.findUnique({
                            where: { id: userIdAsInt },
                            include: { account: true }
                        });
                        console.log('Admin search result:', adminUser ? `Found userId: ${adminUser.id}` : 'Not found');
                        if (adminUser && adminUser.account && adminUser.account.role === 'admin') {
                            user = adminUser;
                            console.log('Found admin user:', user.id, user.email, user.fullName);
                        }
                    }
                } catch (err) {
                    console.error('Error searching admin:', err);
                }
            }

            // 4) Tìm theo username (backward compatibility)
            if (!user) {
                try {
                    const account = await prisma.account.findUnique({
                        where: { username: trimmedIdentifier },
                        include: { user: true }
                    });
                    console.log('Username search result:', account ? `Found username: ${account.username}` : 'Not found');
                    if (account?.user) {
                        user = account.user;
                        console.log('Found user by username:', user.id, user.email, user.fullName);
                    }
                } catch (err) {
                    console.error('Error searching by username:', err);
                }
            }

            console.log('Final result - User found:', user ? `Yes (ID: ${user.id}, Email: ${user.email})` : 'No');

            // Nếu không tìm thấy user với mã số này
            if (!user) {
                return {
                    success: false,
                    message: 'Mã số không tồn tại trong hệ thống'
                };
            }

            // Kiểm tra user có email không
            if (!user.email || !user.email.trim()) {
                return {
                    success: false,
                    message: 'Tài khoản này chưa có email. Vui lòng liên hệ phòng Công Tác Sinh Viên để cập nhật email'
                };
            }

            // Kiểm tra account có active không
            if (user.account && !user.account.isActive) {
                return {
                    success: false,
                    message: 'Tài khoản đã bị khóa. Vui lòng liên hệ phòng Công Tác Sinh Viên'
                };
            }

            // Tạo reset token (JWT với thời gian hết hạn 1 giờ)
            const resetToken = jwt.sign(
                { 
                    userId: user.id,
                    type: 'password_reset'
                },
                config.jwt.secret,
                { expiresIn: '1h' }
            );

            // Tạo link reset password
            const resetLink = `${config.app.corsOrigin}/reset-password?token=${resetToken}`;

            // Gửi email
            try {
                await emailService.sendPasswordResetEmail({
                    to: user.email.trim(),
                    fullName: user.fullName,
                    resetLink: resetLink
                });

                return {
                    success: true,
                    message: `Email khôi phục mật khẩu đã được gửi đến ${user.email.trim()}`
                };
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                
                // Xử lý các lỗi cụ thể
                let errorMessage = 'Không thể gửi email khôi phục mật khẩu';
                
                if (emailError.message.includes('xác thực email') || emailError.message.includes('Invalid login') || emailError.message.includes('BadCredentials')) {
                    errorMessage = 'Lỗi cấu hình email server. Vui lòng liên hệ quản trị viên hệ thống.';
                    console.error('⚠️ Email server authentication failed. Please check EMAIL_USER and EMAIL_PASSWORD in .env file.');
                    console.error('💡 For Gmail, you need to use App Password instead of regular password.');
                    console.error('   Create App Password at: https://myaccount.google.com/apppasswords');
                } else if (emailError.message.includes('kết nối')) {
                    errorMessage = 'Không thể kết nối đến máy chủ email. Vui lòng thử lại sau.';
                } else {
                    errorMessage = `Không thể gửi email. Vui lòng thử lại sau hoặc liên hệ phòng Công Tác Sinh Viên.`;
                }
                
                return {
                    success: false,
                    message: errorMessage
                };
            }
        } catch (error) {
            console.error('Error in forgotPassword:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi xử lý yêu cầu. Vui lòng thử lại sau'
            };
        }
    }

    async resetPassword(token, newPassword) {
        try {
            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, config.jwt.secret);
            } catch (error) {
                throw new Error('Link khôi phục mật khẩu không hợp lệ hoặc đã hết hạn');
            }

            // Kiểm tra token type
            if (decoded.type !== 'password_reset') {
                throw new Error('Link khôi phục mật khẩu không hợp lệ');
            }

            const userId = decoded.userId;

            // Tìm user
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { account: true }
            });

            if (!user || !user.account) {
                throw new Error('Tài khoản không tồn tại');
            }

            // Validate mật khẩu mạnh
            const passwordValidation = validateStrongPassword(newPassword);
            if (!passwordValidation.isValid) {
                throw new Error(passwordValidation.message);
            }

            // Hash mật khẩu mới
            const hashedPassword = await bcryptConfig.hashPassword(newPassword);

            // Cập nhật mật khẩu
            await prisma.account.update({
                where: { id: user.account.id },
                data: { password: hashedPassword }
            });

            return {
                success: true,
                message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới'
            };
        } catch (error) {
            throw new Error(`Lỗi đặt lại mật khẩu: ${error.message}`);
        }
    }
}

module.exports = new AuthService(); 