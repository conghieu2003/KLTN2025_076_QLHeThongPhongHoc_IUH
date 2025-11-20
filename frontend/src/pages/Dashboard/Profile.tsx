import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, Avatar, Divider, Card, CardContent, Chip, CircularProgress, Alert, Stack, Grid, useTheme, useMediaQuery, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import { Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchProfileData, clearError, updateProfile, updatePersonalProfile, updateFamilyInfo } from '../../redux/slices/profileSlice';
import { toast } from 'react-toastify';


const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profileData, loading, error, updating, updateError } = useSelector((state: RootState) => state.profile);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Edit personal profile dialog state
  const [editPersonalDialogOpen, setEditPersonalDialogOpen] = useState(false);
  const [editPersonalFormData, setEditPersonalFormData] = useState({
    address: '',
    idCardNumber: '',
    placeOfBirth: '',
    permanentAddress: '',
    bankName: '',
    bankAccountNumber: ''
  });

  // Edit family info dialog state
  const [editFamilyDialogOpen, setEditFamilyDialogOpen] = useState(false);
  const [editFamilyFormData, setEditFamilyFormData] = useState({
    fatherFullName: '',
    fatherYearOfBirth: '',
    fatherPhone: '',
    motherFullName: '',
    motherYearOfBirth: '',
    motherPhone: ''
  });

  useEffect(() => {
    dispatch(fetchProfileData());
    
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show toast on success/error
  useEffect(() => {
    if (updateError) {
      toast.error(updateError);
    }
  }, [updateError]);


  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getGenderText = (gender?: string) => {
    switch (gender) {
      case 'male': return 'Nam';
      case 'female': return 'Nữ';
      case 'other': return 'Khác';
      default: return '';
    }
  };

  const handleOpenEditPersonalDialog = () => {
    if (profileData?.user && profileData?.personalProfile) {
      const user = profileData.user;
      const personal = profileData.personalProfile;
      setEditPersonalFormData({
        address: user.address || '',
        idCardNumber: personal.idCardNumber || '',
        placeOfBirth: personal.placeOfBirth || '',
        permanentAddress: personal.permanentAddress || '',
        bankName: personal.bankName || '',
        bankAccountNumber: personal.bankAccountNumber || ''
      });
      setEditPersonalDialogOpen(true);
    }
  };

  const handleCloseEditPersonalDialog = () => {
    setEditPersonalDialogOpen(false);
    dispatch(clearError());
  };

  const handleSavePersonalProfile = async () => {
    try {
      // Update user info (address only)
      const userData = {
        address: editPersonalFormData.address
      };
      await dispatch(updateProfile(userData)).unwrap();
      
      // Update personal profile (idCardNumber, placeOfBirth, permanentAddress, bankName, bankAccountNumber)
      const personalData = {
        idCardNumber: editPersonalFormData.idCardNumber,
        placeOfBirth: editPersonalFormData.placeOfBirth,
        permanentAddress: editPersonalFormData.permanentAddress,
        bankName: editPersonalFormData.bankName,
        bankAccountNumber: editPersonalFormData.bankAccountNumber
      };
      await dispatch(updatePersonalProfile(personalData)).unwrap();
      
      toast.success('Cập nhật thông tin thành công');
      handleCloseEditPersonalDialog();
      dispatch(fetchProfileData());
    } catch (error) {
      // Error handled by useEffect
    }
  };

  const handleOpenEditFamilyDialog = () => {
    if (profileData?.familyInfo) {
      const family = profileData.familyInfo;
      setEditFamilyFormData({
        fatherFullName: family.fatherFullName || '',
        fatherYearOfBirth: family.fatherYearOfBirth?.toString() || '',
        fatherPhone: family.fatherPhone || '',
        motherFullName: family.motherFullName || '',
        motherYearOfBirth: family.motherYearOfBirth?.toString() || '',
        motherPhone: family.motherPhone || ''
      });
      setEditFamilyDialogOpen(true);
    }
  };

  const handleCloseEditFamilyDialog = () => {
    setEditFamilyDialogOpen(false);
    dispatch(clearError());
  };

  const handleSaveFamilyInfo = async () => {
    try {
      const dataToUpdate: any = {
        fatherFullName: editFamilyFormData.fatherFullName,
        fatherPhone: editFamilyFormData.fatherPhone,
        motherFullName: editFamilyFormData.motherFullName,
        motherPhone: editFamilyFormData.motherPhone,
        fatherYearOfBirth: editFamilyFormData.fatherYearOfBirth ? parseInt(editFamilyFormData.fatherYearOfBirth) : null,
        motherYearOfBirth: editFamilyFormData.motherYearOfBirth ? parseInt(editFamilyFormData.motherYearOfBirth) : null
      };
      await dispatch(updateFamilyInfo(dataToUpdate)).unwrap();
      toast.success('Cập nhật thông tin thành công');
      handleCloseEditFamilyDialog();
      dispatch(fetchProfileData());
    } catch (error) {
      // Error handled by useEffect
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!profileData) {
    return (
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
        <Alert severity="warning">Không tìm thấy thông tin hồ sơ</Alert>
      </Container>
    );
  }

  const { user, personalProfile, familyInfo, academicProfile, studentInfo, teacherInfo } = profileData;

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        mt: { xs: 2, sm: 3, md: 4 }, 
        mb: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      {/* Header with basic info and avatar */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 2, sm: 2.5, md: 3 }, 
          mb: { xs: 2, sm: 2.5, md: 3 }
        }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
          <Grid
            size={{
              xs: 12,
              sm: 'auto'
            }}
          >
            <Avatar
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0D6EFD&color=fff`}
              sx={{ 
                width: { xs: 80, sm: 100, md: 120 }, 
                height: { xs: 80, sm: 100, md: 120 },
                mx: { xs: 'auto', sm: 0 }
              }}
            />
          </Grid>
          <Grid
            size={{
              xs: 12,
              sm: 'grow'
            }}
          >
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'center' }} gap={{ xs: 1, sm: 2 }} mb={1}>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                component="h1" 
                fontWeight="bold"
                textAlign={{ xs: 'center', sm: 'left' }}
              >
                {user.fullName}
              </Typography>
              <Chip 
                label={user.role === 'student' ? 'Sinh viên' : user.role === 'teacher' ? 'Giảng viên' : 'Quản trị viên'} 
                color="primary" 
                size={isMobile ? "small" : "medium"}
              />
            </Box>
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              color="text.secondary" 
              gutterBottom
              textAlign={{ xs: 'center', sm: 'left' }}
            >
              {user.role === 'student' ? `MSSV: ${studentInfo?.studentCode || user.studentCode}` : 
               user.role === 'teacher' ? `Mã GV: ${teacherInfo?.teacherCode || user.teacherCode}` : 
               'Quản trị viên'}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              textAlign={{ xs: 'center', sm: 'left' }}
            >
              Giới tính: {getGenderText(user.gender)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Academic Information Section - Top */}
      <Box mb={{ xs: 2, sm: 2.5, md: 3 }}>
        <Card elevation={2}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
            <Typography 
              variant={isMobile ? "h6" : "h6"}
              component="h2" 
              fontWeight="bold" 
              mb={2}
              sx={{ 
                fontFamily: "'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                fontFeatureSettings: '"liga" 1, "calt" 1',
                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
              }}
            >
              Thông tin học vấn
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}
              >
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Trạng thái:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {user.role === 'student' ? 'Đang học' : 
                         user.role === 'teacher' ? 'Đang giảng dạy' : 
                         'Đang làm việc'}
                      </Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Lớp học:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {academicProfile?.classCode || '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Bậc đào tạo:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {academicProfile?.degreeLevel || '-'}
                      </Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Khoa:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {studentInfo?.department?.name || teacherInfo?.department?.name || '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Chuyên ngành:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {studentInfo?.major?.name || teacherInfo?.major?.name || '-'}
                      </Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Mã hồ sơ:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {user.role === 'student' ? studentInfo?.studentCode : 
                         user.role === 'teacher' ? teacherInfo?.teacherCode : 
                         user.username}
                      </Typography>
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>
              
              <Grid
                size={{
                  xs: 12,
                  md: 6
                }}
              >
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Ngày vào trường:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(academicProfile?.enrollmentDate) || '-'}
                      </Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Cơ sở:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {academicProfile?.campus || '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Loại hình đào tạo:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {academicProfile?.trainingType || '-'}
                      </Typography>
                    </Grid>
                    <Grid
                      size={{
                        xs: 12,
                        sm: 6
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Ngành:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {studentInfo?.major?.name || teacherInfo?.major?.name || '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid
                      size={{
                        xs: 12
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Khóa học:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {academicProfile?.academicYear || '-'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {/* Personal Information Section */}
        <Grid
          size={{
            xs: 12,
            md: 6
          }}
        >
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  fontWeight="bold" 
                  sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
                >
                  Thông tin cá nhân
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleOpenEditPersonalDialog}
                  sx={{ color: '#1976d2' }}
                >
                  <EditIcon />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Ngày sinh:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(user.dateOfBirth) || '-'}
                    </Typography>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Số CCCD:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {personalProfile?.idCardNumber || '-'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Điện thoại:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {user.phone || '-'}
                    </Typography>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Email:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>
                      {user.email}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Địa chỉ liên hệ:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {user.address || '-'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Nơi sinh:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {personalProfile?.placeOfBirth || '-'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Hộ khẩu thường trú:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {personalProfile?.permanentAddress || '-'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tên ngân hàng:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {personalProfile?.bankName || '-'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tên chủ tài khoản:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {user.fullName}
                    </Typography>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Số tài khoản:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {personalProfile?.bankAccountNumber || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Family Information Section */}
        <Grid
          size={{
            xs: 12,
            md: 6
          }}
        >
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography 
                  variant="h6" 
                  component="h2" 
                  fontWeight="bold" 
                  sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
                >
                  Quan hệ gia đình
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleOpenEditFamilyDialog}
                  sx={{ color: '#1976d2' }}
                >
                  <EditIcon />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {/* Father's Information */}
              <Typography 
                variant="subtitle1" 
                fontWeight="bold" 
                mb={1}
                sx={{ fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }}
              >
                Thông tin cha
              </Typography>
              <Stack spacing={2} mb={3}>
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Họ tên Cha:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {familyInfo?.fatherFullName || '-'}
                    </Typography>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Năm sinh:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {familyInfo?.fatherYearOfBirth || '-'}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Số điện thoại:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {familyInfo?.fatherPhone || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Mother's Information */}
              <Typography 
                variant="subtitle1" 
                fontWeight="bold" 
                mb={1}
                sx={{ fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }}
              >
                Thông tin mẹ
              </Typography>
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Họ tên Mẹ:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {familyInfo?.motherFullName || '-'}
                    </Typography>
                  </Grid>
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Năm sinh:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {familyInfo?.motherYearOfBirth || '-'}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid
                    size={{
                      xs: 12
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Số điện thoại:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {familyInfo?.motherPhone || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Personal Profile Dialog */}
      <Dialog 
        open={editPersonalDialogOpen} 
        onClose={handleCloseEditPersonalDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Chỉnh sửa thông tin cá nhân</Typography>
            <IconButton onClick={handleCloseEditPersonalDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Địa chỉ liên hệ"
              fullWidth
              multiline
              rows={2}
              value={editPersonalFormData.address}
              onChange={(e) => setEditPersonalFormData({ ...editPersonalFormData, address: e.target.value })}
            />
            <TextField
              label="Số CCCD"
              fullWidth
              value={editPersonalFormData.idCardNumber}
              onChange={(e) => setEditPersonalFormData({ ...editPersonalFormData, idCardNumber: e.target.value })}
            />
            <TextField
              label="Nơi sinh"
              fullWidth
              value={editPersonalFormData.placeOfBirth}
              onChange={(e) => setEditPersonalFormData({ ...editPersonalFormData, placeOfBirth: e.target.value })}
            />
            <TextField
              label="Hộ khẩu thường trú"
              fullWidth
              multiline
              rows={3}
              value={editPersonalFormData.permanentAddress}
              onChange={(e) => setEditPersonalFormData({ ...editPersonalFormData, permanentAddress: e.target.value })}
            />
            <TextField
              label="Tên ngân hàng"
              fullWidth
              value={editPersonalFormData.bankName}
              onChange={(e) => setEditPersonalFormData({ ...editPersonalFormData, bankName: e.target.value })}
            />
            <TextField
              label="Số tài khoản"
              fullWidth
              value={editPersonalFormData.bankAccountNumber}
              onChange={(e) => setEditPersonalFormData({ ...editPersonalFormData, bankAccountNumber: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditPersonalDialog}>Hủy</Button>
          <Button 
            onClick={handleSavePersonalProfile} 
            variant="contained" 
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : null}
          >
            {updating ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Family Info Dialog */}
      <Dialog 
        open={editFamilyDialogOpen} 
        onClose={handleCloseEditFamilyDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Chỉnh sửa thông tin gia đình</Typography>
            <IconButton onClick={handleCloseEditFamilyDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>
              Thông tin cha
            </Typography>
            <TextField
              label="Họ tên Cha"
              fullWidth
              value={editFamilyFormData.fatherFullName}
              onChange={(e) => setEditFamilyFormData({ ...editFamilyFormData, fatherFullName: e.target.value })}
            />
            <TextField
              label="Năm sinh (Cha)"
              fullWidth
              type="number"
              value={editFamilyFormData.fatherYearOfBirth}
              onChange={(e) => setEditFamilyFormData({ ...editFamilyFormData, fatherYearOfBirth: e.target.value })}
              inputProps={{ min: 1900, max: new Date().getFullYear() }}
            />
            <TextField
              label="Số điện thoại (Cha)"
              fullWidth
              value={editFamilyFormData.fatherPhone}
              onChange={(e) => setEditFamilyFormData({ ...editFamilyFormData, fatherPhone: e.target.value })}
            />
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>
              Thông tin mẹ
            </Typography>
            <TextField
              label="Họ tên Mẹ"
              fullWidth
              value={editFamilyFormData.motherFullName}
              onChange={(e) => setEditFamilyFormData({ ...editFamilyFormData, motherFullName: e.target.value })}
            />
            <TextField
              label="Năm sinh (Mẹ)"
              fullWidth
              type="number"
              value={editFamilyFormData.motherYearOfBirth}
              onChange={(e) => setEditFamilyFormData({ ...editFamilyFormData, motherYearOfBirth: e.target.value })}
              inputProps={{ min: 1900, max: new Date().getFullYear() }}
            />
            <TextField
              label="Số điện thoại (Mẹ)"
              fullWidth
              value={editFamilyFormData.motherPhone}
              onChange={(e) => setEditFamilyFormData({ ...editFamilyFormData, motherPhone: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditFamilyDialog}>Hủy</Button>
          <Button 
            onClick={handleSaveFamilyInfo} 
            variant="contained" 
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : null}
          >
            {updating ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default Profile;