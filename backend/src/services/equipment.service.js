const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

class EquipmentService {
  // Lấy danh sách thiết bị
  async getAllEquipment() {
    try {
      const equipment = await prisma.$queryRaw`
        SELECT 
          id,
          code,
          name,
          category,
          description,
          isRequired,
          createdAt,
          updatedAt
        FROM Equipment
        ORDER BY category, name
      `;
      
      return equipment.map(eq => ({
        id: eq.id.toString(),
        code: eq.code,
        name: eq.name,
        category: eq.category,
        description: eq.description,
        isRequired: eq.isRequired,
        createdAt: eq.createdAt,
        updatedAt: eq.updatedAt
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách thiết bị: ${error.message}`);
    }
  }

  // Lấy thiết bị theo ID
  async getEquipmentById(equipmentId) {
    try {
      const equipment = await prisma.$queryRaw`
        SELECT 
          id,
          code,
          name,
          category,
          description,
          isRequired,
          createdAt,
          updatedAt
        FROM Equipment
        WHERE id = ${parseInt(equipmentId)}
      `;
      
      if (!equipment || equipment.length === 0) {
        throw new Error('Không tìm thấy thiết bị');
      }
      
      const eq = equipment[0];
      return {
        id: eq.id.toString(),
        code: eq.code,
        name: eq.name,
        category: eq.category,
        description: eq.description,
        isRequired: eq.isRequired,
        createdAt: eq.createdAt,
        updatedAt: eq.updatedAt
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thông tin thiết bị: ${error.message}`);
    }
  }

  // Tạo thiết bị mới
  async createEquipment(equipmentData) {
    try {
      const result = await prisma.$executeRaw`
        INSERT INTO Equipment (code, name, category, description, isRequired, createdAt, updatedAt)
        VALUES (
          ${equipmentData.code},
          ${equipmentData.name},
          ${equipmentData.category},
          ${equipmentData.description || null},
          ${equipmentData.isRequired ? 1 : 0},
          GETDATE(),
          GETDATE()
        )
      `;
      
      const newEquipment = await prisma.$queryRaw`
        SELECT TOP 1 
          id,
          code,
          name,
          category,
          description,
          isRequired,
          createdAt,
          updatedAt
        FROM Equipment
        WHERE code = ${equipmentData.code}
        ORDER BY id DESC
      `;
      
      const eq = newEquipment[0];
      return {
        id: eq.id.toString(),
        code: eq.code,
        name: eq.name,
        category: eq.category,
        description: eq.description,
        isRequired: eq.isRequired,
        createdAt: eq.createdAt,
        updatedAt: eq.updatedAt
      };
    } catch (error) {
      if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
        throw new Error('Mã thiết bị đã tồn tại');
      }
      throw new Error(`Lỗi tạo thiết bị: ${error.message}`);
    }
  }

  // Cập nhật thiết bị
  async updateEquipment(equipmentId, equipmentData) {
    try {
      await prisma.$executeRaw`
        UPDATE Equipment
        SET 
          code = ${equipmentData.code},
          name = ${equipmentData.name},
          category = ${equipmentData.category},
          description = ${equipmentData.description || null},
          isRequired = ${equipmentData.isRequired ? 1 : 0},
          updatedAt = GETDATE()
        WHERE id = ${parseInt(equipmentId)}
      `;
      
      return await this.getEquipmentById(equipmentId);
    } catch (error) {
      if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
        throw new Error('Mã thiết bị đã tồn tại');
      }
      throw new Error(`Lỗi cập nhật thiết bị: ${error.message}`);
    }
  }

  // Xóa thiết bị
  async deleteEquipment(equipmentId) {
    try {
      // Kiểm tra thiết bị có đang được sử dụng không
      const inUse = await prisma.$queryRaw`
        SELECT TOP 1 id
        FROM ClassRoomEquipment
        WHERE equipmentId = ${parseInt(equipmentId)}
      `;
      
      if (inUse && inUse.length > 0) {
        throw new Error('Không thể xóa thiết bị đang được sử dụng trong phòng học');
      }
      
      await prisma.$executeRaw`
        DELETE FROM Equipment
        WHERE id = ${parseInt(equipmentId)}
      `;
      
      return { message: 'Xóa thiết bị thành công' };
    } catch (error) {
      throw new Error(`Lỗi xóa thiết bị: ${error.message}`);
    }
  }

