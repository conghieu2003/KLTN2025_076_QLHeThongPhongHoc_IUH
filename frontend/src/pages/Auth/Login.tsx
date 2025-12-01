import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { login, clearErrors } from '../../redux/slices/authSlice';
import { authService } from '../../services/api';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import 'devextreme/dist/css/dx.light.css';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { toast } from 'react-toastify';
import { Box, Container, useTheme, useMediaQuery, Grid, CircularProgress, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface LoginData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 960px
  
  const [selectedRole, setSelectedRole] = useState<string>('student');
  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState<boolean>(false);
  
  // State để track lỗi validation
  const [loginErrors, setLoginErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  
  // Refs để focus vào trường bị lỗi
  const usernameRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);

  // Rive animations - fallback to simple divs if animations fail to load
  const { RiveComponent: LoginAnimation, rive: loginRive } = useRive({
    src: '/animations/login-animation.riv',
    stateMachines: 'LoginFlow',
    autoplay: true,
    layout: new Layout({
      fit: Fit.Cover,
      alignment: Alignment.Center,
    }),
  });

  useEffect(() => {
    // Xử lý role dựa trên mã số
    if (loginData.username.startsWith('admin') || loginData.username === '1') {
      setSelectedRole('admin');
    } else if (loginData.username.startsWith('gv') || loginData.username.startsWith('10')) {
      setSelectedRole('teacher');
    } else if (loginData.username.startsWith('20') || loginData.username.startsWith('ST')) {
      setSelectedRole('student');
    } else {
      // Mặc định là student nếu không nhận diện được
      setSelectedRole('student');
    }
  }, [loginData.username]);
  
  useEffect(() => {
    const styleInputs = () => {
      const inputs = document.querySelectorAll('.login-textbox input');
      inputs.forEach((input: any) => {
        if (input) {
          input.style.color = '#ffffff';
          input.style.webkitTextFillColor = '#ffffff';
          // Prevent zoom on mobile when focusing
          if (isMobile) {
            input.style.fontSize = '16px';
          }
        }
      });
    };

    // Prevent zoom on mobile when input is focused
    const preventZoom = () => {
      const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      if (viewport && isMobile) {
        const originalContent = viewport.content;
        viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
        
        return () => {
          viewport.content = originalContent;
        };
      }
      return () => {};
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (isMobile && (e.target as HTMLElement).tagName === 'INPUT') {
        preventZoom();
      }
    };

    const handleFocusOut = () => {
      // Optionally restore zoom capability after blur
    };
  
    styleInputs();
    const timer1 = setTimeout(styleInputs, 100);
    const timer2 = setTimeout(styleInputs, 500);
    
    const observer = new MutationObserver(() => {
      styleInputs();
    });
    
    const containers = document.querySelectorAll('.login-textbox');
    containers.forEach(container => {
      observer.observe(container, { childList: true, subtree: true });
    });

    // Add event listeners to prevent zoom
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isMobile]);

  const handleLogin = async (e?: React.FormEvent, passwordValue?: string): Promise<void> => {
    if (e) e.preventDefault();
    
    // Reset errors
    setLoginErrors({});
    dispatch(clearErrors());
    
    const currentUsername = usernameRef.current?.instance?.option('value') || loginData.username || '';
    const currentPassword = passwordValue || passwordRef.current?.instance?.option('value') || loginData.password || '';
    if (currentUsername !== loginData.username || currentPassword !== loginData.password) {
      setLoginData({
        username: currentUsername,
        password: currentPassword
      });
    }
    const updatedLoginData = {
      username: currentUsername.trim(),
      password: currentPassword.trim()
    };
    
    // Kiểm tra dữ liệu nhập và focus vào trường bị lỗi
    if (!updatedLoginData.username) {
      setLoginErrors({ username: 'Vui lòng nhập tên đăng nhập' });
      setTimeout(() => {
        if (usernameRef.current && usernameRef.current.instance) {
          usernameRef.current.instance.focus();
        }
      }, 100);
      return;
    }
    
    if (!updatedLoginData.password) {
      setLoginErrors({ password: 'Vui lòng nhập mật khẩu' });
      setTimeout(() => {
        if (passwordRef.current && passwordRef.current.instance) {
          passwordRef.current.instance.focus();
        }
      }, 100);
      return;
    }

    try {
      await dispatch(login({ 
        username: updatedLoginData.username, 
        password: updatedLoginData.password 
      })).unwrap();
      
      // Trigger success animation
      if (loginRive) {
        loginRive.play('Success');
      }
      toast.success('Đăng nhập thành công');
      setTimeout(() => navigate('/dashboard'), 1500);
      
    } catch (error: any) {
      let errorMessage = 'Đăng nhập thất bại';
      let focusField: 'username' | 'password' | null = null;
      
      // Trigger error animation
      if (loginRive) {
        loginRive.play('Error');
      }
      
      // Xử lý lỗi từ Redux
      if (error && typeof error === 'string') {
        if (error.includes('không chính xác')) {
          errorMessage = 'Mật khẩu không chính xác';
          focusField = 'password';
          setLoginErrors({ password: 'Mật khẩu không chính xác' });
        } else if (error.includes('không tồn tại')) {
          errorMessage = 'Tài khoản không tồn tại';
          focusField = 'username';
          setLoginErrors({ username: 'Tài khoản không tồn tại' });
        } else if (error.includes('đã bị khóa')) {
          errorMessage = 'Tài khoản đã bị khóa';
          focusField = 'username';
          setLoginErrors({ username: 'Tài khoản đã bị khóa' });
        } else {
          errorMessage = error;
        }
      }
      
      toast.error(errorMessage);
      
      // Focus vào trường bị lỗi
      if (focusField === 'username') {
        setTimeout(() => {
          if (usernameRef.current && usernameRef.current.instance) {
            usernameRef.current.instance.focus();
          }
        }, 100);
      } else if (focusField === 'password') {
        setTimeout(() => {
          if (passwordRef.current && passwordRef.current.instance) {
            passwordRef.current.instance.focus();
          }
        }, 100);
      }
    }
  };

  const handleForgotPassword = async () => {
    setLoginErrors({});
    
    if (!loginData.username.trim()) {
      setLoginErrors({ username: 'Vui lòng nhập mã số sinh viên/giảng viên' });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await authService.forgotPassword(loginData.username.trim());
      
      if (response.success) {
        toast.success(response.message || 'Email khôi phục mật khẩu đã được gửi');
        setShowForgotPassword(false);
        setLoginData({ ...loginData, username: '' });
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
        setLoginErrors({ username: response.message || 'Có lỗi xảy ra' });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi yêu cầu';
      toast.error(errorMessage);
      setLoginErrors({ username: errorMessage });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Responsive values
  const headerIconSize = isMobile ? '56px' : isTablet ? '70px' : '80px';
  const headerIconFontSize = isMobile ? '22px' : isTablet ? '28px' : '32px';
  const titleFontSize = isMobile ? '18px' : isTablet ? '24px' : '28px';
  const subtitleFontSize = isMobile ? '11px' : '14px';
  const roleButtonPadding = isMobile ? '6px 8px' : '12px 16px';
  const roleButtonMinWidth = isMobile ? '0px' : '80px';
  const roleIconFontSize = isMobile ? '14px' : '18px';
  const roleTextFontSize = isMobile ? '9px' : '12px';
  const maxWidth = isMobile ? '100%' : isTablet ? '400px' : '420px';

  return (
    <Box
      sx={{
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        fontFamily: 'Montserrat, sans-serif',
        backgroundColor: '#0f0f23',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d1b69 100%)',
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center', md: 'center' },
        justifyContent: 'center',
        minHeight: '100vh',
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        position: 'relative',
        overflow: 'hidden',
        paddingX: { xs: '12px', sm: '24px', md: '0' },
        paddingY: { xs: '8px', sm: '24px', md: '0' },
        overflowY: { xs: 'hidden', sm: 'hidden', md: 'hidden' },
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        scrollbarWidth: 'none'
      }}
    >
      {/* Background Animation */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          overflow: 'hidden',
          zIndex: 1,
          opacity: { xs: 0.5, sm: 0.7, md: 1 }
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <LoginAnimation />
        </Box>
      </Box>

      {/* Floating Particles Effect */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          maxHeight: '100vh',
          overflow: 'hidden',
          zIndex: 2,
          pointerEvents: 'none',
          display: { xs: 'none', sm: 'block', md: 'block' }
        }}
      >
        {[...Array(20)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: '2px',
              height: '2px',
              backgroundColor: '#4a9eff',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.6,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </Box>

      {/* Main Login Container */}
      <Container
        maxWidth={false}
        sx={{
          width: '100%',
          maxWidth: maxWidth,
          padding: 0,
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center', md: 'center' },
          justifyContent: { xs: 'flex-start', sm: 'center', md: 'center' },
          height: { xs: 'auto', sm: '100%', md: '100%' },
          minHeight: { xs: 'calc(100vh - 16px)', sm: '100%', md: '100%' },
          zIndex: 10,
          position: 'relative',
          marginTop: { xs: '0', sm: '0', md: '0' },
          boxSizing: 'border-box'
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: { xs: '16px', sm: '20px', md: '24px' },
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            padding: { xs: '16px', sm: '28px', md: '40px' },
            width: '100%',
            maxWidth: maxWidth,
            zIndex: 10,
            position: 'relative',
            maxHeight: { xs: 'calc(100vh - 16px)', sm: '90vh', md: 'auto' },
            minHeight: { xs: 'fit-content', sm: 'auto', md: 'auto' },
            overflowY: { xs: 'hidden', sm: 'auto', md: 'auto' },
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            marginTop: { xs: '0', sm: '0', md: '0' },
            marginBottom: { xs: '0', sm: '0', md: '0' },
            boxSizing: 'border-box',
            '&::-webkit-scrollbar': {
              width: '4px',
              display: { xs: 'none', sm: 'block', md: 'block' }
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px'
            }
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', marginBottom: { xs: '16px', sm: '24px', md: '32px' } }}>
            <Box
              sx={{
                width: { xs: headerIconSize, sm: headerIconSize, md: headerIconSize },
                height: { xs: headerIconSize, sm: headerIconSize, md: headerIconSize },
                margin: '0 auto',
                marginBottom: { xs: '8px', sm: '16px', md: '20px' },
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
              }}
            >
              <Box
                component="i"
                className="fas fa-graduation-cap"
                sx={{
                  fontSize: headerIconFontSize,
                  color: '#fff'
                }}
              />
            </Box>
            <Box
              component="h1"
              sx={{ 
                fontSize: { xs: titleFontSize, sm: titleFontSize, md: titleFontSize }, 
                marginBottom: { xs: '4px', sm: '6px', md: '8px' },
                color: '#fff',
                fontWeight: '600',
                marginTop: 0
              }}
            >
              Hệ thống Quản lý Phòng học
            </Box>
            <Box
              component="p"
              sx={{ 
                fontSize: { xs: subtitleFontSize, sm: subtitleFontSize, md: subtitleFontSize }, 
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0
              }}
            >
              Đăng nhập để tiếp tục
            </Box>
          </Box>

          {/* Role Selection */}
          <Box
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: { xs: '6px', sm: '10px', md: '12px' }, 
              marginBottom: { xs: '16px', sm: '24px', md: '32px' }
            }}
          >
            {['student', 'teacher', 'admin'].map((role) => (
              <Box
                component="button"
                key={role}
                onClick={() => setSelectedRole(role)}
                sx={{
                  padding: { xs: roleButtonPadding, sm: roleButtonPadding, md: roleButtonPadding },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: '4px', sm: '5px', md: '6px' },
                  background: selectedRole === role 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  color: selectedRole === role ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: { xs: '8px', sm: '10px', md: '12px' },
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minWidth: { xs: roleButtonMinWidth === '0px' ? '0' : roleButtonMinWidth, sm: roleButtonMinWidth, md: roleButtonMinWidth },
                  flex: { xs: 1, sm: 'none', md: 'none' },
                  fontFamily: 'inherit',
                  flexBasis: { xs: '33.333%', sm: 'auto', md: 'auto' }
                }}
              >
                <Box
                  component="i"
                  className={`fas fa-${role === 'student' ? 'user-graduate' : role === 'teacher' ? 'chalkboard-teacher' : 'user-shield'}`}
                  sx={{
                    fontSize: roleIconFontSize
                  }}
                />
                <Box
                  component="span"
                  sx={{ 
                    fontSize: { xs: roleTextFontSize, sm: roleTextFontSize, md: roleTextFontSize }, 
                    fontWeight: '500' 
                  }}
                >
                  {role === 'student' ? 'Sinh viên' : role === 'teacher' ? 'Giảng viên' : 'Admin'}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin(e);
            }}
            sx={{ width: '100%' }}
          >
            <Grid container spacing={{ xs: 1.5, sm: 2 }} direction="column">
              <Grid size={{ xs: 12 }}>
                <Box sx={{ position: 'relative' }}>
                  <TextBox
                    ref={usernameRef}
                    stylingMode="filled"
                    placeholder={selectedRole === 'student' ? 'Mã số sinh viên' : selectedRole === 'teacher' ? 'Mã giảng viên' : 'Tên đăng nhập'}
                    value={loginData.username}
                    onValueChanged={(e: any) => {
                      setLoginData({...loginData, username: e.value});
                      if (loginErrors.username) {
                        setLoginErrors({...loginErrors, username: undefined});
                      }
                    }}
                    onKeyDown={(e: any) => {
                      if (e.event.key === 'Enter') {
                        e.event.preventDefault();
                        if (passwordRef.current && passwordRef.current.instance) {
                          passwordRef.current.instance.focus();
                        }
                      }
                    }}
                    width="100%"
                    isValid={!loginErrors.username}
                    className="login-textbox"
                    disabled={isLoading}
                    inputAttr={{
                      style: 'color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;'
                    }}
                  />
                </Box>
                {loginErrors.username && (
                  <Box sx={{ 
                    color: '#ff6b6b', 
                    fontSize: { xs: '11px', sm: '12px', md: '12px' }, 
                    marginTop: '6px',
                    textAlign: 'left'
                  }}>
                    {loginErrors.username}
                  </Box>
                )}
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Box sx={{ position: 'relative' }}>
                  <TextBox
                    ref={passwordRef}
                    stylingMode="filled"
                    mode={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu"
                    value={loginData.password}
                    onValueChanged={(e: any) => {
                      setLoginData({...loginData, password: e.value});
                      if (loginErrors.password) {
                        setLoginErrors({...loginErrors, password: undefined});
                      }
                    }}
                    onKeyDown={(e: any) => {
                      if (e.event.key === 'Enter') {
                        e.event.preventDefault();
                        e.event.stopPropagation();
                        const inputElement = e.event.target as HTMLInputElement;
                        const currentPasswordValue = inputElement?.value || passwordRef.current?.instance?.option('value') || loginData.password || '';
                        if (currentPasswordValue !== loginData.password) {
                          setLoginData(prev => ({...prev, password: currentPasswordValue}));
                        }
                        setTimeout(() => {
                          handleLogin(undefined, currentPasswordValue);
                        }, 10);
                      }
                    }}
                    width="100%"
                    isValid={!loginErrors.password}
                    className="login-textbox"
                    disabled={isLoading}
                    inputAttr={{
                      style: 'color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; padding-right: 48px !important;'
                    }}
                  />
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    sx={{
                      position: 'absolute',
                      right: { xs: '8px', sm: '10px', md: '12px' },
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      padding: { xs: '6px', sm: '8px', md: '8px' },
                      '&:hover': {
                        color: '#fff',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:disabled': {
                        color: 'rgba(255, 255, 255, 0.3)'
                      },
                      zIndex: 2
                    }}
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: { xs: '18px', sm: '20px', md: '22px' } }} />
                    ) : (
                      <Visibility sx={{ fontSize: { xs: '18px', sm: '20px', md: '22px' } }} />
                    )}
                  </IconButton>
                </Box>
                {loginErrors.password && (
                  <Box sx={{ 
                    color: '#ff6b6b', 
                    fontSize: { xs: '11px', sm: '12px', md: '12px' }, 
                    marginTop: '6px',
                    textAlign: 'left'
                  }}>
                    {loginErrors.password}
                  </Box>
                )}
              </Grid>

              {/* Forgot Password */}
              {!showForgotPassword ? (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setLoginErrors({});
                      }}
                      disabled={isLoading}
                      sx={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        fontSize: { xs: '12px', sm: '13px', md: '14px' }, 
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        textDecoration: 'underline',
                        transition: 'color 0.3s ease',
                        padding: 0,
                        fontFamily: 'inherit',
                        opacity: isLoading ? 0.5 : 1,
                        '&:hover': {
                          color: isLoading ? 'rgba(255, 255, 255, 0.7)' : '#fff'
                        }
                      }}
                    >
                      Quên mật khẩu?
                    </Box>
                  </Box>
                </Grid>
              ) : (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ 
                      backgroundColor: 'rgba(102, 126, 234, 0.2)', 
                      padding: { xs: '12px', sm: '16px' }, 
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      marginBottom: '8px'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '12px'
                      }}>
                        <Box sx={{ 
                          color: '#fff', 
                          fontSize: { xs: '13px', sm: '14px' }, 
                          fontWeight: '500' 
                        }}>
                          Khôi phục mật khẩu
                        </Box>
                        <Box
                          component="button"
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setLoginErrors({});
                          }}
                          sx={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            cursor: 'pointer',
                            padding: '4px',
                            fontSize: '16px',
                            '&:hover': {
                              color: '#fff'
                            }
                          }}
                        >
                          ×
                        </Box>
                      </Box>
                      <Box sx={{ 
                        color: 'rgba(255, 255, 255, 0.8)', 
                        fontSize: { xs: '11px', sm: '12px' }, 
                        marginBottom: '12px' 
                      }}>
                        Nhập mã số sinh viên/giảng viên để nhận email khôi phục mật khẩu
                      </Box>
                      <Box sx={{ position: 'relative', marginBottom: '8px' }}>
                        <TextBox
                          stylingMode="filled"
                          placeholder="Mã số sinh viên/giảng viên"
                          value={loginData.username}
                          onValueChanged={(e: any) => {
                            setLoginData({...loginData, username: e.value});
                            if (loginErrors.username) {
                              setLoginErrors({...loginErrors, username: undefined});
                            }
                          }}
                          onKeyDown={(e: any) => {
                            if (e.event.key === 'Enter') {
                              e.event.preventDefault();
                              handleForgotPassword();
                            }
                          }}
                          width="100%"
                          isValid={!loginErrors.username}
                          className="login-textbox"
                          disabled={forgotPasswordLoading || isLoading}
                          inputAttr={{
                            style: 'color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;'
                          }}
                        />
                      </Box>
                      {loginErrors.username && (
                        <Box sx={{ 
                          color: '#ff6b6b', 
                          fontSize: { xs: '11px', sm: '12px' }, 
                          marginBottom: '8px',
                          textAlign: 'left'
                        }}>
                          {loginErrors.username}
                        </Box>
                      )}
                      <Button
                        width="100%"
                        height={isMobile ? 36 : 40}
                        text={forgotPasswordLoading ? "ĐANG GỬI..." : "GỬI YÊU CẦU"}
                        type="default"
                        stylingMode="contained"
                        onClick={handleForgotPassword}
                        disabled={forgotPasswordLoading || isLoading}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: isMobile ? '12px' : '13px',
                          fontWeight: '600',
                          cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                          opacity: forgotPasswordLoading ? 0.9 : 1,
                          color: '#fff'
                        }}
                      />
                    </Box>
                  </Grid>
                </>
              )}

              {/* Login Button */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ position: 'relative' }}>
                  <Button
                    width="100%"
                    height={isMobile ? 44 : isTablet ? 46 : 48}
                    text={isLoading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
                    type="default"
                    stylingMode="contained"
                    onClick={() => handleLogin()}
                    disabled={isLoading}
                    style={{
                      background: isLoading 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: isMobile ? '10px' : isTablet ? '11px' : '12px',
                      fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                      fontWeight: '600',
                      boxShadow: isLoading 
                        ? '0 4px 12px rgba(102, 126, 234, 0.6)' 
                        : '0 8px 25px rgba(102, 126, 234, 0.4)',
                      transition: 'all 0.3s ease',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.9 : 1,
                      color: isLoading ? 'rgba(255, 255, 255, 0.7)' : '#fff'
                    }}
                  />
                  {isLoading && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        pointerEvents: 'none',
                        zIndex: 10
                      }}
                    >
                      <CircularProgress 
                        size={isMobile ? 18 : isTablet ? 20 : 22} 
                        thickness={4}
                        sx={{ 
                          color: '#fff',
                          '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round'
                          }
                        }} 
                      />
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>

        </Box>
      </Container>

      {/* CSS Animations and Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Prevent body/html scroll on mobile */
          @media (max-width: 600px) {
            html, body {
              width: 100% !important;
              height: 100% !important;
              max-width: 100vw !important;
              max-height: 100vh !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Prevent zoom on input focus - iOS Safari fix */
            input, textarea, select {
              font-size: 16px !important;
              transform: scale(1) !important;
            }
            
            /* Prevent zoom when focusing on inputs */
            input:focus,
            textarea:focus,
            select:focus {
              font-size: 16px !important;
              transform: scale(1) !important;
              zoom: 1 !important;
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
              opacity: 0.6;
            }
            50% {
              transform: translateY(-20px) rotate(180deg);
              opacity: 1;
            }
          }
          
          /* DevExtreme TextBox styling for dark theme */
          .login-textbox .dx-textbox-input,
          .login-textbox input,
          .login-textbox input[type="text"],
          .login-textbox input[type="password"] {
            background-color: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 12px !important;
            color: #ffffff !important;
            padding: 12px 16px !important;
            -webkit-text-fill-color: #ffffff !important;
          }
          
          @media (max-width: 600px) {
            .login-textbox .dx-textbox-input,
            .login-textbox input,
            .login-textbox input[type="text"],
            .login-textbox input[type="password"] {
              padding: 10px 14px !important;
              border-radius: 10px !important;
              font-size: 16px !important;
              transform: scale(1) !important;
              zoom: 1 !important;
            }
          }
          
          @media (min-width: 601px) and (max-width: 960px) {
            .login-textbox .dx-textbox-input,
            .login-textbox input,
            .login-textbox input[type="text"],
            .login-textbox input[type="password"] {
              padding: 11px 15px !important;
              border-radius: 11px !important;
              font-size: 15px !important;
            }
          }
          
          .login-textbox .dx-textbox-input::placeholder,
          .login-textbox input::placeholder,
          .login-textbox input[type="text"]::placeholder,
          .login-textbox input[type="password"]::placeholder {
            color: rgba(255, 255, 255, 0.5) !important;
            -webkit-text-fill-color: rgba(255, 255, 255, 0.5) !important;
            opacity: 1 !important;
          }
          
          .login-textbox .dx-textbox-input:focus,
          .login-textbox input:focus,
          .login-textbox input[type="text"]:focus,
          .login-textbox input[type="password"]:focus {
            border-color: rgba(255, 255, 255, 0.4) !important;
            background-color: rgba(255, 255, 255, 0.15) !important;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
            outline: none !important;
          }
          
          .login-textbox.dx-state-invalid .dx-textbox-input,
          .login-textbox.dx-state-invalid input {
            border-color: #ff6b6b !important;
          }
          
          .login-textbox .dx-textbox-container {
            background-color: transparent !important;
          }
          
          /* Đảm bảo màu chữ khi đang nhập */
          .login-textbox input:-webkit-autofill,
          .login-textbox input:-webkit-autofill:hover,
          .login-textbox input:-webkit-autofill:focus,
          .login-textbox input:-webkit-autofill:active {
            -webkit-text-fill-color: #ffffff !important;
            -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.1) inset !important;
            transition: background-color 5000s ease-in-out 0s;
          }
          
          /* Force white text color for all input elements inside login-textbox */
          .login-textbox * {
            color: #ffffff !important;
          }
          
          .login-textbox input,
          .login-textbox .dx-texteditor-input {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
          }
          
          /* Override any DevExtreme default styles */
          .login-textbox .dx-texteditor-input-container input {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
          }
          
          /* Rive Animation Canvas - Fix overflow on mobile */
          canvas,
          canvas[data-rive-id],
          [data-rive-id] canvas {
            max-width: 100vw !important;
            max-height: 100vh !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
          }
          
          /* Rive container wrapper */
          [data-rive-id] {
            max-width: 100vw !important;
            max-height: 100vh !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            position: relative !important;
          }
          
          @media (max-width: 600px) {
            canvas,
            canvas[data-rive-id],
            [data-rive-id] canvas {
              max-width: 100vw !important;
              max-height: 100vh !important;
              object-fit: cover !important;
            }
          }
        `
      }} />
    </Box>
  );
};

export default Login;
