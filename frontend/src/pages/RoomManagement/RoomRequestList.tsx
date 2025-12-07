import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { toast } from 'react-toastify';
import { roomService } from '../../services/api';
import { getSocket, initSocket } from '../../utils/socket';
import { Typography, Box, CircularProgress, Alert, Button, IconButton, Tooltip, Card, CardContent, Container, Chip, Paper, Stack, Grid, useTheme, useMediaQuery } from '@mui/material';
import { GridColDef, GridToolbar,useGridApiRef} from '@mui/x-data-grid';
import StyledDataGrid from '../../components/DataGrid/StyledDataGrid';
import {Refresh as RefreshIcon, Visibility as ViewIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon, Pending as PendingIcon, Schedule as ScheduleIcon, Person as PersonIcon, Room as RoomIcon, Class as ClassIcon} from '@mui/icons-material';


interface RoomRequest {
  id: number;
  requestType?: 'room_request' | 'schedule_change' | 'exception';
  classScheduleId?: number;
  classRoomId?: number;
  requesterId: number;
  requestDate?: string;
  timeSlotId?: number;
  changeType?: 'room_change' | 'time_change' | 'both' | 'exception';
  oldClassRoomId?: number;
  newClassRoomId?: number;
  oldTimeSlotId?: number;
  newTimeSlotId?: number;
  exceptionDate?: string;
  exceptionType?: 'cancelled' | 'exam' | 'moved' | 'substitute';
  movedToDate?: string;
  movedToTimeSlotId?: number;
  movedToClassRoomId?: number;
  substituteTeacherId?: number;
  reason: string;
  approvedBy?: number;
  status?: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  RequestType?: {
    id: number;
    name: string;
  };
  RequestStatus?: {
    id: number;
    name: string;
  };
  requester?: {
    id: number;
    fullName: string;
    email: string;
  };
  classSchedule?: {
    class?: {
      id: number;
      code: string;
      className: string;
      subjectName: string;
      subjectCode: string;
      maxStudents: number;
    };
    classRoom?: {
      id: number;
      code: string;
      name: string;
      capacity: number;
      ClassRoomType?: {
        name: string;
      };
    };
  };
  class?: {
    id: number;
    code: string;
    className: string;
    subjectName: string;
    subjectCode: string;
    maxStudents: number;
  };
  teacherName?: string;
  teacherCode?: string;
  className?: string;
  subjectCode?: string;
  currentRoom?: string;
  requestedRoom?: string;
  timeSlot?: string;
  dayOfWeek?: string;
  priority?: 'high' | 'medium' | 'low';
}

const RoomRequestList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const user = useSelector((state: RootState) => state.auth.user);
  const socketInitialized = useRef(false);
  
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const dataGridRef = useGridApiRef();

  useEffect(() => {
    if (!socketInitialized.current && user?.id) {
      const socket = getSocket() || initSocket(user.id);
      socketInitialized.current = true;

      const reloadRequests = () => {
        setRefreshKey(prev => prev + 1);
      };

      const setupListeners = () => {
        if (!socket) return;
        socket.on('schedule-request-created', reloadRequests);
        socket.on('schedule-exception-updated', reloadRequests);
      };

      if (socket.connected) {
        setupListeners();
      } else {
        socket.once('connect', setupListeners);
      }

      return () => {
        if (socket) {
          socket.off('schedule-request-created', reloadRequests);
          socket.off('schedule-exception-updated', reloadRequests);
          socket.off('connect', setupListeners);
        }
        socketInitialized.current = false;
      };
    }
  }, [user?.id]);

  useEffect(() => {
    loadRequests();
  }, [refreshKey]);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await roomService.getScheduleRequests({
        page: 1,
        limit: 100
      });

      if (response.success) {
        setRequests(response.data);
      } else {
        setError(response.message || 'Không thể tải danh sách yêu cầu');
      }
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleViewRequest = (requestId: number) => {
    navigate(`/rooms/requests/${requestId}/process`);
  };

  const handleApproveRequest = async (requestId: number) => {
    navigate(`/rooms/requests/${requestId}/process`);
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      const response = await roomService.updateScheduleRequestStatus(requestId, 3, 'Yêu cầu bị từ chối');
      if (response.success) {
        toast.success('Đã từ chối yêu cầu');
        handleRefresh();
      } else {
        toast.error('Có lỗi xảy ra khi từ chối yêu cầu');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Có lỗi xảy ra khi từ chối yêu cầu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <PendingIcon />;
      case 'approved': return <ApproveIcon />;
      case 'rejected': return <RejectIcon />;
      default: return <PendingIcon />;
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'room_request': return 'primary';
      case 'schedule_change': return 'secondary';
      case 'exception': return 'warning';
      default: return 'default';
    }
  };