  // Lấy thiết bị của phòng học
  async getRoomEquipment(roomId) {
    try {
      const equipment = await prisma.$queryRaw`
        SELECT 
          cre.id,
          cre.classRoomId,
          cre.equipmentId,
          cre.quantity,
          cre.isWorking,
          cre.lastMaintenanceDate,
          cre.nextMaintenanceDate,
          cre.note,
          e.code AS equipmentCode,
          e.name AS equipmentName,
          e.category AS equipmentCategory,
          e.description AS equipmentDescription
        FROM ClassRoomEquipment cre
        INNER JOIN Equipment e ON cre.equipmentId = e.id
        WHERE cre.classRoomId = ${parseInt(roomId)}
        ORDER BY e.category, e.name
      `;
      
      return equipment.map(eq => ({
        id: eq.id.toString(),
        classRoomId: eq.classRoomId.toString(),
        equipmentId: eq.equipmentId.toString(),
        quantity: eq.quantity,
        isWorking: eq.isWorking,
        lastMaintenanceDate: eq.lastMaintenanceDate,
        nextMaintenanceDate: eq.nextMaintenanceDate,
        note: eq.note,
        equipment: {
          id: eq.equipmentId.toString(),
          code: eq.equipmentCode,
          name: eq.equipmentName,
          category: eq.equipmentCategory,
          description: eq.equipmentDescription
        }
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy thiết bị phòng học: ${error.message}`);
    }
  }

  // Thêm thiết bị vào phòng học
  async addRoomEquipment(roomId, equipmentData) {
    try {
      // Convert date strings to Date objects and format for SQL Server DATE type
      const formatDateForSQL = (dateValue) => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        // Return YYYY-MM-DD format string for SQL Server DATE type
        return date.toISOString().split('T')[0];
      };

      const lastMaintenanceDateStr = formatDateForSQL(equipmentData.lastMaintenanceDate);
      const nextMaintenanceDateStr = formatDateForSQL(equipmentData.nextMaintenanceDate);

      // Build safe SQL with proper date casting
      const lastMaintenanceDateSQL = lastMaintenanceDateStr 
        ? `CAST('${lastMaintenanceDateStr}' AS DATE)` 
        : 'NULL';
      const nextMaintenanceDateSQL = nextMaintenanceDateStr 
        ? `CAST('${nextMaintenanceDateStr}' AS DATE)` 
        : 'NULL';
      
      // Escape single quotes in note to prevent SQL injection
      const noteSQL = equipmentData.note 
        ? `N'${String(equipmentData.note).replace(/'/g, "''")}'` 
        : 'NULL';

      await prisma.$executeRawUnsafe(`
        INSERT INTO ClassRoomEquipment (
          classRoomId, 
          equipmentId, 
          quantity, 
          isWorking, 
          lastMaintenanceDate, 
          nextMaintenanceDate, 
          note,
          createdAt,
          updatedAt
        )
        VALUES (
          ${parseInt(roomId)},
          ${parseInt(equipmentData.equipmentId)},
          ${parseInt(equipmentData.quantity) || 1},
          ${equipmentData.isWorking !== false ? 1 : 0},
          ${lastMaintenanceDateSQL},
          ${nextMaintenanceDateSQL},
          ${noteSQL},
          GETDATE(),
          GETDATE()
        )
      `);
      
      const newRoomEquipment = await prisma.$queryRaw`
        SELECT TOP 1 
          cre.id,
          cre.classRoomId,
          cre.equipmentId,
          cre.quantity,
          cre.isWorking,
          cre.lastMaintenanceDate,
          cre.nextMaintenanceDate,
          cre.note,
          e.code AS equipmentCode,
          e.name AS equipmentName,
          e.category AS equipmentCategory
        FROM ClassRoomEquipment cre
        INNER JOIN Equipment e ON cre.equipmentId = e.id
        WHERE cre.classRoomId = ${parseInt(roomId)}
          AND cre.equipmentId = ${parseInt(equipmentData.equipmentId)}
        ORDER BY cre.id DESC
      `;
      
      const eq = newRoomEquipment[0];
      return {
        id: eq.id.toString(),
        classRoomId: eq.classRoomId.toString(),
        equipmentId: eq.equipmentId.toString(),
        quantity: eq.quantity,
        isWorking: eq.isWorking,
        lastMaintenanceDate: eq.lastMaintenanceDate,
        nextMaintenanceDate: eq.nextMaintenanceDate,
        note: eq.note,
        equipment: {
          id: eq.equipmentId.toString(),
          code: eq.equipmentCode,
          name: eq.equipmentName,
          category: eq.equipmentCategory
        }
      };
    } catch (error) {
      if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
        throw new Error('Thiết bị này đã được thêm vào phòng học');
      }
      throw new Error(`Lỗi thêm thiết bị vào phòng học: ${error.message}`);
    }
  }

