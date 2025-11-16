-- =====================================================
-- SAMPLE DATA - CLASSROOM MANAGEMENT SYSTEM
-- Đại học Công nghiệp TP. Hồ Chí Minh (IUH)
-- =====================================================

USE ClassroomManagement;
GO

-- =====================================================
-- 1. DỮ LIỆU TRẠNG THÁI HỌC VẤN
-- =====================================================
INSERT INTO AcademicStatus (name) VALUES
(N'Đang học'),
(N'Đã tốt nghiệp'),
(N'Bỏ học');

-- =====================================================
-- 2. DỮ LIỆU LOẠI PHÒNG/LỚP
-- =====================================================
INSERT INTO ClassRoomType (name) VALUES
(N'Lý thuyết'),
(N'Thực hành'),
(N'Online');

-- =====================================================
-- 3. DỮ LIỆU LOẠI YÊU CẦU (và trạng thái lịch học)
-- =====================================================
INSERT INTO RequestType (name) VALUES
-- Trạng thái lịch học
(N'Chờ phân phòng'),  -- pending
(N'Đã phân phòng'),    -- assigned  
(N'Đang hoạt động'),   -- active
(N'Đã hủy'),          -- cancelled
(N'Tạm ngưng'),       -- paused
(N'Thi'),             -- exam
-- Loại yêu cầu thay đổi
(N'Đổi phòng'),
(N'Đổi lịch'),
(N'Đổi giáo viên');

-- =====================================================
-- 4. DỮ LIỆU TRẠNG THÁI YÊU CẦU
-- =====================================================
INSERT INTO RequestStatus (name) VALUES
(N'Chờ xử lý'),
(N'Hoàn thành'),
(N'Từ chối');

-- =====================================================
-- 5. DỮ LIỆU KHOA/PHÒNG BAN
-- =====================================================
INSERT INTO Department (code, name) VALUES
('CNTT', N'Khoa Công nghệ Thông tin'),
('CK', N'Khoa Công nghệ Cơ khí'),
('CD', N'Khoa Công nghệ Điện'),
('CDT', N'Khoa Công nghệ Điện tử'),
('QTKD', N'Khoa Quản trị Kinh doanh'),
('NN', N'Khoa Ngoại ngữ');

-- =====================================================
-- 6. DỮ LIỆU CHUYÊN NGÀNH
-- =====================================================
INSERT INTO Major (code, name, departmentId) VALUES
-- Khoa CNTT
('SE', N'Kỹ thuật Phần mềm', (SELECT TOP 1 id FROM Department WHERE code = 'CNTT')),
('AI', N'Trí tuệ nhân tạo', (SELECT TOP 1 id FROM Department WHERE code = 'CNTT')),
('NET', N'Mạng máy tính', (SELECT TOP 1 id FROM Department WHERE code = 'CNTT')),
-- Khoa Cơ khí
('CTM', N'Công nghệ Chế tạo máy', (SELECT TOP 1 id FROM Department WHERE code = 'CK')),
('CNC', N'Công nghệ CNC', (SELECT TOP 1 id FROM Department WHERE code = 'CK')),
-- Khoa Điện
('DTCN', N'Điện tử Công nghiệp', (SELECT TOP 1 id FROM Department WHERE code = 'CD')),
('TDH', N'Tự động hóa', (SELECT TOP 1 id FROM Department WHERE code = 'CD')),
-- Khoa Điện tử
('VT', N'Viễn thông', (SELECT TOP 1 id FROM Department WHERE code = 'CDT')),
('DT', N'Điện tử', (SELECT TOP 1 id FROM Department WHERE code = 'CDT')),
-- Khoa QTKD
('KT', N'Kế toán', (SELECT TOP 1 id FROM Department WHERE code = 'QTKD')),
('TC', N'Tài chính', (SELECT TOP 1 id FROM Department WHERE code = 'QTKD')),
-- Khoa Ngoại ngữ
('TA', N'Ngôn ngữ Anh', (SELECT TOP 1 id FROM Department WHERE code = 'NN'));

-- =====================================================
-- 7. DỮ LIỆU KHUNG GIỜ HỌC (theo lịch IUH)
-- =====================================================
INSERT INTO TimeSlot (slotName, startTime, endTime, shift) VALUES
-- Buổi sáng (shift = 1)
(N'Tiết 1', '06:30:00', '07:20:00', 1),
(N'Tiết 2', '07:20:00', '08:10:00', 1),
(N'Tiết 3', '08:10:00', '09:00:00', 1),
(N'Tiết 4', '09:10:00', '10:00:00', 1),
(N'Tiết 5', '10:00:00', '10:50:00', 1),
(N'Tiết 6', '10:50:00', '11:40:00', 1),
-- Buổi chiều (shift = 2)
(N'Tiết 7', '12:30:00', '13:20:00', 2),
(N'Tiết 8', '13:20:00', '14:10:00', 2),
(N'Tiết 9', '14:10:00', '15:00:00', 2),
(N'Tiết 10', '15:10:00', '16:00:00', 2),
(N'Tiết 11', '16:00:00', '16:50:00', 2),
(N'Tiết 12', '16:50:00', '17:40:00', 2),
-- Buổi tối (shift = 3)
(N'Tiết 13', '18:00:00', '18:50:00', 3),
(N'Tiết 14', '18:50:00', '19:40:00', 3),
(N'Tiết 15', '19:50:00', '20:40:00', 3),
(N'Tiết 16', '20:40:00', '21:30:00', 3),

-- Nhóm tiết học (dùng cho lịch học thường xuyên)
-- Buổi sáng (shift = 1)
(N'Tiết 1-3', '06:30:00', '09:00:00', 1),  -- Từ tiết 1 đến tiết 3 (06:30 - 09:00)
(N'Tiết 4-6', '09:10:00', '11:40:00', 1),  -- Từ tiết 4 đến tiết 6 (09:10 - 11:40)
-- Buổi chiều (shift = 2)
(N'Tiết 7-9', '12:30:00', '15:00:00', 2),  -- Từ tiết 7 đến tiết 9 (12:30 - 15:00)
(N'Tiết 10-12', '15:10:00', '17:40:00', 2), -- Từ tiết 10 đến tiết 12 (15:10 - 17:40)
-- Buổi tối (shift = 3)
(N'Tiết 13-15', '18:00:00', '20:40:00', 3); -- Từ tiết 13 đến tiết 15 (18:00 - 20:40)

-- =====================================================
-- 8. DỮ LIỆU TÀI KHOẢN ADMIN
-- =====================================================
INSERT INTO Account (username, password, role, isActive)
VALUES ('admin', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'admin', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Admin System',
    'admin@iuh.edu.vn',
    '02838940390',
    N'Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, TP.HCM',
    'https://ui-avatars.com/api/?name=Admin+System&background=0D6EFD&color=fff',
    'male',
    '1990-01-01'
);

-- =====================================================
-- 9. DỮ LIỆU GIẢNG VIÊN (5 người)
-- =====================================================
-- Giảng viên 1: CNTT
INSERT INTO Account (username, password, role, isActive)
VALUES ('gv001', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'teacher', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Nguyễn Văn Minh',
    'gv001.Minh@teacher.iuh.edu.vn',
    '0901234567',
    N'Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, TP.HCM',
    'https://ui-avatars.com/api/?name=Nguyen+Van+Minh&background=198754&color=fff',
    'male',
    '1985-03-15'
);

INSERT INTO Teacher (userId, teacherCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    'GV001',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'SE')
);

-- Giảng viên 2: CNTT
INSERT INTO Account (username, password, role, isActive)
VALUES ('gv002', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'teacher', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Trần Thị Lan',
    'gv002.Lan@teacher.iuh.edu.vn',
    '0901234568',
    N'Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, TP.HCM',
    'https://ui-avatars.com/api/?name=Tran+Thi+Lan&background=20C997&color=fff',
    'female',
    '1988-07-22'
);

