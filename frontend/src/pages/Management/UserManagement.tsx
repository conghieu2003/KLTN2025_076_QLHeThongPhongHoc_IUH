import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Tooltip,
  Paper,
  Stack,
  InputAdornment,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  GridColDef,
  GridFilterModel,
  GridSortModel,
  GridToolbar,
  GridActionsCellItem,
  GridRowParams,
  useGridApiRef
} from '@mui/x-data-grid';
import StyledDataGrid from '../../components/DataGrid/StyledDataGrid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  PersonAdd as PersonAddIcon,
  TrendingUp as TrendingUpIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { User } from '../../types';
import { fetchUsersThunk, updateUserThunk } from '../../redux/slices/userSlice';
import { RootState, AppDispatch } from '../../redux/store';
import { userService } from '../../services/api';
import EmailDialog from '../../components/EmailDialog/EmailDialog';
import { toast } from 'react-toastify';

interface RoleOption {
  id: string;
  text: string;
}

const UserManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { users, usersLoading, usersError } = useSelector((state: RootState) => state.user);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [emailDialogOpen, setEmailDialogOpen] = useState<boolean>(false);
  const [emailUser, setEmailUser] = useState<User | null>(null);
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const dataGridRef = useGridApiRef();

  const roleOptions: RoleOption[] = [{
    id: 'all',
    text: 'Tất cả'
  }, {
    id: 'teacher',
    text: 'Giảng viên'
  }, {
    id: 'student',
    text: 'Sinh viên'
  }];

  // Computed statistics
  const userStats = useMemo(() => {  
    const totalUsers = users.length;
    const students = users.filter(user => user.role === 'student').length;
    const teachers = users.filter(user => user.role === 'teacher').length;
    const admins = users.filter(user => user.role === 'admin').length;
    const activeUsers = users.filter(user => user.status === 'active' || user.isActive).length;
    const inactiveUsers = totalUsers - activeUsers;

    return {
      total: totalUsers,
      students,
      teachers,
      admins,
      active: activeUsers,
      inactive: inactiveUsers
    };
  }, [users]);

  // Filtered users based on search term and role
  const filteredUsers = (() => {
    let filtered = users;

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const fullName = (user.fullName || '').toLowerCase();
        const teacherCode = (user.teacherCode || '').toLowerCase();
        const studentCode = (user.studentCode || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const email = (user.email || '').toLowerCase();

        return fullName.includes(searchLower) ||
               teacherCode.includes(searchLower) ||
               studentCode.includes(searchLower) ||
               phone.includes(searchLower) ||
               email.includes(searchLower);
      });
    }

    return filtered;
  })();

  const fetchUsers = useCallback((role?: string): void => {
    const roleFilter = role === 'all' || !role ? undefined : (role as any);
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    dispatch(fetchUsersThunk({ role: roleFilter, username: currentUser?.username }));
  }, [dispatch]);

  const handleRoleFilterChange = useCallback((newRole: string) => {
    setIsFiltering(true);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setFilterRole(newRole);
      fetchUsers(newRole);
      setIsFiltering(false);
    }, 500);
  }, [fetchUsers]);

  const handleSearchChange = useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  }, []);

  // Initial load only
  useEffect(() => {
    const roleFilter = filterRole === 'all' ? undefined : (filterRole as any);
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    dispatch(fetchUsersThunk({ role: roleFilter, username: currentUser?.username }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      isActive: user.status === 'active',
      phone: user.phone || ''
    });
  
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    try {
      const updateData = {
        phone: editFormData.phone,
        isActive: editFormData.isActive
      };
      
      // Gọi API thông qua slice - slice sẽ tự động cập nhật state
      await dispatch(updateUserThunk({ userId: editingUser.id, userData: updateData }));
      
      setEditDialogOpen(false);
      setEditingUser(null);
      setEditFormData({});
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleSendEmail = (user: User) => {
    setEmailUser(user);
    setEmailDialogOpen(true);
  };

  const handleSendEmailSubmit = async (emailData: any) => {
    setEmailLoading(true);
    try {
      const result = await userService.sendEmail(emailData);
      if (result.success) {
        toast.success(result.message || 'Email đã được gửi thành công');
        setEmailDialogOpen(false);
      } else {
        toast.error(result.message || 'Có lỗi xảy ra khi gửi email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi gửi email');
    } finally {
      setEmailLoading(false);
    }
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


  const handleRefresh = (): void => {
    setIsFiltering(true);
    fetchUsers(filterRole);
    setTimeout(() => setIsFiltering(false), 500);
  };

  // Sử dụng DataGrid API để export với ref
  const handleExportData = (): void => {
    if (dataGridRef.current) {
      // Sử dụng API của DataGrid để export
      dataGridRef.current.exportDataAsCsv({
        fileName: `users_${dayjs().format('YYYY-MM-DD')}`,
        utf8WithBom: true, // Thêm BOM cho tiếng Việt
        includeHeaders: true,
        delimiter: ',',
        getRowsToExport: () => {
          return filteredUsers.map(user => user.id);
        }
      });
    }
  };

  // DataGrid columns configuration - responsive widths, text wrapping on mobile/tablet
  const columns: GridColDef[] = [
    {
      field: 'username',
      headerName: 'ID',
      ...(isMobile || isTablet ? { 
        flex: 0.6, 
        minWidth: 70,
        maxWidth: 100
      } : { 
        width: 100 
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            lineHeight: 1.4
          }}
        >
          {params?.value || ''}
        </Typography>
      )
    },
    {
      field: 'fullName',
      headerName: 'Họ và tên',
      ...(isMobile || isTablet ? { 
        flex: 1.5, 
        minWidth: 140
      } : { 
        width: 200 
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: { xs: 0.5, sm: 0.75, md: 1 }
        }}>
          <PersonIcon 
            color="action" 
            sx={{ 
              marginTop: '2px', 
              flexShrink: 0, 
              fontSize: { xs: 14, sm: 16, md: 18 } 
            }} 
          />
          <Typography 
            variant="body2" 
            sx={{ 
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              lineHeight: 1.4,
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
              flex: 1,
              minWidth: 0
            }}
          >
            {params?.value || ''}
          </Typography>
        </Box>
      )
    },
    {
      field: 'code',
      headerName: 'Mã số',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 80
      } : { 
        width: 120 
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params: any) => {
        const user = params?.row;
        
        if (!user) return <Typography variant="body2"></Typography>;
        
        let code = '';
        if (user.role === 'teacher') {
          code = user.teacherCode || '';
        } else if (user.role === 'student') {
          code = user.studentCode || '';
        } else if (user.role === 'admin') {
          code = 'ADMIN';
        }
        
        return (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              lineHeight: 1.4
            }}
          >
            {code}
          </Typography>
        );
      }
    },
    {
      field: 'role',
      headerName: 'Vai trò',
      ...(isMobile || isTablet ? { 
        flex: 0.8, 
        minWidth: 70
      } : { 
        width: 120 
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Chip 
          label={getRoleText(params?.value || '')} 
          color={getRoleColor(params?.value || '') as any}
          size="small"
          sx={{ 
            fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' },
            height: { xs: 20, sm: 24, md: 28 },
            whiteSpace: 'normal',
            '& .MuiChip-label': {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              padding: { xs: '0 4px', sm: '0 6px', md: '0 8px' }
            }
          }}
        />
      )
    },
    {
      field: 'phone',
      headerName: 'Số điện thoại',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 100
      } : { 
        width: 140 
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params: any) => {
        const phone = params?.row?.phone || params?.value;
        return (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
              wordBreak: 'break-word',
              whiteSpace: 'normal',
              lineHeight: 1.4
            }}
          >
            {phone || ''}
          </Typography>
        );
      }
    },
    {
      field: 'email',
      headerName: 'Email',
      ...(isMobile || isTablet ? { 
        flex: 1.8, 
        minWidth: 150
      } : { 
        width: 250 
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            wordBreak: 'break-word',
            whiteSpace: 'normal',
            lineHeight: 1.4,
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' }
          }}
        >
          {params?.value || ''}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      ...(isMobile || isTablet ? { 
        flex: 0.9, 
        minWidth: 80
      } : { 
        width: 120 
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => {
        if (!params?.row) return <Chip label="" size="small" />;
        return (
          <Chip
            label={params.row.status === 'active' || params.row.isActive ? 'Hoạt động' : 'Đã khóa'}
            color={params.row.status === 'active' || params.row.isActive ? 'success' : 'error'}
            size="small"
            onClick={() => handleEdit(params.row)}
            sx={{ 
              cursor: 'pointer',
              fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' },
              height: { xs: 20, sm: 24, md: 28 },
              whiteSpace: 'normal',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: 1.2,
                padding: { xs: '0 4px', sm: '0 6px', md: '0 8px' }
              }
            }}
          />
        );
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Thao tác',
      ...(isMobile || isTablet ? { 
        flex: 0.7, 
        minWidth: 70
      } : { 
        width: 120 
      }),
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      getActions: (params: GridRowParams) => {
        if (!params?.row) return [];
        return [
          <GridActionsCellItem
            icon={<EditIcon fontSize={isMobile ? "small" : "medium"} />}
            label="Chỉnh sửa"
            onClick={() => handleEdit(params.row)}
            color="primary"
          />,
          <GridActionsCellItem
            icon={<EmailIcon fontSize={isMobile ? "small" : "medium"} />}
            label="Gửi email"
            onClick={() => handleSendEmail(params.row)}
          />
        ];
      }
    }
  ];

  return (
    <Box
      sx={{ 
        p: { xs: 1, sm: 1.5, md: 3 },
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        overflowY: 'hidden',
        position: 'relative',
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        pb: { xs: 2, sm: 3, md: 4 }
      }}
    >
      {usersError && (
        <Alert severity="error" sx={{ mb: { xs: 1.5, sm: 2 } }}>
          {usersError}
        </Alert>
      )}

        {/* Statistics Cards */}
      <Grid 
        container 
        spacing={{ xs: 0.75, sm: 1 }} 
        sx={{ 
          mb: { xs: 1.25, sm: 1.5, md: 2 },
          flexShrink: 0
        }}
      >
          <Grid
            size={{
              xs: 4,
              sm: 4,
              md: 2
            }}
          >
            <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
              <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                  <Grid size={{ xs: 12 }}>
                    <PersonIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'primary.main' }} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      color="textSecondary" 
                      variant="body2" 
                      sx={{ 
                        fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.6rem' },
                        lineHeight: 1.1
                      }}
                    >
                      Tổng người dùng
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, 
                        fontWeight: 'bold',
                        lineHeight: 1.1
                      }}
                    >
                      {userStats.total}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid
            size={{
              xs: 4,
              sm: 4,
              md: 2
            }}
          >
            <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
              <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                  <Grid size={{ xs: 12 }}>
                    <SchoolIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'secondary.main' }} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      color="textSecondary" 
                      variant="body2" 
                      sx={{ 
                        fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.6rem' },
                        lineHeight: 1.1
                      }}
                    >
                      Sinh viên
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      color="secondary.main" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, 
                        fontWeight: 'bold',
                        lineHeight: 1.1
                      }}
                    >
                      {userStats.students}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid
            size={{
              xs: 4,
              sm: 4,
              md: 2
            }}
          >
            <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
              <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                  <Grid size={{ xs: 12 }}>
                    <PersonAddIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'info.main' }} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      color="textSecondary" 
                      variant="body2" 
                      sx={{ 
                        fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.6rem' },
                        lineHeight: 1.1
                      }}
                    >
                      Giảng viên
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      color="info.main" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, 
                        fontWeight: 'bold',
                        lineHeight: 1.1
                      }}
                    >
                      {userStats.teachers}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid
            size={{
              xs: 4,
              sm: 4,
              md: 2
            }}
          >
            <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
              <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                  <Grid size={{ xs: 12 }}>
                    <TrendingUpIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'success.main' }} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      color="textSecondary" 
                      variant="body2" 
                      sx={{ 
                        fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.6rem' },
                        lineHeight: 1.1
                      }}
                    >
                      Hoạt động
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      color="success.main" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, 
                        fontWeight: 'bold',
                        lineHeight: 1.1
                      }}
                    >
                      {userStats.active}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid
            size={{
              xs: 4,
              sm: 4,
              md: 2
            }}
          >
            <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
              <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                  <Grid size={{ xs: 12 }}>
                    <PersonIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'error.main' }} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      color="textSecondary" 
                      variant="body2" 
                      sx={{ 
                        fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.6rem' },
                        lineHeight: 1.1
                      }}
                    >
                      Đã khóa
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      color="error.main" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, 
                        fontWeight: 'bold',
                        lineHeight: 1.1
                      }}
                    >
                      {userStats.inactive}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid
            size={{
              xs: 4,
              sm: 4,
              md: 2
            }}
          >
            <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
              <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                  <Grid size={{ xs: 12 }}>
                    <PersonIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'warning.main' }} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      color="textSecondary" 
                      variant="body2" 
                      sx={{ 
                        fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.6rem' },
                        lineHeight: 1.1
                      }}
                    >
                      Quản trị viên
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography 
                      variant="h6" 
                      component="div" 
                      color="warning.main" 
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, 
                        fontWeight: 'bold',
                        lineHeight: 1.1
                      }}
                    >
                      {userStats.admins}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Paper sx={{ 
          p: { xs: 1.25, sm: 1.5, md: 2 }, 
          mb: { xs: 1.5, sm: 2, md: 2.5 },
          borderRadius: 2,
          boxShadow: 1,
          flexShrink: 0
        }}>
          <Grid container spacing={{ xs: 2, sm: 2 }} alignItems="center">
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 8
              }}
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 1.5, sm: 2 }} 
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <FormControl 
                  sx={{ 
                    minWidth: { xs: '100%', sm: 180 },
                    maxWidth: { xs: '100%', sm: 200 }
                  }}
                >
                  <InputLabel sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Lọc theo vai trò</InputLabel>
                  <Select
                    value={filterRole}
                    onChange={(e: any) => handleRoleFilterChange(e.target.value)}
                    label="Lọc theo vai trò"
                    size="small"
                    disabled={isFiltering}
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      opacity: isFiltering ? 0.7 : 1,
                      transition: 'opacity 0.2s ease-in-out'
                    }}
                  >
                    {roleOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {option.text}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, width: { xs: '100%', sm: 'auto' }, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    sx={{ 
                      flex: { xs: 1, sm: 'none' },
                      minWidth: { xs: 0, sm: 280 },
                      maxWidth: { xs: '100%', sm: 320 },
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => handleSearchChange('')}
                            sx={{ p: 0.5 }}
                          >
                            <ClearIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  {isMobile && (
                    <Tooltip title="Làm mới dữ liệu">
                      <IconButton 
                        onClick={handleRefresh}
                        sx={{ 
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' },
                          flexShrink: 0
                        }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                
                {!isMobile && (
                  <Tooltip title="Làm mới dữ liệu">
                    <IconButton 
                      onClick={handleRefresh}
                      sx={{ 
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      <RefreshIcon fontSize="medium" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Grid>
            
            <Grid
              size={{
                xs: 12,
                sm: 12,
                md: 4
              }}
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 1, sm: 1.5 }} 
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent={{ md: 'flex-end' }}
              >
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportData}
                  size={isMobile ? "small" : "medium"}
                  fullWidth={isMobile}
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    minWidth: { xs: '100%', sm: 120 }
                  }}
                >
                  Xuất dữ liệu
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/users/create')}
                  size={isMobile ? "small" : "medium"}
                  fullWidth={isMobile}
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    minWidth: { xs: '100%', sm: 140 }
                  }}
                >
                  Thêm người dùng
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* DataGrid với fixed header và internal scroll */}
        <Paper sx={{ 
          flex: 1,
          minHeight: 0,
          maxHeight: '100%',
          width: '100%', 
          maxWidth: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {isFiltering && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <CircularProgress size={40} />
            </Box>
          )}
          <StyledDataGrid
            apiRef={dataGridRef}
            rows={filteredUsers}
            columns={columns}
            getRowId={(row) => row.id}
            filterModel={isMobile ? { items: [] } : filterModel}
            onFilterModelChange={isMobile ? undefined : setFilterModel}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            loading={usersLoading || isFiltering}
            slots={{
              toolbar: isMobile ? undefined : GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: false,
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 5 },
              },
            }}
            disableRowSelectionOnClick
            disableColumnFilter={isMobile}
            disableColumnMenu={isMobile}
            disableColumnResize={true}
            autoPageSize={false}
            columnHeaderHeight={isMobile ? 48 : isTablet ? 52 : 56}
            getRowHeight={() => 'auto'}
            isMobile={isMobile}
            isTablet={isTablet}
            density="comfortable"
            checkboxSelection={false}
            disableColumnSelector={false}
            disableDensitySelector={false}
          />
        </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        <DialogContent>
          {editingUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <Typography component="span" fontWeight="bold">Người dùng:</Typography> {editingUser.fullName}
              </Typography>
              
              <TextField
                fullWidth
                label="Số điện thoại"
                value={editFormData.phone}
                onChange={(e: any) => setEditFormData({
                  ...editFormData,
                  phone: e.target.value
                })}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editFormData.isActive}
                    onChange={(e: any) => setEditFormData({
                      ...editFormData,
                      isActive: e.target.checked
                    })}
                  />
                }
                label="Hoạt động"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={!editingUser}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <EmailDialog
        open={emailDialogOpen}
        onClose={() => {
          setEmailDialogOpen(false);
        }}
        user={emailUser}
        onSendEmail={handleSendEmailSubmit}
        loading={emailLoading}
      />
    </Box>
  );
};

export default UserManagement;
