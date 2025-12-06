-- =====================================================
-- DATABASE SCHEMA - CLASSROOM MANAGEMENT SYSTEM
-- Đại học Công nghiệp TP. Hồ Chí Minh (IUH)
-- =====================================================

USE master;
IF EXISTS(SELECT * FROM sys.databases WHERE name = 'ClassroomManagement')
BEGIN
    DROP DATABASE ClassroomManagement;
END
GO

CREATE DATABASE ClassroomManagement;
GO

USE ClassroomManagement;
GO

-- =====================================================
-- 1. BẢNG TRẠNG THÁI HỌC VẤN
-- =====================================================
CREATE TABLE AcademicStatus (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID trạng thái học vấn
    name NVARCHAR(255) NOT NULL -- Tên trạng thái: Đang học, Đã tốt nghiệp, Bỏ học
);

-- =====================================================
-- 2. BẢNG LOẠI PHÒNG/LỚP
-- =====================================================
CREATE TABLE ClassRoomType (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID loại phòng/lớp
    name NVARCHAR(255) NOT NULL -- Tên loại: Lý thuyết, Thực hành, Online
);

-- =====================================================
-- 3. BẢNG LOẠI YÊU CẦU
-- =====================================================
CREATE TABLE RequestType (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID loại yêu cầu
    name NVARCHAR(255) NOT NULL -- Tên loại: Đổi phòng, Đổi lịch, Tạm ngưng, Thi, Đổi giáo viên
);

-- =====================================================
-- 4. BẢNG TRẠNG THÁI YÊU CẦU
-- =====================================================
CREATE TABLE RequestStatus (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID trạng thái yêu cầu
    name NVARCHAR(255) NOT NULL -- Tên trạng thái: Chờ xử lý, Hoàn thành, Từ chối
);

-- =====================================================
-- 5. BẢNG KHOA/PHÒNG BAN
-- =====================================================
CREATE TABLE Department (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID khoa
    code NVARCHAR(50) UNIQUE NOT NULL, -- Mã khoa (VD: CNTT, CK, CD)
    name NVARCHAR(255) UNIQUE NOT NULL, -- Tên khoa
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE() -- Thời gian cập nhật
);

-- =====================================================
-- 6. BẢNG CHUYÊN NGÀNH
-- =====================================================
CREATE TABLE Major (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID chuyên ngành
    code NVARCHAR(50) UNIQUE NOT NULL, -- Mã chuyên ngành (VD: SE, AI, CTM)
    name NVARCHAR(255) NOT NULL, -- Tên chuyên ngành
    departmentId INT NOT NULL, -- ID khoa chủ quản
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (departmentId) REFERENCES Department(id)
);

-- =====================================================
-- 7. BẢNG TÀI KHOẢN
-- =====================================================
CREATE TABLE Account (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID tài khoản
    username NVARCHAR(255) UNIQUE NOT NULL, -- Tên đăng nhập
    password NVARCHAR(255) NOT NULL, -- Mật khẩu (đã hash)
    role NVARCHAR(50) NOT NULL, -- Vai trò: 'admin', 'teacher', 'student'
    isActive BIT DEFAULT 1, -- Trạng thái hoạt động
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE() -- Thời gian cập nhật
);

-- =====================================================
-- 8. BẢNG NGƯỜI DÙNG
-- =====================================================
CREATE TABLE [User] (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID người dùng
    accountId INT UNIQUE NOT NULL, -- ID tài khoản liên kết
    fullName NVARCHAR(255) NOT NULL, -- Họ và tên
    email NVARCHAR(255) UNIQUE NOT NULL, -- Email
    phone NVARCHAR(20), -- Số điện thoại
    address NVARCHAR(255), -- Địa chỉ
    avatar NVARCHAR(500), -- Link ảnh đại diện
    gender NVARCHAR(10), -- Giới tính: 'male', 'female', 'other'
    dateOfBirth DATE, -- Ngày sinh
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (accountId) REFERENCES Account(id) ON DELETE CASCADE
);

-- =====================================================
-- 9. BẢNG THÔNG TIN CÁ NHÂN MỞ RỘNG
-- =====================================================
CREATE TABLE PersonalProfile (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID thông tin cá nhân
    userId INT UNIQUE NOT NULL, -- ID người dùng
    idCardNumber NVARCHAR(50) NULL, -- Số CMND/CCCD
    idCardIssueDate DATE NULL, -- Ngày cấp CMND/CCCD
    idCardIssuePlace NVARCHAR(255) NULL, -- Nơi cấp CMND/CCCD
    placeOfBirth NVARCHAR(255) NULL, -- Nơi sinh
    permanentAddress NVARCHAR(500) NULL, -- Địa chỉ thường trú
    phoneEmergency NVARCHAR(50) NULL, -- Số điện thoại khẩn cấp
    bankName NVARCHAR(255) NULL, -- Tên ngân hàng
    bankBranch NVARCHAR(255) NULL, -- Chi nhánh ngân hàng
    bankAccountNumber NVARCHAR(50) NULL, -- Số tài khoản ngân hàng
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE
);

-- =====================================================
-- 10. BẢNG THÔNG TIN GIA ĐÌNH
-- =====================================================
CREATE TABLE FamilyInfo (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID thông tin gia đình
    userId INT UNIQUE NOT NULL, -- ID người dùng
    fatherFullName NVARCHAR(255) NULL, -- Họ tên cha
    fatherYearOfBirth INT NULL, -- Năm sinh cha
    fatherPhone NVARCHAR(50) NULL, -- Số điện thoại cha
    motherFullName NVARCHAR(255) NULL, -- Họ tên mẹ
    motherYearOfBirth INT NULL, -- Năm sinh mẹ
    motherPhone NVARCHAR(50) NULL, -- Số điện thoại mẹ
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE
);

-- =====================================================
-- 11. BẢNG THÔNG TIN HỌC VẤN
-- =====================================================
CREATE TABLE AcademicProfile (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID thông tin học vấn
    userId INT UNIQUE NOT NULL, -- ID người dùng
    role NVARCHAR(20) NOT NULL, -- Vai trò: 'teacher' | 'student'
    campus NVARCHAR(255) NULL, -- Cơ sở học tập
    trainingType NVARCHAR(255) NULL, -- Loại hình đào tạo
    degreeLevel NVARCHAR(255) NULL, -- Trình độ học vấn
    academicYear NVARCHAR(50) NULL, -- Năm học
    enrollmentDate DATE NULL, -- Ngày nhập học
    classCode NVARCHAR(50) NULL, -- Mã lớp (cho sinh viên)
    title NVARCHAR(255) NULL, -- Chức danh (cho giảng viên)
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE
);

-- =====================================================
-- 12. BẢNG GIẢNG VIÊN
-- =====================================================
CREATE TABLE Teacher (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID giảng viên
    userId INT UNIQUE NOT NULL, -- ID người dùng
    teacherCode NVARCHAR(50) UNIQUE NOT NULL, -- Mã giảng viên (VD: GV001)
    departmentId INT NULL, -- ID khoa chủ quản
    majorId INT NULL, -- ID chuyên ngành
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE,
    FOREIGN KEY (departmentId) REFERENCES Department(id),
    FOREIGN KEY (majorId) REFERENCES Major(id)
);

-- =====================================================
-- 13. BẢNG SINH VIÊN
-- =====================================================
CREATE TABLE Student (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID sinh viên
    userId INT UNIQUE NOT NULL, -- ID người dùng
    studentCode NVARCHAR(50) UNIQUE NOT NULL, -- Mã sinh viên (VD: 21026511)
    departmentId INT NULL, -- ID khoa chủ quản
    majorId INT NULL, -- ID chuyên ngành
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (userId) REFERENCES [User](id) ON DELETE CASCADE,
    FOREIGN KEY (departmentId) REFERENCES Department(id),
    FOREIGN KEY (majorId) REFERENCES Major(id)
);

-- =====================================================
-- 14. BẢNG LỚP HỌC
-- =====================================================
CREATE TABLE Class (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID lớp học
    code NVARCHAR(50) UNIQUE NOT NULL, -- Mã lớp học (VD: COMP101)
    className NVARCHAR(255) NOT NULL, -- Tên lớp học
    subjectName NVARCHAR(255) NOT NULL, -- Tên môn học
    subjectCode NVARCHAR(50) NOT NULL, -- Mã môn học
    credits INT NOT NULL, -- Số tín chỉ
    teacherId INT NOT NULL, -- ID giảng viên
    departmentId INT NOT NULL, -- ID khoa chủ quản của môn học
    majorId INT NULL, -- ID chuyên ngành (NULL nếu là môn chung)
    semester NVARCHAR(50) NOT NULL, -- Học kỳ
    academicYear NVARCHAR(50) NOT NULL, -- Năm học
    maxStudents INT NOT NULL, -- Số sinh viên tối đa
    totalWeeks INT NOT NULL, -- Tổng số tuần học
    startDate DATE NOT NULL, -- Ngày bắt đầu khóa học
    endDate DATE NOT NULL, -- Ngày kết thúc khóa học
    classRoomTypeId INT NOT NULL, -- ID loại phòng/lớp (1: Lý thuyết, 2: Thực hành, 3: Online)
    description NVARCHAR(MAX), -- Mô tả lớp học
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (teacherId) REFERENCES Teacher(id),
    FOREIGN KEY (departmentId) REFERENCES Department(id),
    FOREIGN KEY (majorId) REFERENCES Major(id),
    FOREIGN KEY (classRoomTypeId) REFERENCES ClassRoomType(id)
);