INSERT INTO Teacher (userId, teacherCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    'GV002',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'AI')
);

-- Giảng viên 3: Cơ khí
INSERT INTO Account (username, password, role, isActive)
VALUES ('gv003', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'teacher', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Lê Văn Hùng',
    'gv003.Hung@teacher.iuh.edu.vn',
    '0901234569',
    N'Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, TP.HCM',
    'https://ui-avatars.com/api/?name=Le+Van+Hung&background=DC3545&color=fff',
    'male',
    '1982-11-08'
);

INSERT INTO Teacher (userId, teacherCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    'GV003',
    (SELECT TOP 1 id FROM Department WHERE code = 'CK'),
    (SELECT TOP 1 id FROM Major WHERE code = 'CTM')
);

-- Giảng viên 4: Điện tử
INSERT INTO Account (username, password, role, isActive)
VALUES ('gv004', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'teacher', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Phạm Thị Mai',
    'gv004.Mai@teacher.iuh.edu.vn',
    '0901234570',
    N'Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, TP.HCM',
    'https://ui-avatars.com/api/?name=Pham+Thi+Mai&background=FD7E14&color=fff',
    'female',
    '1987-05-12'
);

INSERT INTO Teacher (userId, teacherCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    'GV004',
    (SELECT TOP 1 id FROM Department WHERE code = 'CDT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'VT')
);

-- Giảng viên 5: QTKD
INSERT INTO Account (username, password, role, isActive)
VALUES ('gv005', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'teacher', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Hoàng Văn Đức',
    'gv005.Duc@teacher.iuh.edu.vn',
    '0901234571',
    N'Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, TP.HCM',
    'https://ui-avatars.com/api/?name=Hoang+Van+Duc&background=6F42C1&color=fff',
    'male',
    '1983-09-25'
);

INSERT INTO Teacher (userId, teacherCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    'GV005',
    (SELECT TOP 1 id FROM Department WHERE code = 'QTKD'),
    (SELECT TOP 1 id FROM Major WHERE code = 'KT')
);

-- =====================================================
-- 10. DỮ LIỆU SINH VIÊN (20 người)
-- =====================================================
-- Sinh viên CNTT (10 người)
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026511', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Ao Công Hiếu',
    '21026511.Hieu@student.iuh.edu.vn',
    '0987654321',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Ao+Cong+Hieu&background=17A2B8&color=fff',
    'male',
    '2003-05-10'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026511',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'SE')
);

-- Sinh viên 2: CNTT - AI
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026512', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Nguyễn Thị Lan Anh',
    '21026512.LanAnh@student.iuh.edu.vn',
    '0987654322',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Nguyen+Thi+Lan+Anh&background=E83E8C&color=fff',
    'female',
    '2003-08-15'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026512',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'AI')
);

-- Sinh viên 3: CNTT - NET
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026513', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Trần Văn Minh',
    '21026513.Minh@student.iuh.edu.vn',
    '0987654323',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Tran+Van+Minh&background=28A745&color=fff',
    'male',
    '2003-02-20'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026513',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'NET')
);

-- Sinh viên 4: CNTT - SE
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026514', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Lê Thị Hương',
    '21026514.Huong@student.iuh.edu.vn',
    '0987654324',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Le+Thi+Huong&background=FFC107&color=fff',
    'female',
    '2003-11-08'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026514',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'SE')
);

-- Sinh viên 5: CNTT - AI
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026515', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Phạm Văn Đức',
    '21026515.Duc@student.iuh.edu.vn',
    '0987654325',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Pham+Van+Duc&background=17A2B8&color=fff',
    'male',
    '2003-04-12'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026515',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'AI')
);

-- Sinh viên 6: CNTT - NET
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026516', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Hoàng Thị Mai',
    '21026516.Mai@student.iuh.edu.vn',
    '0987654326',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Hoang+Thi+Mai&background=6F42C1&color=fff',
    'female',
    '2003-07-25'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026516',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'NET')
);

-- Sinh viên 7: CNTT - SE
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026517', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Vũ Văn Hùng',
    '21026517.Hung@student.iuh.edu.vn',
    '0987654327',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Vu+Van+Hung&background=DC3545&color=fff',
    'male',
    '2003-09-18'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026517',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'SE')
);

-- Sinh viên 8: CNTT - AI
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026518', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Đặng Thị Linh',
    '21026518.Linh@student.iuh.edu.vn',
    '0987654328',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Dang+Thi+Linh&background=20C997&color=fff',
    'female',
    '2003-01-30'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026518',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'AI')
);

-- Sinh viên 9: CNTT - NET
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026519', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Bùi Văn Nam',
    '21026519.Nam@student.iuh.edu.vn',
    '0987654329',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Bui+Van+Nam&background=FD7E14&color=fff',
    'male',
    '2003-06-14'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026519',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'NET')
);

-- Sinh viên 10: CNTT - SE
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026520', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Ngô Thị Thu',
    '21026520.Thu@student.iuh.edu.vn',
    '0987654330',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Ngo+Thi+Thu&background=6C757D&color=fff',
    'female',
    '2003-12-03'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026520',
    (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'SE')
);

-- Sinh viên 11: Cơ khí - CTM
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026521', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Đinh Văn Tài',
    '21026521.Tai@student.iuh.edu.vn',
    '0987654331',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Dinh+Van+Tai&background=198754&color=fff',
    'male',
    '2003-03-22'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026521',
    (SELECT TOP 1 id FROM Department WHERE code = 'CK'),
    (SELECT TOP 1 id FROM Major WHERE code = 'CTM')
);

-- Sinh viên 12: Cơ khí - CNC
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026522', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Cao Thị Hoa',
    '21026522.Hoa@student.iuh.edu.vn',
    '0987654332',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Cao+Thi+Hoa&background=E83E8C&color=fff',
    'female',
    '2003-10-11'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026522',
    (SELECT TOP 1 id FROM Department WHERE code = 'CK'),
    (SELECT TOP 1 id FROM Major WHERE code = 'CNC')
);

-- Sinh viên 13: Điện - DTCN
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026523', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Lý Văn Quang',
    '21026523.Quang@student.iuh.edu.vn',
    '0987654333',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Ly+Van+Quang&background=28A745&color=fff',
    'male',
    '2003-05-07'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026523',
    (SELECT TOP 1 id FROM Department WHERE code = 'CD'),
    (SELECT TOP 1 id FROM Major WHERE code = 'DTCN')
);

-- Sinh viên 14: Điện - TDH
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026524', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Trịnh Thị Nga',
    '21026524.Nga@student.iuh.edu.vn',
    '0987654334',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Trinh+Thi+Nga&background=FFC107&color=fff',
    'female',
    '2003-08-28'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026524',
    (SELECT TOP 1 id FROM Department WHERE code = 'CD'),
    (SELECT TOP 1 id FROM Major WHERE code = 'TDH')
);

-- Sinh viên 15: Điện tử - VT
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026525', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Võ Văn Sơn',
    '21026525.Son@student.iuh.edu.vn',
    '0987654335',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Vo+Van+Son&background=17A2B8&color=fff',
    'male',
    '2003-11-16'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026525',
    (SELECT TOP 1 id FROM Department WHERE code = 'CDT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'VT')
);

-- Sinh viên 16: Điện tử - DT
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026526', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Dương Thị Yến',
    '21026526.Yen@student.iuh.edu.vn',
    '0987654336',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Duong+Thi+Yen&background=6F42C1&color=fff',
    'female',
    '2003-02-09'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026526',
    (SELECT TOP 1 id FROM Department WHERE code = 'CDT'),
    (SELECT TOP 1 id FROM Major WHERE code = 'DT')
);

