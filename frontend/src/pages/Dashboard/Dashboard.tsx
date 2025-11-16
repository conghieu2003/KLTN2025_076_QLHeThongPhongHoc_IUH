import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography,
  Grid,
  Avatar,
  CircularProgress
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  CalendarToday as CalendarTodayIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  MeetingRoom as MeetingRoomIcon,
  Search as SearchIcon,
  List as ListIcon,
  EventNote as EventNoteIcon,
  CalendarMonth as CalendarMonthIcon,
  Warning as WarningIcon,
  SwapHoriz as SwapHorizIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { authService, profileService, scheduleManagementService } from '../../services/api';
import { User } from '../../types';

interface MenuCard {
  id: string;
  title: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [weeklySchedules, setWeeklySchedules] = useState(0);
  const [weeklyExams, setWeeklyExams] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Helper function to get current week start date (Monday)
  const getCurrentWeekStartDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    let daysToSubtract;
    
    if (dayOfWeek === 0) {
      daysToSubtract = 6;
    } else {
      daysToSubtract = dayOfWeek - 1;
    }
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const hasDayOffException = (schedule: any): boolean => {
    if (!schedule.exceptionDate) {
      return false;
    }
    
    const isDayOff = schedule.requestTypeId === 5 || '';
    
    if (!isDayOff) {
      return false;
    }
    
    // Check if exception date is in current week
    const exceptionDate = new Date(schedule.exceptionDate);
    exceptionDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    let daysToSubtract;
    
    if (dayOfWeek === 0) {
      daysToSubtract = 6;
    } else {
      daysToSubtract = dayOfWeek - 1;
    }
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return exceptionDate >= weekStart && exceptionDate <= weekEnd;
  };

