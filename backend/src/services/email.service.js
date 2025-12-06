const nodemailer = require('nodemailer');
const config = require('../config/env.config');

class EmailService {
    constructor() {
        const emailUser = config.email.user !== 'your_email@gmail.com' 
            ? config.email.user 
            : (process.env.EMAIL_USER || process.env.SMTP_USER || '');
        
        const emailPass = config.email.pass !== 'your_app_password'
            ? config.email.pass
            : (process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || '');

        if (config.email.host && config.email.host !== 'smtp.gmail.com') {
            this.transporter = nodemailer.createTransport({
                host: config.email.host,
                port: config.email.port,
                secure: config.email.port === 465, 
                auth: {
                    user: emailUser,
                    pass: emailPass
                }
            });
        } else {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailUser,
                    pass: emailPass
                }
            });
        }

        this.verifyConnection();
    }

    async verifyConnection() {
        try {
            await this.transporter.verify();
        } catch (error) {
        }
    }

    async sendEmail({ to, subject, content }) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'your-email@gmail.com',
                to: to,
                subject: subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                            <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
                            <div style="background-color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                                ${content.replace(/\n/g, '<br>')}
                            </div>
                            <div style="text-align: center; color: #666; font-size: 12px;">
                                <p>Email này được gửi tự động từ hệ thống quản lý lớp học</p>
                                <p>Vui lòng không trả lời email này</p>
                            </div>
                        </div>
                    </div>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            return result;
        } catch (error) {
            let errorMessage = 'Lỗi gửi email';
            
            if (error.message.includes('Invalid login') || error.message.includes('BadCredentials')) {
                errorMessage = 'Lỗi xác thực email. Vui lòng kiểm tra lại EMAIL_USER và EMAIL_PASSWORD trong file .env. Với Gmail, cần sử dụng App Password.';
            } else if (error.message.includes('ECONNECTION') || error.message.includes('ETIMEDOUT')) {
                errorMessage = 'Không thể kết nối đến máy chủ email. Vui lòng kiểm tra kết nối mạng.';
            } else if (error.message.includes('EENVELOPE')) {
                errorMessage = 'Lỗi địa chỉ email người nhận.';
            } else {
                errorMessage = `Lỗi gửi email: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    // gửi email thông báo tài khoản mới
    async sendAccountNotification({ to, username, password, fullName, role }) {
        const subject = 'IUH - Thông tin tài khoản và hướng dẫn đăng nhập hệ thống';
        const content = this.generateEmailTemplate({ to, username, password, fullName, role });
        return this.sendEmail({ to, subject, content });
    }

    // gửi email thủ công từ admin
    async sendManualEmail({ to, subject, content, fullName, role, username, password }) {
        const emailContent = this.generateEmailTemplate({ 
            to, subject, content, fullName, role, username, password 
        });
        return this.sendEmail({ to, subject, content: emailContent });
    }

    // gửi email reset password
    async sendPasswordResetEmail({ to, fullName, resetLink }) {
        const subject = 'IUH - Khôi phục mật khẩu';
        const content = this.generatePasswordResetTemplate({ fullName, resetLink });
        return this.sendEmail({ to, subject, content });
    }

    // template email reset password
    generatePasswordResetTemplate({ fullName, resetLink }) {
        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                        Khôi phục mật khẩu
                    </h1>
                </div>
                
                <!-- Content -->
                <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                        <strong>Thân gửi ${fullName},</strong>
                    </p>
                    
                    <div style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                        Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn trên hệ thống quản lý lớp học IUH.
                    </div>
                    
                    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3;">
                        <h3 style="color: #1976d2; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
                            Đặt lại mật khẩu:
                        </h3>
                        <p style="color: #555; margin: 10px 0;">
                            Vui lòng click vào nút bên dưới để đặt lại mật khẩu mới:
                        </p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${resetLink}" style="display: inline-block; background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 16px;">
                                Đặt lại mật khẩu
                            </a>
                        </div>
                        <p style="color: #666; font-size: 13px; margin-top: 15px;">
                            Hoặc copy và dán link sau vào trình duyệt:<br>
                            <span style="color: #1976d2; word-break: break-all;">${resetLink}</span>
                        </p>
                    </div>
                    
                    <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff9800;">
                        <h3 style="color: #f57c00; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
                            ⚠️ Lưu ý quan trọng:
                        </h3>
                        <ul style="color: #555; margin: 0; padding-left: 20px;">
                            <li style="margin: 8px 0;">Link này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
                            <li style="margin: 8px 0;">Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này</li>
                            <li style="margin: 8px 0;">Để bảo mật, không chia sẻ link này với bất kỳ ai</li>
                            <li style="margin: 8px 0;">Nếu gặp vấn đề, vui lòng liên hệ phòng Công Tác Sinh Viên</li>
                        </ul>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
                        Trân trọng,<br>
                        <strong>IUH - Trường Đại học Công nghiệp TP.HCM</strong>
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>© 2024 IUH Classroom Management System. Powered by IUH IT Department.</p>
                </div>
            </div>
        `;
    }

    // Template email chung cho tất cả trường hợp
    generateEmailTemplate({ to, subject, content, fullName, role, username, password }) {
        const roleText = role === 'teacher' ? 'Giảng viên' : 'Sinh viên';
        const loginCode = role === 'teacher' ? 'Mã giảng viên' : 'Mã sinh viên';
        
        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                        ${subject || 'Thông tin tài khoản và hướng dẫn đăng nhập hệ thống'}
                    </h1>
                </div>
                
                <!-- Content -->
                <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
                        <strong>Thân gửi ${fullName},</strong>
                    </p>
                    
                    <div style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
                        ${content ? content.replace(/\n/g, '<br>') : 'Tài khoản của bạn trên hệ thống quản lý lớp học IUH vừa được khởi tạo thành công.'}
                    </div>
                    
                    ${username && password ? `
                    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196f3;">
                        <h3 style="color: #1976d2; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
                            📋 Thông tin tài khoản:
                        </h3>
                        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            <p style="margin: 8px 0; color: #333;"><strong>${loginCode}:</strong> <span style="color: #1976d2; font-weight: 600;">${username}</span></p>
                            <p style="margin: 8px 0; color: #333;"><strong>Mật khẩu:</strong> <span style="color: #d32f2f; font-weight: 600;">${password}</span></p>
                            <p style="margin: 8px 0; color: #333;"><strong>Chức danh:</strong> <span style="color: #388e3c; font-weight: 600;">${roleText}</span></p>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="background-color: #f3e5f5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #9c27b0;">
                        <h3 style="color: #7b1fa2; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
                            🌐 Hướng dẫn truy cập hệ thống:
                        </h3>
                        <p style="color: #555; margin: 10px 0;">
                            Để sẵn sàng sử dụng hệ thống, truy cập tại:
                        </p>
                        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 10px 0; text-align: center;">
                            <a href="https://kltn2025-076-qlhethongphonghoc-iuh.onrender.com" style="color: #1976d2; text-decoration: none; font-weight: 600; font-size: 16px;">
                                🔗 https://kltn2025-076-qlhethongphonghoc-iuh.onrender.com
                            </a>
                        </div>
                    </div>
                    
                    <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ff9800;">
                        <h3 style="color: #f57c00; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
                            ⚠️ Lưu ý quan trọng:
                        </h3>
                        <ul style="color: #555; margin: 0; padding-left: 20px;">
                            <li style="margin: 8px 0;">Vui lòng đăng nhập và thay đổi mật khẩu ngay để đảm bảo an toàn</li>
                            <li style="margin: 8px 0;">Không chia sẻ thông tin đăng nhập với người khác</li>
                            <li style="margin: 8px 0;">Liên hệ phòng Công Tác Sinh Viên nếu gặp vấn đề khi đăng nhập</li>
                        </ul>
                    </div>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
                        Trân trọng,<br>
                        <strong>IUH - Trường Đại học Công nghiệp TP.HCM</strong>
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>© 2024 IUH Classroom Management System. Powered by IUH IT Department.</p>
                </div>
            </div>
        `;
    }
}

module.exports = new EmailService();