-- Sinh viên 17: QTKD - KT
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026527', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Phan Văn Bình',
    '21026527.Binh@student.iuh.edu.vn',
    '0987654337',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Phan+Van+Binh&background=DC3545&color=fff',
    'male',
    '2003-07-04'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026527',
    (SELECT TOP 1 id FROM Department WHERE code = 'QTKD'),
    (SELECT TOP 1 id FROM Major WHERE code = 'KT')
);

-- Sinh viên 18: QTKD - TC
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026528', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Lưu Thị Hạnh',
    '21026528.Hanh@student.iuh.edu.vn',
    '0987654338',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Luu+Thi+Hanh&background=20C997&color=fff',
    'female',
    '2003-12-19'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026528',
    (SELECT TOP 1 id FROM Department WHERE code = 'QTKD'),
    (SELECT TOP 1 id FROM Major WHERE code = 'TC')
);

-- Sinh viên 19: QTKD - KT
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026529', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Nguyễn Văn Cường',
    '21026529.Cuong@student.iuh.edu.vn',
    '0987654339',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Nguyen+Van+Cuong&background=FD7E14&color=fff',
    'male',
    '2003-04-26'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026529',
    (SELECT TOP 1 id FROM Department WHERE code = 'QTKD'),
    (SELECT TOP 1 id FROM Major WHERE code = 'KT')
);

-- Sinh viên 20: Ngoại ngữ - TA
INSERT INTO Account (username, password, role, isActive)
VALUES ('21026530', '$2b$10$Yrn9g4GJ7VmaD0atsM.EzurUFzq7D7qr9y4RkPAGYRLfBtMG9sthi', 'student', 1);

INSERT INTO [User] (accountId, fullName, email, phone, address, avatar, gender, dateOfBirth)
VALUES (
    SCOPE_IDENTITY(),
    N'Trần Thị Phương',
    '21026530.Phuong@student.iuh.edu.vn',
    '0987654340',
    N'TP.HCM',
    'https://ui-avatars.com/api/?name=Tran+Thi+Phuong&background=6C757D&color=fff',
    'female',
    '2003-09-13'
);

INSERT INTO Student (userId, studentCode, departmentId, majorId)
VALUES (
    SCOPE_IDENTITY(),
    '21026530',
    (SELECT TOP 1 id FROM Department WHERE code = 'NN'),
    (SELECT TOP 1 id FROM Major WHERE code = 'TA')
);