-- =====================================================
-- 15. BẢNG SINH VIÊN TRONG LỚP
-- =====================================================
CREATE TABLE ClassStudent (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID sinh viên trong lớp
    classId INT NOT NULL, -- ID lớp học
    studentId INT NOT NULL, -- ID sinh viên
    groupNumber INT, -- Số nhóm thực hành (NULL nếu là lớp lý thuyết)
    academicStatusId INT NOT NULL DEFAULT 1, -- ID trạng thái học vấn (1: Đang học, 2: Đã tốt nghiệp, 3: Bỏ học)
    joinedAt DATETIME DEFAULT GETDATE(), -- Thời gian tham gia lớp
    FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
    FOREIGN KEY (studentId) REFERENCES Student(id) ON DELETE CASCADE,
    FOREIGN KEY (academicStatusId) REFERENCES AcademicStatus(id),
    UNIQUE(classId, studentId) -- Một sinh viên chỉ có thể ở trong một lớp một lần
);

-- =====================================================
-- 16. BẢNG PHÒNG HỌC
-- =====================================================
CREATE TABLE ClassRoom (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID phòng học
    code NVARCHAR(50) UNIQUE NOT NULL, -- Mã phòng (VD: A1.1, H3.4)
    name NVARCHAR(255) NOT NULL, -- Tên phòng học
    capacity INT NOT NULL, -- Sức chứa
    building NVARCHAR(255) NOT NULL, -- Tòa nhà (VD: A, H, D, B)
    floor INT NOT NULL, -- Tầng
    campus NVARCHAR(255) NULL, -- Cơ sở
    classRoomTypeId INT NOT NULL, -- ID loại phòng (1: Lý thuyết, 2: Thực hành, 3: Online)
    departmentId INT NULL, -- ID khoa chủ quản phòng học (NULL = phòng chung)
    isAvailable BIT NOT NULL DEFAULT 1, -- Phòng có sẵn sàng sử dụng không
    description NVARCHAR(MAX), -- Mô tả phòng
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (departmentId) REFERENCES Department(id),
    FOREIGN KEY (classRoomTypeId) REFERENCES ClassRoomType(id)
);

-- =====================================================
-- 17. BẢNG KHUNG GIỜ HỌC
-- =====================================================
CREATE TABLE TimeSlot (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID tiết học
    slotName NVARCHAR(50) NOT NULL, -- Tên tiết (VD: 'Tiết 1-3', 'Tiết 4-6', 'Tiết 7-9')
    startTime TIME NOT NULL, -- Giờ bắt đầu
    endTime TIME NOT NULL, -- Giờ kết thúc
    shift INT NOT NULL -- Ca học: 1 (Sáng), 2 (Chiều), 3 (Tối)
);

-- =====================================================
-- 18. BẢNG LỊCH HỌC VÀ PHÂN PHÒNG
-- =====================================================
CREATE TABLE ClassSchedule (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID lịch học
    classId INT NOT NULL, -- ID lớp học
    teacherId INT NOT NULL, -- ID giảng viên
    classRoomId INT NULL, -- ID phòng học (NULL nếu chưa được phân phòng)
    dayOfWeek INT NOT NULL, -- Ngày trong tuần (1: Chủ nhật, 2: Thứ 2, ..., 7: Thứ 7)
    timeSlotId INT NOT NULL, -- ID tiết học (CỐ ĐỊNH - Admin không thay đổi)
    classRoomTypeId INT NOT NULL, -- ID loại phòng/lớp (1: Lý thuyết, 2: Thực hành, 3: Online)
    practiceGroup INT NULL, -- Số nhóm thực hành (NULL nếu là lý thuyết)
    weekPattern NVARCHAR(50) NOT NULL DEFAULT 'weekly', -- Mẫu tuần: 'weekly', 'biweekly', 'specific'
    startWeek INT NOT NULL, -- Tuần bắt đầu
    endWeek INT NOT NULL, -- Tuần kết thúc
    statusId INT NOT NULL DEFAULT 1, -- ID trạng thái lịch học (1: Chờ phân phòng, 2: Đã phân phòng, 3: Đang hoạt động, 4: Đã hủy, 5: Tạm ngưng, 6: Thi)
    assignedBy INT NULL, -- ID admin phân phòng (NULL nếu chưa phân)
    assignedAt DATETIME NULL, -- Thời gian phân phòng
    note NVARCHAR(MAX), -- Ghi chú
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE CASCADE,
    FOREIGN KEY (teacherId) REFERENCES Teacher(id),
    FOREIGN KEY (classRoomId) REFERENCES ClassRoom(id),
    FOREIGN KEY (timeSlotId) REFERENCES TimeSlot(id),
    FOREIGN KEY (classRoomTypeId) REFERENCES ClassRoomType(id),
    FOREIGN KEY (assignedBy) REFERENCES [User](id),
    FOREIGN KEY (statusId) REFERENCES RequestType(id)
);

-- =====================================================
-- 19. BẢNG YÊU CẦU THAY ĐỔI LỊCH HỌC (Gộp RoomRequest + ScheduleChange)
-- =====================================================
CREATE TABLE ScheduleRequest (
    id INT IDENTITY(1,1) PRIMARY KEY, -- ID yêu cầu
    requestTypeId INT NOT NULL, -- ID loại yêu cầu (1: Đổi phòng, 2: Đổi lịch, 3: Tạm ngưng, 4: Thi, 5: Đổi giáo viên, 10: Thi cuối kỳ)
    classScheduleId INT NULL, -- ID lịch học (NULL nếu là yêu cầu phòng độc lập hoặc thi cuối kỳ)
    classId INT NULL, -- ID lớp học (cho thi cuối kỳ - RequestType 10)
    classRoomId INT NULL, -- ID phòng yêu cầu (cho room_request)
    requesterId INT NOT NULL, -- ID người gửi yêu cầu
    requestDate DATE NOT NULL, -- Ngày gửi yêu cầu
    timeSlotId INT NOT NULL, -- ID tiết yêu cầu
    -- Thông tin thay đổi (cho schedule_change)
    changeType NVARCHAR(50) NULL, -- Loại thay đổi: 'room_change', 'time_change', 'both', 'exception'
    oldClassRoomId INT NULL, -- ID phòng cũ (NULL nếu thay đổi tiết)
    newClassRoomId INT NULL, -- ID phòng mới (NULL nếu thay đổi tiết)
    oldTimeSlotId INT NULL, -- ID tiết cũ (NULL nếu thay đổi phòng)
    newTimeSlotId INT NULL, -- ID tiết mới (NULL nếu thay đổi phòng)
    -- Thông tin ngoại lệ (cho exception)
    exceptionDate DATE NULL, -- Ngày có ngoại lệ (VD: 2025-09-07)
    exceptionType NVARCHAR(50) NULL, -- Loại ngoại lệ: 'cancelled', 'exam', 'moved', 'substitute'
    movedToDate DATE NULL, -- Ngày chuyển đến (nếu type = 'moved')
    movedToTimeSlotId INT NULL, -- ID tiết chuyển đến (nếu type = 'moved')
    movedToDayOfWeek INT NULL, -- Thứ trong tuần muốn đổi (1: Chủ nhật, 2: Thứ 2, ..., 7: Thứ 7)
    movedToClassRoomId INT NULL, -- ID phòng chuyển đến (nếu type = 'moved')
    substituteTeacherId INT NULL, -- ID giảng viên thay thế (nếu type = 'substitute')
    -- Thông tin chung
    reason NVARCHAR(MAX) NOT NULL, -- Lý do yêu cầu
    approvedBy INT NULL, -- ID admin phê duyệt
    requestStatusId INT NOT NULL DEFAULT 1, -- ID trạng thái yêu cầu (1: Chờ xử lý, 2: Hoàn thành, 3: Từ chối)
    approvedAt DATETIME NULL, -- Thời gian phê duyệt
    note NVARCHAR(MAX), -- Ghi chú của admin
    createdAt DATETIME DEFAULT GETDATE(), -- Thời gian tạo
    updatedAt DATETIME DEFAULT GETDATE(), -- Thời gian cập nhật
    FOREIGN KEY (classScheduleId) REFERENCES ClassSchedule(id) ON DELETE CASCADE,
    FOREIGN KEY (classId) REFERENCES Class(id) ON DELETE NO ACTION,
    FOREIGN KEY (classRoomId) REFERENCES ClassRoom(id),
    FOREIGN KEY (oldClassRoomId) REFERENCES ClassRoom(id),
    FOREIGN KEY (newClassRoomId) REFERENCES ClassRoom(id),
    FOREIGN KEY (oldTimeSlotId) REFERENCES TimeSlot(id),
    FOREIGN KEY (newTimeSlotId) REFERENCES TimeSlot(id),
    FOREIGN KEY (movedToTimeSlotId) REFERENCES TimeSlot(id),
    FOREIGN KEY (movedToClassRoomId) REFERENCES ClassRoom(id),
    FOREIGN KEY (substituteTeacherId) REFERENCES Teacher(id),
    FOREIGN KEY (requesterId) REFERENCES [User](id),
    FOREIGN KEY (approvedBy) REFERENCES [User](id),
    FOREIGN KEY (requestTypeId) REFERENCES RequestType(id),
    FOREIGN KEY (requestStatusId) REFERENCES RequestStatus(id)
);

