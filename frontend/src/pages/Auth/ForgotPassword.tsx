import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { TextBox } from 'devextreme-react/text-box';
import { Button } from 'devextreme-react/button';
import { toast } from 'react-toastify';
import { Box, Container, useTheme, useMediaQuery, Grid, CircularProgress } from '@mui/material';
import 'devextreme/dist/css/dx.light.css';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [identifier, setIdentifier] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setError('');
    
    if (!identifier.trim()) {
      setError('Vui lòng nhập mã số sinh viên/giảng viên');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(identifier.trim());
      
      if (response.success) {
        toast.success(response.message || 'Email khôi phục mật khẩu đã được gửi');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi yêu cầu';
      toast.error(errorMessage);
      setError(errorMessage);
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
                className="fas fa-key"
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
              Quên mật khẩu
            </Box>
            <Box
              component="p"
              sx={{ 
                fontSize: { xs: '12px', sm: '13px', md: '14px' }, 
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0
              }}
            >
              Nhập mã số sinh viên/giảng viên để nhận email khôi phục mật khẩu
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
                    placeholder="Mã số sinh viên/giảng viên"
                    value={identifier}
                    onValueChanged={(e: any) => {
                      setIdentifier(e.value);
                      setError('');
                    }}
                    onKeyDown={(e: any) => {
                      if (e.event.key === 'Enter') {
                        e.event.preventDefault();
                        handleSubmit();
                      }
                    }}
                    width="100%"
                    isValid={!error}
                    className="login-textbox"
                    disabled={isLoading}
                    inputAttr={{
                      style: 'color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;'
                    }}
                  />
                </Box>
                {error && (
                  <Box sx={{ 
                    color: '#ff6b6b', 
                    fontSize: { xs: '11px', sm: '12px', md: '12px' }, 
                    marginTop: '6px',
                    textAlign: 'left'
                  }}>
                    {error}
                  </Box>
                )}
              </Grid>

              {/* Submit Button */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ position: 'relative' }}>
                  <Button
                    width="100%"
                    height={isMobile ? 44 : isTablet ? 46 : 48}
                    text={isLoading ? "ĐANG GỬI..." : "GỬI YÊU CẦU"}
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

export default ForgotPassword;