-- =====================================================
-- 11. DỮ LIỆU PHÒNG HỌC
-- =====================================================
-- Phòng học Khoa CNTT (Dãy H, A)
INSERT INTO ClassRoom (code, name, capacity, building, floor, campus, classRoomTypeId, departmentId, isAvailable, description)
VALUES 
-- Dãy H - CNTT (Lý thuyết = 1, Thực hành = 2, Online = 3)
('H1.1', N'Phòng lý thuyết H1.1', 50, N'Tòa H', 1, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng lý thuyết CNTT tầng 1'),
('H1.2', N'Phòng lý thuyết H1.2', 50, N'Tòa H', 1, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng lý thuyết CNTT tầng 1'),
('H2.1', N'Phòng lý thuyết H2.1', 60, N'Tòa H', 2, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng lý thuyết CNTT tầng 2'),
('H2.2', N'Phòng lý thuyết H2.2', 60, N'Tòa H', 2, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng lý thuyết CNTT tầng 2'),
('H3.1', N'Phòng thực hành H3.1', 30, N'Tòa H', 3, N'Cơ sở chính', 2, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng thực hành CNTT tầng 3'),
('H3.2', N'Phòng thực hành H3.2', 30, N'Tòa H', 3, N'Cơ sở chính', 2, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng thực hành CNTT tầng 3'),
('H3.3', N'Phòng thực hành H3.3', 30, N'Tòa H', 3, N'Cơ sở chính', 2, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng thực hành CNTT tầng 3'),
('H3.4', N'Phòng thực hành H3.4', 30, N'Tòa H', 3, N'Cơ sở chính', 2, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng thực hành CNTT tầng 3'),

-- Dãy A - CNTT
('A1.1', N'Phòng lý thuyết A1.1', 80, N'Tòa A', 1, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng lý thuyết CNTT tầng 1'),
('A1.2', N'Phòng lý thuyết A1.2', 80, N'Tòa A', 1, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng lý thuyết CNTT tầng 1'),
('A2.1', N'Phòng lý thuyết A2.1', 100, N'Tòa A', 2, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), 1, N'Phòng lý thuyết CNTT tầng 2'),

-- Phòng học Khoa Cơ khí (Dãy D, B)
('D1.1', N'Phòng lý thuyết D1.1', 60, N'Tòa D', 1, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CK'), 1, N'Phòng lý thuyết Cơ khí tầng 1'),
('D1.2', N'Phòng lý thuyết D1.2', 60, N'Tòa D', 1, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CK'), 1, N'Phòng lý thuyết Cơ khí tầng 1'),
('B1.1', N'Phòng thực hành B1.1', 25, N'Tòa B', 1, N'Cơ sở chính', 2, (SELECT TOP 1 id FROM Department WHERE code = 'CK'), 1, N'Phòng thực hành Cơ khí tầng 1'),
('B1.2', N'Phòng thực hành B1.2', 25, N'Tòa B', 1, N'Cơ sở chính', 2, (SELECT TOP 1 id FROM Department WHERE code = 'CK'), 1, N'Phòng thực hành Cơ khí tầng 1'),

-- Phòng học Khoa Điện tử (Dãy V)
('V1.1', N'Phòng lý thuyết V1.1', 50, N'Tòa V', 1, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'CDT'), 1, N'Phòng lý thuyết Điện tử tầng 1'),
('V2.1', N'Phòng thực hành V2.1', 30, N'Tòa V', 2, N'Cơ sở chính', 2, (SELECT TOP 1 id FROM Department WHERE code = 'CDT'), 1, N'Phòng thực hành Điện tử tầng 2'),

-- Phòng học Khoa QTKD (Dãy X)
('X1.1', N'Phòng lý thuyết X1.1', 70, N'Tòa X', 1, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'QTKD'), 1, N'Phòng lý thuyết QTKD tầng 1'),
('X1.2', N'Phòng lý thuyết X1.2', 70, N'Tòa X', 1, N'Cơ sở chính', 1, (SELECT TOP 1 id FROM Department WHERE code = 'QTKD'), 1, N'Phòng lý thuyết QTKD tầng 1'),

-- Phòng học chung
('CHUNG1', N'Phòng học chung 1', 150, N'Tòa Trung tâm', 1, N'Cơ sở chính', 1, NULL, 1, N'Phòng học chung lớn'),
('CHUNG2', N'Phòng học chung 2', 200, N'Tòa Trung tâm', 2, N'Cơ sở chính', 1, NULL, 1, N'Phòng học chung rất lớn');

-- =====================================================
-- 12. DỮ LIỆU LỚP HỌC (chưa có phòng)
-- =====================================================
INSERT INTO Class (code, className, subjectName, subjectCode, credits, teacherId, departmentId, majorId, semester, academicYear, maxStudents, totalWeeks, startDate, endDate, classRoomTypeId, description)
VALUES 
-- Lớp CNTT (Lý thuyết = 1, Thực hành = 2, Online = 3)
('COMP101', N'Lập trình cơ bản', N'Nhập môn lập trình', 'NMLT', 3, 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), (SELECT TOP 1 id FROM Major WHERE code = 'SE'), N'Học kỳ 1', '2025-2026', 50, 15, '2025-09-01', '2025-12-15', 1, N'Môn học cơ bản về lập trình'),
('COMP102', N'Cơ sở dữ liệu', N'Cơ sở dữ liệu', 'CSDL', 4, 2, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), (SELECT TOP 1 id FROM Major WHERE code = 'SE'), N'Học kỳ 1', '2025-2026', 40, 15, '2025-09-01', '2025-12-15', 1, N'Môn học về cơ sở dữ liệu'),
('COMP103', N'Lập trình Web', N'Lập trình Web', 'LTW', 3, 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), (SELECT TOP 1 id FROM Major WHERE code = 'SE'), N'Học kỳ 1', '2025-2026', 35, 15, '2025-09-01', '2025-12-15', 1, N'Môn học lập trình Web'),

-- Lớp Cơ khí
('MECH101', N'Cơ học kỹ thuật', N'Cơ học kỹ thuật', 'CHKT', 3, 3, (SELECT TOP 1 id FROM Department WHERE code = 'CK'), (SELECT TOP 1 id FROM Major WHERE code = 'CTM'), N'Học kỳ 1', '2025-2026', 45, 15, '2025-09-01', '2025-12-15', 1, N'Môn học cơ học kỹ thuật'),
('MECH102', N'Thực hành CNC', N'Thực hành CNC', 'THCNC', 2, 3, (SELECT TOP 1 id FROM Department WHERE code = 'CK'), (SELECT TOP 1 id FROM Major WHERE code = 'CNC'), N'Học kỳ 1', '2025-2026', 20, 15, '2025-09-01', '2025-12-15', 2, N'Môn học thực hành CNC'),

-- Lớp Điện tử
('ELEC101', N'Điện tử cơ bản', N'Điện tử cơ bản', 'DTCB', 3, 4, (SELECT TOP 1 id FROM Department WHERE code = 'CDT'), (SELECT TOP 1 id FROM Major WHERE code = 'VT'), N'Học kỳ 1', '2025-2026', 40, 15, '2025-09-01', '2025-12-15', 1, N'Môn học điện tử cơ bản'),

-- Lớp QTKD
('BUS101', N'Kế toán tài chính', N'Kế toán tài chính', 'KTTN', 3, 5, (SELECT TOP 1 id FROM Department WHERE code = 'QTKD'), (SELECT TOP 1 id FROM Major WHERE code = 'KT'), N'Học kỳ 1', '2025-2026', 60, 15, '2025-09-01', '2025-12-15', 1, N'Môn học kế toán tài chính'),

-- =====================================================
-- THÊM 10 LỚP LÝ THUYẾT (KHÔNG CÓ THỰC HÀNH) - VỚI NGÀY BẮT ĐẦU VÀ KẾT THÚC KHÁC NHAU
-- =====================================================
-- Lớp CNTT - Lý thuyết (Học kỳ 1: 01/09/2025 - 15/12/2025)
('COMP201', N'Cấu trúc dữ liệu và giải thuật', N'Cấu trúc dữ liệu và giải thuật', 'CTDLGT', 4, 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), (SELECT TOP 1 id FROM Major WHERE code = 'SE'), N'Học kỳ 1', '2025-2026', 45, 15, '2025-09-01', '2025-12-15', 1, N'Môn học cấu trúc dữ liệu và giải thuật'),
('COMP202', N'Lập trình hướng đối tượng', N'Lập trình hướng đối tượng', 'LTHDT', 3, 2, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), (SELECT TOP 1 id FROM Major WHERE code = 'SE'), N'Học kỳ 1', '2025-2026', 40, 15, '2025-09-01', '2025-12-15', 1, N'Môn học lập trình hướng đối tượng'),
('COMP203', N'Hệ điều hành', N'Hệ điều hành', 'HDH', 3, 1, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), (SELECT TOP 1 id FROM Major WHERE code = 'NET'), N'Học kỳ 1', '2025-2026', 35, 15, '2025-09-01', '2025-12-15', 1, N'Môn học hệ điều hành'),
('COMP204', N'Trí tuệ nhân tạo', N'Trí tuệ nhân tạo', 'TTNT', 3, 2, (SELECT TOP 1 id FROM Department WHERE code = 'CNTT'), (SELECT TOP 1 id FROM Major WHERE code = 'AI'), N'Học kỳ 1', '2025-2026', 30, 15, '2025-09-01', '2025-12-15', 1, N'Môn học trí tuệ nhân tạo'),

-- Lớp Cơ khí - Lý thuyết (Học kỳ 1: 01/09/2025 - 15/12/2025)
('MECH201', N'Vật liệu kỹ thuật', N'Vật liệu kỹ thuật', 'VLKT', 3, 3, (SELECT TOP 1 id FROM Department WHERE code = 'CK'), (SELECT TOP 1 id FROM Major WHERE code = 'CTM'), N'Học kỳ 1', '2025-2026', 40, 15, '2025-09-01', '2025-12-15', 1, N'Môn học vật liệu kỹ thuật'),
('MECH202', N'Động lực học', N'Động lực học', 'DLH', 3, 3, (SELECT TOP 1 id FROM Department WHERE code = 'CK'), (SELECT TOP 1 id FROM Major WHERE code = 'CNC'), N'Học kỳ 1', '2025-2026', 35, 15, '2025-09-01', '2025-12-15', 1, N'Môn học động lực học'),

-- Lớp Điện tử - Lý thuyết (Học kỳ 1: 01/09/2025 - 15/12/2025)
('ELEC201', N'Viễn thông số', N'Viễn thông số', 'VTS', 3, 4, (SELECT TOP 1 id FROM Department WHERE code = 'CDT'), (SELECT TOP 1 id FROM Major WHERE code = 'VT'), N'Học kỳ 1', '2025-2026', 35, 15, '2025-09-01', '2025-12-15', 1, N'Môn học viễn thông số'),
('ELEC202', N'Xử lý tín hiệu số', N'Xử lý tín hiệu số', 'XLTSS', 3, 4, (SELECT TOP 1 id FROM Department WHERE code = 'CDT'), (SELECT TOP 1 id FROM Major WHERE code = 'DT'), N'Học kỳ 1', '2025-2026', 30, 15, '2025-09-01', '2025-12-15', 1, N'Môn học xử lý tín hiệu số'),

-- Lớp QTKD - Lý thuyết (Học kỳ 1: 01/09/2025 - 15/12/2025)
('BUS201', N'Quản trị học', N'Quản trị học', 'QTH', 3, 5, (SELECT TOP 1 id FROM Department WHERE code = 'QTKD'), (SELECT TOP 1 id FROM Major WHERE code = 'KT'), N'Học kỳ 1', '2025-2026', 50, 15, '2025-09-01', '2025-12-15', 1, N'Môn học quản trị học'),
('BUS202', N'Marketing căn bản', N'Marketing căn bản', 'MKT', 3, 5, (SELECT TOP 1 id FROM Department WHERE code = 'QTKD'), (SELECT TOP 1 id FROM Major WHERE code = 'TC'), N'Học kỳ 1', '2025-2026', 45, 15, '2025-09-01', '2025-12-15', 1, N'Môn học marketing căn bản');

-- =====================================================
-- 13. DỮ LIỆU LỊCH HỌC (chưa có phòng - statusId = 1: Chờ phân phòng)
-- =====================================================
INSERT INTO ClassSchedule (classId, teacherId, classRoomId, dayOfWeek, timeSlotId, classRoomTypeId, practiceGroup, weekPattern, startWeek, endWeek, statusId, assignedBy, assignedAt, note)
VALUES 
-- Lớp COMP101 (mixed): Thứ 3, tiết 1-3 (LT) và Thứ 5, tiết 7-9 (TH)
-- TIẾT HỌC ĐÃ CỐ ĐỊNH - Admin chỉ cần gán phòng
-- TimeSlot ID: 17 = Tiết 1-3, 19 = Tiết 7-9, 20 = Tiết 10-12, 21 = Tiết 13-15
(1, 1, NULL, 3, 17, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết COMP101 - Tiết 1-3 cố định, chờ phân phòng'),
(1, 1, NULL, 5, 19, 2, 1, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành COMP101 - Nhóm 1 - Tiết 7-9 cố định, chờ phân phòng'),
(1, 1, NULL, 5, 20, 2, 2, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành COMP101 - Nhóm 2 - Tiết 10-12 cố định, chờ phân phòng'),
(1, 1, NULL, 5, 21, 2, 3, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành COMP101 - Nhóm 3 - Tiết 13-15 cố định, chờ phân phòng'),

-- Lớp COMP102 (mixed): Thứ 2, tiết 4-6 (LT) và Thứ 4, tiết 7-9 (TH)
-- TimeSlot ID: 18 = Tiết 4-6, 19 = Tiết 7-9, 20 = Tiết 10-12
(2, 2, NULL, 2, 18, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết COMP102 - Chờ phân phòng'),
(2, 2, NULL, 4, 19, 2, 1, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành COMP102 - Nhóm 1 - Chờ phân phòng'),
(2, 2, NULL, 4, 20, 2, 2, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành COMP102 - Nhóm 2 - Chờ phân phòng'),

-- Lớp COMP103 (theory only): Thứ 6, tiết 4-6
-- TimeSlot ID: 18 = Tiết 4-6
(3, 1, NULL, 6, 18, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết COMP103 - Chờ phân phòng'),

-- Lớp MECH101 (mixed): Thứ 2, tiết 1-3 (LT) và Thứ 4, tiết 7-9 (TH)
-- TimeSlot ID: 17 = Tiết 1-3, 19 = Tiết 7-9, 20 = Tiết 10-12
(4, 3, NULL, 2, 17, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết MECH101 - Chờ phân phòng'),
(4, 3, NULL, 4, 19, 2, 1, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành MECH101 - Nhóm 1 - Chờ phân phòng'),
(4, 3, NULL, 4, 20, 2, 2, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành MECH101 - Nhóm 2 - Chờ phân phòng'),

-- Lớp MECH102 (practice only): Thứ 7, tiết 7-9
-- TimeSlot ID: 19 = Tiết 7-9, 20 = Tiết 10-12
(5, 3, NULL, 7, 19, 2, 1, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành MECH102 - Nhóm 1 - Chờ phân phòng'),
(5, 3, NULL, 7, 20, 2, 2, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành MECH102 - Nhóm 2 - Chờ phân phòng'),

-- Lớp ELEC101 (mixed): Thứ 3, tiết 4-6 (LT) và Thứ 5, tiết 7-9 (TH)
-- TimeSlot ID: 18 = Tiết 4-6, 19 = Tiết 7-9, 20 = Tiết 10-12
(6, 4, NULL, 3, 18, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết ELEC101 - Chờ phân phòng'),
(6, 4, NULL, 5, 19, 2, 1, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành ELEC101 - Nhóm 1 - Chờ phân phòng'),
(6, 4, NULL, 5, 20, 2, 2, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch thực hành ELEC101 - Nhóm 2 - Chờ phân phòng'),

-- Lớp BUS101 (theory only): Thứ 2, tiết 7-9
-- TimeSlot ID: 19 = Tiết 7-9
(7, 5, NULL, 2, 19, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết BUS101 - Chờ phân phòng'),

-- =====================================================
-- LỊCH HỌC CHO 10 LỚP LÝ THUYẾT MỚI (CHỈ LÝ THUYẾT)
-- =====================================================
-- Lớp COMP201 (Cấu trúc dữ liệu và giải thuật): Thứ 3, tiết 4-6
-- TimeSlot ID: 18 = Tiết 4-6
(8, 1, NULL, 3, 18, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết COMP201 - Chờ phân phòng'),

-- Lớp COMP202 (Lập trình hướng đối tượng): Thứ 4, tiết 1-3
-- TimeSlot ID: 17 = Tiết 1-3
(9, 2, NULL, 4, 17, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết COMP202 - Chờ phân phòng'),

-- Lớp COMP203 (Hệ điều hành): Thứ 5, tiết 4-6
-- TimeSlot ID: 18 = Tiết 4-6
(10, 1, NULL, 5, 18, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết COMP203 - Chờ phân phòng'),

-- Lớp COMP204 (Trí tuệ nhân tạo): Thứ 6, tiết 1-3
-- TimeSlot ID: 17 = Tiết 1-3
(11, 2, NULL, 6, 17, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết COMP204 - Chờ phân phòng'),

-- Lớp MECH201 (Vật liệu kỹ thuật): Thứ 2, tiết 1-3
-- TimeSlot ID: 17 = Tiết 1-3
(12, 3, NULL, 2, 17, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết MECH201 - Chờ phân phòng'),

-- Lớp MECH202 (Động lực học): Thứ 3, tiết 7-9
-- TimeSlot ID: 19 = Tiết 7-9
(13, 3, NULL, 3, 19, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết MECH202 - Chờ phân phòng'),

-- Lớp ELEC201 (Viễn thông số): Thứ 4, tiết 4-6
-- TimeSlot ID: 18 = Tiết 4-6
(14, 4, NULL, 4, 18, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết ELEC201 - Chờ phân phòng'),

-- Lớp ELEC202 (Xử lý tín hiệu số): Thứ 5, tiết 1-3
-- TimeSlot ID: 17 = Tiết 1-3
(15, 4, NULL, 5, 17, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết ELEC202 - Chờ phân phòng'),

-- Lớp BUS201 (Quản trị học): Thứ 6, tiết 7-9
-- TimeSlot ID: 19 = Tiết 7-9
(16, 5, NULL, 6, 19, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết BUS201 - Chờ phân phòng'),

-- Lớp BUS202 (Marketing căn bản): Thứ 7, tiết 1-3
-- TimeSlot ID: 17 = Tiết 1-3
(17, 5, NULL, 7, 17, 1, NULL, 'weekly', 1, 15, 1, NULL, NULL, N'Lịch học lý thuyết BUS202 - Chờ phân phòng');

-- =====================================================
-- 14. DỮ LIỆU SINH VIÊN TRONG LỚP (VỚI NHÓM THỰC HÀNH)
-- =====================================================
INSERT INTO ClassStudent (classId, studentId, groupNumber, academicStatusId, joinedAt)
VALUES 
--(8, 21, NULL, 1, '2025-09-01') -- Bảo
-- Lớp COMP101 (Nhập môn lập trình) - 10 sinh viên CNTT
(1, 1, 1, 1, '2025-09-01'), -- Ao Công Hiếu - Nhóm 1
(1, 2, 1, 1, '2025-09-01'), -- Nguyễn Thị Lan Anh - Nhóm 1
(1, 3, 2, 1, '2025-09-01'), -- Trần Văn Minh - Nhóm 2
(1, 4, 2, 1, '2025-09-01'), -- Lê Thị Hương - Nhóm 2
(1, 5, 3, 1, '2025-09-01'), -- Phạm Văn Đức - Nhóm 3
(1, 6, 3, 1, '2025-09-01'), -- Hoàng Thị Mai - Nhóm 3
(1, 7, 1, 1, '2025-09-01'), -- Vũ Văn Hùng - Nhóm 1
(1, 8, 2, 1, '2025-09-01'), -- Đặng Thị Linh - Nhóm 2
(1, 9, 3, 1, '2025-09-01'), -- Bùi Văn Nam - Nhóm 3
(1, 10, 1, 1, '2025-09-01'), -- Ngô Thị Thu - Nhóm 1

-- Lớp COMP102 (Cơ sở dữ liệu) - 8 sinh viên CNTT
(2, 1, 1, 1, '2025-09-01'), -- Ao Công Hiếu - Nhóm 1
(2, 2, 1, 1, '2025-09-01'), -- Nguyễn Thị Lan Anh - Nhóm 1
(2, 3, 2, 1, '2025-09-01'), -- Trần Văn Minh - Nhóm 2
(2, 4, 2, 1, '2025-09-01'), -- Lê Thị Hương - Nhóm 2
(2, 5, 1, 1, '2025-09-01'), -- Phạm Văn Đức - Nhóm 1
(2, 6, 2, 1, '2025-09-01'), -- Hoàng Thị Mai - Nhóm 2
(2, 7, 1, 1, '2025-09-01'), -- Vũ Văn Hùng - Nhóm 1
(2, 8, 2, 1, '2025-09-01'), -- Đặng Thị Linh - Nhóm 2

-- Lớp COMP103 (Lập trình Web) - 6 sinh viên CNTT (chỉ lý thuyết)
(3, 1, NULL, 1, '2025-09-01'), -- Ao Công Hiếu - Không có nhóm (chỉ lý thuyết)
(3, 2, NULL, 1, '2025-09-01'), -- Nguyễn Thị Lan Anh - Không có nhóm (chỉ lý thuyết)
(3, 3, NULL, 1, '2025-09-01'), -- Trần Văn Minh - Không có nhóm (chỉ lý thuyết)
(3, 4, NULL, 1, '2025-09-01'), -- Lê Thị Hương - Không có nhóm (chỉ lý thuyết)
(3, 5, NULL, 1, '2025-09-01'), -- Phạm Văn Đức - Không có nhóm (chỉ lý thuyết)
(3, 6, NULL, 1, '2025-09-01'), -- Hoàng Thị Mai - Không có nhóm (chỉ lý thuyết)

-- Lớp MECH101 (Cơ học kỹ thuật) - 4 sinh viên Cơ khí
(4, 11, 1, 1, '2025-09-01'), -- Đinh Văn Tài - Nhóm 1
(4, 12, 1, 1, '2025-09-01'), -- Cao Thị Hoa - Nhóm 1
(4, 13, 2, 1, '2025-09-01'), -- Lý Văn Quang - Nhóm 2
(4, 14, 2, 1, '2025-09-01'), -- Trịnh Thị Nga - Nhóm 2

-- Lớp MECH102 (Thực hành CNC) - 2 sinh viên Cơ khí
(5, 11, 1, 1, '2025-09-01'), -- Đinh Văn Tài - Nhóm 1
(5, 12, 2, 1, '2025-09-01'), -- Cao Thị Hoa - Nhóm 2

-- Lớp ELEC101 (Điện tử cơ bản) - 4 sinh viên Điện tử
(6, 15, 1, 1, '2025-09-01'), -- Võ Văn Sơn - Nhóm 1
(6, 16, 1, 1, '2025-09-01'), -- Dương Thị Yến - Nhóm 1
(6, 17, 2, 1, '2025-09-01'), -- Phan Văn Bình - Nhóm 2
(6, 18, 2, 1, '2025-09-01'), -- Lưu Thị Hạnh - Nhóm 2

-- Lớp BUS101 (Kế toán tài chính) - 2 sinh viên QTKD (chỉ lý thuyết)
(7, 19, NULL, 1, '2025-09-01'), -- Nguyễn Văn Cường - Không có nhóm (chỉ lý thuyết)
(7, 20, NULL, 1, '2025-09-01'), -- Trần Thị Phương - Không có nhóm (chỉ lý thuyết)

-- =====================================================
-- SINH VIÊN TRONG 10 LỚP LÝ THUYẾT MỚI (CHỈ LÝ THUYẾT)
-- =====================================================
-- Lớp COMP201 (Cấu trúc dữ liệu và giải thuật) - 8 sinh viên CNTT SE
(8, 1, NULL, 1, '2025-09-01'), -- Ao Công Hiếu
--
(8, 4, NULL, 1, '2025-09-01'), -- Lê Thị Hương
(8, 7, NULL, 1, '2025-09-01'), -- Vũ Văn Hùng
(8, 10, NULL, 1, '2025-09-01'), -- Ngô Thị Thu
(8, 2, NULL, 1, '2025-09-01'), -- Nguyễn Thị Lan Anh
(8, 5, NULL, 1, '2025-09-01'), -- Phạm Văn Đức
(8, 8, NULL, 1, '2025-09-01'), -- Đặng Thị Linh
(8, 9, NULL, 1, '2025-09-01'), -- Bùi Văn Nam

-- Lớp COMP202 (Lập trình hướng đối tượng) - 6 sinh viên CNTT SE
(9, 1, NULL, 1, '2025-09-01'), -- Ao Công Hiếu
(9, 4, NULL, 1, '2025-09-01'), -- Lê Thị Hương
(9, 7, NULL, 1, '2025-09-01'), -- Vũ Văn Hùng
(9, 10, NULL, 1, '2025-09-01'), -- Ngô Thị Thu
(9, 2, NULL, 1, '2025-09-01'), -- Nguyễn Thị Lan Anh
(9, 5, NULL, 1, '2025-09-01'), -- Phạm Văn Đức

-- Lớp COMP203 (Hệ điều hành) - 4 sinh viên CNTT NET
(10, 3, NULL, 1, '2025-09-01'), -- Trần Văn Minh
(10, 6, NULL, 1, '2025-09-01'), -- Hoàng Thị Mai
(10, 8, NULL, 1, '2025-09-01'), -- Đặng Thị Linh
(10, 9, NULL, 1, '2025-09-01'), -- Bùi Văn Nam

-- Lớp COMP204 (Trí tuệ nhân tạo) - 3 sinh viên CNTT AI
(11, 2, NULL, 1, '2025-09-01'), -- Nguyễn Thị Lan Anh
(11, 5, NULL, 1, '2025-09-01'), -- Phạm Văn Đức
(11, 8, NULL, 1, '2025-09-01'), -- Đặng Thị Linh

-- Lớp MECH201 (Vật liệu kỹ thuật) - 3 sinh viên Cơ khí CTM
(12, 11, NULL, 1, '2025-09-01'), -- Đinh Văn Tài
(12, 12, NULL, 1, '2025-09-01'), -- Cao Thị Hoa
(12, 13, NULL, 1, '2025-09-01'), -- Lý Văn Quang

-- Lớp MECH202 (Động lực học) - 2 sinh viên Cơ khí CNC
(13, 12, NULL, 1, '2025-09-01'), -- Cao Thị Hoa
(13, 14, NULL, 1, '2025-09-01'), -- Trịnh Thị Nga

-- Lớp ELEC201 (Viễn thông số) - 3 sinh viên Điện tử VT
(14, 15, NULL, 1, '2025-09-01'), -- Võ Văn Sơn
(14, 16, NULL, 1, '2025-09-01'), -- Dương Thị Yến
(14, 17, NULL, 1, '2025-09-01'), -- Phan Văn Bình

-- Lớp ELEC202 (Xử lý tín hiệu số) - 2 sinh viên Điện tử DT
(15, 16, NULL, 1, '2025-09-01'), -- Dương Thị Yến
(15, 18, NULL, 1, '2025-09-01'), -- Lưu Thị Hạnh

-- Lớp BUS201 (Quản trị học) - 4 sinh viên QTKD KT
(16, 19, NULL, 1, '2025-09-01'), -- Nguyễn Văn Cường
(16, 20, NULL, 1, '2025-09-01'), -- Trần Thị Phương
(16, 17, NULL, 1, '2025-09-01'), -- Phan Văn Bình
(16, 18, NULL, 1, '2025-09-01'), -- Lưu Thị Hạnh

-- Lớp BUS202 (Marketing căn bản) - 3 sinh viên QTKD TC
(17, 20, NULL, 1, '2025-09-01'), -- Trần Thị Phương
(17, 19, NULL, 1, '2025-09-01'), -- Nguyễn Văn Cường
(17, 18, NULL, 1, '2025-09-01'); -- Lưu Thị Hạnh

-- =====================================================
-- 15. DỮ LIỆU YÊU CẦU THAY ĐỔI LỊCH HỌC
-- =====================================================
--INSERT INTO ScheduleRequest (requestTypeId, classScheduleId, classRoomId, requesterId, requestDate, timeSlotId, changeType, oldClassRoomId, newClassRoomId, oldTimeSlotId, newTimeSlotId, exceptionDate, exceptionType, reason, approvedBy, requestStatusId, approvedAt, note)
--VALUES 
---- Yêu cầu phòng độc lập (Đổi phòng = 7)
--(7, NULL, 1, 1, '2025-10-15', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, N'Yêu cầu phòng cho buổi thuyết trình', NULL, 1, NULL, NULL),

---- Yêu cầu thay đổi phòng học (Đổi phòng = 7)
--(7, 1, NULL, 1, '2025-10-15', 1, 'room_change', 1, 2, NULL, NULL, NULL, NULL, N'Phòng hiện tại quá nhỏ cho số lượng sinh viên', 1, 2, '2025-10-01 10:00:00', N'Admin đã phê duyệt thay đổi phòng'),

---- Yêu cầu thay đổi tiết học (Đổi lịch = 8)
--(8, 2, NULL, 2, '2025-10-15', 7, 'time_change', NULL, NULL, 7, 10, NULL, NULL, N'Giảng viên có lịch trùng với tiết 7-9', 1, 1, NULL, N'Đang chờ admin xem xét'),

---- Yêu cầu thay đổi cả phòng và tiết (Đổi lịch = 8)
--(8, 3, NULL, 3, '2025-10-15', 4, 'both', 2, 3, 4, 5, NULL, NULL, N'Phòng và tiết hiện tại không phù hợp', NULL, 1, NULL, N'Chờ admin phê duyệt'),

---- Ngoại lệ: Chuyển sang thi (Thi = 6)
--(6, 1, NULL, 1, '2025-10-15', 1, 'exception', NULL, NULL, NULL, NULL, '2025-11-07', 'exam', N'Chuyển từ học sang thi giữa kỳ', 1, 2, '2025-10-01 10:00:00', N'Admin đã phê duyệt chuyển sang thi'),

---- Ngoại lệ: Nghỉ học (Tạm ngưng = 5)
--(5, 2, NULL, 2, '2025-10-15', 7, 'exception', NULL, NULL, NULL, NULL, '2025-11-07', 'cancelled', N'Nghỉ học do bão', NULL, 1, NULL, N'Chờ admin phê duyệt'),

---- Ngoại lệ: Chuyển sang ngày khác (Đổi lịch = 8)
--(8, 3, NULL, 3, '2025-10-15', 4, 'exception', NULL, NULL, NULL, NULL, '2025-11-07', 'moved', N'Chuyển lớp do nghỉ lễ', NULL, 1, NULL, N'Chờ admin phê duyệt');

-- =====================================================
-- 16. DỮ LIỆU THÔNG TIN PROFILE MỞ RỘNG
-- =====================================================

-- Thông tin cá nhân cho Admin
INSERT INTO PersonalProfile (userId, idCardNumber, idCardIssueDate, idCardIssuePlace, placeOfBirth, permanentAddress, phoneEmergency, bankName, bankBranch, bankAccountNumber)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = 'admin'),
    '079123456789',
    '2015-03-15',
    N'Công an TP. Hồ Chí Minh',
    N'TP. Hồ Chí Minh',
    N'Số 12 Nguyễn Văn Bảo, P. Hạnh Thông, Q. Gò Vấp, TP.HCM',
    '02838940390',
    N'Ngân hàng TMCP Á Châu - ACB',
    N'Chi nhánh Gò Vấp',
    '1234567890'
);

-- Thông tin gia đình cho Admin
INSERT INTO FamilyInfo (userId, fatherFullName, fatherYearOfBirth, fatherPhone, motherFullName, motherYearOfBirth, motherPhone)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = 'admin'),
    N'Nguyễn Văn Bảo',
    1965,
    '0901234567',
    N'Võ Thị Thu Thủy',
    1968,
    '0901234568'
);

-- Thông tin học vấn cho Admin
INSERT INTO AcademicProfile (userId, role, campus, trainingType, degreeLevel, academicYear, enrollmentDate, classCode, title)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = 'admin'),
    'admin',
    N'Cơ sở chính (TP. Hồ Chí Minh)',
    N'Chính quy',
    N'Thạc sĩ',
    '2010-2012',
    '2010-09-01',
    NULL,
    N'Quản trị viên hệ thống'
);

-- Thông tin cá nhân cho sinh viên Ao Công Hiếu (21026511)
INSERT INTO PersonalProfile (userId, idCardNumber, idCardIssueDate, idCardIssuePlace, placeOfBirth, permanentAddress, phoneEmergency, bankName, bankBranch, bankAccountNumber)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = '21026511'),
    '212621829',
    '2018-04-16',
    N'Tỉnh Quảng Ngãi',
    N'Tỉnh Quảng Ngãi',
    N'Thôn Đức Sơn, Xã Tịnh Hiệp, Huyện Sơn Tịnh, Tỉnh Quảng Ngãi',
    '0866675276',
    N'Ngân hàng Ngoại Thương Việt Nam - Vietcombank',
    N'Chi nhánh Bình Sơn - Quảng Ngãi',
    '1015692608'
);

-- Thông tin gia đình cho sinh viên Ao Công Hiếu
INSERT INTO FamilyInfo (userId, fatherFullName, fatherYearOfBirth, fatherPhone, motherFullName, motherYearOfBirth, motherPhone)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = '21026511'),
    N'Ao Công Bình',
    1959,
    '0974231914',
    N'Đỗ Thị Mân',
    1960,
    '0347282146'
);

-- Thông tin học vấn cho sinh viên Ao Công Hiếu
INSERT INTO AcademicProfile (userId, role, campus, trainingType, degreeLevel, academicYear, enrollmentDate, classCode, title)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = '21026511'),
    'student',
    N'Cơ sở 1 (Thành phố Hồ Chí Minh)',
    N'Chính quy',
    N'Đại học',
    '2021-2022',
    '2021-08-06',
    'DHKTPM17A',
    NULL
);

-- Cập nhật thông tin User cho Ao Công Hiếu để khớp với ảnh
UPDATE [User] 
SET 
    phone = '0866675276',
    address = N'Tịnh Bắc, sơn Tịnh, quảng Ngãi',
    dateOfBirth = '2003-01-01',
    email = 'conghieusq@gmail.com'
WHERE id = (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = '21026511');

-- Thông tin cá nhân cho giảng viên Nguyễn Văn Minh (GV001)
INSERT INTO PersonalProfile (userId, idCardNumber, idCardIssueDate, idCardIssuePlace, placeOfBirth, permanentAddress, phoneEmergency, bankName, bankBranch, bankAccountNumber)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = 'gv001'),
    '079123456780',
    '2010-05-20',
    N'Công an TP. Hồ Chí Minh',
    N'TP. Hồ Chí Minh',
    N'Số 123 Nguyễn Văn Cừ, P. 4, Q. 5, TP.HCM',
    '0901234567',
    N'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam - BIDV',
    N'Chi nhánh Quận 5',
    '9876543210'
);

-- Thông tin gia đình cho giảng viên Nguyễn Văn Minh
INSERT INTO FamilyInfo (userId, fatherFullName, fatherYearOfBirth, fatherPhone, motherFullName, motherYearOfBirth, motherPhone)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = 'gv001'),
    N'Nguyễn Văn Cảnh',
    1960,
    '0901234569',
    N'Trần Thị Minh Thúy',
    1963,
    '0901234570'
);

-- Thông tin học vấn cho giảng viên Nguyễn Văn Minh
INSERT INTO AcademicProfile (userId, role, campus, trainingType, degreeLevel, academicYear, enrollmentDate, classCode, title)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = 'gv001'),
    'teacher',
    N'Cơ sở chính (TP. Hồ Chí Minh)',
    N'Chính quy',
    N'Thạc sĩ',
    '2005-2007',
    '2005-09-01',
    NULL,
    N'Giảng viên chính'
);

-- Thông tin cá nhân cho sinh viên Nguyễn Thị Lan Anh (21026512)
INSERT INTO PersonalProfile (userId, idCardNumber, idCardIssueDate, idCardIssuePlace, placeOfBirth, permanentAddress, phoneEmergency, bankName, bankBranch, bankAccountNumber)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = '21026512'),
    '212621830',
    '2019-06-10',
    N'Công an TP. Hồ Chí Minh',
    N'TP. Hồ Chí Minh',
    N'Số 456 Lê Văn Việt, P. Tăng Nhơn Phú A, Q. 9, TP.HCM',
    '0987654322',
    N'Ngân hàng TMCP Sài Gòn Thương Tín - Sacombank',
    N'Chi nhánh Quận 9',
    '1122334455'
);

-- Thông tin gia đình cho sinh viên Nguyễn Thị Lan Anh
INSERT INTO FamilyInfo (userId, fatherFullName, fatherYearOfBirth, fatherPhone, motherFullName, motherYearOfBirth, motherPhone)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = '21026512'),
    N'Nguyễn Văn Lan Anh Cha',
    1970,
    '0987654323',
    N'Trần Thị Lan Anh Mẹ',
    1972,
    '0987654324'
);

-- Thông tin học vấn cho sinh viên Nguyễn Thị Lan Anh
INSERT INTO AcademicProfile (userId, role, campus, trainingType, degreeLevel, academicYear, enrollmentDate, classCode, title)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = '21026512'),
    'student',
    N'Cơ sở 1 (Thành phố Hồ Chí Minh)',
    N'Chính quy',
    N'Đại học',
    '2021-2022',
    '2021-08-06',
    'DHKTPM17A',
    NULL
);

-- Thông tin cá nhân cho giảng viên Trần Thị Lan (GV002)
INSERT INTO PersonalProfile (userId, idCardNumber, idCardIssueDate, idCardIssuePlace, placeOfBirth, permanentAddress, phoneEmergency, bankName, bankBranch, bankAccountNumber)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = 'gv002'),
    '079123456781',
    '2012-08-15',
    N'Công an TP. Hồ Chí Minh',
    N'TP. Hồ Chí Minh',
    N'Số 789 Điện Biên Phủ, P. 25, Q. Bình Thạnh, TP.HCM',
    '0901234568',
    N'Ngân hàng TMCP Ngoại thương Việt Nam - Vietcombank',
    N'Chi nhánh Bình Thạnh',
    '5566778899'
);

-- Thông tin gia đình cho giảng viên Trần Thị Lan
INSERT INTO FamilyInfo (userId, fatherFullName, fatherYearOfBirth, fatherPhone, motherFullName, motherYearOfBirth, motherPhone)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = 'gv002'),
    N'Trần Văn Lan Cha',
    1965,
    '0901234571',
    N'Nguyễn Thị Lan Mẹ',
    1968,
    '0901234572'
);

-- Thông tin học vấn cho giảng viên Trần Thị Lan
INSERT INTO AcademicProfile (userId, role, campus, trainingType, degreeLevel, academicYear, enrollmentDate, classCode, title)
VALUES (
    (SELECT TOP 1 u.id FROM [User] u INNER JOIN Account a ON u.accountId = a.id WHERE a.username = 'gv002'),
    'teacher',
    N'Cơ sở chính (TP. Hồ Chí Minh)',
    N'Chính quy',
    N'Tiến sĩ',
    '2008-2012',
    '2008-09-01',
    NULL,
    N'Phó Giáo sư'
);

---- =====================================================
---- 17. DỮ LIỆU NGOẠI LỆ LỊCH HỌC (TẠM NGƯNG VÀ THI)
---- =====================================================

---- Thêm lịch tạm ngưng cho sinh viên Ao Công Hiếu (COMP201 - Cấu trúc dữ liệu và giải thuật)
---- Tuần 4, Thứ 3, Tiết 4-6: Tạm ngưng do nghỉ lễ
--INSERT INTO ScheduleRequest (requestTypeId, classScheduleId, classRoomId, requesterId, requestDate, timeSlotId, changeType, oldClassRoomId, newClassRoomId, oldTimeSlotId, newTimeSlotId, exceptionDate, exceptionType, reason, approvedBy, requestStatusId, approvedAt, note)
--VALUES 
--(5, 18, NULL, 1, '2025-09-15', 4, 'exception', NULL, NULL, NULL, NULL, '2025-09-23', 'cancelled', N'Tạm ngưng lớp do nghỉ lễ Quốc khánh', 1, 2, '2025-09-01 10:00:00', N'Admin đã phê duyệt tạm ngưng lớp');

---- Thêm lịch thi cho sinh viên Ao Công Hiếu (COMP201 - Cấu trúc dữ liệu và giải thuật)
---- Tuần 5, Thứ 3, Tiết 4-6: Chuyển sang thi giữa kỳ
--INSERT INTO ScheduleRequest (requestTypeId, classScheduleId, classRoomId, requesterId, requestDate, timeSlotId, changeType, oldClassRoomId, newClassRoomId, oldTimeSlotId, newTimeSlotId, exceptionDate, exceptionType, reason, approvedBy, requestStatusId, approvedAt, note)
--VALUES 
--(6, 18, NULL, 1, '2025-09-15', 4, 'exception', NULL, NULL, NULL, NULL, '2025-09-30', 'exam', N'Chuyển từ học sang thi giữa kỳ môn Cấu trúc dữ liệu và giải thuật', 1, 2, '2025-09-01 10:00:00', N'Admin đã phê duyệt chuyển sang thi');

---- Thêm lịch tạm ngưng cho sinh viên Ao Công Hiếu (COMP101 - Nhập môn lập trình)
---- Tuần 6, Thứ 3, Tiết 1-3: Tạm ngưng do bão
--INSERT INTO ScheduleRequest (requestTypeId, classScheduleId, classRoomId, requesterId, requestDate, timeSlotId, changeType, oldClassRoomId, newClassRoomId, oldTimeSlotId, newTimeSlotId, exceptionDate, exceptionType, reason, approvedBy, requestStatusId, approvedAt, note)
--VALUES 
--(5, 1, NULL, 1, '2025-10-15', 1, 'exception', NULL, NULL, NULL, NULL, '2025-10-14', 'cancelled', N'Tạm ngưng lớp do bão Noru', 1, 2, '2025-10-01 10:00:00', N'Admin đã phê duyệt tạm ngưng lớp do thời tiết');

---- =====================================================
---- END OF SAMPLE DATA
---- =====================================================