-- =====================================================
-- RÀNG BUỘC VÀ CHỈ MỤC
-- =====================================================

-- Class
ALTER TABLE Class
ADD CONSTRAINT CK_Class_Dates CHECK (startDate <= endDate);

-- ClassStudent: ràng buộc trạng thái học vấn
ALTER TABLE ClassStudent
ADD CONSTRAINT CK_ClassStudent_AcademicStatus CHECK (academicStatusId BETWEEN 1 AND 3);

-- ClassRoom: loại phòng hợp lệ
ALTER TABLE ClassRoom
ADD CONSTRAINT CK_ClassRoom_Type CHECK (classRoomTypeId BETWEEN 1 AND 3);

-- TimeSlot: ca học hợp lệ và thời gian kết thúc > thời gian bắt đầu
ALTER TABLE TimeSlot
ADD CONSTRAINT CK_TimeSlot_Shift CHECK (shift BETWEEN 1 AND 3);

ALTER TABLE TimeSlot
ADD CONSTRAINT CK_TimeSlot_Time CHECK (startTime < endTime);

-- ClassSchedule: ràng buộc ngày trong tuần và trạng thái
ALTER TABLE ClassSchedule
ADD CONSTRAINT CK_ClassSchedule_DayOfWeek CHECK (dayOfWeek BETWEEN 1 AND 7);

-- Trạng thái lịch học phải là 1-6 (các trạng thái lịch học trong RequestType)
ALTER TABLE ClassSchedule
ADD CONSTRAINT CK_ClassSchedule_StatusId CHECK (statusId BETWEEN 1 AND 6);

ALTER TABLE ClassSchedule
ADD CONSTRAINT CK_ClassSchedule_Weeks CHECK (startWeek <= endWeek);

-- Ràng buộc loại phòng/lớp: 1 = Lý thuyết, 2 = Thực hành, 3 = Online
ALTER TABLE ClassSchedule
ADD CONSTRAINT CK_ClassSchedule_ClassRoomType CHECK (classRoomTypeId BETWEEN 1 AND 3);

-- Ràng buộc nhóm thực hành: NULL nếu là lý thuyết, 1-99 nếu là thực hành
ALTER TABLE ClassSchedule
ADD CONSTRAINT CK_ClassSchedule_PracticeGroup CHECK (
    (classRoomTypeId = 1 AND practiceGroup IS NULL) OR 
    (classRoomTypeId = 2 AND practiceGroup IS NOT NULL AND practiceGroup BETWEEN 1 AND 99) OR
    (classRoomTypeId = 3 AND practiceGroup IS NULL)
);

-- Tránh trùng lịch: phòng học không thể bị double-book trong cùng ngày/ca
CREATE UNIQUE INDEX UQ_ClassSchedule_Room_Time ON ClassSchedule (dayOfWeek, timeSlotId, classRoomId) 
WHERE classRoomId IS NOT NULL AND statusId IN (2, 3); -- Chỉ áp dụng cho lịch đã phân phòng và đang hoạt động

-- Tránh trùng lịch: giảng viên không thể dạy 2 nơi cùng ca/ngày
CREATE UNIQUE INDEX UQ_ClassSchedule_Teacher_Time ON ClassSchedule (dayOfWeek, timeSlotId, teacherId)
WHERE statusId IN (2, 3); -- Chỉ áp dụng cho lịch đã phân phòng và đang hoạt động

-- ScheduleRequest
ALTER TABLE ScheduleRequest
ADD CONSTRAINT CK_ScheduleRequest_Type CHECK (requestTypeId BETWEEN 1 AND 10);

ALTER TABLE ScheduleRequest
ADD CONSTRAINT CK_ScheduleRequest_Status CHECK (requestStatusId BETWEEN 1 AND 3);
ALTER TABLE ScheduleRequest
ADD CONSTRAINT CK_ScheduleRequest_DayOfWeek CHECK (movedToDayOfWeek BETWEEN 1 AND 7);
GO

-- =====================================================
-- STORED PROCEDURES - XỬ LÝ NGOẠI LỆ LỊCH HỌC
-- =====================================================

-- Function: Lấy thứ tự ưu tiên của loại ngoại lệ
-- Thứ tự ưu tiên: Tạm ngưng (4) > Thi (3) > Đổi lịch (2) > Đổi phòng (1)
CREATE FUNCTION dbo.fn_GetExceptionPriority(@requestTypeId INT)
RETURNS INT
AS
BEGIN
    DECLARE @priority INT;
    
    -- Tạm ngưng: ưu tiên cao nhất
    IF @requestTypeId = 3
        SET @priority = 4;
    -- Thi: ưu tiên cao
    ELSE IF @requestTypeId IN (4, 10)
        SET @priority = 3;
    -- Đổi lịch: ưu tiên trung bình
    ELSE IF @requestTypeId = 8
        SET @priority = 2;
    -- Đổi phòng: ưu tiên thấp nhất
    ELSE IF @requestTypeId IN (1, 5, 6, 7)
        SET @priority = 1;
    ELSE
        SET @priority = 0;
    
    RETURN @priority;
END;
GO

