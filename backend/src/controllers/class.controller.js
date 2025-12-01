const classService = require('../services/class.service');

class ClassController {
    async getAll(req, res, next) {
        try {
            const classes = await classService.getAllClasses();
            return res.status(200).json({ success: true, data: classes });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async create(req, res, next) {
        try {
            const result = await classService.createClassWithMembers(req.body);
            return res.status(201).json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ClassController();


