import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { TextBox } from 'devextreme-react/text-box';
import { User } from '../../types';
import Sidebar from './Sidebar';
import { Box, Grid, useTheme, useMediaQuery, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Stack, CircularProgress, InputAdornment } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { initSocket } from '../../utils/socket';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { changePassword } from '../../redux/slices/profileSlice';
import { toast } from 'react-toastify';
import 'devextreme/dist/css/dx.light.css';


const Layout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 960px
  
  const [searchText, setSearchText] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [passwordFormData, setPasswordFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const currentUser: User | null = authService.getCurrentUser();
  const socketInitialized = useRef(false);

  // Xử lý click outside
  useEffect(() => {
    if (!showUserMenu && !(isMobile && sidebarOpen)) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      if (toggleButtonRef.current && toggleButtonRef.current.contains(target)) {
        return;
      }
      
      if (showUserMenu && 
          dropdownRef.current && !dropdownRef.current.contains(target) &&
          userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      
      if (isMobile && sidebarOpen && sidebarRef.current && 
          !sidebarRef.current.contains(target) &&
          !(toggleButtonRef.current && toggleButtonRef.current.contains(target))) {
        setSidebarOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('touchend', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('touchend', handleClickOutside, true);
    };
  }, [isMobile, sidebarOpen, showUserMenu]);

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true);
    } else if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isDesktop, isMobile]);

  // Initialize socket for all authenticated users (admin, teacher, student)
  useEffect(() => {
    if (currentUser?.id && !socketInitialized.current) {
      initSocket(currentUser.id);
      socketInitialized.current = true;
    }

    // Cleanup on unmount or logout
    return () => {
      if (!currentUser) {
        socketInitialized.current = false;
      }
    };
  }, [currentUser?.id, currentUser?.role]);

  const handleMenuItemClick = (action: string): void => {
    setShowUserMenu(false);
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'password':
        setPasswordDialogOpen(true);
        setPasswordFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
        break;
      case 'logout':
        authService.logout();
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setShowPasswords({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false
    });
  };

  // Hàm validate mật khẩu mạnh
  const validateStrongPassword = (password: string): string | null => {
    if (!password || password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase) {
      return 'Mật khẩu phải có ít nhất một chữ cái in hoa (A-Z)';
    }

    if (!hasNumber) {
      return 'Mật khẩu phải có ít nhất một số (0-9)';
    }

    if (!hasSpecialChar) {
      return 'Mật khẩu phải có ít nhất một ký tự đặc biệt (!@#$%^&*()_+-=[]{}|;:,.<>?)';
    }

    return null;
  };

  const handleChangePassword = async () => {
    // Validate
    const errors: { [key: string]: string } = {};
    
    if (!passwordFormData.oldPassword) {
      errors.oldPassword = 'Vui lòng nhập mật khẩu cũ';
    }
    if (!passwordFormData.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else {
      const passwordError = validateStrongPassword(passwordFormData.newPassword);
      if (passwordError) {
        errors.newPassword = passwordError;
      }
    }
    if (!passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setChangingPassword(true);
    try {
      await dispatch(changePassword({
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword
      })).unwrap();
      toast.success('Đổi mật khẩu thành công');
      handleClosePasswordDialog();
    } catch (error: any) {
      toast.error(error || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleSidebar = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSidebarOpen(prev => !prev);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: { xs: '100vw', sm: '100vw', md: '100vw' },
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
        minWidth: { xs: 0, sm: 0, md: '1200px' },
        boxSizing: 'border-box'
      }}
    >
      {/* Backdrop/Overlay for mobile sidebar */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: { xs: '56px', sm: '56px' }, // Start below header
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1250,
            opacity: sidebarOpen ? 1 : 0,
            visibility: sidebarOpen ? 'visible' : 'hidden',
            transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s ease-in-out',
            pointerEvents: sidebarOpen ? 'auto' : 'none',
            willChange: 'opacity'
          }}
          onClick={(e) => {
            // Don't close if clicking on toggle button
            if (toggleButtonRef.current && toggleButtonRef.current.contains(e.target as Node)) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            setSidebarOpen(false);
          }}
          onTouchEnd={(e) => {
            // Don't close if clicking on toggle button
            if (toggleButtonRef.current && toggleButtonRef.current.contains(e.target as Node)) {
              return;
            }
            e.preventDefault();
            e.stopPropagation();
            setSidebarOpen(false);
          }}
        />
      )}

      {/* Header - Fixed at top */}
      <Box
        sx={{
          height: { xs: '56px', sm: '56px', md: '50px' },
          minHeight: { xs: '56px', sm: '56px', md: '50px' },
          maxHeight: { xs: '56px', sm: '56px', md: '50px' },
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: { xs: '0 12px', sm: '0 16px', md: '0 20px' },
          justifyContent: 'space-between',
          borderBottom: '1px solid #e0e0e0',
          flexShrink: 0,
          width: '100%',
          maxWidth: { xs: '100vw', sm: '100vw', md: '100%' },
          zIndex: 1300,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          boxSizing: 'border-box',
          overflow: 'visible'
        }}
      >
        <Grid container spacing={{ xs: 1, sm: 1.5, md: 2.5 }} alignItems="center" sx={{ flex: 1 }}>
          {/* Hamburger Menu Button for Mobile */}
          {isMobile && (
            <Grid size={{ xs: 'auto' }}>
              <IconButton
                ref={toggleButtonRef}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSidebar(e);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSidebar(e);
                }}
                sx={{
                  padding: '8px',
                  position: 'relative',
                  zIndex: 1101,
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            </Grid>
          )}
          
          {/* Logo */}
          <Grid size={{ xs: 'auto' }}>
            <Box
              component="img"
              src="/logo-iuh-ngang.jpg"
              alt="Logo"
              sx={{
                height: { xs: '40px', sm: '45px', md: '50px' },
                display: 'block',
                objectFit: 'contain'
              }}
            />
          </Grid>
          
          {/* Search Box - Hidden on mobile */}
          <Grid size={{ xs: 0, sm: 0, md: 'auto' }}>
            <Box
              sx={{
                display: { xs: 'none', sm: 'none', md: 'block' },
                position: 'relative'
              }}
            >
              <TextBox
                style={{
                  width: '300px',
                  borderRadius: '20px',
                  backgroundColor: '#f5f5f5'
                }}
                mode="search"
                placeholder="Tìm kiếm..."
                value={searchText}
                onValueChanged={(e: any) => setSearchText(e.value)}
                stylingMode="filled"
              />
            </Box>
          </Grid>
          
          {/* Home Icon - Hidden on mobile */}
          <Grid size={{ xs: 0, sm: 'auto', md: 'auto' }}>
            <Box
              sx={{
                width: '40px',
                height: '40px',
                display: { xs: 'none', sm: 'flex', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/dashboard')}
            >
              <Box
                component="i"
                className="fas fa-home"
                sx={{
                  fontSize: '20px',
                  color: '#666'
                }}
              />
            </Box>
          </Grid>
        </Grid>

        <Grid container size={{ xs: 'auto' }}>
          <Box sx={{ position: 'relative', zIndex: 1350 }}>
          <Box
            ref={userMenuRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowUserMenu(prev => !prev);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowUserMenu(prev => !prev);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: '6px', sm: '8px', md: '10px' },
              cursor: 'pointer',
              padding: { xs: '8px', sm: '8px 10px', md: '8px 10px' },
              borderRadius: '4px',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              '&:active': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            <Box
              sx={{
                width: { xs: '28px', sm: '30px', md: '32px' },
                height: { xs: '28px', sm: '30px', md: '32px' },
                borderRadius: '50%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666'
              }}
            >
              <Box
                component="i"
                className="fas fa-user"
                sx={{
                  fontSize: { xs: '14px', sm: '16px', md: '18px' }
                }}
              />
            </Box>
            <Box
              component="span"
              sx={{
                color: '#333',
                fontSize: { xs: '13px', sm: '14px', md: '16px' },
                display: { xs: 'none', sm: 'block', md: 'block' },
                maxWidth: { sm: '100px', md: '200px' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {currentUser?.fullName || ''}
            </Box>
            <Box
              component="i"
              className="fas fa-chevron-down"
              sx={{
                fontSize: { xs: '10px', sm: '11px', md: '12px' },
                color: '#666',
                display: { xs: 'none', sm: 'block', md: 'block' }
              }}
            />
          </Box>

          {showUserMenu && (
            <>
              {/* Backdrop for mobile/tablet to close dropdown */}
              {(isMobile || !isDesktop) && (
                <Box
                  sx={{
                    position: 'fixed',
                    top: { xs: '56px', sm: '56px', md: '50px' },
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1349,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowUserMenu(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowUserMenu(false);
                  }}
                />
              )}
              <Box
                ref={dropdownRef}
                onClick={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '5px',
                  backgroundColor: '#fff',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  width: { xs: '180px', sm: '200px', md: '200px' },
                  zIndex: 1351,
                  minWidth: '150px',
                  border: '1px solid #e0e0e0',
                  overflow: 'hidden',
                  touchAction: 'manipulation'
                }}
              >
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('profile');
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('profile');
                  }}
                  sx={{
                    padding: { xs: '10px 12px', sm: '12px 15px', md: '12px 15px' },
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: { xs: '13px', sm: '14px', md: '16px' },
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    },
                    '&:active': {
                      backgroundColor: '#eeeeee'
                    }
                  }}
                >
                  <Box
                    component="i"
                    className="fas fa-user"
                    sx={{ width: '20px', fontSize: { xs: '14px', sm: '16px' }, color: '#666' }}
                  />
                  <span>Thông tin cá nhân</span>
                </Box>
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('password');
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('password');
                  }}
                  sx={{
                    padding: { xs: '10px 12px', sm: '12px 15px', md: '12px 15px' },
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: { xs: '13px', sm: '14px', md: '16px' },
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    },
                    '&:active': {
                      backgroundColor: '#eeeeee'
                    }
                  }}
                >
                  <Box
                    component="i"
                    className="fas fa-key"
                    sx={{ width: '20px', fontSize: { xs: '14px', sm: '16px' }, color: '#666' }}
                  />
                  <span>Đổi mật khẩu</span>
                </Box>
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('logout');
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleMenuItemClick('logout');
                  }}
                  sx={{
                    padding: { xs: '10px 12px', sm: '12px 15px', md: '12px 15px' },
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: { xs: '13px', sm: '14px', md: '16px' },
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    },
                    '&:active': {
                      backgroundColor: '#eeeeee'
                    }
                  }}
                >
                  <Box
                    component="i"
                    className="fas fa-sign-out-alt"
                    sx={{ width: '20px', fontSize: { xs: '14px', sm: '16px' }, color: '#666' }}
                  />
                  <span>Đăng xuất</span>
                </Box>
              </Box>
            </>
          )}
          </Box>
        </Grid>
      </Box>

      <Grid
        container
        sx={{
          flex: 1,
          backgroundColor: '#f5f5f5',
          minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 56px)', md: 'calc(100vh - 50px)' },
          width: '100%',
          maxWidth: { xs: '100vw', sm: '100vw', md: 'none' },
          position: 'relative',
          overflow: 'visible',
          boxSizing: 'border-box',
          marginTop: { xs: '56px', sm: '56px', md: '50px' }
        }}
      >
        {/* Sidebar - Hidden on mobile (fixed overlay), shown on desktop */}
        {!isMobile && (
          <Box ref={sidebarRef}>
            <Sidebar 
              open={true}
              onClose={() => setSidebarOpen(false)}
              isMobile={false}
            />
          </Box>
        )}

        {/* Sidebar for mobile - Fixed overlay */}
        {isMobile && (
          <Box ref={sidebarRef}>
            <Sidebar 
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              isMobile={true}
            />
          </Box>
        )}

        {/* Main Content */}
        <Grid
          size={{ xs: 12, sm: 12 }}
          sx={{
            flex: { md: 1 },
            padding: { xs: '12px', sm: '16px', md: '20px' },
            overflowY: 'auto',
            overflowX: 'auto',
            minWidth: 0,
            width: '100%',
            maxWidth: { xs: '100vw', sm: '100vw', md: 'none' },
            boxSizing: 'border-box',
            minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 56px)', md: 'calc(100vh - 50px)' },
            display: 'flex',
            flexDirection: 'column',
            marginLeft: { xs: 0, sm: 0, md: '250px' }
          }}
        >
          <Outlet />
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={handleClosePasswordDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Đổi mật khẩu</Typography>
            <IconButton onClick={handleClosePasswordDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Mật khẩu cũ"
              fullWidth
              type={showPasswords.oldPassword ? "text" : "password"}
              value={passwordFormData.oldPassword}
              onChange={(e) => {
                setPasswordFormData({ ...passwordFormData, oldPassword: e.target.value });
                setPasswordErrors({ ...passwordErrors, oldPassword: '' });
              }}
              error={!!passwordErrors.oldPassword}
              helperText={passwordErrors.oldPassword}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, oldPassword: !prev.oldPassword }))}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={changingPassword}
                      sx={{ padding: '4px' }}
                    >
                      {showPasswords.oldPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Mật khẩu mới"
              fullWidth
              type={showPasswords.newPassword ? "text" : "password"}
              value={passwordFormData.newPassword}
              onChange={(e) => {
                setPasswordFormData({ ...passwordFormData, newPassword: e.target.value });
                setPasswordErrors({ ...passwordErrors, newPassword: '' });
              }}
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword || ''}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={changingPassword}
                      sx={{ padding: '4px' }}
                    >
                      {showPasswords.newPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Xác nhận mật khẩu mới"
              fullWidth
              type={showPasswords.confirmPassword ? "text" : "password"}
              value={passwordFormData.confirmPassword}
              onChange={(e) => {
                setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value });
                setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
              }}
              error={!!passwordErrors.confirmPassword}
              helperText={passwordErrors.confirmPassword}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={changingPassword}
                      sx={{ padding: '4px' }}
                    >
                      {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Hủy</Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained" 
            disabled={changingPassword}
            startIcon={changingPassword ? <CircularProgress size={20} /> : null}
          >
            {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(-100%);
              opacity: 0;
            }
          }
          
          /* Prevent horizontal scroll on mobile - but allow vertical */
          @media (max-width: 959px) {
            body {
              overflow-x: hidden !important;
              overflow-y: auto !important;
              width: 100% !important;
              max-width: 100vw !important;
              position: relative !important;
            }
            
            html {
              overflow-x: hidden !important;
              overflow-y: auto !important;
              width: 100% !important;
              max-width: 100vw !important;
            }
            
            #root {
              width: 100% !important;
              max-width: 100vw !important;
              overflow-x: hidden !important;
              overflow-y: auto !important;
              position: relative !important;
            }
            
            /* Prevent all containers from overflowing horizontally */
            * {
              max-width: 100vw;
            }
            
            /* Ensure Box components don't overflow horizontally */
            [class*="MuiBox-root"] {
              max-width: 100% !important;
            }
            
            /* Allow tables and content to scroll horizontally if needed */
            table, .MuiTable-root, .MuiTableContainer-root {
              max-width: 100% !important;
              overflow-x: auto !important;
            }
          }
        `
      }} />
    </Box>
  );
};

export default Layout;