-- Stored Procedure: Kiểm tra conflict phòng học
-- Kiểm tra xem phòng có đang được sử dụng bởi lịch học hoặc ngoại lệ khác không
CREATE PROCEDURE sp_CheckRoomConflict
    @classRoomId INT,
    @targetDate DATE,
    @targetTimeSlotId INT,
    @excludeScheduleRequestId INT = NULL, -- Loại trừ ngoại lệ hiện tại khi update
    @excludeClassScheduleId INT = NULL,  -- Loại trừ lịch học hiện tại
    @hasConflict BIT OUTPUT,
    @conflictType NVARCHAR(50) OUTPUT,   -- 'schedule' hoặc 'exception'
    @conflictId INT OUTPUT,               -- ID của conflict
    @conflictMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET @hasConflict = 0;
    SET @conflictType = NULL;
    SET @conflictId = NULL;
    SET @conflictMessage = NULL;
    
    -- Tính dayOfWeek từ targetDate (1=Chủ nhật, 2=Thứ 2, ..., 7=Thứ 7)
    DECLARE @dayOfWeek INT;
    SET @dayOfWeek = CASE 
        WHEN DATEPART(WEEKDAY, @targetDate) = 1 THEN 1  -- Chủ nhật
        ELSE DATEPART(WEEKDAY, @targetDate)              -- Thứ 2-7
    END;
    
    -- 1. Kiểm tra conflict với lịch học thường xuyên
    DECLARE @scheduleConflict INT;
    SELECT TOP 1 @scheduleConflict = id
    FROM ClassSchedule
    WHERE dayOfWeek = @dayOfWeek
        AND timeSlotId = @targetTimeSlotId
        AND classRoomId = @classRoomId
        AND statusId IN (2, 3) -- Đã phân phòng hoặc đang hoạt động
        AND (@excludeClassScheduleId IS NULL OR id <> @excludeClassScheduleId);
    
    IF @scheduleConflict IS NOT NULL
    BEGIN
        SET @hasConflict = 1;
        SET @conflictType = 'schedule';
        SET @conflictId = @scheduleConflict;
        SET @conflictMessage = N'Phòng học đang được sử dụng bởi lịch học thường xuyên';
        RETURN;
    END;
    
    -- 2. Kiểm tra conflict với ngoại lệ khác
    -- Lấy ngày bắt đầu và kết thúc của ngày target
    DECLARE @targetDateStart DATETIME;
    DECLARE @targetDateEnd DATETIME;
    SET @targetDateStart = CAST(@targetDate AS DATETIME);
    SET @targetDateEnd = DATEADD(DAY, 1, @targetDateStart);
    
    DECLARE @exceptionConflict INT;
    DECLARE @exceptionRequestTypeId INT;
    DECLARE @exceptionPriority INT;
    DECLARE @isSuspended BIT;
    
    -- Tìm ngoại lệ conflict (chỉ kiểm tra ngoại lệ đã duyệt - status 2)
    SELECT TOP 1 
        @exceptionConflict = sr.id,
        @exceptionRequestTypeId = sr.requestTypeId,
        @exceptionPriority = dbo.fn_GetExceptionPriority(sr.requestTypeId)
    FROM ScheduleRequest sr
    WHERE sr.requestStatusId = 2 -- Chỉ kiểm tra ngoại lệ đã duyệt
        AND (@excludeScheduleRequestId IS NULL OR sr.id <> @excludeScheduleRequestId)
        AND (
            -- Ngoại lệ sử dụng phòng này trong cùng ngày và tiết
            (
                (sr.newClassRoomId = @classRoomId OR sr.movedToClassRoomId = @classRoomId)
                AND (
                    (sr.exceptionDate >= @targetDateStart AND sr.exceptionDate < @targetDateEnd)
                    OR (sr.movedToDate >= @targetDateStart AND sr.movedToDate < @targetDateEnd)
                )
                AND (
                    sr.newTimeSlotId = @targetTimeSlotId 
                    OR sr.movedToTimeSlotId = @targetTimeSlotId
                    OR (sr.classScheduleId IS NOT NULL AND EXISTS (
                        SELECT 1 FROM ClassSchedule cs 
                        WHERE cs.id = sr.classScheduleId 
                        AND cs.timeSlotId = @targetTimeSlotId
                    ))
                )
            )
        )
        AND NOT (
            -- Loại trừ ngoại lệ tạm ngưng (phòng trống)
            sr.requestTypeId = 3 OR sr.exceptionType = 'cancelled'
        )
    ORDER BY dbo.fn_GetExceptionPriority(sr.requestTypeId) DESC;
    
    IF @exceptionConflict IS NOT NULL
    BEGIN
        SET @hasConflict = 1;
        SET @conflictType = 'exception';
        SET @conflictId = @exceptionConflict;
        
        DECLARE @exceptionTypeName NVARCHAR(255);
        SELECT @exceptionTypeName = name FROM RequestType WHERE id = @exceptionRequestTypeId;
        
        SET @conflictMessage = N'Phòng học đang được sử dụng bởi ngoại lệ: ' + ISNULL(@exceptionTypeName, N'Không xác định');
        RETURN;
    END;
END;
GO

-- Stored Procedure: Kiểm tra conflict giảng viên
-- Kiểm tra xem giảng viên có đang dạy ở nơi khác trong cùng thời gian không
CREATE PROCEDURE sp_CheckTeacherConflict
    @teacherId INT,
    @targetDate DATE,
    @targetTimeSlotId INT,
    @excludeScheduleRequestId INT = NULL,
    @excludeClassScheduleId INT = NULL,
    @hasConflict BIT OUTPUT,
    @conflictType NVARCHAR(50) OUTPUT,
    @conflictId INT OUTPUT,
    @conflictMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET @hasConflict = 0;
    SET @conflictType = NULL;
    SET @conflictId = NULL;
    SET @conflictMessage = NULL;
    
    -- Tính dayOfWeek từ targetDate
    DECLARE @dayOfWeek INT;
    SET @dayOfWeek = CASE 
        WHEN DATEPART(WEEKDAY, @targetDate) = 1 THEN 1
        ELSE DATEPART(WEEKDAY, @targetDate)
    END;
    
    -- 1. Kiểm tra conflict với lịch học thường xuyên
    DECLARE @scheduleConflict INT;
    SELECT TOP 1 @scheduleConflict = id
    FROM ClassSchedule
    WHERE dayOfWeek = @dayOfWeek
        AND timeSlotId = @targetTimeSlotId
        AND teacherId = @teacherId
        AND statusId IN (2, 3)
        AND (@excludeClassScheduleId IS NULL OR id <> @excludeClassScheduleId);
    
    IF @scheduleConflict IS NOT NULL
    BEGIN
        SET @hasConflict = 1;
        SET @conflictType = 'schedule';
        SET @conflictId = @scheduleConflict;
        SET @conflictMessage = N'Giảng viên đang có lịch dạy khác trong cùng thời gian';
        RETURN;
    END;
    
    -- 2. Kiểm tra conflict với ngoại lệ khác (thi cuối kỳ, đổi lịch, etc.)
    DECLARE @targetDateStart DATETIME;
    DECLARE @targetDateEnd DATETIME;
    SET @targetDateStart = CAST(@targetDate AS DATETIME);
    SET @targetDateEnd = DATEADD(DAY, 1, @targetDateStart);
    
    DECLARE @exceptionConflict INT;
    DECLARE @exceptionRequestTypeId INT;
    
    -- Kiểm tra ngoại lệ có giảng viên thay thế hoặc giảng viên gốc
    SELECT TOP 1 
        @exceptionConflict = sr.id,
        @exceptionRequestTypeId = sr.requestTypeId
    FROM ScheduleRequest sr
    LEFT JOIN ClassSchedule cs ON sr.classScheduleId = cs.id
    WHERE sr.requestStatusId = 2
        AND (@excludeScheduleRequestId IS NULL OR sr.id <> @excludeScheduleRequestId)
        AND (
            -- Giảng viên thay thế trong ngoại lệ
            sr.substituteTeacherId = @teacherId
            OR 
            -- Giảng viên gốc trong lịch học có ngoại lệ
            (cs.teacherId = @teacherId AND sr.classScheduleId IS NOT NULL)
        )
        AND (
            (sr.exceptionDate >= @targetDateStart AND sr.exceptionDate < @targetDateEnd)
            OR (sr.movedToDate >= @targetDateStart AND sr.movedToDate < @targetDateEnd)
        )
        AND (
            sr.newTimeSlotId = @targetTimeSlotId 
            OR sr.movedToTimeSlotId = @targetTimeSlotId
            OR (sr.classScheduleId IS NOT NULL AND EXISTS (
                SELECT 1 FROM ClassSchedule cs2 
                WHERE cs2.id = sr.classScheduleId 
                AND cs2.timeSlotId = @targetTimeSlotId
            ))
        );
    
    IF @exceptionConflict IS NOT NULL
    BEGIN
        SET @hasConflict = 1;
        SET @conflictType = 'exception';
        SET @conflictId = @exceptionConflict;
        
        DECLARE @exceptionTypeName NVARCHAR(255);
        SELECT @exceptionTypeName = name FROM RequestType WHERE id = @exceptionRequestTypeId;
        
        SET @conflictMessage = N'Giảng viên đang có ngoại lệ khác: ' + ISNULL(@exceptionTypeName, N'Không xác định');
        RETURN;
    END;
END;
GO

