const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger.config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Classroom Management System Backend',
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Classroom Management System Backend API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        documentation: '/api-docs'
    });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Classroom Management System API',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true
    }
}));

// Routes
const authRoutes = require('./routes/auth.routes');
const classRoutes = require('./routes/class.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const scheduleRequestRoutes = require('./routes/scheduleRequest.routes');
const userRoutes = require('./routes/user.routes');
const roomRoutes = require('./routes/room.routes');
const scheduleManagementRoutes = require('./routes/scheduleManagement.routes');

// routes 
const departmentRoutes = require('./routes/department.routes');
const teacherRoutes = require('./routes/teacher.routes');
const classRoomTypeRoutes = require('./routes/classRoomType.routes');
const requestTypeRoutes = require('./routes/requestType.routes');
const classScheduleRoutes = require('./routes/classSchedule.routes');
const profileRoutes = require('./routes/profile.routes');
const scheduleExceptionRoutes = require('./routes/scheduleException.routes');
const equipmentRoutes = require('./routes/equipment.routes');
const roomIssueRoutes = require('./routes/roomIssue.routes');

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/schedule-requests', scheduleRequestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/schedule-management', scheduleManagementRoutes);

// 
app.use('/api/departments', departmentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classroom-types', classRoomTypeRoutes);
app.use('/api/request-types', requestTypeRoutes);
app.use('/api/class-schedules', classScheduleRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/schedule-exceptions', scheduleExceptionRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/room-issues', roomIssueRoutes);

// xử lý lỗi
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Lỗi server'
    });
});

module.exports = app; 