const scheduleService = require('../services/schedule.service');

// Lấy danh sách lịch học với filter
const getSchedules = async (req, res) => {
  try {
    const {
      departmentId,
      classId,
      teacherId,
      scheduleType,
      startDate,
      endDate
    } = req.query;

    const filters = {
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      classId: classId ? parseInt(classId) : undefined,
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      scheduleType,
      startDate,
      endDate
    };

    const schedules = await scheduleService.getSchedules(filters);
    res.json(schedules);
  } catch (error) {
    console.error('Error in getSchedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Lấy lịch học theo tuần
const getWeeklySchedule = async (req, res) => {
  try {
    const {
      weekStartDate,
      departmentId,
      classId,
      teacherId,
      scheduleType
    } = req.query;

    const filters = {
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      classId: classId ? parseInt(classId) : undefined,
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      scheduleType
    };

    const schedules = await scheduleService.getWeeklySchedule(weekStartDate, filters);
    res.json(schedules);
  } catch (error) {
    console.error('Error in getWeeklySchedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// In lịch học
const printSchedule = async (req, res) => {
  try {
    const {
      departmentId,
      classId,
      teacherId,
      scheduleType,
      startDate,
      endDate
    } = req.query;

    const filters = {
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      classId: classId ? parseInt(classId) : undefined,
      teacherId: teacherId ? parseInt(teacherId) : undefined,
      scheduleType,
      startDate,
      endDate
    };

    const pdfBuffer = await scheduleService.printSchedule(filters);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="schedule.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error in printSchedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Tạo lịch học mới
const createSchedule = async (req, res) => {
  try {
    const scheduleData = req.body;
    const newSchedule = await scheduleService.createSchedule(scheduleData);
    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error in createSchedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cập nhật lịch học
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const scheduleData = req.body;
    const updatedSchedule = await scheduleService.updateSchedule(parseInt(id), scheduleData);
    res.json(updatedSchedule);
  } catch (error) {
    console.error('Error in updateSchedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Xóa lịch học
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    await scheduleService.deleteSchedule(parseInt(id));
    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteSchedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Lấy danh sách khoa
const getDepartments = async (req, res) => {
  try {
    const departments = await scheduleService.getDepartments();
    res.json(departments);
  } catch (error) {
    console.error('Error in getDepartments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Lấy danh sách lớp học
const getClasses = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const classes = await scheduleService.getClasses(departmentId ? parseInt(departmentId) : undefined);
    res.json(classes);
  } catch (error) {
    console.error('Error in getClasses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Lấy danh sách giảng viên
const getTeachers = async (req, res) => {
  try {
    const { departmentId } = req.query;
    const teachers = await scheduleService.getTeachers(departmentId ? parseInt(departmentId) : undefined);
    res.json(teachers);
  } catch (error) {
    console.error('Error in getTeachers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSchedules,
  getWeeklySchedule,
  printSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getDepartments,
  getClasses,
  getTeachers
};