-- Stored Procedure: Kiểm tra conflict với ngoại lệ khác (xét thứ tự ưu tiên)
-- Cho phép ngoại lệ có ưu tiên cao hơn ghi đè ngoại lệ có ưu tiên thấp hơn
CREATE PROCEDURE sp_CheckExceptionConflict
    @classScheduleId INT = NULL,
    @classId INT = NULL, -- Cho thi cuối kỳ
    @exceptionDate DATE,
    @requestTypeId INT,
    @newTimeSlotId INT = NULL,
    @newClassRoomId INT = NULL,
    @movedToDate DATE = NULL,
    @movedToTimeSlotId INT = NULL,
    @movedToClassRoomId INT = NULL,
    @excludeScheduleRequestId INT = NULL, -- Loại trừ ngoại lệ hiện tại khi update
    @hasConflict BIT OUTPUT,
    @conflictId INT OUTPUT,
    @conflictPriority INT OUTPUT,
    @conflictMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET @hasConflict = 0;
    SET @conflictId = NULL;
    SET @conflictPriority = NULL;
    SET @conflictMessage = NULL;
    
    DECLARE @currentPriority INT;
    SET @currentPriority = dbo.fn_GetExceptionPriority(@requestTypeId);
    
    -- Xác định ngày và tiết cần kiểm tra
    DECLARE @targetDate DATE;
    DECLARE @targetTimeSlotId INT;
    DECLARE @targetClassRoomId INT;
    
    -- Ưu tiên movedToDate nếu có (cho đổi lịch/thi)
    IF @movedToDate IS NOT NULL
    BEGIN
        SET @targetDate = @movedToDate;
        SET @targetTimeSlotId = ISNULL(@movedToTimeSlotId, @newTimeSlotId);
        SET @targetClassRoomId = ISNULL(@movedToClassRoomId, @newClassRoomId);
    END
    ELSE
    BEGIN
        SET @targetDate = @exceptionDate;
        SET @targetTimeSlotId = @newTimeSlotId;
        SET @targetClassRoomId = @newClassRoomId;
    END;
    
    IF @targetDate IS NULL OR @targetTimeSlotId IS NULL
    BEGIN
        SET @conflictMessage = N'Thiếu thông tin ngày hoặc tiết học';
        RETURN;
    END;
    
    DECLARE @targetDateStart DATETIME;
    DECLARE @targetDateEnd DATETIME;
    SET @targetDateStart = CAST(@targetDate AS DATETIME);
    SET @targetDateEnd = DATEADD(DAY, 1, @targetDateStart);
    
    -- Tìm ngoại lệ conflict (chỉ kiểm tra ngoại lệ đã duyệt)
    DECLARE @conflictExceptionId INT;
    DECLARE @conflictExceptionPriority INT;
    DECLARE @conflictExceptionTypeId INT;
    DECLARE @conflictExceptionTypeName NVARCHAR(255);
    
    SELECT TOP 1
        @conflictExceptionId = sr.id,
        @conflictExceptionPriority = dbo.fn_GetExceptionPriority(sr.requestTypeId),
        @conflictExceptionTypeId = sr.requestTypeId
    FROM ScheduleRequest sr
    WHERE sr.requestStatusId = 2 -- Chỉ kiểm tra ngoại lệ đã duyệt
        AND (@excludeScheduleRequestId IS NULL OR sr.id <> @excludeScheduleRequestId)
        AND (
            -- Cùng lịch học hoặc cùng lớp (cho thi cuối kỳ)
            (@classScheduleId IS NOT NULL AND sr.classScheduleId = @classScheduleId)
            OR (@classId IS NOT NULL AND sr.classId = @classId)
        )
        AND (
            -- Cùng ngày
            (sr.exceptionDate >= @targetDateStart AND sr.exceptionDate < @targetDateEnd)
            OR (sr.movedToDate >= @targetDateStart AND sr.movedToDate < @targetDateEnd)
        )
        AND (
            -- Cùng tiết
            sr.newTimeSlotId = @targetTimeSlotId
            OR sr.movedToTimeSlotId = @targetTimeSlotId
            OR (sr.classScheduleId IS NOT NULL AND EXISTS (
                SELECT 1 FROM ClassSchedule cs 
                WHERE cs.id = sr.classScheduleId 
                AND cs.timeSlotId = @targetTimeSlotId
            ))
        )
        AND NOT (
            -- Loại trừ ngoại lệ tạm ngưng (có thể ghi đè)
            sr.requestTypeId = 3 AND @currentPriority > 3
        )
    ORDER BY dbo.fn_GetExceptionPriority(sr.requestTypeId) DESC;
    
    IF @conflictExceptionId IS NOT NULL
    BEGIN
        -- Kiểm tra thứ tự ưu tiên
        IF @conflictExceptionPriority >= @currentPriority
        BEGIN
            SET @hasConflict = 1;
            SET @conflictId = @conflictExceptionId;
            SET @conflictPriority = @conflictExceptionPriority;
            
            SELECT @conflictExceptionTypeName = name FROM RequestType WHERE id = @conflictExceptionTypeId;
            
            SET @conflictMessage = N'Đã có ngoại lệ có ưu tiên cao hơn hoặc bằng: ' + ISNULL(@conflictExceptionTypeName, N'Không xác định');
        END
        -- Nếu ngoại lệ hiện tại có ưu tiên cao hơn, cho phép ghi đè (không conflict)
    END;
END;
GO

-- Stored Procedure: Validate việc tạo/cập nhật ngoại lệ
-- Tổng hợp tất cả các kiểm tra conflict
CREATE PROCEDURE sp_ValidateExceptionChange
    @classScheduleId INT = NULL,
    @classId INT = NULL,
    @exceptionDate DATE,
    @requestTypeId INT,
    @teacherId INT = NULL, -- Giảng viên của lịch học hoặc giảng viên thay thế
    @newTimeSlotId INT = NULL,
    @newClassRoomId INT = NULL,
    @movedToDate DATE = NULL,
    @movedToTimeSlotId INT = NULL,
    @movedToClassRoomId INT = NULL,
    @substituteTeacherId INT = NULL,
    @excludeScheduleRequestId INT = NULL,
    @excludeClassScheduleId INT = NULL,
    @isValid BIT OUTPUT,
    @errorMessage NVARCHAR(500) OUTPUT
AS
BEGIN
    SET @isValid = 1;
    SET @errorMessage = NULL;
    
    -- 1. Kiểm tra conflict phòng học nếu có newClassRoomId hoặc movedToClassRoomId
    IF @newClassRoomId IS NOT NULL OR @movedToClassRoomId IS NOT NULL
    BEGIN
        DECLARE @targetRoomId INT;
        DECLARE @targetDate DATE;
        DECLARE @targetTimeSlot INT;
        
        IF @movedToClassRoomId IS NOT NULL
        BEGIN
            SET @targetRoomId = @movedToClassRoomId;
            SET @targetDate = ISNULL(@movedToDate, @exceptionDate);
            SET @targetTimeSlot = ISNULL(@movedToTimeSlotId, @newTimeSlotId);
        END
        ELSE
        BEGIN
            SET @targetRoomId = @newClassRoomId;
            SET @targetDate = @exceptionDate;
            SET @targetTimeSlot = @newTimeSlotId;
        END;
        
        IF @targetRoomId IS NOT NULL AND @targetDate IS NOT NULL AND @targetTimeSlot IS NOT NULL
        BEGIN
            DECLARE @roomHasConflict BIT;
            DECLARE @roomConflictType NVARCHAR(50);
            DECLARE @roomConflictId INT;
            DECLARE @roomConflictMessage NVARCHAR(500);
            
            EXEC sp_CheckRoomConflict
                @classRoomId = @targetRoomId,
                @targetDate = @targetDate,
                @targetTimeSlotId = @targetTimeSlot,
                @excludeScheduleRequestId = @excludeScheduleRequestId,
                @excludeClassScheduleId = @excludeClassScheduleId,
                @hasConflict = @roomHasConflict OUTPUT,
                @conflictType = @roomConflictType OUTPUT,
                @conflictId = @roomConflictId OUTPUT,
                @conflictMessage = @roomConflictMessage OUTPUT;
            
            IF @roomHasConflict = 1
            BEGIN
                SET @isValid = 0;
                SET @errorMessage = @roomConflictMessage;
                RETURN;
            END;
        END;
    END;
    
    -- 2. Kiểm tra conflict giảng viên
    DECLARE @checkTeacherId INT;
    SET @checkTeacherId = ISNULL(@substituteTeacherId, @teacherId);
    
    IF @checkTeacherId IS NOT NULL
    BEGIN
        DECLARE @targetDateForTeacher DATE;
        DECLARE @targetTimeSlotForTeacher INT;
        
        IF @movedToDate IS NOT NULL
        BEGIN
            SET @targetDateForTeacher = @movedToDate;
            SET @targetTimeSlotForTeacher = ISNULL(@movedToTimeSlotId, @newTimeSlotId);
        END
        ELSE
        BEGIN
            SET @targetDateForTeacher = @exceptionDate;
            SET @targetTimeSlotForTeacher = @newTimeSlotId;
        END;
        
        IF @targetDateForTeacher IS NOT NULL AND @targetTimeSlotForTeacher IS NOT NULL
        BEGIN
            DECLARE @teacherHasConflict BIT;
            DECLARE @teacherConflictType NVARCHAR(50);
            DECLARE @teacherConflictId INT;
            DECLARE @teacherConflictMessage NVARCHAR(500);
            
            EXEC sp_CheckTeacherConflict
                @teacherId = @checkTeacherId,
                @targetDate = @targetDateForTeacher,
                @targetTimeSlotId = @targetTimeSlotForTeacher,
                @excludeScheduleRequestId = @excludeScheduleRequestId,
                @excludeClassScheduleId = @excludeClassScheduleId,
                @hasConflict = @teacherHasConflict OUTPUT,
                @conflictType = @teacherConflictType OUTPUT,
                @conflictId = @teacherConflictId OUTPUT,
                @conflictMessage = @teacherConflictMessage OUTPUT;
            
            IF @teacherHasConflict = 1
            BEGIN
                SET @isValid = 0;
                SET @errorMessage = @teacherConflictMessage;
                RETURN;
            END;
        END;
    END;
    
    -- 3. Kiểm tra conflict với ngoại lệ khác (xét thứ tự ưu tiên)
    DECLARE @exceptionHasConflict BIT;
    DECLARE @exceptionConflictId INT;
    DECLARE @exceptionConflictPriority INT;
    DECLARE @exceptionConflictMessage NVARCHAR(500);
    
    EXEC sp_CheckExceptionConflict
        @classScheduleId = @classScheduleId,
        @classId = @classId,
        @exceptionDate = @exceptionDate,
        @requestTypeId = @requestTypeId,
        @newTimeSlotId = @newTimeSlotId,
        @newClassRoomId = @newClassRoomId,
        @movedToDate = @movedToDate,
        @movedToTimeSlotId = @movedToTimeSlotId,
        @movedToClassRoomId = @movedToClassRoomId,
        @excludeScheduleRequestId = @excludeScheduleRequestId,
        @hasConflict = @exceptionHasConflict OUTPUT,
        @conflictId = @exceptionConflictId OUTPUT,
        @conflictPriority = @exceptionConflictPriority OUTPUT,
        @conflictMessage = @exceptionConflictMessage OUTPUT;
    
    IF @exceptionHasConflict = 1
    BEGIN
        SET @isValid = 0;
        SET @errorMessage = @exceptionConflictMessage;
        RETURN;
    END;
