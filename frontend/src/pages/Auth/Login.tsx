import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { login, clearErrors } from '../../redux/slices/authSlice';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import 'devextreme/dist/css/dx.light.css';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import notify from 'devextreme/ui/notify';

interface LoginData {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.auth);
  
  const [selectedRole, setSelectedRole] = useState<string>('student');
  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: ''
  });
  
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

  const { RiveComponent: LoadingAnimation, rive: loadingRive } = useRive({
    src: '/animations/loading.riv',
    stateMachines: 'Loading',
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
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
    // Trigger animation based on loading state
    if (loadingRive) {
      if (isLoading) {
        loadingRive.play();
      } else {
        loadingRive.pause();
      }
    }
  }, [isLoading, loadingRive]);
  
  useEffect(() => {
    const styleInputs = () => {
      const inputs = document.querySelectorAll('.login-textbox input');
      inputs.forEach((input: any) => {
        if (input) {
          input.style.color = '#ffffff';
          input.style.webkitTextFillColor = '#ffffff';
        }
      });
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
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
    };
  }, []);

  const handleLogin = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();
    
    // Reset errors
    setLoginErrors({});
    dispatch(clearErrors());
    
    // Kiểm tra dữ liệu nhập và focus vào trường bị lỗi
    if (!loginData.username.trim()) {
      setLoginErrors({ username: 'Vui lòng nhập tên đăng nhập' });
      setTimeout(() => {
        if (usernameRef.current && usernameRef.current.instance) {
          usernameRef.current.instance.focus();
        }
      }, 100);
      return;
    }
    
    if (!loginData.password.trim()) {
      setLoginErrors({ password: 'Vui lòng nhập mật khẩu' });
      setTimeout(() => {
        if (passwordRef.current && passwordRef.current.instance) {
          passwordRef.current.instance.focus();
        }
      }, 100);
      return;
    }

    try {
      // Sử dụng Redux thunk action
      await dispatch(login({ 
        username: loginData.username, 
        password: loginData.password 
      })).unwrap();
      
      // Trigger success animation
      if (loginRive) {
        loginRive.play('Success');
      }
      notify('Đăng nhập thành công', 'success', 2000);
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
      
      notify(errorMessage, 'error', 3000);
      
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

  return (
    <div style={{
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
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Animation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}>
        <LoginAnimation />
      </div>

      {/* Floating Particles Effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none'
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
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
      </div>

      {/* Main Login Container */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
          }}>
            <i className="fas fa-graduation-cap" style={{ 
              fontSize: '32px', 
              color: '#fff' 
            }}></i>
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            marginBottom: '8px',
            color: '#fff',
            fontWeight: '600'
          }}>
            Hệ thống Quản lý Phòng học
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0
          }}>
            Đăng nhập để tiếp tục
          </p>
        </div>

        {/* Role Selection */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px', 
          marginBottom: '32px'
        }}>
          {['student', 'teacher', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              style={{
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: selectedRole === role 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: selectedRole === role ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '80px'
              }}
            >
              <i className={`fas fa-${role === 'student' ? 'user-graduate' : role === 'teacher' ? 'chalkboard-teacher' : 'user-shield'}`} 
                 style={{ fontSize: '18px' }}></i>
              <span style={{ fontSize: '12px', fontWeight: '500' }}>
                {role === 'student' ? 'Sinh viên' : role === 'teacher' ? 'Giảng viên' : 'Admin'}
              </span>
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
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
                inputAttr={{
                  style: 'color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;'
                }}
              />
            </div>
            {loginErrors.username && (
              <div style={{ 
                color: '#ff6b6b', 
                fontSize: '12px', 
                marginTop: '6px',
                textAlign: 'left'
              }}>
                {loginErrors.username}
              </div>
            )}
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <TextBox
                ref={passwordRef}
                stylingMode="filled"
                mode="password"
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
                    handleLogin();
                  }
                }}
                width="100%"
                isValid={!loginErrors.password}
                className="login-textbox"
                inputAttr={{
                  style: 'color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;'
                }}
              />
            </div>
            {loginErrors.password && (
              <div style={{ 
                color: '#ff6b6b', 
                fontSize: '12px', 
                marginTop: '6px',
                textAlign: 'left'
              }}>
                {loginErrors.password}
              </div>
            )}
          </div>

          {/* Forgot Password */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <button 
              type="button"
              onClick={() => notify('Tính năng quên mật khẩu đang được phát triển', 'info', 3000)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'rgba(255, 255, 255, 0.7)', 
                fontSize: '14px', 
                cursor: 'pointer',
                textDecoration: 'underline',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              Quên mật khẩu?
            </button>
          </div>

          {/* Login Button */}
          <Button
            width="100%"
            height={48}
            text={isLoading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
            type="default"
            stylingMode="contained"
            onClick={() => handleLogin()}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
          />
        </form>

        {/* Loading Animation Overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20
          }}>
            <div style={{ width: '120px', height: '120px' }}>
              <LoadingAnimation />
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations and Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
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
        `
      }} />
    </div>
  );
};

export default Login;
