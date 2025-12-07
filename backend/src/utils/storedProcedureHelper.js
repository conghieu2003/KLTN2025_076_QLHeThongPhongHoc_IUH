const prisma = require('../config/db.config');

// helper class để gọi stored procedures từ Prisma
class StoredProcedureHelper {
// gửi stored procedure với OUTPUT parameters
  static async executeWithOutputs(procedureName, inputs = {}, outputs = {}) {
    try {
      const declareOutputs = Object.keys(outputs)
        .map(key => `DECLARE @${key} ${outputs[key]};`)
        .join('\n');

      const inputParams = Object.keys(inputs)
        .map(key => {
          const value = inputs[key];
          if (value === null || value === undefined) {
            return `@${key} = NULL`;
          }
          return `@${key} = ${this.formatValue(value)}`;
        })
        .join(', ');

      const outputParams = Object.keys(outputs)
        .map(key => `@${key} OUTPUT`)
        .join(', ');

      const allParams = [];
      if (inputParams) allParams.push(inputParams);
      if (outputParams) allParams.push(outputParams);

      const selectOutputs = Object.keys(outputs)
        .map(key => `@${key} AS ${key}`)
        .join(', ');

      const sql = `
        ${declareOutputs}
        EXEC ${procedureName}
          ${allParams.join(', ')};
        SELECT ${selectOutputs};
      `;

      const result = await prisma.$queryRawUnsafe(sql);
      return result[0] || {};
    } catch (error) {
      console.error(`[StoredProcedureHelper] Error executing ${procedureName}:`, error);
      throw error;
    }
  }

// gửi stored procedure trả về result set
  static async executeQuery(procedureName, inputs = {}) {
    try {
      const inputParams = Object.keys(inputs)
        .map(key => `@${key} = ${this.formatValue(inputs[key])}`)
        .join(', ');

      const sql = `EXEC ${procedureName} ${inputParams};`;

      const result = await prisma.$queryRawUnsafe(sql);
      return result || [];
    } catch (error) {
      console.error(`[StoredProcedureHelper] Error executing ${procedureName}:`, error);
      throw error;
    }
  }

// format giá trị cho SQL
  static formatValue(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      const escaped = value.replace(/'/g, "''");
      return `N'${escaped}'`;
    }
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `'${year}-${month}-${day}'`;
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    return value;
  }

// gán phòng cho lịch học
  static async assignRoomToSchedule(scheduleId, roomId, assignedBy) {
    const outputs = {
      success: 'BIT',
      errorMessage: 'NVARCHAR(500)',
      updatedScheduleId: 'INT'
    };

    const inputs = {
      scheduleId: scheduleId,
      roomId: roomId,
      assignedBy: assignedBy
    };

    const result = await this.executeWithOutputs('sp_AssignRoomToSchedule', inputs, outputs);

    return {
      success: result.success === 1 || result.success === true,
      errorMessage: result.errorMessage,
      scheduleId: result.updatedScheduleId
    };
  }

// lấy phòng khả dụng cho lịch học
  static async getAvailableRoomsForSchedule(scheduleId, specificDate = null) {
    const inputs = {
      scheduleId: scheduleId
    };

    if (specificDate) {
      inputs.specificDate = specificDate;
    }

    return await this.executeQuery('sp_GetAvailableRoomsForSchedule', inputs);
  }

// lấy lịch học theo time slot và ngày
  static async getSchedulesByTimeSlotAndDate(timeSlotId, dayOfWeek, specificDate = null) {
    const inputs = {
      timeSlotId: timeSlotId,
      dayOfWeek: dayOfWeek
    };

    if (specificDate) {
      inputs.specificDate = specificDate;
    }

    return await this.executeQuery('sp_GetSchedulesByTimeSlotAndDate', inputs);
  }

// validate exception change
  static async validateExceptionChange(data) {
    const outputs = {
      isValid: 'BIT',
      errorMessage: 'NVARCHAR(500)'
    };

    const inputs = {
      classScheduleId: data.classScheduleId || null,
      classId: data.classId || null,
      exceptionDate: data.exceptionDate,
      requestTypeId: data.requestTypeId,
      teacherId: data.teacherId || null,
      newTimeSlotId: data.newTimeSlotId || null,
      newClassRoomId: data.newClassRoomId || null,
      movedToDate: data.movedToDate || null,
      movedToTimeSlotId: data.movedToTimeSlotId || null,
      movedToClassRoomId: data.movedToClassRoomId || null,
      substituteTeacherId: data.substituteTeacherId || null,
      excludeScheduleRequestId: data.excludeScheduleRequestId || null,
      excludeClassScheduleId: data.excludeClassScheduleId || null
    };

    const result = await this.executeWithOutputs('sp_ValidateExceptionChange', inputs, outputs);

    return {
      isValid: result.isValid === 1 || result.isValid === true,
      errorMessage: result.errorMessage
    };
  }

// tạo hoặc cập nhật ngoại lệ
  static async createOrUpdateException(data) {
    const outputs = {
      success: 'BIT',
      errorMessage: 'NVARCHAR(500)',
      createdExceptionId: 'INT'
    };

    const inputs = {
      exceptionId: data.exceptionId || null,
      classScheduleId: data.classScheduleId || null,
      classId: data.classId || null,
      exceptionDate: data.exceptionDate,
      requestTypeId: data.requestTypeId,
      teacherId: data.teacherId || null,
      newTimeSlotId: data.newTimeSlotId || null,
      newClassRoomId: data.newClassRoomId || null,
      movedToDate: data.movedToDate || null,
      movedToTimeSlotId: data.movedToTimeSlotId || null,
      movedToClassRoomId: data.movedToClassRoomId || null,
      substituteTeacherId: data.substituteTeacherId || null,
      reason: data.reason,
      note: data.note || null,
      requesterId: data.requesterId,
      approvedBy: data.approvedBy || null,
      requestStatusId: data.requestStatusId || 2
    };

    const result = await this.executeWithOutputs('sp_CreateOrUpdateException', inputs, outputs);

    return {
      success: result.success === 1 || result.success === true,
      errorMessage: result.errorMessage,
      exceptionId: result.createdExceptionId
    };
  }

// kiểm tra conflict phòng học
  static async checkRoomConflict(classRoomId, targetDate, targetTimeSlotId, excludeScheduleRequestId = null, excludeClassScheduleId = null) {
    const outputs = {
      hasConflict: 'BIT',
      conflictType: 'NVARCHAR(50)',
      conflictId: 'INT',
      conflictMessage: 'NVARCHAR(500)'
    };

    const inputs = {
      classRoomId: classRoomId,
      targetDate: targetDate,
      targetTimeSlotId: targetTimeSlotId,
      excludeScheduleRequestId: excludeScheduleRequestId,
      excludeClassScheduleId: excludeClassScheduleId
    };

    const result = await this.executeWithOutputs('sp_CheckRoomConflict', inputs, outputs);

    return {
      hasConflict: result.hasConflict === 1 || result.hasConflict === true,
      conflictType: result.conflictType,
      conflictId: result.conflictId,
      conflictMessage: result.conflictMessage
    };
  }

// kiểm tra conflict giảng viên
  static async checkTeacherConflict(teacherId, targetDate, targetTimeSlotId, excludeScheduleRequestId = null, excludeClassScheduleId = null) {
    const outputs = {
      hasConflict: 'BIT',
      conflictType: 'NVARCHAR(50)',
      conflictId: 'INT',
      conflictMessage: 'NVARCHAR(500)'
    };

    const inputs = {
      teacherId: teacherId,
      targetDate: targetDate,
      targetTimeSlotId: targetTimeSlotId,
      excludeScheduleRequestId: excludeScheduleRequestId,
      excludeClassScheduleId: excludeClassScheduleId
    };

    const result = await this.executeWithOutputs('sp_CheckTeacherConflict', inputs, outputs);

    return {
      hasConflict: result.hasConflict === 1 || result.hasConflict === true,
      conflictType: result.conflictType,
      conflictId: result.conflictId,
      conflictMessage: result.conflictMessage
    };
  }

// lấy conflicts cho schedule
  static async getConflictsForSchedule(targetDate, targetTimeSlotId, classRoomId = null, teacherId = null) {
    const inputs = {
      targetDate: targetDate,
      targetTimeSlotId: targetTimeSlotId
    };

    if (classRoomId) inputs.classRoomId = classRoomId;
    if (teacherId) inputs.teacherId = teacherId;

    return await this.executeQuery('sp_GetConflictsForSchedule', inputs);
  }
}

module.exports = StoredProcedureHelper;