  // Cập nhật thiết bị phòng học
  async updateRoomEquipment(roomEquipmentId, equipmentData) {
    try {
      // Convert date strings to Date objects and format for SQL Server DATE type
      const formatDateForSQL = (dateValue) => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        // Return YYYY-MM-DD format string for SQL Server DATE type
        return date.toISOString().split('T')[0];
      };

      const lastMaintenanceDateStr = formatDateForSQL(equipmentData.lastMaintenanceDate);
      const nextMaintenanceDateStr = formatDateForSQL(equipmentData.nextMaintenanceDate);

      // Build safe SQL with proper date casting
      const lastMaintenanceDateSQL = lastMaintenanceDateStr 
        ? `CAST('${lastMaintenanceDateStr}' AS DATE)` 
        : 'NULL';
      const nextMaintenanceDateSQL = nextMaintenanceDateStr 
        ? `CAST('${nextMaintenanceDateStr}' AS DATE)` 
        : 'NULL';
      
      // Escape single quotes in note to prevent SQL injection
      const noteSQL = equipmentData.note 
        ? `N'${String(equipmentData.note).replace(/'/g, "''")}'` 
        : 'NULL';

      await prisma.$executeRawUnsafe(`
        UPDATE ClassRoomEquipment
        SET 
          quantity = ${parseInt(equipmentData.quantity) || 1},
          isWorking = ${equipmentData.isWorking !== false ? 1 : 0},
          lastMaintenanceDate = ${lastMaintenanceDateSQL},
          nextMaintenanceDate = ${nextMaintenanceDateSQL},
          note = ${noteSQL},
          updatedAt = GETDATE()
        WHERE id = ${parseInt(roomEquipmentId)}
      `);
      
      const updated = await prisma.$queryRaw`
        SELECT 
          cre.id,
          cre.classRoomId,
          cre.equipmentId,
          cre.quantity,
          cre.isWorking,
          cre.lastMaintenanceDate,
          cre.nextMaintenanceDate,
          cre.note,
          e.code AS equipmentCode,
          e.name AS equipmentName,
          e.category AS equipmentCategory
        FROM ClassRoomEquipment cre
        INNER JOIN Equipment e ON cre.equipmentId = e.id
        WHERE cre.id = ${parseInt(roomEquipmentId)}
      `;
      
      const eq = updated[0];
      return {
        id: eq.id.toString(),
        classRoomId: eq.classRoomId.toString(),
        equipmentId: eq.equipmentId.toString(),
        quantity: eq.quantity,
        isWorking: eq.isWorking,
        lastMaintenanceDate: eq.lastMaintenanceDate,
        nextMaintenanceDate: eq.nextMaintenanceDate,
        note: eq.note,
        equipment: {
          id: eq.equipmentId.toString(),
          code: eq.equipmentCode,
          name: eq.equipmentName,
          category: eq.equipmentCategory
        }
      };
    } catch (error) {
      throw new Error(`Lỗi cập nhật thiết bị phòng học: ${error.message}`);
    }
  }

  // Xóa thiết bị khỏi phòng học
  async removeRoomEquipment(roomEquipmentId) {
    try {
      await prisma.$executeRaw`
        DELETE FROM ClassRoomEquipment
        WHERE id = ${parseInt(roomEquipmentId)}
      `;
      
      return { message: 'Xóa thiết bị khỏi phòng học thành công' };
    } catch (error) {
      throw new Error(`Lỗi xóa thiết bị khỏi phòng học: ${error.message}`);
    }
  }
}

module.exports = new EquipmentService();

