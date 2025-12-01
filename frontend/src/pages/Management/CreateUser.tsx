import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchFormInit, fetchMajors, createUserThunk } from '../../redux/slices/userSlice';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  MenuItem, 
  Grid, 
  useTheme, 
  useMediaQuery,
  Paper 
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

interface CreateUserForm {
  fullName: string;
  email: string;
	phone?: string;
	address?: string;
	avatar?: string;
	gender?: 'male' | 'female' | 'other';
	dateOfBirth?: Dayjs | null;
  role: 'teacher' | 'student';
  teacherCode?: string;
  studentCode?: string;
  title?: string;
	departmentId?: number;
	majorId?: number;
	classCode?: string;
}

const CreateUser = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
	const [submitting, setSubmitting] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const { previewCode, previewUsername, departments, majors, defaultValues } = useSelector((s: RootState) => s.user);
	const [form, setForm] = useState<CreateUserForm>({
    fullName: '',
    email: '',
		phone: '',
		address: '',
		avatar: '',
		gender: undefined,
		dateOfBirth: null,
    role: 'student',
		classCode: '',
	});

	const handleRoleChange = (role: 'teacher' | 'student'): void => {
		setForm((prev) => ({
			...prev,
			role,
			teacherCode: role === 'teacher' ? prev.teacherCode : '',
			studentCode: role === 'student' ? prev.studentCode : '',
			title: role === 'teacher' ? prev.title : '',
			departmentId: undefined,
			majorId: undefined,
		}));
        
        dispatch(fetchFormInit(role));
	};

    useEffect(() => {
        dispatch(fetchFormInit(form.role));
    }, [dispatch, form.role]);

    // Khi chọn khoa, tự động load danh sách chuyên ngành theo khoa
    useEffect(() => {
        if (form.departmentId) {
            dispatch(fetchMajors({ departmentId: form.departmentId }));
            setForm((p) => ({ ...p, majorId: undefined }));
        } else {
            setForm((p) => ({ ...p, majorId: undefined }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.departmentId]);

	const handleSubmit = async (): Promise<void> => {
		try {
			setSubmitting(true);

			if (!form.fullName || !form.email || !form.role) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(form.email)) {
				toast.error('Email không đúng định dạng');
        return;
      }

			// Validate phone format (optional but if provided should be valid)
			if (form.phone && !/^[0-9+\-\s()]+$/.test(form.phone)) {
				toast.error('Số điện thoại không đúng định dạng');
        return;
      }

			const payload = {
				fullName: form.fullName,
				email: form.email,
				phone: form.phone?.trim() || undefined,
				address: form.address?.trim() || undefined,
				avatar: form.avatar?.trim() || undefined,
				gender: form.gender || undefined,
				dateOfBirth: form.dateOfBirth ? form.dateOfBirth.format('YYYY-MM-DD') : undefined,
				role: form.role,
				departmentId: form.departmentId || undefined,
				majorId: form.majorId || undefined,
				classCode: form.classCode?.trim() || undefined,
			};

			const response: any = await (dispatch as any)(createUserThunk(payload));
			if (response?.meta?.requestStatus === 'fulfilled') {
				toast.success('Tạo tài khoản thành công');
        navigate('/users');
      } else {
				toast.error(response?.payload || 'Có lỗi xảy ra khi tạo tài khoản');
      }
    } catch (error: any) {
			toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
			setSubmitting(false);
		}
	};

  return (
		<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
			<Box sx={{ 
        p: { xs: 1.5, sm: 2, md: 3 },
        pb: { xs: 4, sm: 3, md: 3 },
        minHeight: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)', md: 'auto' }
      }}>
				<Typography 
          variant={isMobile ? 'h6' : 'h5'} 
          sx={{ 
            mb: { xs: 1.5, sm: 2 }, 
            fontWeight: 600,
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' }
          }}
        >
          Tạo người dùng
        </Typography>
				
        {/* Group: Personal info (top) */}
				<Paper sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, mb: { xs: 2, sm: 2.5, md: 3 }, boxShadow: 1 }}>
					<Typography 
            variant={isMobile ? 'body1' : 'subtitle1'} 
            sx={{ 
              fontWeight: 600, 
              mb: { xs: 1.25, sm: 1.5 },
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.125rem' }
            }}
          >
            Thông tin cá nhân
          </Typography>
					<Grid container spacing={{ xs: 1.5, sm: 2 }}>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                required 
                label="Họ và tên" 
                value={form.fullName} 
                onChange={(e: any) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                required 
                type="email" 
                label="Email" 
                value={form.email} 
                onChange={(e: any) => setForm((p) => ({ ...p, email: e.target.value }))}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                label="Số điện thoại" 
                value={form.phone} 
                onChange={(e: any) => setForm((p) => ({ ...p, phone: e.target.value }))}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                label="Địa chỉ" 
                value={form.address} 
                onChange={(e: any) => setForm((p) => ({ ...p, address: e.target.value }))}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                select 
                fullWidth 
                label="Giới tính" 
                value={form.gender || ''} 
                onChange={(e: any) => setForm((p) => ({ ...p, gender: e.target.value as any }))}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              >
								<MenuItem value="male" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Nam</MenuItem>
								<MenuItem value="female" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Nữ</MenuItem>
								<MenuItem value="other" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Khác</MenuItem>
							</TextField>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<DatePicker
								label="Ngày sinh"
								value={form.dateOfBirth}
								onChange={(newValue) => setForm((p) => ({ ...p, dateOfBirth: newValue }))}
								slotProps={{
									textField: {
										fullWidth: true,
										size: isMobile ? 'small' : 'medium',
										sx: {
                      fontSize: { xs: '0.875rem', sm: '1rem' },
											'& .MuiOutlinedInput-root': {
												'& fieldset': {
													borderColor: 'rgba(0, 0, 0, 0.23)',
												},
												'&:hover fieldset': {
													borderColor: 'rgba(0, 0, 0, 0.87)',
												},
												'&.Mui-focused fieldset': {
													borderColor: 'primary.main',
												},
											},
										},
									},
								}}
								format="DD/MM/YYYY"
								disableFuture
								maxDate={dayjs().subtract(16, 'year')} // Tối thiểu 16 tuổi
								minDate={dayjs().subtract(100, 'year')} // Tối đa 100 tuổi
							/>
						</Grid>
					</Grid>
				</Paper>

				{/* Group: Account & Role (bottom) */}
				<Paper sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, mb: { xs: 2, sm: 2.5, md: 3 }, boxShadow: 1 }}>
					<Typography 
            variant={isMobile ? 'body1' : 'subtitle1'} 
            sx={{ 
              fontWeight: 600, 
              mb: { xs: 1.25, sm: 1.5 },
              fontSize: { xs: '0.9rem', sm: '1rem', md: '1.125rem' }
            }}
          >
            Thông tin tài khoản & vai trò
          </Typography>
					<Grid container spacing={{ xs: 1.5, sm: 2 }}>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                select 
                fullWidth 
                required 
                label="Vai trò" 
                value={form.role} 
                onChange={(e: any) => handleRoleChange(e.target.value as any)}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              >
								<MenuItem value="teacher" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Giảng viên</MenuItem>
								<MenuItem value="student" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Sinh viên</MenuItem>
							</TextField>
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                disabled 
                label={form.role === 'teacher' ? 'Mã giảng viên' : 'Mã sinh viên'} 
                value={previewCode || ''}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                disabled 
                label="Mật khẩu ban đầu" 
                value={'123456'}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                disabled 
                label="Username (hiển thị)" 
                value={previewUsername || previewCode || ''}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                select 
                fullWidth 
                label={form.role === 'teacher' ? 'Khoa/Bộ môn' : 'Khoa'} 
                value={form.departmentId || ''} 
                onChange={(e: any) => setForm((p) => ({ ...p, departmentId: Number(e.target.value) }))}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              >
								{(departments || []).map((d) => (
									<MenuItem key={d.id} value={d.id} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{d.name}</MenuItem>
								))}
							</TextField>
						</Grid>
						{form.role === 'student' && (
							<Grid size={{ xs: 12, sm: 6, md: 4 }}>
								<TextField 
                  select 
                  fullWidth 
                  label="Chuyên ngành" 
                  value={form.majorId || ''} 
                  onChange={(e: any) => setForm((p) => ({ ...p, majorId: Number(e.target.value) }))} 
                  disabled={!form.departmentId}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }}
                >
									{(majors || []).map((m) => (
										<MenuItem key={m.id} value={m.id} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{m.name}</MenuItem>
									))}
								</TextField>
							</Grid>
						)}
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                label="Cơ sở" 
                value={defaultValues.campus || ''} 
                InputProps={{ readOnly: true }} 
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' },
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }} 
              />
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                label="Hình thức đào tạo" 
                value={defaultValues.trainingType || ''} 
                InputProps={{ readOnly: true }} 
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' },
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }} 
              />
						</Grid>
						<Grid size={{ xs: 12, sm: 6, md: 4 }}>
							<TextField 
                fullWidth 
                label="Bậc/Trình độ" 
                value={defaultValues.degreeLevel || ''} 
                InputProps={{ readOnly: true }} 
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' },
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }} 
              />
						</Grid>
						{form.role === 'student' && (
							<Grid size={{ xs: 12, sm: 6, md: 4 }}>
								<TextField 
                  fullWidth 
                  label="Niên khóa" 
                  value={defaultValues.academicYear || ''} 
                  InputProps={{ readOnly: true }} 
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ 
                    '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' },
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }
                  }} 
                />
							</Grid>
						)}
						{form.role === 'student' && (
							<>
								<Grid size={{ xs: 12, sm: 6, md: 4 }}>
									<TextField 
                    fullWidth 
                    label="Ngày nhập học" 
                    value={defaultValues.enrollmentDate || ''} 
                    InputProps={{ readOnly: true }} 
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ 
                      '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' },
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }
                    }} 
                  />
								</Grid>
								<Grid size={{ xs: 12, sm: 6, md: 4 }}>
									<TextField 
                    fullWidth 
                    label="Lớp danh nghĩa" 
                    value={form.classCode || ''} 
                    onChange={(e: any) => setForm((p) => ({ ...p, classCode: e.target.value }))}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }
                    }}
                  />
								</Grid>
							</>
						)}
						{form.role === 'teacher' && (
							<>
								<Grid size={{ xs: 12, sm: 6, md: 4 }}>
									<TextField 
                    fullWidth 
                    label="Ngày vào trường" 
                    value={defaultValues.enrollmentDate || ''} 
                    InputProps={{ readOnly: true }} 
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ 
                      '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' },
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }
                    }} 
                  />
								</Grid>
								<Grid size={{ xs: 12, sm: 6, md: 4 }}>
									<TextField 
                    fullWidth 
                    label="Học hàm/Học vị" 
                    value={defaultValues.title || ''} 
                    InputProps={{ readOnly: true }} 
                    size={isMobile ? 'small' : 'medium'}
                    sx={{ 
                      '& .MuiInputBase-input': { backgroundColor: '#f5f5f5' },
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }
                    }} 
                  />
								</Grid>
							</>
						)}
					</Grid>
				</Paper>

				<Paper sx={{ 
          p: { xs: 2, sm: 2.5, md: 2.5 }, 
          mt: { xs: 2.5, sm: 3, md: 3 },
          mb: { xs: 0, sm: 0, md: 0 },
          boxShadow: { xs: 2, sm: 1, md: 1 },
          position: 'relative',
          zIndex: 1
        }}>
					<Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
						<Grid size={{ xs: 6, sm: 'auto' }}>
							<Button 
                variant="outlined" 
                onClick={() => navigate('/users')}
                fullWidth
                size={isMobile ? 'medium' : 'large'}
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1.25, sm: 1.5 },
                  fontWeight: { xs: 600, sm: 500 },
                  minWidth: { sm: 120 }
                }}
              >
                Hủy
              </Button>
						</Grid>
						<Grid size={{ xs: 6, sm: 'auto' }}>
							<Button 
                variant="contained" 
                onClick={handleSubmit} 
                disabled={submitting}
                fullWidth
                size={isMobile ? 'medium' : 'large'}
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  py: { xs: 1.25, sm: 1.5 },
                  fontWeight: { xs: 600, sm: 500 },
                  minWidth: { sm: 160 }
                }}
              >
                Tạo tài khoản
              </Button>
						</Grid>
					</Grid>
				</Paper>
			</Box>
		</LocalizationProvider>
  );
};

export default CreateUser;