END;
GO

-- Stored Procedure: Lấy danh sách ngoại lệ conflict cho một ngày/tiết/phòng
-- Hữu ích cho frontend để hiển thị conflict khi chọn lịch
CREATE PROCEDURE sp_GetConflictsForSchedule
    @targetDate DATE,
    @targetTimeSlotId INT,
    @classRoomId INT = NULL,
    @teacherId INT = NULL
AS
BEGIN
    -- Tính dayOfWeek
    DECLARE @dayOfWeek INT;
    SET @dayOfWeek = CASE 
        WHEN DATEPART(WEEKDAY, @targetDate) = 1 THEN 1
        ELSE DATEPART(WEEKDAY, @targetDate)
    END;
    
    DECLARE @targetDateStart DATETIME;
    DECLARE @targetDateEnd DATETIME;
    SET @targetDateStart = CAST(@targetDate AS DATETIME);
    SET @targetDateEnd = DATEADD(DAY, 1, @targetDateStart);
    
    -- Lấy lịch học conflict
    SELECT 
        'schedule' AS conflictType,
        cs.id AS conflictId,
        cs.classId,
        c.className,
        c.code AS classCode,
        t.teacherCode,
        u.fullName AS teacherName,
        cr.code AS roomCode,
        cr.name AS roomName,
        ts.slotName,
        cs.statusId,
        0 AS priority,
        NULL AS requestTypeId,
        NULL AS requestTypeName
    FROM ClassSchedule cs
    INNER JOIN Class c ON cs.classId = c.id
    INNER JOIN Teacher t ON cs.teacherId = t.id
    INNER JOIN [User] u ON t.userId = u.id
    LEFT JOIN ClassRoom cr ON cs.classRoomId = cr.id
    INNER JOIN TimeSlot ts ON cs.timeSlotId = ts.id
    WHERE cs.dayOfWeek = @dayOfWeek
        AND cs.timeSlotId = @targetTimeSlotId
        AND cs.statusId IN (2, 3)
        AND (@classRoomId IS NULL OR cs.classRoomId = @classRoomId)
        AND (@teacherId IS NULL OR cs.teacherId = @teacherId);
    
    -- Lấy ngoại lệ conflict
    SELECT 
        'exception' AS conflictType,
        sr.id AS conflictId,
        ISNULL(sr.classId, cs.classId) AS classId,
        ISNULL(c2.className, c.className) AS className,
        ISNULL(c2.code, c.code) AS classCode,
        ISNULL(st.teacherCode, t.teacherCode) AS teacherCode,
        ISNULL(u2.fullName, u.fullName) AS teacherName,
        ISNULL(cr2.code, cr.code) AS roomCode,
        ISNULL(cr2.name, cr.name) AS roomName,
        ISNULL(ts2.slotName, ts.slotName) AS slotName,
        NULL AS statusId,
        dbo.fn_GetExceptionPriority(sr.requestTypeId) AS priority,
        sr.requestTypeId,
        rt.name AS requestTypeName
    FROM ScheduleRequest sr
    LEFT JOIN ClassSchedule cs ON sr.classScheduleId = cs.id
    LEFT JOIN Class c ON cs.classId = c.id
    LEFT JOIN Class c2 ON sr.classId = c2.id
    LEFT JOIN Teacher t ON cs.teacherId = t.id
    LEFT JOIN Teacher st ON sr.substituteTeacherId = st.id
    LEFT JOIN [User] u ON t.userId = u.id
    LEFT JOIN [User] u2 ON st.userId = u2.id
    LEFT JOIN ClassRoom cr ON cs.classRoomId = cr.id
    LEFT JOIN ClassRoom cr2 ON sr.newClassRoomId = cr2.id OR sr.movedToClassRoomId = cr2.id
    LEFT JOIN TimeSlot ts ON cs.timeSlotId = ts.id
    LEFT JOIN TimeSlot ts2 ON sr.newTimeSlotId = ts2.id OR sr.movedToTimeSlotId = ts2.id
    INNER JOIN RequestType rt ON sr.requestTypeId = rt.id
    WHERE sr.requestStatusId = 2 -- Chỉ lấy ngoại lệ đã duyệt
        AND (
            (sr.exceptionDate >= @targetDateStart AND sr.exceptionDate < @targetDateEnd)
            OR (sr.movedToDate >= @targetDateStart AND sr.movedToDate < @targetDateEnd)
        )
        AND (
            sr.newTimeSlotId = @targetTimeSlotId
            OR sr.movedToTimeSlotId = @targetTimeSlotId
            OR (sr.classScheduleId IS NOT NULL AND EXISTS (
                SELECT 1 FROM ClassSchedule cs3 
                WHERE cs3.id = sr.classScheduleId 
                AND cs3.timeSlotId = @targetTimeSlotId
            ))
        )
        AND (
            @classRoomId IS NULL 
            OR sr.newClassRoomId = @classRoomId 
            OR sr.movedToClassRoomId = @classRoomId
            OR (sr.classScheduleId IS NOT NULL AND EXISTS (
                SELECT 1 FROM ClassSchedule cs4 
                WHERE cs4.id = sr.classScheduleId 
                AND cs4.classRoomId = @classRoomId
            ))
        )
        AND (
            @teacherId IS NULL
            OR sr.substituteTeacherId = @teacherId
            OR (sr.classScheduleId IS NOT NULL AND EXISTS (
                SELECT 1 FROM ClassSchedule cs5 
                WHERE cs5.id = sr.classScheduleId 
                AND cs5.teacherId = @teacherId
            ))
        )
        AND NOT (
            -- Loại trừ ngoại lệ tạm ngưng (phòng trống)
            sr.requestTypeId = 3 OR sr.exceptionType = 'cancelled'
        )
    ORDER BY dbo.fn_GetExceptionPriority(sr.requestTypeId) DESC;
END;
GO

-- Stored Procedure: Gán phòng cho lịch học (với kiểm tra conflict đầy đủ)
CREATE PROCEDURE sp_AssignRoomToSchedule
    @scheduleId INT,
    @roomId INT,
    @assignedBy INT,
    @success BIT OUTPUT,
    @errorMessage NVARCHAR(500) OUTPUT,
    @updatedScheduleId INT OUTPUT
