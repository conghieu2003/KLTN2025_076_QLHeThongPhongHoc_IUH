const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Lấy thông tin profile đầy đủ của user
const getFullProfile = async (userId) => {
  try {
    // Lấy thông tin user cơ bản với các relation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        account: true,
        teacher: {
          include: {
            department: true,
            major: true
          }
        },
        student: {
          include: {
            department: true,
            major: true
          }
        },
        personalProfile: true,
        familyInfo: true,
        academicProfile: true
      }
    });

    if (!user) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }

    // Tạo studentInfo hoặc teacherInfo
    let studentInfo = null;
    let teacherInfo = null;

    if (user.account.role === 'student' && user.student) {
      studentInfo = {
        id: user.student.id,
        userId: user.id,
        studentCode: user.student.studentCode,
        departmentId: user.student.departmentId,
        majorId: user.student.majorId,
        department: user.student.department,
        major: user.student.major,
        createdAt: user.student.createdAt.toISOString(),
        updatedAt: user.student.updatedAt.toISOString()
      };
    } else if (user.account.role === 'teacher' && user.teacher) {
      teacherInfo = {
        id: user.teacher.id,
        userId: user.id,
        teacherCode: user.teacher.teacherCode,
        departmentId: user.teacher.departmentId,
        majorId: user.teacher.majorId,
        department: user.teacher.department,
        major: user.teacher.major,
        createdAt: user.teacher.createdAt.toISOString(),
        updatedAt: user.teacher.updatedAt.toISOString()
      };
    }

    // Tạo user object
    const userData = {
      id: user.id,
      username: user.account.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      role: user.account.role,
      teacherCode: user.teacher?.teacherCode,
      studentCode: user.student?.studentCode,
      isActive: user.account.isActive
    };

    // Format dates for personal profile
    const personalProfile = user.personalProfile ? {
      ...user.personalProfile,
      createdAt: user.personalProfile.createdAt.toISOString(),
      updatedAt: user.personalProfile.updatedAt.toISOString()
    } : null;

    // Format dates for family info
    const familyInfo = user.familyInfo ? {
      ...user.familyInfo,
      createdAt: user.familyInfo.createdAt.toISOString(),
      updatedAt: user.familyInfo.updatedAt.toISOString()
    } : null;

    // Format dates for academic profile
    const academicProfile = user.academicProfile ? {
      ...user.academicProfile,
      createdAt: user.academicProfile.createdAt.toISOString(),
      updatedAt: user.academicProfile.updatedAt.toISOString()
    } : null;

    return {
      user: userData,
      personalProfile: personalProfile,
      familyInfo: familyInfo,
      academicProfile: academicProfile,
      studentInfo: studentInfo,
      teacherInfo: teacherInfo
    };

  } catch (error) {
    console.error('Error in getFullProfile:', error);
    throw error;
  }
};

// Cập nhật thông tin cá nhân
const updatePersonalProfile = async (userId, personalData) => {
  try {
    // Kiểm tra xem PersonalProfile đã tồn tại chưa
    const existingProfile = await prisma.personalProfile.findUnique({
      where: { userId: userId }
    });
    
    if (existingProfile) {
      // Cập nhật
      await prisma.personalProfile.update({
        where: { userId: userId },
        data: {
          idCardNumber: personalData.idCardNumber,
          idCardIssueDate: personalData.idCardIssueDate ? new Date(personalData.idCardIssueDate) : null,
          idCardIssuePlace: personalData.idCardIssuePlace,
          placeOfBirth: personalData.placeOfBirth,
          permanentAddress: personalData.permanentAddress,
          phoneEmergency: personalData.phoneEmergency,
          bankName: personalData.bankName,
          bankBranch: personalData.bankBranch,
          bankAccountNumber: personalData.bankAccountNumber,
          updatedAt: new Date()
        }
      });
    } else {
      // Tạo mới
      await prisma.personalProfile.create({
        data: {
          userId: userId,
          idCardNumber: personalData.idCardNumber,
          idCardIssueDate: personalData.idCardIssueDate ? new Date(personalData.idCardIssueDate) : null,
          idCardIssuePlace: personalData.idCardIssuePlace,
          placeOfBirth: personalData.placeOfBirth,
          permanentAddress: personalData.permanentAddress,
          phoneEmergency: personalData.phoneEmergency,
          bankName: personalData.bankName,
          bankBranch: personalData.bankBranch,
          bankAccountNumber: personalData.bankAccountNumber
        }
      });
    }
    
    // Trả về thông tin đã cập nhật
    return await getFullProfile(userId);
    
  } catch (error) {
    console.error('Error in updatePersonalProfile:', error);
    throw error;
  }
};

// Cập nhật thông tin gia đình
const updateFamilyInfo = async (userId, familyData) => {
  try {
    // Kiểm tra xem FamilyInfo đã tồn tại chưa
    const existingFamily = await prisma.familyInfo.findUnique({
      where: { userId: userId }
    });
    
    if (existingFamily) {
      // Cập nhật
      await prisma.familyInfo.update({
        where: { userId: userId },
        data: {
          fatherFullName: familyData.fatherFullName,
          fatherYearOfBirth: familyData.fatherYearOfBirth,
          fatherPhone: familyData.fatherPhone,
          motherFullName: familyData.motherFullName,
          motherYearOfBirth: familyData.motherYearOfBirth,
          motherPhone: familyData.motherPhone,
          updatedAt: new Date()
        }
      });
    } else {
      // Tạo mới
      await prisma.familyInfo.create({
        data: {
          userId: userId,
          fatherFullName: familyData.fatherFullName,
          fatherYearOfBirth: familyData.fatherYearOfBirth,
          fatherPhone: familyData.fatherPhone,
          motherFullName: familyData.motherFullName,
          motherYearOfBirth: familyData.motherYearOfBirth,
          motherPhone: familyData.motherPhone
        }
      });
    }
    
    // Trả về thông tin đã cập nhật
    return await getFullProfile(userId);
    
  } catch (error) {
    console.error('Error in updateFamilyInfo:', error);
    throw error;
  }
};

// Cập nhật thông tin học vấn
const updateAcademicProfile = async (userId, academicData) => {
  try {
    // Kiểm tra xem AcademicProfile đã tồn tại chưa
    const existingAcademic = await prisma.academicProfile.findUnique({
      where: { userId: userId }
    });
    
    if (existingAcademic) {
      // Cập nhật
      await prisma.academicProfile.update({
        where: { userId: userId },
        data: {
          campus: academicData.campus,
          trainingType: academicData.trainingType,
          degreeLevel: academicData.degreeLevel,
          academicYear: academicData.academicYear,
          enrollmentDate: academicData.enrollmentDate ? new Date(academicData.enrollmentDate) : null,
          classCode: academicData.classCode,
          title: academicData.title,
          updatedAt: new Date()
        }
      });
    } else {
      // Tạo mới
      await prisma.academicProfile.create({
        data: {
          userId: userId,
          role: academicData.role || 'student',
          campus: academicData.campus,
          trainingType: academicData.trainingType,
          degreeLevel: academicData.degreeLevel,
          academicYear: academicData.academicYear,
          enrollmentDate: academicData.enrollmentDate ? new Date(academicData.enrollmentDate) : null,
          classCode: academicData.classCode,
          title: academicData.title
        }
      });
    }
    
    // Trả về thông tin đã cập nhật
    return await getFullProfile(userId);
    
  } catch (error) {
    console.error('Error in updateAcademicProfile:', error);
    throw error;
  }
};

module.exports = {
  getFullProfile,
  updatePersonalProfile,
  updateFamilyInfo,
  updateAcademicProfile
};
