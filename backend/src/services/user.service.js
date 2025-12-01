const prisma = require('../config/db.config');
const bcryptConfig = require('../config/bcrypt.config');
const emailService = require('./email.service');

function mapAccountRow(account) {
    const academicProfile = account.user?.academicProfile;
    
    // Debug log để kiểm tra dữ liệu
    console.log('=== DEBUG: Account data ===');
    console.log('Account ID:', account.id);
    console.log('User ID:', account.user?.id);
    console.log('User phone:', account.user?.phone);
    console.log('User fullName:', account.user?.fullName);
    console.log('Teacher code:', account.user?.teacher?.teacherCode);
    console.log('Student code:', account.user?.student?.studentCode);
    console.log('========================');
    
    return {
        id: account.user?.id || null,
        accountId: account.id,
        username: account.username,
        fullName: account.user?.fullName || '',
        email: account.user?.email || '',
        phone: account.user?.phone || null,  // Thêm field phone
        role: account.role,
        status: account.isActive ? 'active' : 'inactive',
        teacherCode: account.user?.teacher?.teacherCode || null,
        studentCode: account.user?.student?.studentCode || null,
        // Academic Profile Information
        campus: academicProfile?.campus || null,
        trainingType: academicProfile?.trainingType || null,
        degreeLevel: academicProfile?.degreeLevel || null,
        academicYear: academicProfile?.academicYear || null,  // Chỉ có cho student
        enrollmentDate: academicProfile?.enrollmentDate || null,  // Có cho cả student và teacher
        classCode: academicProfile?.classCode || null,
        title: academicProfile?.title || null,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
    };
}

class UserService {
    async getDepartments() {
        const rows = await prisma.$queryRaw`SELECT id, name FROM Department ORDER BY name ASC`;
        return Array.isArray(rows) ? rows.map(r => ({ id: r.id, name: r.name })) : [];
    }

    async getMajors(departmentId) {
        if (departmentId) {
            const rows = await prisma.$queryRaw`SELECT id, name FROM Major WHERE departmentId = ${Number(departmentId)} ORDER BY name ASC`;
            return Array.isArray(rows) ? rows.map(r => ({ id: r.id, name: r.name })) : [];
        }
        const rows = await prisma.$queryRaw`SELECT id, name FROM Major ORDER BY name ASC`;
        return Array.isArray(rows) ? rows.map(r => ({ id: r.id, name: r.name })) : [];
    }
    async getNextCode(role) {
        const isTeacher = role === 'teacher';
        const prefix = isTeacher ? '10' : '20';

        // Query max numeric 8-digit code with proper prefix, ignore non-numeric legacy codes (e.g., TC001)
        const tableName = isTeacher ? 'Teacher' : 'Student';
        const columnName = isTeacher ? 'teacherCode' : 'studentCode';
        const rows = await prisma.$queryRawUnsafe(
            `SELECT MAX(CAST(${columnName} AS BIGINT)) AS maxCode
             FROM ${tableName}
             WHERE TRY_CONVERT(BIGINT, ${columnName}) IS NOT NULL
               AND LEN(${columnName}) = 8
               AND LEFT(${columnName}, 2) = '${prefix}'`
        );

        let nextNumber;
        if (Array.isArray(rows) && rows.length > 0 && rows[0].maxCode) {
            const maxCode = Number(rows[0].maxCode);
            nextNumber = maxCode + 1;
        } else {
            // Start base: 10000000 or 20000000
            nextNumber = Number(prefix + '000000');
        }

        const next = String(nextNumber).padStart(8, '0');
        return next;
    }