AS
BEGIN
    SET @success = 0;
    SET @errorMessage = NULL;
    SET @updatedScheduleId = NULL;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 1. Kiểm tra lịch học có tồn tại không
        DECLARE @scheduleDayOfWeek INT;
        DECLARE @scheduleTimeSlotId INT;
        DECLARE @scheduleStatusId INT;
        DECLARE @scheduleClassRoomId INT;
        
        SELECT 
            @scheduleDayOfWeek = dayOfWeek,
            @scheduleTimeSlotId = timeSlotId,
            @scheduleStatusId = statusId,
            @scheduleClassRoomId = classRoomId
        FROM ClassSchedule
        WHERE id = @scheduleId;
        
        IF @scheduleDayOfWeek IS NULL
        BEGIN
            SET @errorMessage = N'Không tìm thấy lịch học';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- 2. Kiểm tra lịch học đã được gán phòng chưa
        IF @scheduleClassRoomId IS NOT NULL AND @scheduleStatusId = 2
        BEGIN
            SET @errorMessage = N'Lịch học đã được gán phòng';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- 3. Kiểm tra phòng có khả dụng không
        DECLARE @roomIsAvailable BIT;
        SELECT @roomIsAvailable = isAvailable
        FROM ClassRoom
        WHERE id = @roomId;
        
        IF @roomIsAvailable IS NULL OR @roomIsAvailable = 0
        BEGIN
            SET @errorMessage = N'Phòng học không khả dụng';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- 4. Kiểm tra conflict với lịch học khác
        DECLARE @scheduleConflict INT;
        SELECT TOP 1 @scheduleConflict = id
        FROM ClassSchedule
        WHERE dayOfWeek = @scheduleDayOfWeek
            AND timeSlotId = @scheduleTimeSlotId
            AND classRoomId = @roomId
            AND statusId IN (2, 3)
            AND id <> @scheduleId;
        
        IF @scheduleConflict IS NOT NULL
        BEGIN
            SET @errorMessage = N'Phòng học đã được sử dụng bởi lịch học khác trong khung giờ này';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- 5. Kiểm tra conflict với ngoại lệ (sử dụng stored procedure đã có)
        DECLARE @roomHasConflict BIT;
        DECLARE @roomConflictType NVARCHAR(50);
        DECLARE @roomConflictId INT;
        DECLARE @roomConflictMessage NVARCHAR(500);
        
        -- Tính ngày từ dayOfWeek (lấy ngày đầu tuần hiện tại)
        DECLARE @targetDate DATE;
        SET @targetDate = DATEADD(DAY, 
            CASE 
                WHEN @scheduleDayOfWeek = 1 THEN 6  -- Chủ nhật
                ELSE @scheduleDayOfWeek - 2  -- Thứ 2-7
            END,
            DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)  -- Chủ nhật đầu tuần
        );
        
        EXEC sp_CheckRoomConflict
            @classRoomId = @roomId,
            @targetDate = @targetDate,
            @targetTimeSlotId = @scheduleTimeSlotId,
            @excludeScheduleRequestId = NULL,
            @excludeClassScheduleId = @scheduleId,
            @hasConflict = @roomHasConflict OUTPUT,
            @conflictType = @roomConflictType OUTPUT,
            @conflictId = @roomConflictId OUTPUT,
            @conflictMessage = @roomConflictMessage OUTPUT;
        
        IF @roomHasConflict = 1
        BEGIN
            SET @errorMessage = @roomConflictMessage;
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- 6. Cập nhật lịch học
        UPDATE ClassSchedule
        SET classRoomId = @roomId,
            statusId = 2,
            assignedBy = @assignedBy,
            assignedAt = GETDATE(),
            updatedAt = GETDATE()
        WHERE id = @scheduleId;
        
        SET @updatedScheduleId = @scheduleId;
        SET @success = 1;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @errorMessage = ERROR_MESSAGE();
        SET @success = 0;
    END CATCH;
END;
GO

-- Stored Procedure: Lấy phòng khả dụng cho lịch học (xử lý ngoại lệ)
CREATE PROCEDURE sp_GetAvailableRoomsForSchedule
    @scheduleId INT,
    @specificDate DATE = NULL  -- Ngày cụ thể để kiểm tra ngoại lệ
AS
BEGIN
    -- Lấy thông tin lịch học
    DECLARE @scheduleDayOfWeek INT;
    DECLARE @scheduleTimeSlotId INT;
    DECLARE @scheduleClassRoomTypeId INT;
    DECLARE @scheduleDepartmentId INT;
    DECLARE @scheduleMaxStudents INT;
    
    SELECT 
        @scheduleDayOfWeek = cs.dayOfWeek,
        @scheduleTimeSlotId = cs.timeSlotId,
        @scheduleClassRoomTypeId = cs.classRoomTypeId,
        @scheduleDepartmentId = c.departmentId,
        @scheduleMaxStudents = c.maxStudents
    FROM ClassSchedule cs
    INNER JOIN Class c ON cs.classId = c.id
    WHERE cs.id = @scheduleId;
    
    IF @scheduleDayOfWeek IS NULL
    BEGIN
        SELECT NULL AS id, N'Không tìm thấy lịch học' AS errorMessage;
        RETURN;
    END;
    
    -- Tính ngày target
    DECLARE @targetDate DATE;
    IF @specificDate IS NOT NULL
        SET @targetDate = @specificDate;
    ELSE
        -- Lấy ngày đầu tuần hiện tại
        SET @targetDate = DATEADD(DAY, 
            CASE 
                WHEN @scheduleDayOfWeek = 1 THEN 6
                ELSE @scheduleDayOfWeek - 2
            END,
            DATEADD(WEEK, DATEDIFF(WEEK, 0, GETDATE()), 0)
        );
    
    -- Lấy danh sách phòng phù hợp
    SELECT 
        cr.id,
        cr.code,
        cr.name,
        cr.capacity,
        cr.building,
        cr.floor,
        crt.name AS type,
        d.name AS department,
        CASE WHEN cr.departmentId = @scheduleDepartmentId THEN 1 ELSE 0 END AS isSameDepartment,
        0 AS isOccupied,
        NULL AS conflictInfo
    INTO #AvailableRooms
    FROM ClassRoom cr
    INNER JOIN ClassRoomType crt ON cr.classRoomTypeId = crt.id
    LEFT JOIN Department d ON cr.departmentId = d.id
    WHERE cr.classRoomTypeId = @scheduleClassRoomTypeId
        AND cr.isAvailable = 1
        AND (cr.departmentId = @scheduleDepartmentId OR cr.departmentId IS NULL)
        AND (cr.classRoomTypeId <> 2 OR cr.capacity >= @scheduleMaxStudents)  -- Phòng thực hành không cần kiểm tra capacity
        AND (@scheduleClassRoomTypeId = 2 OR cr.capacity >= @scheduleMaxStudents);  -- Phòng lý thuyết cần kiểm tra capacity
    
    -- Đánh dấu phòng bận bởi lịch học
    UPDATE #AvailableRooms
    SET isOccupied = 1,
        conflictInfo = N'Đang được sử dụng bởi lịch học khác'
    WHERE id IN (
        SELECT classRoomId
        FROM ClassSchedule
        WHERE dayOfWeek = @scheduleDayOfWeek
            AND timeSlotId = @scheduleTimeSlotId
            AND classRoomId IS NOT NULL
            AND statusId IN (2, 3)
            AND id <> @scheduleId
    );
    
    -- Đánh dấu phòng bận bởi ngoại lệ (chỉ kiểm tra ngoại lệ đã duyệt)
    DECLARE @targetDateStart DATETIME;
    DECLARE @targetDateEnd DATETIME;
    SET @targetDateStart = CAST(@targetDate AS DATETIME);
    SET @targetDateEnd = DATEADD(DAY, 1, @targetDateStart);
    
    UPDATE #AvailableRooms
    SET isOccupied = 1,
        conflictInfo = N'Đang được sử dụng bởi ngoại lệ'
    WHERE id IN (
        SELECT DISTINCT ISNULL(sr.newClassRoomId, sr.movedToClassRoomId)
        FROM ScheduleRequest sr
        WHERE sr.requestStatusId = 2
            AND (
                (sr.exceptionDate >= @targetDateStart AND sr.exceptionDate < @targetDateEnd)
                OR (sr.movedToDate >= @targetDateStart AND sr.movedToDate < @targetDateEnd)
            )
            AND (
                sr.newTimeSlotId = @scheduleTimeSlotId
                OR sr.movedToTimeSlotId = @scheduleTimeSlotId
                OR (sr.classScheduleId IS NOT NULL AND EXISTS (
                    SELECT 1 FROM ClassSchedule cs 
                    WHERE cs.id = sr.classScheduleId 
                    AND cs.timeSlotId = @scheduleTimeSlotId
                ))
            )
            AND NOT (sr.requestTypeId = 3 OR sr.exceptionType = 'cancelled')  -- Loại trừ tạm ngưng
    );
    
    -- Trả về kết quả
    SELECT * FROM #AvailableRooms
    ORDER BY isSameDepartment DESC, isOccupied ASC, capacity ASC;
    
    DROP TABLE #AvailableRooms;
END;
GO

-- Stored Procedure: Lấy lịch học theo time slot và ngày (xử lý ngoại lệ)
CREATE PROCEDURE sp_GetSchedulesByTimeSlotAndDate
    @timeSlotId INT,
    @dayOfWeek INT,
    @specificDate DATE = NULL