  const fetchWeeklyScheduleCount = useCallback(async () => {
    try {
      const weekStartDate = getCurrentWeekStartDate();
      const user = authService.getCurrentUser();
      
      const filters: any = {};
      if (user?.role === 'teacher' || user?.role === 'student') {
      }
      
      const response = await scheduleManagementService.getWeeklySchedule(weekStartDate, filters);
      
      if (response.success && Array.isArray(response.data)) {
        const schedules = response.data;
        
        const validSchedules = schedules.filter((schedule: any) => !hasDayOffException(schedule));
        
        const classSchedules = validSchedules.filter((schedule: any) => {
          const isNotExam = schedule.requestTypeId !== 6; 
          return isNotExam;
        });
        
        // Count exam schedules (lịch thi)
        // Lịch thi là những schedule có type === 'exam' hoặc exceptionType === 'exam' hoặc requestTypeId === 6
        const examSchedules = validSchedules.filter((schedule: any) => {
          return schedule.type === 'exam' || 
                 schedule.exceptionType === 'exam' ||
                 schedule.requestTypeId === 6; // RequestTypeId 6 = Thi
        });
        
        setWeeklySchedules(classSchedules.length);
        setWeeklyExams(examSchedules.length);
      }
    } catch (error) {
      console.error('Error fetching weekly schedule count:', error);
      setWeeklySchedules(0);
      setWeeklyExams(0);
    }
  }, []);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setUserRole(user.role || 'student');
    }
    
    // Fetch profile data
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const response = await profileService.getProfile();
        if (response.success) {
          setProfileData(response.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    fetchProfile();
    
    // Fetch weekly schedule counts
    fetchWeeklyScheduleCount();
    
    setUnreadNotifications(0);
  }, [fetchWeeklyScheduleCount]);

  // Menu cards based on user role
  const getMenuCards = (): MenuCard[] => {
    const baseCards: MenuCard[] = [];

    if (userRole === 'admin') {
      baseCards.push(
        {
          id: 'users',
          title: 'Quản lý người dùng',
          path: '/users',
          icon: <PeopleIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        {
          id: 'rooms',
          title: 'Hệ thống phòng học',
          path: '/rooms',
          icon: <MeetingRoomIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        {
          id: 'available-rooms',
          title: 'Danh sách phòng học',
          path: '/rooms/available',
          icon: <SearchIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        {
          id: 'request-list',
          title: 'Danh sách yêu cầu',
          path: '/rooms/requests/list',
          icon: <ListIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        {
          id: 'room-scheduling',
          title: 'Sắp xếp phòng học',
          path: '/rooms/scheduling',
          icon: <EventNoteIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        {
          id: 'weekly-schedule',
          title: 'Lịch học theo tuần',
          path: '/schedule/weekly',
          icon: <CalendarMonthIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        {
          id: 'schedule-management',
          title: 'Quản lý ngoại lệ lịch học',
          path: '/schedule/management',
          icon: <WarningIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        }
      );
    } else if (userRole === 'teacher') {
      baseCards.push(
        {
          id: 'weekly-schedule',
          title: 'Lịch dạy theo tuần',
          path: '/schedule/weekly',
          icon: <CalendarMonthIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        {
          id: 'room-requests',
          title: 'Yêu cầu đổi phòng',
          path: '/room-requests',
          icon: <SwapHorizIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        {
          id: 'profile',
          title: 'Thông tin cá nhân',
          path: '/profile',
          icon: <PersonIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        }
      );
    } else {
      // student
      baseCards.push(
        {
          id: 'weekly-schedule',
          title: 'Lịch học theo tuần',
          path: '/schedule/weekly',
          icon: <CalendarMonthIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        },
        {
          id: 'profile',
          title: 'Thông tin cá nhân',
          path: '/profile',
          icon: <PersonIcon />,
          color: '#1976d2',
          bgColor: '#e3f2fd'
        }
      );
    }

    return baseCards;
  };

  const handleCardClick = (path: string) => {
    navigate(path);
  };

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

  const menuCards = getMenuCards();
  
  const { user, studentInfo, teacherInfo, academicProfile, personalProfile } = profileData || {};

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5, md: 3 }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 1.5, sm: 2, md: 3 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: { xs: 0.5, sm: 1 },
            fontWeight: 'bold',
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' },
            color: 'primary.main'
          }}
        >
          Trang chủ
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
        >
          Xin chào, {currentUser?.fullName || 'Người dùng'}
        </Typography>
      </Box>

      {/* User Information Card */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 1.5, sm: 2, md: 3 } }}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                  mb: { xs: 1.5, sm: 2 }
                }}
              >
                {userRole === 'student' ? 'Thông tin sinh viên' : 
                 userRole === 'teacher' ? 'Thông tin giảng viên' : 
                 'Thông tin quản trị viên'}
              </Typography>
              
              {loadingProfile ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : user ? (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {/* Avatar */}
                  <Grid size={{ xs: 12 }} sx={{ textAlign: 'center', mb: 1 }}>
                    <Avatar
                      src={user.avatar}
                      alt={user.fullName}
                      sx={{
                        width: { xs: 80, sm: 100, md: 120 },
                        height: { xs: 80, sm: 100, md: 120 },
                        mx: 'auto',
                        mb: 1,
                        bgcolor: 'primary.main'
                      }}
                    >
                      {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Typography 
                      variant="body2" 
                      color="primary" 
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => navigate('/profile')}
                    >
                      Xem chi tiết
                    </Typography>
                  </Grid>

                  {/* Two Column Layout - Personal Info (Left) and Academic Info (Right) */}
                  {userRole === 'student' && (
                    <>
                      {/* Left Column - Personal Information */}
                      <Grid size={{ xs: 6, sm: 6 }}>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>MSSV:</strong> {studentInfo?.studentCode || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Họ tên:</strong> {user.fullName || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Giới tính:</strong> {getGenderText(user.gender)}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Ngày sinh:</strong> {formatDate(user.dateOfBirth)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Nơi sinh:</strong> {personalProfile?.placeOfBirth || 'N/A'}
                        </Typography>
                      </Grid>
                      {/* Right Column - Academic Information */}
                      <Grid size={{ xs: 6, sm: 6 }}>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Lớp học:</strong> {academicProfile?.classCode || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Khóa học:</strong> {academicProfile?.academicYear || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Bậc đào tạo:</strong> {academicProfile?.degreeLevel || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Loại hình đào tạo:</strong> {academicProfile?.trainingType || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Ngành:</strong> {studentInfo?.major?.name || 'N/A'}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  {userRole === 'teacher' && (
                    <>
                      {/* Left Column - Personal Information */}
                      <Grid size={{ xs: 6, sm: 6 }}>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Mã GV:</strong> {teacherInfo?.teacherCode || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Họ tên:</strong> {user.fullName || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Giới tính:</strong> {getGenderText(user.gender)}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Ngày sinh:</strong> {formatDate(user.dateOfBirth)}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Nơi sinh:</strong> {personalProfile?.placeOfBirth || 'N/A'}
                        </Typography>
                      </Grid>
                      {/* Right Column - Academic Information */}
                      <Grid size={{ xs: 6, sm: 6 }}>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Khoa:</strong> {teacherInfo?.department?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Ngành:</strong> {teacherInfo?.major?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Chức danh:</strong> {academicProfile?.title || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Loại hình đào tạo:</strong> {academicProfile?.trainingType || 'N/A'}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  {userRole === 'admin' && (
                    <>
                      {/* Left Column - Personal Information */}
                      <Grid size={{ xs: 6, sm: 6 }}>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Họ tên:</strong> {user.fullName || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Email:</strong> {user.email || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Số điện thoại:</strong> {user.phone || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Địa chỉ:</strong> {user.address || 'N/A'}
                        </Typography>
                      </Grid>
                      {/* Right Column - Role Information */}
                      <Grid size={{ xs: 6, sm: 6 }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                          <strong>Trạng thái:</strong> {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Không có thông tin
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notifications Card */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 1.5, sm: 2, md: 3 } }}>
        <Grid size={{ xs: 12 }}>
          <Card 
            sx={{ 
              boxShadow: 2,
              '&:hover': { 
                boxShadow: 4,
                cursor: 'pointer'
              },
              transition: 'box-shadow 0.3s'
            }}
            onClick={() => {
              // TODO: Navigate to notifications page
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 8, sm: 9 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
                      mb: 1
                    }}
                  >
                    Nhắc nhở mới, chưa xem
                  </Typography>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: 'primary.main',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                      mb: 1
                    }}
                  >
                    {unreadNotifications}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="primary" 
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Xem chi tiết
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4, sm: 3 }} sx={{ textAlign: 'right' }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: 56, sm: 64, md: 72 },
                      height: { xs: 56, sm: 64, md: 72 },
                      borderRadius: '50%',
                      backgroundColor: '#f5f5f5',
                      color: 'primary.main'
                    }}
                  >
                    <NotificationsIcon sx={{ fontSize: { xs: 28, sm: 32, md: 36 } }} />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Weekly Schedule Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 1.5, sm: 2, md: 3 } }}>
        <Grid size={{ xs: 6 }}>
          <Card 
            sx={{ 
              boxShadow: 2,
              backgroundColor: '#e3f2fd',
              '&:hover': { 
                boxShadow: 4,
                cursor: 'pointer'
              },
              transition: 'box-shadow 0.3s'
            }}
            onClick={() => navigate('/schedule/weekly')}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                  mb: 1,
                  color: '#1976d2'
                }}
              >
                Lịch học trong tuần
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  mb: 1
                }}
              >
                {weeklySchedules}
              </Typography>
              <Typography 
                variant="body2" 
                color="primary" 
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Xem chi tiết
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  mt: 1
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: { xs: 40, sm: 48, md: 56 },
                    height: { xs: 40, sm: 48, md: 56 },
                    borderRadius: '50%',
                    backgroundColor: '#bbdefb',
                    color: '#1976d2'
                  }}
                >
                  <CalendarTodayIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Card 
            sx={{ 
              boxShadow: 2,
              backgroundColor: '#fff9c4',
              '&:hover': { 
                boxShadow: 4,
                cursor: 'pointer'
              },
              transition: 'box-shadow 0.3s'
            }}
            onClick={() => navigate('/schedule/weekly')}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                  mb: 1,
                  color: '#f57c00'
                }}
              >
                Lịch thi trong tuần
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#f57c00',
                  fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                  mb: 1
                }}
              >
                {weeklyExams}
              </Typography>
              <Typography 
                variant="body2" 
                color="secondary" 
                sx={{ 
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                  cursor: 'pointer',
                  color: '#f57c00',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Xem chi tiết
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  mt: 1
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: { xs: 40, sm: 48, md: 56 },
                    height: { xs: 40, sm: 48, md: 56 },
                    borderRadius: '50%',
                    backgroundColor: '#fff59d',
                    color: '#f57c00'
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Menu Cards Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {menuCards.map((card) => (
          <Grid key={card.id} size={{ xs: 6, sm: 4, md: 3 }}>
            <Card 
              sx={{ 
                boxShadow: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { 
                  boxShadow: 4,
                  cursor: 'pointer',
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s'
                },
                transition: 'all 0.3s'
              }}
              onClick={() => handleCardClick(card.path)}
            >
              <CardContent 
                sx={{ 
                  p: { xs: 1.5, sm: 2 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  flex: 1,
                  justifyContent: 'center'
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: { xs: 48, sm: 56, md: 64 },
                    height: { xs: 48, sm: 56, md: 64 },
                    borderRadius: '50%',
                    backgroundColor: card.bgColor,
                    color: card.color,
                    mb: { xs: 1, sm: 1.5 }
                  }}
                >
                  {React.cloneElement(card.icon as React.ReactElement, {
                    sx: { fontSize: { xs: 24, sm: 28, md: 32 } }
                  })}
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 'medium',
                    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                    color: 'text.primary',
                    wordBreak: 'break-word'
                  }}
                >
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
