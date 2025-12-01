-- =====================================================
-- VÍ DỤ VỀ LOGIC HIỂN THỊ LỊCH HỌC THEO NHÓM THỰC HÀNH
-- =====================================================

-- 1. LẤY LỊCH HỌC CHO SINH VIÊN CỤ THỂ
-- Ví dụ: Lấy lịch học của sinh viên có ID = 1 (Ao Công Hiếu)
SELECT 
    cs.id,
    c.className,
    c.subjectName,
    c.subjectCode,
    ts.slotName,
    cs.dayOfWeek,
    crt.name as sessionType, -- Lý thuyết hoặc Thực hành
    cs.practiceGroup,
    cr.code as roomCode,
    cr.name as roomName,
    cr.building,
    cr.floor,
    u.fullName as teacherName,
    cs.startWeek,
    cs.endWeek,
    rt.name as status
FROM ClassSchedule cs
JOIN Class c ON cs.classId = c.id
JOIN ClassStudent cls ON c.id = cls.classId
JOIN TimeSlot ts ON cs.timeSlotId = ts.id
JOIN ClassRoomType crt ON cs.classRoomTypeId = crt.id
LEFT JOIN ClassRoom cr ON cs.classRoomId = cr.id
JOIN Teacher t ON cs.teacherId = t.id
JOIN [User] u ON t.userId = u.id
JOIN RequestType rt ON cs.statusId = rt.id
WHERE cls.studentId = 1 -- Ao Công Hiếu
AND (
    -- Lý thuyết: tất cả sinh viên trong lớp đều thấy
    (cs.classRoomTypeId = 1) 
    OR 
    -- Thực hành: chỉ sinh viên thuộc nhóm thực hành tương ứng
    (cs.classRoomTypeId = 2 AND cs.practiceGroup = cls.groupNumber)
)
ORDER BY cs.dayOfWeek, ts.startTime;

-- 2. LẤY LỊCH HỌC CỦA TẤT CẢ SINH VIÊN TRONG LỚP COMP101
-- Hiển thị lịch học của lớp COMP101 với thông tin nhóm thực hành
SELECT 
    cs.id,
    c.className,
    c.subjectName,
    ts.slotName,
    cs.dayOfWeek,
    crt.name as sessionType,
    cs.practiceGroup,
    cr.code as roomCode,
    u.fullName as teacherName,
    -- Danh sách sinh viên trong nhóm thực hành
    STRING_AGG(
        CASE 
            WHEN cs.classRoomTypeId = 1 THEN u2.fullName -- Lý thuyết: tất cả sinh viên
            WHEN cs.classRoomTypeId = 2 AND cs.practiceGroup = cls2.groupNumber THEN u2.fullName -- Thực hành: chỉ nhóm tương ứng
            ELSE NULL
        END, 
        ', '
    ) as studentsInGroup
FROM ClassSchedule cs
JOIN Class c ON cs.classId = c.id
JOIN TimeSlot ts ON cs.timeSlotId = ts.id
JOIN ClassRoomType crt ON cs.classRoomTypeId = crt.id
LEFT JOIN ClassRoom cr ON cs.classRoomId = cr.id
JOIN Teacher t ON cs.teacherId = t.id
JOIN [User] u ON t.userId = u.id
LEFT JOIN ClassStudent cls2 ON c.id = cls2.classId
LEFT JOIN Student s2 ON cls2.studentId = s2.id
LEFT JOIN [User] u2 ON s2.userId = u2.id
WHERE c.code = 'COMP101'
GROUP BY cs.id, c.className, c.subjectName, ts.slotName, cs.dayOfWeek, crt.name, cs.practiceGroup, cr.code, u.fullName
ORDER BY cs.dayOfWeek, ts.startTime;

-- 3. KIỂM TRA XUNG ĐỘT LỊCH HỌC
-- Kiểm tra xem có sinh viên nào bị trùng lịch không
SELECT 
    s.id as studentId,
    u.fullName as studentName,
    c1.className as class1,
    c2.className as class2,
    cs1.dayOfWeek,
    ts1.slotName as timeSlot1,
    ts2.slotName as timeSlot2
FROM ClassStudent cls1
JOIN ClassStudent cls2 ON cls1.studentId = cls2.studentId AND cls1.classId != cls2.classId
JOIN ClassSchedule cs1 ON cls1.classId = cs1.classId
JOIN ClassSchedule cs2 ON cls2.classId = cs2.classId
JOIN Class c1 ON cs1.classId = c1.id
JOIN Class c2 ON cs2.classId = c2.id
JOIN TimeSlot ts1 ON cs1.timeSlotId = ts1.id
JOIN TimeSlot ts2 ON cs2.timeSlotId = ts2.id
JOIN Student s ON cls1.studentId = s.id
JOIN [User] u ON s.userId = u.id
WHERE cs1.dayOfWeek = cs2.dayOfWeek
AND cs1.timeSlotId = cs2.timeSlotId
AND (
    -- Lý thuyết: tất cả sinh viên
    (cs1.classRoomTypeId = 1 AND cs2.classRoomTypeId = 1)
    OR
    -- Thực hành: cùng nhóm
    (cs1.classRoomTypeId = 2 AND cs2.classRoomTypeId = 2 AND cs1.practiceGroup = cs2.practiceGroup)
    OR
    -- Lý thuyết + Thực hành: sinh viên thuộc nhóm thực hành
    (cs1.classRoomTypeId = 1 AND cs2.classRoomTypeId = 2 AND cs2.practiceGroup = cls2.groupNumber)
    OR
    (cs1.classRoomTypeId = 2 AND cs2.classRoomTypeId = 1 AND cs1.practiceGroup = cls1.groupNumber)
);

-- 4. THỐNG KÊ LỊCH HỌC THEO LOẠI
-- Thống kê số lượng lịch học theo loại (Lý thuyết/Thực hành)
SELECT 
    crt.name as sessionType,
    COUNT(*) as totalSchedules,
    COUNT(CASE WHEN cs.classRoomId IS NOT NULL THEN 1 END) as assignedRooms,
    COUNT(CASE WHEN cs.classRoomId IS NULL THEN 1 END) as pendingRooms
FROM ClassSchedule cs
JOIN ClassRoomType crt ON cs.classRoomTypeId = crt.id
GROUP BY crt.id, crt.name
ORDER BY crt.id;

-- 5. LẤY DANH SÁCH NHÓM THỰC HÀNH CỦA MỘT LỚP
-- Hiển thị các nhóm thực hành và sinh viên trong từng nhóm
SELECT 
    c.className,
    cls.groupNumber,
    COUNT(*) as studentCount,
    STRING_AGG(u.fullName, ', ') as students
FROM Class c
JOIN ClassStudent cls ON c.id = cls.classId
JOIN Student s ON cls.studentId = s.id
JOIN [User] u ON s.userId = u.id
WHERE c.code = 'COMP101'
AND cls.groupNumber IS NOT NULL
GROUP BY c.id, c.className, cls.groupNumber
ORDER BY cls.groupNumber;
