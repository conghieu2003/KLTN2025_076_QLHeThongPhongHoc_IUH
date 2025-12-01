require('dotenv').config();
const app = require('./app');
const prisma = require('./config/db.config');
const { exec } = require('child_process');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        console.log('🚀 Khởi động Classroom Management System Backend...');
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔌 Port: ${PORT}`);
        console.log(`🗄️ Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '1433'}`);
        console.log('');

        // Kiểm tra kết nối database
        console.log('⏳ Đang kết nối database...');
        await prisma.$connect();
        console.log('✅ Kết nối database thành công.');

        app.listen(PORT, () => {
            console.log(`🎉 Server đang chạy trên cổng ${PORT}`);
            console.log(`🌐 Health check: http://localhost:${PORT}/health`);
            const swaggerUrl = `http://localhost:${PORT}/api-docs`;
            console.log(`📚 Swagger API docs: ${swaggerUrl}`);
            
            // Tự động mở Swagger UI trong browser (chỉ trong development)
            if (process.env.NODE_ENV !== 'production') {
                setTimeout(() => {
                    const platform = process.platform;
                    let command;
                    
                    if (platform === 'win32') {
                        command = `start ${swaggerUrl}`;
                    } else if (platform === 'darwin') {
                        command = `open ${swaggerUrl}`;
                    } else {
                        command = `xdg-open ${swaggerUrl}`;
                    }
                    
                    exec(command, (error) => {
                        if (error) {
                            console.log(`💡 Mở trình duyệt thủ công tại: ${swaggerUrl}`);
                        } else {
                            console.log(`🌐 Đã mở Swagger UI trong trình duyệt`);
                        }
                    });
                }, 1000); // Đợi 1 giây để server sẵn sàng
            }
        });
    } catch (error) {
        console.error('❌ Không thể kết nối đến database:', error);
        process.exit(1);
    }
}

startServer();

// Cleanup khi tắt server
process.on('beforeExit', async () => {
    console.log('🛑 Đang đóng kết nối database...');
    await prisma.$disconnect();
    console.log('✅ Đã đóng kết nối database.');
});

// Xử lý graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Nhận tín hiệu SIGTERM, đang tắt server...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 Nhận tín hiệu SIGINT, đang tắt server...');
    await prisma.$disconnect();
    process.exit(0);
}); 