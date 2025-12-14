const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const SocketClient = require('../utils/socketClient');

class RoomIssueService {
  // Lấy danh sách vấn đề phòng học
  async getAllRoomIssues(filters = {}) {
    try {
      let whereClause = '1=1';
      const params = [];
      
      if (filters.classRoomId) {
        whereClause += ` AND ri.classRoomId = @p${params.length + 1}`;
        params.push(parseInt(filters.classRoomId));
      }
      
      if (filters.status) {
        whereClause += ` AND ri.status = @p${params.length + 1}`;
        params.push(filters.status);
      }
      
      if (filters.severity) {
        whereClause += ` AND ri.severity = @p${params.length + 1}`;
        params.push(filters.severity);
      }
      
      if (filters.issueType) {
        whereClause += ` AND ri.issueType = @p${params.length + 1}`;
        params.push(filters.issueType);
      }
      
      const issues = await prisma.$queryRawUnsafe(`
        SELECT 
          ri.id,
          ri.classRoomId,
          ri.reportedBy,
          ri.issueType,
          ri.title,
          ri.description,
          ri.severity,
          ri.startDate,
          ri.endDate,
          ri.status,
          ri.affectedEquipmentId,
          ri.autoCreateException,
          ri.exceptionCreated,
          ri.resolvedBy,
          ri.resolvedAt,
          ri.resolutionNote,
          ri.assignedTo,
          ri.assignedAt,
          ri.createdAt,
          ri.updatedAt,
          cr.code AS roomCode,
          cr.name AS roomName,
          u.fullName AS reporterName,
          u.email AS reporterEmail,
          ru.fullName AS resolverName,
          au.fullName AS assigneeName,
          e.name AS equipmentName,
          e.code AS equipmentCode
        FROM RoomIssue ri
        INNER JOIN ClassRoom cr ON ri.classRoomId = cr.id
        INNER JOIN [User] u ON ri.reportedBy = u.id
        LEFT JOIN [User] ru ON ri.resolvedBy = ru.id
        LEFT JOIN [User] au ON ri.assignedTo = au.id
        LEFT JOIN Equipment e ON ri.affectedEquipmentId = e.id
        WHERE ${whereClause}
        ORDER BY ri.createdAt DESC
      `, ...params);
      
      return issues.map(issue => ({
        id: issue.id.toString(),
        classRoomId: issue.classRoomId.toString(),
        reportedBy: issue.reportedBy.toString(),
        issueType: issue.issueType,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        startDate: issue.startDate,
        endDate: issue.endDate,
        status: issue.status,
        affectedEquipmentId: issue.affectedEquipmentId ? issue.affectedEquipmentId.toString() : null,
        autoCreateException: issue.autoCreateException,
        exceptionCreated: issue.exceptionCreated,
        resolvedBy: issue.resolvedBy ? issue.resolvedBy.toString() : null,
        resolvedAt: issue.resolvedAt,
        resolutionNote: issue.resolutionNote,
        assignedTo: issue.assignedTo ? issue.assignedTo.toString() : null,
        assignedAt: issue.assignedAt,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        room: {
          id: issue.classRoomId.toString(),
          code: issue.roomCode,
          name: issue.roomName
        },
        reporter: {
          id: issue.reportedBy.toString(),
          fullName: issue.reporterName,
          email: issue.reporterEmail
        },
        resolver: issue.resolverName ? {
          id: issue.resolvedBy.toString(),
          fullName: issue.resolverName
        } : null,
        assignee: issue.assigneeName ? {
          id: issue.assignedTo.toString(),
          fullName: issue.assigneeName
        } : null,
        equipment: issue.equipmentName ? {
          id: issue.affectedEquipmentId.toString(),
          code: issue.equipmentCode,
          name: issue.equipmentName
        } : null
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách vấn đề phòng học: ${error.message}`);
    }
  }

  // Lấy vấn đề theo ID
  async getRoomIssueById(issueId) {
    try {
      const issues = await prisma.$queryRaw`
        SELECT 
          ri.id,
          ri.classRoomId,
          ri.reportedBy,
          ri.issueType,
          ri.title,
          ri.description,
          ri.severity,
          ri.startDate,
          ri.endDate,
          ri.status,
          ri.affectedEquipmentId,
          ri.autoCreateException,
          ri.exceptionCreated,
          ri.resolvedBy,
          ri.resolvedAt,
          ri.resolutionNote,
          ri.assignedTo,
          ri.assignedAt,
          ri.createdAt,
          ri.updatedAt,
          cr.code AS roomCode,
          cr.name AS roomName,
          u.fullName AS reporterName,
          u.email AS reporterEmail,
          ru.fullName AS resolverName,
          au.fullName AS assigneeName,
          e.name AS equipmentName,
          e.code AS equipmentCode
        FROM RoomIssue ri
        INNER JOIN ClassRoom cr ON ri.classRoomId = cr.id
        INNER JOIN [User] u ON ri.reportedBy = u.id
        LEFT JOIN [User] ru ON ri.resolvedBy = ru.id
        LEFT JOIN [User] au ON ri.assignedTo = au.id
        LEFT JOIN Equipment e ON ri.affectedEquipmentId = e.id
        WHERE ri.id = ${parseInt(issueId)}
      `;
      
      if (!issues || issues.length === 0) {
        throw new Error('Không tìm thấy vấn đề phòng học');
      }
      
      const issue = issues[0];
      return {
        id: issue.id.toString(),
        classRoomId: issue.classRoomId.toString(),
        reportedBy: issue.reportedBy.toString(),
        issueType: issue.issueType,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        startDate: issue.startDate,
        endDate: issue.endDate,
        status: issue.status,
        affectedEquipmentId: issue.affectedEquipmentId ? issue.affectedEquipmentId.toString() : null,
        autoCreateException: issue.autoCreateException,
        exceptionCreated: issue.exceptionCreated,
        resolvedBy: issue.resolvedBy ? issue.resolvedBy.toString() : null,
        resolvedAt: issue.resolvedAt,
        resolutionNote: issue.resolutionNote,
        assignedTo: issue.assignedTo ? issue.assignedTo.toString() : null,
        assignedAt: issue.assignedAt,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        room: {
          id: issue.classRoomId.toString(),
          code: issue.roomCode,
          name: issue.roomName
        },
        reporter: {
          id: issue.reportedBy.toString(),
          fullName: issue.reporterName,
          email: issue.reporterEmail
        },
        resolver: issue.resolverName ? {
          id: issue.resolvedBy.toString(),
          fullName: issue.resolverName
        } : null,
        assignee: issue.assigneeName ? {
          id: issue.assignedTo.toString(),
          fullName: issue.assigneeName
        } : null,
        equipment: issue.equipmentName ? {
          id: issue.affectedEquipmentId.toString(),
          code: issue.equipmentCode,
          name: issue.equipmentName
        } : null
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thông tin vấn đề phòng học: ${error.message}`);
    }
  }

  // Tạo vấn đề mới
  async createRoomIssue(issueData) {
    try {
      // Chuyển đổi date string thành Date object để tránh lỗi type mismatch
      const startDate = issueData.startDate ? new Date(issueData.startDate) : new Date();
      const endDate = issueData.endDate ? new Date(issueData.endDate) : null;
      
      const result = await prisma.$executeRaw`
        INSERT INTO RoomIssue (
          classRoomId,
          reportedBy,
          issueType,
          title,
          description,
          severity,
          startDate,
          endDate,
          affectedEquipmentId,
          autoCreateException,
          status,
          createdAt,
          updatedAt
        )
        VALUES (
          ${parseInt(issueData.classRoomId)},
          ${parseInt(issueData.reportedBy)},
          ${issueData.issueType},
          ${issueData.title},
          ${issueData.description},
          ${issueData.severity || 'medium'},
          ${startDate},
          ${endDate},
          ${issueData.affectedEquipmentId ? parseInt(issueData.affectedEquipmentId) : null},
          ${issueData.autoCreateException ? 1 : 0},
          'open',
          GETDATE(),
          GETDATE()
        )
      `;
      
      // Lấy vấn đề vừa tạo
      const newIssues = await prisma.$queryRaw`
        SELECT TOP 1 
          id,
          classRoomId,
          reportedBy,
          issueType,
          title,
          description,
          severity,
          startDate,
          endDate,
          status,
          affectedEquipmentId,
          autoCreateException,
          exceptionCreated,
          resolvedBy,
          resolvedAt,
          resolutionNote,
          createdAt,
          updatedAt
        FROM RoomIssue
        WHERE classRoomId = ${parseInt(issueData.classRoomId)}
          AND reportedBy = ${parseInt(issueData.reportedBy)}
        ORDER BY id DESC
      `;
      
      if (newIssues && newIssues.length > 0) {
        const createdIssue = await this.getRoomIssueById(newIssues[0].id);
        
        // Lấy danh sách users có role admin và maintenance để gửi thông báo
        try {
          const adminUsers = await prisma.user.findMany({
            where: {
              account: {
                role: 'admin'
              }
            },
            select: {
              id: true
            }
          });

          const maintenanceUsers = await prisma.user.findMany({
            where: {
              account: {
                role: 'maintenance'
              }
            },
            select: {
              id: true
            }
          });

          const userIds = [
            ...adminUsers.map(u => u.id),
            ...maintenanceUsers.map(u => u.id)
          ].filter(id => id !== parseInt(issueData.reportedBy)); // Loại bỏ người báo cáo

          // Gửi socket event
          await SocketClient.emitRoomIssueCreated({
            issue: createdIssue,
            userIds: userIds.length > 0 ? userIds : undefined
          });
        } catch (socketError) {
          console.error('[Room Issue] Lỗi khi emit socket event:', socketError);
        }
        
        return createdIssue;
      }
      
      throw new Error('Không thể tạo vấn đề phòng học');
    } catch (error) {
      throw new Error(`Lỗi tạo vấn đề phòng học: ${error.message}`);
    }
  }

  // Cập nhật vấn đề
  async updateRoomIssue(issueId, issueData) {
    try {
      const updateFields = [];
      const params = [];
      
      if (issueData.title !== undefined) {
        updateFields.push(`title = @p${params.length + 1}`);
        params.push(issueData.title);
      }
      
      if (issueData.description !== undefined) {
        updateFields.push(`description = @p${params.length + 1}`);
        params.push(issueData.description);
      }
      
      if (issueData.severity !== undefined) {
        updateFields.push(`severity = @p${params.length + 1}`);
        params.push(issueData.severity);
      }
      
      if (issueData.status !== undefined) {
        updateFields.push(`status = @p${params.length + 1}`);
        params.push(issueData.status);
      }
      
      if (issueData.endDate !== undefined) {
        updateFields.push(`endDate = @p${params.length + 1}`);
        params.push(issueData.endDate);
      }
      
      if (issueData.resolvedBy !== undefined) {
        updateFields.push(`resolvedBy = @p${params.length + 1}`);
        params.push(issueData.resolvedBy ? parseInt(issueData.resolvedBy) : null);
        if (issueData.resolvedBy) {
          updateFields.push(`resolvedAt = GETDATE()`);
        }
      }
      
      if (issueData.resolutionNote !== undefined) {
        updateFields.push(`resolutionNote = @p${params.length + 1}`);
        params.push(issueData.resolutionNote);
      }
      
      if (issueData.assignedTo !== undefined) {
        updateFields.push(`assignedTo = @p${params.length + 1}`);
        params.push(issueData.assignedTo ? parseInt(issueData.assignedTo) : null);
        if (issueData.assignedTo) {
          updateFields.push(`assignedAt = GETDATE()`);
          // Nếu đang assign và status chưa được chỉ định rõ ràng, tự động chuyển status sang in_progress nếu đang là open
          if (issueData.status === undefined) {
            updateFields.push(`status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END`);
          }
        }
      }
      
      if (updateFields.length === 0) {
        return await this.getRoomIssueById(issueId);
      }
      
      updateFields.push(`updatedAt = GETDATE()`);
      params.push(parseInt(issueId));
      
      await prisma.$executeRawUnsafe(`
        UPDATE RoomIssue
        SET ${updateFields.join(', ')}
        WHERE id = @p${params.length}
      `, ...params);
      
      const updatedIssue = await this.getRoomIssueById(issueId);
      
      // Lấy danh sách users có role admin và maintenance để gửi thông báo
      try {
        const adminUsers = await prisma.user.findMany({
          where: {
            account: {
              role: 'admin'
            }
          },
          select: {
            id: true
          }
        });

        const maintenanceUsers = await prisma.user.findMany({
          where: {
            account: {
              role: 'maintenance'
            }
          },
          select: {
            id: true
          }
        });

        const userIds = [
          ...adminUsers.map(u => u.id),
          ...maintenanceUsers.map(u => u.id)
        ];

        // Thêm người báo cáo, người xử lý và người được phân công vào danh sách
        if (updatedIssue.reportedBy && !userIds.includes(parseInt(updatedIssue.reportedBy))) {
          userIds.push(parseInt(updatedIssue.reportedBy));
        }
        if (updatedIssue.resolvedBy && !userIds.includes(parseInt(updatedIssue.resolvedBy))) {
          userIds.push(parseInt(updatedIssue.resolvedBy));
        }
        if (updatedIssue.assignedTo && !userIds.includes(parseInt(updatedIssue.assignedTo))) {
          userIds.push(parseInt(updatedIssue.assignedTo));
        }

        // Gửi socket event
        await SocketClient.emitRoomIssueUpdated({
          issue: updatedIssue,
          userIds: userIds.length > 0 ? userIds : undefined
        });
      } catch (socketError) {
        console.error('[Room Issue] Lỗi khi emit socket event:', socketError);
      }
      
      return updatedIssue;
    } catch (error) {
      throw new Error(`Lỗi cập nhật vấn đề phòng học: ${error.message}`);
    }
  }

  // Nhận/Phân công vấn đề (chuyển từ open sang in_progress)
  async acceptRoomIssue(issueId, assignedBy) {
    try {
      // Kiểm tra vấn đề có tồn tại và đang ở trạng thái 'open' không
      const currentIssue = await this.getRoomIssueById(issueId);
      
      if (currentIssue.status !== 'open') {
        throw new Error(`Vấn đề này đã được xử lý hoặc đã được phân công. Trạng thái hiện tại: ${currentIssue.status}`);
      }
      
      // Cập nhật trạng thái sang 'in_progress'
      const updatedIssue = await this.updateRoomIssue(issueId, {
        status: 'in_progress'
      });
      
      return updatedIssue;
    } catch (error) {
      throw new Error(`Lỗi nhận/phân công vấn đề phòng học: ${error.message}`);
    }
  }

  // Phân công vấn đề cho maintenance cụ thể (admin only)
  async assignRoomIssue(issueId, maintenanceUserId, assignedBy) {
    try {
      // Kiểm tra vấn đề có tồn tại
      const currentIssue = await this.getRoomIssueById(issueId);
      
      // Kiểm tra user có phải maintenance không
      const maintenanceUser = await prisma.user.findFirst({
        where: {
          id: parseInt(maintenanceUserId),
          account: {
            role: 'maintenance'
          }
        }
      });
      
      if (!maintenanceUser) {
        throw new Error('Người dùng được chọn không phải là maintenance');
      }
      
      // Cập nhật assignedTo và status
      const updatedIssue = await this.updateRoomIssue(issueId, {
        assignedTo: maintenanceUserId,
        status: currentIssue.status === 'open' ? 'in_progress' : currentIssue.status
      });
      
      return updatedIssue;
    } catch (error) {
      throw new Error(`Lỗi phân công vấn đề phòng học: ${error.message}`);
    }
  }

  // Lấy danh sách maintenance users
  async getMaintenanceUsers() {
    try {
      const maintenanceUsers = await prisma.user.findMany({
        where: {
          account: {
            role: 'maintenance',
            isActive: true
          }
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          Maintenance: {
            select: {
              maintenanceCode: true,
              specialization: true
            }
          }
        },
        orderBy: {
          fullName: 'asc'
        }
      });
      
      return maintenanceUsers.map(user => ({
        id: user.id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        maintenanceCode: user.Maintenance?.maintenanceCode || '',
        specialization: user.Maintenance?.specialization || ''
      }));
    } catch (error) {
      throw new Error(`Lỗi lấy danh sách maintenance: ${error.message}`);
    }
  }

  // Xóa vấn đề
  async deleteRoomIssue(issueId) {
    try {
      await prisma.$executeRaw`
        DELETE FROM RoomIssue
        WHERE id = ${parseInt(issueId)}
      `;
      
      return { message: 'Xóa vấn đề phòng học thành công' };
    } catch (error) {
      throw new Error(`Lỗi xóa vấn đề phòng học: ${error.message}`);
    }
  }
}

module.exports = new RoomIssueService();