// tính toán thống kê
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => {
      const statusName = r.RequestStatus?.name?.toLowerCase() || '';
      return statusName.includes('chờ') || statusName.includes('pending') || statusName === 'chờ xử lý';
    }).length;
    const approved = requests.filter(r => {
      const statusName = r.RequestStatus?.name?.toLowerCase() || '';
      return statusName.includes('đã duyệt') || statusName.includes('approved') || 
             statusName.includes('hoàn thành') || statusName.includes('completed') ||
             statusName === 'đã duyệt' || statusName === 'hoàn thành';
    }).length;
    const rejected = requests.filter(r => {
      const statusName = r.RequestStatus?.name?.toLowerCase() || '';
      return statusName.includes('từ chối') || statusName.includes('rejected') || statusName === 'từ chối';
    }).length;
    const roomRequests = requests.filter(r => {
      const typeName = r.RequestType?.name?.toLowerCase() || '';
      return typeName.includes('xin phòng') || typeName.includes('room_request') || typeName === 'xin phòng';
    }).length;
    const scheduleChanges = requests.filter(r => {
      const typeName = r.RequestType?.name?.toLowerCase() || '';
      return typeName.includes('đổi lịch') || typeName.includes('schedule_change') || typeName === 'đổi lịch';
    }).length;

    return { total, pending, approved, rejected, roomRequests, scheduleChanges };
  }, [requests]);

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      ...(isMobile || isTablet ? { 
        flex: 0.3, 
        minWidth: 40
      } : { 
        flex: 0.05,
        minWidth: 40
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'RequestType',
      headerName: 'Loại yêu cầu',
      ...(isMobile || isTablet ? { 
        flex: 0.8, 
        minWidth: 100
      } : { 
        flex: 0.12,
        minWidth: 100
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Chip
          label={params.value?.name || ''}
          color={getRequestTypeColor(params.value?.name) as any}
          size="small"
          variant="outlined"
          sx={{ 
            fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }, 
            height: { xs: 20, sm: 22, md: 24 }
          }}
        />
      )
    },
    {
      field: 'RequestStatus',
      headerName: 'Trạng thái',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 110
      } : { 
        flex: 0.12,
        minWidth: 110
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Chip
          icon={getStatusIcon(params.value?.name)}
          label={params.value?.name || ''}
          color={getStatusColor(params.value?.name) as any}
          size="small"
          variant="filled"
          sx={{ 
            fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }, 
            height: { xs: 20, sm: 22, md: 24 }
          }}
        />
      )
    },
    {
      field: 'requester',
      headerName: 'Giảng viên yêu cầu',
      ...(isMobile || isTablet ? { 
        flex: 1.5, 
        minWidth: 140
      } : { 
        flex: 0.15,
        minWidth: 140
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, minWidth: 0, width: '100%' }}>
          <PersonIcon color="primary" sx={{ 
            fontSize: { xs: 12, sm: 14, md: 16 }, 
            marginTop: '2px', 
            flexShrink: 0 
          }} />
          <Typography 
            variant="body2" 
            sx={{
              fontWeight: 'medium',
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
              lineHeight: 1.4,
              wordBreak: 'break-word',
              whiteSpace: 'normal'
            }}
          >
            {params.value?.fullName || ''}
          </Typography>
        </Box>
      )
    },
    {
      field: 'classSchedule',
      headerName: 'Lớp học',
      ...(isMobile || isTablet ? { 
        flex: 1.5, 
        minWidth: 130
      } : { 
        flex: 0.15,
        minWidth: 130
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => {
        const className = params.value?.class?.className || params.row.class?.className || '';
        return (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, minWidth: 0, width: '100%' }}>
            <ClassIcon color="secondary" sx={{ 
              fontSize: { xs: 12, sm: 14, md: 16 }, 
              marginTop: '2px', 
              flexShrink: 0 
            }} />
            <Typography 
              variant="body2" 
              sx={{
                fontWeight: 'medium',
                fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                lineHeight: 1.4,
                wordBreak: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              {className || 'Chưa có thông tin'}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'reason',
      headerName: 'Lý do yêu cầu',
      ...(isMobile || isTablet ? { 
        flex: 2, 
        minWidth: 150
      } : { 
        flex: 0.18,
        minWidth: 150
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, minWidth: 0, width: '100%' }}>
            <ScheduleIcon color="info" sx={{ 
              fontSize: { xs: 12, sm: 14, md: 16 }, 
              marginTop: '2px', 
              flexShrink: 0 
            }} />
            <Typography 
              variant="body2" 
              sx={{
                fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                lineHeight: 1.4,
                wordBreak: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              {params.value || ''}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'createdAt',
      headerName: 'Ngày gửi',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 80
      } : { 
        flex: 0.08,
        minWidth: 80
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
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }, 
            lineHeight: 1.2 
          }}
        >
          {new Date(params.value).toLocaleDateString('vi-VN')}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Xử lý',
      ...(isMobile || isTablet ? { 
        flex: 0.8, 
        minWidth: 90
      } : { 
        flex: 0.10,
        minWidth: 90
      }),
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: true,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Xem chi tiết và xử lý">
            <IconButton
              size="small"
              onClick={() => handleViewRequest(params.row.id)}
              color="primary"
              sx={{ padding: { xs: 0.25, sm: 0.5 } }}
            >
              <ViewIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
            </IconButton>
          </Tooltip>
          {params.row.RequestStatus?.name === 'Chờ xử lý' && (
            <>
              <Tooltip title="Duyệt và xử lý yêu cầu">
                <IconButton
                  size="small"
                  onClick={() => handleApproveRequest(params.row.id)}
                  color="success"
                  sx={{ padding: { xs: 0.25, sm: 0.5 } }}
                >
                  <ApproveIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Từ chối yêu cầu">
                <IconButton
                  size="small"
                  onClick={() => handleRejectRequest(params.row.id)}
                  color="error"
                  sx={{ padding: { xs: 0.25, sm: 0.5 } }}
                >
                  <RejectIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      )
    }
  ];

  if (loading && requests.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
        flexDirection="column"
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
          Đang tải danh sách yêu cầu...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6">Không thể tải danh sách yêu cầu</Typography>
              <Typography>{error}</Typography>
            </Alert>
            <Button
              variant="contained"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              sx={{ mt: 2 }}
            >
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

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
      {/* Header Card */}
      <Card sx={{ mb: { xs: 1.5, sm: 2, md: 2.5 }, boxShadow: 3, flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid size={{ xs: 'auto', sm: 'auto', md: 'auto' }} sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{
                  color: 'primary.main',
                  fontWeight: 'bold',
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Danh sách yêu cầu xin/đổi phòng
              </Typography>
            </Grid>

            <Grid size={{ xs: 'auto', sm: 'auto', md: 'auto' }} sx={{ flexShrink: 0 }}>
              <Tooltip title="Làm mới dữ liệu">
                <IconButton
                  onClick={handleRefresh}
                  color="primary"
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  <RefreshIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid 
        container 
        spacing={{ xs: 0.75, sm: 1, md: 1.5 }} 
        sx={{ 
          mb: { xs: 1.5, sm: 2, md: 2.5 },
          flexShrink: 0,
          justifyContent: 'center'
        }}
      >
        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <ScheduleIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'primary.main' }} />
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
                    Tổng yêu cầu
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
                    {stats.total}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <PendingIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'warning.main' }} />
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
                    Chờ duyệt
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
                    {stats.pending}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <ApproveIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'success.main' }} />
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
                    Đã duyệt
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
                    {stats.approved}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <RejectIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'error.main' }} />
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
                    Từ chối
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
                    {stats.rejected}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <RoomIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'primary.main' }} />
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
                    Xin phòng
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    color="primary.main" 
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, 
                      fontWeight: 'bold',
                      lineHeight: 1.1
                    }}
                  >
                    {stats.roomRequests}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <ScheduleIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'secondary.main' }} />
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
                    Đổi lịch
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
                    {stats.scheduleChanges}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DataGrid */}
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
        <StyledDataGrid
          apiRef={dataGridRef}
          rows={requests}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
          }}
          disableRowSelectionOnClick
          disableColumnFilter={isMobile}
          disableColumnMenu={isMobile}
          disableColumnResize={isMobile || isTablet}
          autoPageSize={false}
          columnHeaderHeight={isMobile ? 48 : isTablet ? 52 : 56}
          getRowHeight={() => 'auto'}
          isMobile={isMobile}
          isTablet={isTablet}
          density="comfortable"
          checkboxSelection={false}
          disableColumnSelector={false}
          disableDensitySelector={false}
          slots={{
            toolbar: isMobile ? undefined : GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: false,
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default RoomRequestList;
