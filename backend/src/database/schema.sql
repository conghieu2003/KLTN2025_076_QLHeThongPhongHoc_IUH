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

-- =====================================================
-- END OF SCHEMA
-- =====================================================