AS
BEGIN
    -- Lấy lịch học thường xuyên
    SELECT 
        cs.id,
        cs.classRoomId,
        cs.classId,
        cs.teacherId,
        cs.dayOfWeek,
        cs.timeSlotId,
        c.className,
        c.subjectName,
        c.startDate,
        c.endDate,
        cr.name AS roomName,
        cr.code AS roomCode,
        t.teacherCode,
        u.fullName AS teacherName,
        0 AS hasException,
        NULL AS exceptionType,
        NULL AS exceptionReason,
        NULL AS exceptionTypeName,
        NULL AS requestTypeId,
        NULL AS originalClassRoomId,
        NULL AS movedToClassRoomId,
        NULL AS movedToTimeSlotId,
        NULL AS movedToDate
    INTO #Schedules
    FROM ClassSchedule cs
    INNER JOIN Class c ON cs.classId = c.id
    LEFT JOIN ClassRoom cr ON cs.classRoomId = cr.id
    INNER JOIN Teacher t ON cs.teacherId = t.id
    INNER JOIN [User] u ON t.userId = u.id
    WHERE cs.timeSlotId = @timeSlotId
        AND cs.dayOfWeek = @dayOfWeek;
    
    -- Nếu có specificDate, lọc theo khoảng thời gian và xử lý ngoại lệ
    IF @specificDate IS NOT NULL
    BEGIN
        DECLARE @dateStart DATETIME;
        DECLARE @dateEnd DATETIME;
        SET @dateStart = CAST(@specificDate AS DATETIME);
        SET @dateEnd = DATEADD(DAY, 1, @dateStart);
        
        -- Lọc lịch học trong khoảng thời gian
        DELETE FROM #Schedules
        WHERE startDate > @specificDate OR endDate < @specificDate;
        
        -- Cập nhật thông tin ngoại lệ
        UPDATE s
        SET 
            hasException = 1,
            exceptionType = sr.exceptionType,
            exceptionReason = sr.reason,
            exceptionTypeName = rt.name,
            requestTypeId = sr.requestTypeId,
            originalClassRoomId = s.classRoomId,
            movedToClassRoomId = ISNULL(sr.movedToClassRoomId, sr.newClassRoomId),
            movedToTimeSlotId = ISNULL(sr.movedToTimeSlotId, sr.newTimeSlotId),
            movedToDate = sr.movedToDate
        FROM #Schedules s
        INNER JOIN ScheduleRequest sr ON sr.classScheduleId = s.id
        INNER JOIN RequestType rt ON sr.requestTypeId = rt.id
        WHERE sr.exceptionDate >= @dateStart
            AND sr.exceptionDate < @dateEnd
            AND sr.requestStatusId = 2;
        
        -- Xử lý ngoại lệ tạm ngưng/thi - giải phóng phòng
        UPDATE #Schedules
        SET classRoomId = NULL,
            roomName = NULL,
            roomCode = NULL
        WHERE hasException = 1
            AND (requestTypeId IN (3, 4, 5) OR exceptionType = 'cancelled' OR exceptionType = 'exam');
        
        -- Xử lý ngoại lệ đổi lịch - chuyển phòng
        UPDATE #Schedules
        SET classRoomId = movedToClassRoomId,
            roomName = (SELECT name FROM ClassRoom WHERE id = movedToClassRoomId),
            roomCode = (SELECT code FROM ClassRoom WHERE id = movedToClassRoomId)
        WHERE hasException = 1
            AND (exceptionType = 'moved' OR requestTypeId = 8)
            AND movedToClassRoomId IS NOT NULL;
    END;
    
    -- Trả về kết quả
    SELECT * FROM #Schedules
    ORDER BY className;
    
    DROP TABLE #Schedules;
END;
GO

-- Stored Procedure: Tạo hoặc cập nhật ngoại lệ (validate và xử lý đầy đủ)
CREATE PROCEDURE sp_CreateOrUpdateException
    @exceptionId INT = NULL,  -- NULL nếu tạo mới
    @classScheduleId INT = NULL,
    @classId INT = NULL,
    @exceptionDate DATE,
    @requestTypeId INT,
    @teacherId INT = NULL,
    @newTimeSlotId INT = NULL,
    @newClassRoomId INT = NULL,
    @movedToDate DATE = NULL,
    @movedToTimeSlotId INT = NULL,
    @movedToClassRoomId INT = NULL,
    @substituteTeacherId INT = NULL,
    @reason NVARCHAR(MAX),
    @note NVARCHAR(MAX) = NULL,
    @requesterId INT,
    @approvedBy INT = NULL,
    @requestStatusId INT = 2,  -- Mặc định đã duyệt
    @success BIT OUTPUT,
    @errorMessage NVARCHAR(500) OUTPUT,
    @createdExceptionId INT OUTPUT
AS
BEGIN
    SET @success = 0;
    SET @errorMessage = NULL;
    SET @createdExceptionId = NULL;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validate dữ liệu đầu vào
        IF @exceptionDate IS NULL OR @requestTypeId IS NULL OR @requesterId IS NULL
        BEGIN
            SET @errorMessage = N'Thiếu thông tin bắt buộc';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Kiểm tra conflict sử dụng stored procedure đã có
        DECLARE @isValid BIT;
        DECLARE @validationError NVARCHAR(500);
        
        EXEC sp_ValidateExceptionChange
            @classScheduleId = @classScheduleId,
            @classId = @classId,
            @exceptionDate = @exceptionDate,
            @requestTypeId = @requestTypeId,
            @teacherId = @teacherId,
            @newTimeSlotId = @newTimeSlotId,
            @newClassRoomId = @newClassRoomId,
            @movedToDate = @movedToDate,
            @movedToTimeSlotId = @movedToTimeSlotId,
            @movedToClassRoomId = @movedToClassRoomId,
            @substituteTeacherId = @substituteTeacherId,
            @excludeScheduleRequestId = @exceptionId,
            @excludeClassScheduleId = NULL,
            @isValid = @isValid OUTPUT,
            @errorMessage = @validationError OUTPUT;
        
        IF @isValid = 0
        BEGIN
            SET @errorMessage = @validationError;
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Tính movedToDayOfWeek nếu có movedToDate
        DECLARE @movedToDayOfWeek INT = NULL;
        IF @movedToDate IS NOT NULL
        BEGIN
            SET @movedToDayOfWeek = CASE 
                WHEN DATEPART(WEEKDAY, @movedToDate) = 1 THEN 1
                ELSE DATEPART(WEEKDAY, @movedToDate)
            END;
        END;
        
        -- Xác định timeSlotId cho exception
        DECLARE @exceptionTimeSlotId INT;
        IF @newTimeSlotId IS NOT NULL
            SET @exceptionTimeSlotId = @newTimeSlotId;
        ELSE IF @movedToTimeSlotId IS NOT NULL
            SET @exceptionTimeSlotId = @movedToTimeSlotId;
        ELSE IF @classScheduleId IS NOT NULL
            SELECT @exceptionTimeSlotId = timeSlotId FROM ClassSchedule WHERE id = @classScheduleId;
        ELSE
            SET @exceptionTimeSlotId = NULL;
        
        -- Xác định exceptionType
        DECLARE @exceptionType NVARCHAR(50);
        IF @requestTypeId = 3
            SET @exceptionType = 'cancelled';
        ELSE IF @requestTypeId IN (4, 10)
            SET @exceptionType = 'exam';
        ELSE IF @requestTypeId = 8
            SET @exceptionType = 'moved';
        ELSE IF @requestTypeId = 9
            SET @exceptionType = 'substitute';
        ELSE
            SET @exceptionType = NULL;
        
        -- Tạo hoặc cập nhật
        IF @exceptionId IS NULL
        BEGIN
            -- Tạo mới
            INSERT INTO ScheduleRequest (
                requestTypeId, classScheduleId, classId, requesterId, requestDate,
                timeSlotId, exceptionDate, exceptionType,
                newTimeSlotId, newClassRoomId,
                movedToDate, movedToDayOfWeek, movedToTimeSlotId, movedToClassRoomId,
                substituteTeacherId, reason, note,
                requestStatusId, approvedBy, approvedAt,
                createdAt, updatedAt
            )
            VALUES (
                @requestTypeId, @classScheduleId, @classId, @requesterId, GETDATE(),
                @exceptionTimeSlotId, @exceptionDate, @exceptionType,
                @newTimeSlotId, @newClassRoomId,
                @movedToDate, @movedToDayOfWeek, @movedToTimeSlotId, @movedToClassRoomId,
                @substituteTeacherId, @reason, @note,
                @requestStatusId, ISNULL(@approvedBy, @requesterId), 
                CASE WHEN @requestStatusId = 2 THEN GETDATE() ELSE NULL END,
                GETDATE(), GETDATE()
            );
            
            SET @createdExceptionId = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- Cập nhật
            UPDATE ScheduleRequest
            SET 
                requestTypeId = @requestTypeId,
                exceptionDate = @exceptionDate,
                exceptionType = @exceptionType,
                newTimeSlotId = @newTimeSlotId,
                newClassRoomId = @newClassRoomId,
                movedToDate = @movedToDate,
                movedToDayOfWeek = @movedToDayOfWeek,
                movedToTimeSlotId = @movedToTimeSlotId,
                movedToClassRoomId = @movedToClassRoomId,
                substituteTeacherId = @substituteTeacherId,
                reason = @reason,
                note = @note,
                requestStatusId = @requestStatusId,
                approvedBy = ISNULL(@approvedBy, approvedBy),
                approvedAt = CASE WHEN @requestStatusId = 2 AND approvedAt IS NULL THEN GETDATE() ELSE approvedAt END,
                updatedAt = GETDATE()
            WHERE id = @exceptionId;
            
            SET @createdExceptionId = @exceptionId;
        END;
        
        SET @success = 1;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @errorMessage = ERROR_MESSAGE();
        SET @success = 0;
    END CATCH;
END;
GO

-- =====================================================
-- END OF SCHEMA
-- =====================================================

