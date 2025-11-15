import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Paper,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { User } from '../../types';

interface EmailDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSendEmail: (emailData: EmailData) => Promise<void>;
  loading?: boolean;
}

interface EmailData {
  userId: number;
  subject: string;
  content: string;
  includeCredentials: boolean;
}

const EmailDialog: React.FC<EmailDialogProps> = ({
  open,
  onClose,
  user,
  onSendEmail,
  loading = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  // Template email cung cấp thông tin đăng nhập
  const getEmailTemplate = React.useCallback(() => {
    const codeText = user?.role === 'teacher' ? 'giảng viên' : 'sinh viên';
    
    return {
      subject: 'IUH - Thông tin tài khoản và hướng dẫn đăng nhập hệ thống',
      content: `Xin chào ${user?.fullName || ''},

Tài khoản của bạn trên hệ thống quản lý lớp học IUH vừa được khởi tạo thành công.

Thông tin đăng nhập của bạn:
- Mã ${codeText}: [Mã sẽ được hiển thị trong email]
- Mật khẩu: [Mật khẩu sẽ được hiển thị trong email]

Vui lòng đăng nhập và thay đổi mật khẩu ngay để đảm bảo an toàn.

Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với phòng Công Tác Sinh Viên.

Trân trọng,
IUH - Trường Đại học Công nghiệp TP.HCM`
    };
  }, [user?.fullName, user?.role]);

  // Tự động điền thông tin khi dialog mở
  React.useEffect(() => {
    if (open && user) {
      const template = getEmailTemplate();
      setSubject(template.subject);
      setContent(template.content);
    }
  }, [open, user, getEmailTemplate]);

  const handleSend = async () => {
    if (!user) return;

    if (!subject.trim()) {
      setError('Vui lòng nhập tiêu đề email');
      return;
    }

    if (!content.trim()) {
      setError('Vui lòng nhập nội dung email');
      return;
    }

    setError('');

    try {
      await onSendEmail({
        userId: user.id,
        subject: subject.trim(),
        content: content.trim(),
        includeCredentials: true
      });
      
      onClose();
    } catch (err) {
      setError('Có lỗi xảy ra khi gửi email');
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'teacher': return 'Giảng viên';
      case 'student': return 'Sinh viên';
      case 'admin': return 'Quản trị viên';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'primary';
      case 'student': return 'secondary';
      case 'admin': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth={isMobile ? 'xs' : isTablet ? 'sm' : 'md'}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: { 
          minHeight: { xs: 'auto', sm: '500px', md: '600px' },
          m: { xs: 0, sm: 2 }
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        fontSize: { xs: '1rem', sm: '1.25rem' },
        py: { xs: 1.5, sm: 2 }
      }}>
        <EmailIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        Gửi email thông báo
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        {user && (
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {/* Thông tin người nhận */}
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 }, bgcolor: '#f8f9fa' }}>
              <Typography 
                variant={isMobile ? 'subtitle1' : 'h6'} 
                sx={{ 
                  mb: { xs: 1.5, sm: 2 }, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 0.75, sm: 1 },
                  fontSize: { xs: '0.9rem', sm: '1.25rem' }
                }}
              >
                <PersonIcon color="primary" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                Thông tin người nhận
              </Typography>
              
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography 
                    variant="body2" 
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                  >
                    Họ và tên:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      wordBreak: 'break-word'
                    }}
                  >
                    {user.fullName}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography 
                    variant="body2" 
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                  >
                    Email:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold" 
                    color="primary"
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      wordBreak: 'break-word'
                    }}
                  >
                    {user.email}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography 
                    variant="body2" 
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                  >
                    Vai trò:
                  </Typography>
                  <Chip 
                    label={getRoleText(user.role)} 
                    color={getRoleColor(user.role) as any}
                    size={isMobile ? 'small' : 'medium'}
                    icon={user.role === 'teacher' ? <SchoolIcon /> : <PersonIcon />}
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.875rem' },
                      height: { xs: 24, sm: 32 }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography 
                    variant="body2" 
                    color="textSecondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 0.5 }}
                  >
                    Mã số:
                  </Typography>
                  <Typography 
                    variant="body1" 
                    fontWeight="bold"
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      wordBreak: 'break-word'
                    }}
                  >
                    {user.role === 'teacher' ? user.teacherCode : 
                     user.role === 'student' ? user.studentCode : 'ADMIN'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            </Grid>

            {error && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="error" sx={{ mb: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {error}
                </Alert>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
            </Grid>

            {/* Form gửi email */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Tiêu đề email"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                variant="outlined"
                required
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nội dung email"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                multiline
                rows={isMobile ? 6 : isTablet ? 7 : 8}
                variant="outlined"
                required
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontFamily: 'monospace',
                    fontSize: { xs: '0.8rem', sm: '0.9rem' }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Alert severity="info" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  <strong>Lưu ý:</strong> Email này sẽ tự động bao gồm thông tin đăng nhập:
                  <br />• Mã {user.role === 'teacher' ? 'giảng viên' : 'sinh viên'}
                  <br />• Mật khẩu đăng nhập
                  <br />• Hướng dẫn thay đổi mật khẩu
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, sm: 2.5, md: 3 }, 
        gap: { xs: 1, sm: 1.5 },
        flexDirection: { xs: 'column-reverse', sm: 'row' }
      }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          fullWidth={isMobile}
          size={isMobile ? 'medium' : 'large'}
          sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Hủy
        </Button>
        <Button 
          onClick={handleSend}
          disabled={loading || !subject.trim() || !content.trim()}
          variant="contained"
          fullWidth={isMobile}
          size={isMobile ? 'medium' : 'large'}
          startIcon={loading ? <CircularProgress size={isMobile ? 16 : 20} /> : <SendIcon />}
          sx={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            '&:hover': {
              background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              opacity: 0.9
            }
          }}
        >
          {loading ? 'Đang gửi...' : 'Gửi email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailDialog;
