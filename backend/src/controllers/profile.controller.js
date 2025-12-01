const profileService = require('../services/profile.service');

// Lấy thông tin profile đầy đủ của user hiện tại
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Từ middleware auth
    const profileData = await profileService.getFullProfile(userId);
    
    res.json({
      success: true,
      data: profileData,
      message: 'Lấy thông tin profile thành công'
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thông tin profile',
      error: error.message
    });
  }
};

// Lấy thông tin profile của user khác (admin)
const getProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = await profileService.getFullProfile(userId);
    
    res.json({
      success: true,
      data: profileData,
      message: 'Lấy thông tin profile thành công'
    });
  } catch (error) {
    console.error('Error getting profile by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi lấy thông tin profile',
      error: error.message
    });
  }
};

// Cập nhật thông tin cá nhân
const updatePersonalProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const personalData = req.body;
    
    const updatedProfile = await profileService.updatePersonalProfile(userId, personalData);
    
    res.json({
      success: true,
      data: updatedProfile,
      message: 'Cập nhật thông tin cá nhân thành công'
    });
  } catch (error) {
    console.error('Error updating personal profile:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật thông tin cá nhân',
      error: error.message
    });
  }
};

// Cập nhật thông tin gia đình
const updateFamilyInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const familyData = req.body;
    
    const updatedFamily = await profileService.updateFamilyInfo(userId, familyData);
    
    res.json({
      success: true,
      data: updatedFamily,
      message: 'Cập nhật thông tin gia đình thành công'
    });
  } catch (error) {
    console.error('Error updating family info:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật thông tin gia đình',
      error: error.message
    });
  }
};

// Cập nhật thông tin học vấn
const updateAcademicProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const academicData = req.body;
    
    const updatedAcademic = await profileService.updateAcademicProfile(userId, academicData);
    
    res.json({
      success: true,
      data: updatedAcademic,
      message: 'Cập nhật thông tin học vấn thành công'
    });
  } catch (error) {
    console.error('Error updating academic profile:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật thông tin học vấn',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  getProfileById,
  updatePersonalProfile,
  updateFamilyInfo,
  updateAcademicProfile
};