    async getFormInit(role) {
        // Get next code based on role
        const code = await this.getNextCode(role);

        // Build departments and majors from new catalog tables (id + name)
        const departmentsRows = await prisma.$queryRaw`SELECT id, name FROM Department ORDER BY name ASC`;
        const majorsRows = await prisma.$queryRaw`SELECT id, name FROM Major ORDER BY name ASC`;

        const departments = Array.isArray(departmentsRows)
            ? departmentsRows.map((r) => ({ id: r.id, name: r.name })).filter((r) => r.name)
            : [];
        const majors = Array.isArray(majorsRows)
            ? majorsRows.map((r) => ({ id: r.id, name: r.name })).filter((r) => r.name)
            : [];

        // For teacher/student, username shown on FE equals login code (numeric, 8 chars)
        const previewUsername = code;

        // Tự động tính toán các giá trị mặc định
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;
        const enrollmentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        // Giá trị mặc định theo role
        const defaultValues = {
            campus: 'Cơ sở 1 Hồ Chí Minh',
            trainingType: 'Chính Quy',
            degreeLevel: role === 'teacher' ? 'Thạc sĩ' : 'Đại Học',
            academicYear: role === 'student' ? academicYear : null,  // Chỉ student có
            enrollmentDate: enrollmentDate,  // Cả student và teacher đều có
            title: role === 'teacher' ? 'Giảng viên' : null
        };

        return { 
            code, 
            previewUsername, 
            departments, 
            majors,
            defaultValues  // Trả về các giá trị mặc định
        };
    }
    async listUsers(role) {
        const whereClause = role ? { role } : {};
        const accounts = await prisma.account.findMany({
            where: whereClause,
            include: {
                user: {
                    include: {
                        teacher: true,
                        student: true,
                        academicProfile: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return accounts.map(mapAccountRow);
    }

    async createUser(userData) {
        const {
            fullName,
            email,
            phone,
            address,
            avatar,
            gender,
            dateOfBirth,
            role,
            teacherCode,
            studentCode,
            title,
            departmentId,
            majorId,
            classCode,
            // Optional from FE but ignored per policy
            username: _ignoredUsername,
            password: _ignoredPassword,
            // Deprecated
            department: _ignoredDepartment,
            major: _ignoredMajor,
            classId: _ignoredClassId,
            sendEmail,
            emailSubject,
            emailContent
        } = userData;

        try {
            // Kiểm tra email đã tồn tại
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                throw new Error('Email đã tồn tại trong hệ thống');
            }

            // Kiểm tra mã giảng viên/sinh viên đã tồn tại
            if (role === 'teacher' && teacherCode) {
                const existingTeacher = await prisma.teacher.findUnique({
                    where: { teacherCode }
                });
                if (existingTeacher) {
                    throw new Error('Mã giảng viên đã tồn tại');
                }
            }

            if (role === 'student' && studentCode) {
                const existingStudent = await prisma.student.findUnique({
                    where: { studentCode }
                });
                if (existingStudent) {
                    throw new Error('Mã sinh viên đã tồn tại');
                }
            }

            // Xác định username và password (hash bằng bcrypt)
            // Always generate login code (8 digits) based on role
            const codeForLogin = await this.getNextCode(role);

            // Generate internal username (not used for teacher/student login)
            const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const username = `${role.slice(0, 3)}_${uniqueSuffix}`; // e.g., tea_..., stu_...

            // Fixed default password policy
            const plainPassword = '123456';
            const hashedPassword = await bcryptConfig.hashPassword(plainPassword);

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
                        phone: phone || null,
                        address: address || null,
                        avatar: avatar || 'https://via.placeholder.com/150/CCCCCC/666666?text=' + encodeURIComponent(fullName.charAt(0).toUpperCase()),
                        gender: gender || null,
                        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null
                    }
                });

                // Tạo thêm bản ghi teacher hoặc student
                if (role === 'teacher') {
                    await tx.teacher.create({
                        data: {
                            userId: user.id,
                            teacherCode: codeForLogin,
                            departmentId: departmentId || null,
                            majorId: majorId || null,
                            title: title || 'Giảng viên'
                        }
                    });
                    
                    // Tự động gán giá trị mặc định cho teacher (KHÔNG có academicYear)
                    const enrollmentDate = userData.enrollmentDate ? new Date(userData.enrollmentDate) : new Date();
                    
                    await tx.academicProfile.create({
                        data: {
                            userId: user.id,
                            role: 'teacher',
                            campus: 'Cơ sở 1 Hồ Chí Minh',
                            trainingType: 'Chính Quy',
                            degreeLevel: 'Thạc sĩ',
                            academicYear: null,
                            enrollmentDate: enrollmentDate,
                            classCode: classCode || null,
                            title: title || 'Giảng viên'
                        }
                    });
                } else if (role === 'student') {
                    await tx.student.create({
                        data: {
                            userId: user.id,
                            studentCode: codeForLogin,
                            departmentId: departmentId || null,
                            majorId: majorId || null
                        }
                    });
                    
                    // Tự động gán giá trị mặc định cho student
                    const currentYear = new Date().getFullYear();
                    const academicYear = `${currentYear}-${currentYear + 1}`;
                    const enrollmentDate = new Date(); // Ngày tạo user
                    
                    await tx.academicProfile.create({
                        data: {
                            userId: user.id,
                            role: 'student',
                            campus: 'Cơ sở 1 Hồ Chí Minh',
                            trainingType: 'Chính Quy',
                            degreeLevel: 'Đại Học',
                            academicYear: academicYear,
                            enrollmentDate: enrollmentDate,
                            classCode: classCode || null,
                            title: null
                        }
                    });
                }

                return { account, user };
            });

            // Gửi email thông báo nếu được yêu cầu
            if (sendEmail && email) {
                try {
                    const finalEmailContent = (emailContent || '')
                        .replace('{username}', username)
                        .replace('{password}', plainPassword);

                    await emailService.sendEmail({
                        to: email,
                        subject: emailSubject || 'Thông báo tài khoản mới',
                        content: finalEmailContent
                    });
                } catch (emailError) {
                    console.error('Lỗi gửi email:', emailError);
                    // Không throw error vì tài khoản đã được tạo thành công
                }
            }

            return {
                success: true,
                message: 'Tạo tài khoản thành công',
                data: {
                    id: result.user.id,
                    username,
                    fullName,
                    email,
                    role,
                    teacherCode: role === 'teacher' ? codeForLogin : null,
                    studentCode: role === 'student' ? codeForLogin : null
                }
            };
        } catch (error) {
            throw new Error(`Lỗi tạo tài khoản: ${error.message}`);
        }
    }

    async sendEmailToUser({ userId, subject, content, includeCredentials = false }) {
        try {
            // Lấy thông tin user
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    account: true,
                    teacher: true,
                    student: true
                }
            });

            if (!user) {
                throw new Error('Không tìm thấy người dùng');
            }

            if (!user.email) {
                throw new Error('Người dùng không có email');
            }

            // Xác định role và thông tin đăng nhập
            const role = user.account.role;
            let username = null;
            let password = null;

            if (includeCredentials) {
                // Lấy thông tin đăng nhập từ database
                if (role === 'teacher' && user.teacher) {
                    username = user.teacher.teacherCode;
                } else if (role === 'student' && user.student) {
                    username = user.student.studentCode;
                }
                
                // Mật khẩu mặc định (có thể thay đổi logic này)
                password = '123456';
            }

            // Gửi email
            await emailService.sendManualEmail({
                to: user.email,
                subject,
                content,
                fullName: user.fullName,
                role,
                username,
                password
            });

            return {
                success: true,
                message: `Email đã được gửi thành công đến ${user.email}`,
                data: {
                    recipient: user.fullName,
                    email: user.email,
                    subject
                }
            };
        } catch (error) {
            throw new Error(`Lỗi gửi email: ${error.message}`);
        }
    }

    async getUserById(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    account: true,
                    teacher: true,
                    student: true,
                    academicProfile: true
                }
            });

            if (!user) {
                throw new Error('Không tìm thấy user');
            }

            const academicProfile = user.academicProfile;
            
            return {
                id: user.id,
                accountId: user.accountId,
                username: user.account?.username || null,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                avatar: user.avatar,
                gender: user.gender,
                dateOfBirth: user.dateOfBirth,
                role: user.account?.role || null,
                status: user.account?.isActive ? 'active' : 'inactive',
                teacherCode: user.teacher?.teacherCode || null,
                studentCode: user.student?.studentCode || null,
                departmentId: user.teacher?.departmentId || user.student?.departmentId || null,
                majorId: user.teacher?.majorId || user.student?.majorId || null,
                // Academic Profile Information
                campus: academicProfile?.campus || null,
                trainingType: academicProfile?.trainingType || null,
                degreeLevel: academicProfile?.degreeLevel || null,
                academicYear: academicProfile?.academicYear || null,  // Chỉ có cho student
                enrollmentDate: academicProfile?.enrollmentDate || null,  // Có cho cả student và teacher
                classCode: academicProfile?.classCode || null,
                title: academicProfile?.title || null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
        } catch (error) {
            throw new Error(`Lỗi lấy thông tin user: ${error.message}`);
        }
    }

    async updateUser(userId, updateData) {
        try {
            const { phone, isActive } = updateData;
            
            // Cập nhật thông tin user
            if (phone !== undefined) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { phone }
                });
            }
            
            // Cập nhật trạng thái account
            if (isActive !== undefined) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { accountId: true }
                });
                
                if (user) {
                    await prisma.account.update({
                        where: { id: user.accountId },
                        data: { isActive }
                    });
                }
            }
            
            // Lấy thông tin user đã cập nhật
            return await this.getUserById(userId);
        } catch (error) {
            throw new Error(`Lỗi cập nhật user: ${error.message}`);
        }
    }
}

module.exports = new UserService();
