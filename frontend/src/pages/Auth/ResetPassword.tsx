import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/api';
import { TextBox } from 'devextreme-react/text-box';
import { Button } from 'devextreme-react/button';
import { toast } from 'react-toastify';
import { Box, Container, useTheme, useMediaQuery, Grid, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import 'devextreme/dist/css/dx.light.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Link khôi phục mật khẩu không hợp lệ');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, navigate]);

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

  const validate = () => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else {
      const passwordError = validateStrongPassword(newPassword);
      if (passwordError) {
        newErrors.newPassword = passwordError;
      }
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validate()) {
      return;
    }

    if (!token) {
      toast.error('Link khôi phục mật khẩu không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.resetPassword({
        token,
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim()
      });
      
      if (response.success) {
        toast.success(response.message || 'Đặt lại mật khẩu thành công');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

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
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        height: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        position: 'relative',
        overflow: 'hidden',
        paddingX: { xs: '12px', sm: '24px', md: '0' },
        paddingY: { xs: '8px', sm: '24px', md: '0' },
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          width: '100%',
          maxWidth: maxWidth,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: { xs: '16px', sm: '20px', md: '24px' },
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            padding: { xs: '24px', sm: '32px', md: '40px' },
            width: '100%',
            maxWidth: maxWidth,
            zIndex: 10,
            position: 'relative',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', marginBottom: { xs: '24px', sm: '32px' } }}>
            <Box
              sx={{
                width: { xs: '56px', sm: '70px', md: '80px' },
                height: { xs: '56px', sm: '70px', md: '80px' },
                margin: '0 auto',
                marginBottom: { xs: '16px', sm: '20px' },
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
                className="fas fa-lock"
                sx={{
                  fontSize: { xs: '22px', sm: '28px', md: '32px' },
                  color: '#fff'
                }}
              />
            </Box>
            <Box
              component="h1"
              sx={{ 
                fontSize: { xs: '20px', sm: '24px', md: '28px' }, 
                marginBottom: { xs: '8px', sm: '12px' },
                color: '#fff',
                fontWeight: '600',
                marginTop: 0
              }}
            >
              Đặt lại mật khẩu
            </Box>
            <Box
              component="p"
              sx={{ 
                fontSize: { xs: '12px', sm: '13px', md: '14px' }, 
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0,
                marginBottom: '16px'
              }}
            >
              Vui lòng nhập mật khẩu mới của bạn
            </Box>
          </Box>

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: '100%' }}
          >
            <Grid container spacing={{ xs: 1.5, sm: 2 }} direction="column">
              <Grid size={{ xs: 12 }}>
                <Box sx={{ position: 'relative' }}>
                  <TextBox
                    stylingMode="filled"
                    mode={showPassword ? "text" : "password"}
                    placeholder="Mật khẩu mới"
                    value={newPassword}
                    onValueChanged={(e: any) => {
                      setNewPassword(e.value);
                      if (errors.newPassword) {
                        setErrors({ ...errors, newPassword: undefined });
                      }
                    }}
                    onKeyDown={(e: any) => {
                      if (e.event.key === 'Enter') {
                        e.event.preventDefault();
                        if (confirmPassword) {
                          handleSubmit();
                        }
                      }
                    }}
                    width="100%"
                    isValid={!errors.newPassword}
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
                {errors.newPassword && (
                  <Box sx={{ 
                    color: '#ff6b6b', 
                    fontSize: { xs: '11px', sm: '12px', md: '12px' }, 
                    marginTop: '6px',
                    textAlign: 'left'
                  }}>
                    {errors.newPassword}
                  </Box>
                )}
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ position: 'relative' }}>
                  <TextBox
                    stylingMode="filled"
                    mode={showConfirmPassword ? "text" : "password"}
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onValueChanged={(e: any) => {
                      setConfirmPassword(e.value);
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: undefined });
                      }
                    }}
                    onKeyDown={(e: any) => {
                      if (e.event.key === 'Enter') {
                        e.event.preventDefault();
                        handleSubmit();
                      }
                    }}
                    width="100%"
                    isValid={!errors.confirmPassword}
                    className="login-textbox"
                    disabled={isLoading}
                    inputAttr={{
                      style: 'color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; padding-right: 48px !important;'
                    }}
                  />
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? (
                      <VisibilityOff sx={{ fontSize: { xs: '18px', sm: '20px', md: '22px' } }} />
                    ) : (
                      <Visibility sx={{ fontSize: { xs: '18px', sm: '20px', md: '22px' } }} />
                    )}
                  </IconButton>
                </Box>
                {errors.confirmPassword && (
                  <Box sx={{ 
                    color: '#ff6b6b', 
                    fontSize: { xs: '11px', sm: '12px', md: '12px' }, 
                    marginTop: '6px',
                    textAlign: 'left'
                  }}>
                    {errors.confirmPassword}
                  </Box>
                )}
              </Grid>

              {/* Submit Button */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ position: 'relative' }}>
                  <Button
                    width="100%"
                    height={isMobile ? 44 : isTablet ? 46 : 48}
                    text={isLoading ? "ĐANG XỬ LÝ..." : "ĐẶT LẠI MẬT KHẨU"}
                    type="default"
                    stylingMode="contained"
                    onClick={() => handleSubmit()}
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

              {/* Back to Login */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ textAlign: 'center', marginTop: '16px' }}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => navigate('/login')}
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
                    Quay lại đăng nhập
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* CSS Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .login-textbox .dx-textbox-input,
          .login-textbox input {
            background-color: rgba(255, 255, 255, 0.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 12px !important;
            color: #ffffff !important;
            padding: 12px 16px !important;
            -webkit-text-fill-color: #ffffff !important;
          }
          
          @media (max-width: 600px) {
            .login-textbox .dx-textbox-input,
            .login-textbox input {
              padding: 10px 14px !important;
              border-radius: 10px !important;
              font-size: 16px !important;
            }
          }
          
          .login-textbox .dx-textbox-input::placeholder,
          .login-textbox input::placeholder {
            color: rgba(255, 255, 255, 0.5) !important;
            -webkit-text-fill-color: rgba(255, 255, 255, 0.5) !important;
            opacity: 1 !important;
          }
          
          .login-textbox .dx-textbox-input:focus,
          .login-textbox input:focus {
            border-color: rgba(255, 255, 255, 0.4) !important;
            background-color: rgba(255, 255, 255, 0.15) !important;
            outline: none !important;
          }
          
          .login-textbox.dx-state-invalid .dx-textbox-input,
          .login-textbox.dx-state-invalid input {
            border-color: #ff6b6b !important;
          }
        `
      }} />
    </Box>
  );
};

export default ResetPassword;


