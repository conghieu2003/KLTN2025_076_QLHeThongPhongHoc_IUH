import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { roomService } from '../../services/api';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Container,
  Chip,
  Paper,
  Stack,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  GridColDef,
  GridToolbar,
  useGridApiRef
} from '@mui/x-data-grid';
import StyledDataGrid from '../../components/DataGrid/StyledDataGrid';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Room as RoomIcon,
  Class as ClassIcon
} from '@mui/icons-material';

// Sample data for room requests - dựa trên table ScheduleRequest
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const sampleRoomRequests: RoomRequest[] = [
//   {
//     id: 1,
//     requestType: 'schedule_change',
//     classScheduleId: 1,
//     requesterId: 1,
//     requestDate: '2024-01-15',
//     timeSlotId: 1,
//     changeType: 'time_change',
//     oldTimeSlotId: 1,
//     newTimeSlotId: 2,
//     reason: 'Yêu cầu đổi từ tiết 1-3 lên tiết 4-6 để tránh giờ cao điểm',
//     status: 'pending',
//     createdAt: '2024-01-10T08:30:00Z',
//     updatedAt: '2024-01-10T08:30:00Z',
//     // Computed fields for display
//     teacherName: 'Nguyễn Văn Giáo',
//     teacherCode: '10000000',
//     className: 'Lập trình cơ bản',
//     subjectCode: 'NMLT',
//     currentRoom: 'LT101 - Phòng lý thuyết 101',
//     requestedRoom: 'LT101 - Phòng lý thuyết 101',
//     timeSlot: 'Tiết 1-3 → Tiết 4-6',
//     dayOfWeek: 'Thứ 3',
//     priority: 'high'
//   },
//   {
//     id: 2,
//     requestType: 'room_request',
//     classRoomId: 3,
//     requesterId: 2,
//     requestDate: '2024-01-20',
//     timeSlotId: 3,
//     reason: 'Xin phòng thực hành có thiết bị mới hơn cho lớp CSDL',
//     status: 'approved',
//     approvedBy: 10,
//     approvedAt: '2024-01-21T10:00:00Z',
//     createdAt: '2024-01-12T10:15:00Z',
//     updatedAt: '2024-01-21T10:00:00Z',
//     // Computed fields for display
//     teacherName: 'Trần Thị Dạy',
//     teacherCode: '10000001',
//     className: 'Cơ sở dữ liệu',
//     subjectCode: 'CSDL',
//     currentRoom: 'TH102 - Phòng thực hành 102',
//     requestedRoom: 'TH201 - Phòng thực hành 201',
//     timeSlot: 'Tiết 7-9 (13:00-15:30)',
//     dayOfWeek: 'Thứ 4',
//     priority: 'medium'
//   },
//   {
//     id: 3,
//     requestType: 'schedule_change',
//     classScheduleId: 3,
//     requesterId: 3,
//     requestDate: '2024-01-18',
//     timeSlotId: 1,
//     changeType: 'room_change',
//     oldClassRoomId: 7,
//     newClassRoomId: 10,
//     reason: 'Đổi phòng từ LT301 sang LT401 do vấn đề âm thanh',
//     status: 'rejected',
//     approvedBy: 10,
//     approvedAt: '2024-01-19T14:30:00Z',
//     note: 'Phòng LT401 đã được đặt trước',
//     createdAt: '2024-01-08T14:20:00Z',
//     updatedAt: '2024-01-19T14:30:00Z',
//     // Computed fields for display
//     teacherName: 'Lê Thị Minh',
//     teacherCode: '10000002',
//     className: 'Cấu trúc dữ liệu và giải thuật',
//     subjectCode: 'CTDL',
//     currentRoom: 'LT301 - Phòng lý thuyết 301',
//     requestedRoom: 'LT401 - Phòng lý thuyết 401',
//     timeSlot: 'Tiết 1-3 (07:00-09:30)',
//     dayOfWeek: 'Thứ 2',
//     priority: 'low'
//   },
//   {
//     id: 4,
//     requestType: 'room_request',
//     classRoomId: 1,
//     requesterId: 4,
//     requestDate: '2024-01-25',
//     timeSlotId: 2,
//     reason: 'Xin chuyển từ online sang offline để tương tác tốt hơn',
//     status: 'pending',
//     createdAt: '2024-01-14T09:45:00Z',
//     updatedAt: '2024-01-14T09:45:00Z',
//     // Computed fields for display
//     teacherName: 'Phạm Văn Học',
//     teacherCode: '10000003',
//     className: 'Lập trình Web',
//     subjectCode: 'LTW',
//     currentRoom: 'ONLINE - Lớp trực tuyến',
//     requestedRoom: 'LT101 - Phòng lý thuyết 101',
//     timeSlot: 'Tiết 4-6 (09:45-12:15)',
//     dayOfWeek: 'Thứ 6',
//     priority: 'high'
//   },
//   {
//     id: 5,
//     requestType: 'schedule_change',
//     classScheduleId: 5,
//     requesterId: 5,
//     requestDate: '2024-01-22',
//     timeSlotId: 3,
//     changeType: 'room_change',
//     oldClassRoomId: 8,
//     newClassRoomId: 9,
//     reason: 'Đổi phòng do TH301 đang bảo trì thiết bị',
//     status: 'approved',
//     approvedBy: 10,
//     approvedAt: '2024-01-23T09:15:00Z',
//     createdAt: '2024-01-11T16:30:00Z',
//     updatedAt: '2024-01-23T09:15:00Z',
//     // Computed fields for display
//     teacherName: 'Hoàng Thị Giảng',
//     teacherCode: '10000004',
//     className: 'Lập trình hướng đối tượng',
//     subjectCode: 'OOP',
//     currentRoom: 'TH301 - Phòng thực hành 301',
//     requestedRoom: 'TH302 - Phòng thực hành 302',
//     timeSlot: 'Tiết 7-9 (13:00-15:30)',
//     dayOfWeek: 'Thứ 4',
//     priority: 'high'
//   }
// ];

interface RoomRequest {
  id: number;
  requestType: 'room_request' | 'schedule_change' | 'exception';
  classScheduleId?: number;
  classRoomId?: number;
  requesterId: number;
  requestDate: string;
  timeSlotId: number;
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
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields for display
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
  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const dataGridRef = useGridApiRef();

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
    // Navigate to request detail page để admin xử lý yêu cầu
    // Trang này sẽ hiển thị chi tiết yêu cầu và cho phép admin:
    // 1. Xem thông tin giảng viên và lớp yêu cầu
    // 2. Dựa vào yêu cầu để thay đổi lịch học
    // 3. Chọn phòng trống của tiết đó và thuộc dãy phòng khoa đó
    navigate(`/rooms/requests/${requestId}`);
  };

  const handleApproveRequest = async (requestId: number) => {
    // Chuyển sang page xử lý yêu cầu để admin chấp nhận và phân phòng
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'room_request': return 'Xin phòng';
      case 'schedule_change': return 'Đổi lịch';
      case 'exception': return 'Ngoại lệ';
      default: return type;
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


  // Calculate statistics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const roomRequests = requests.filter(r => r.requestType === 'room_request').length;
    const scheduleChanges = requests.filter(r => r.requestType === 'schedule_change').length;

    return { total, pending, approved, rejected, roomRequests, scheduleChanges };
  }, [requests]);

  // DataGrid columns với flex layout - tối ưu cho admin xử lý yêu cầu
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
          label={params.value?.name || 'N/A'}
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
          label={params.value?.name || 'N/A'}
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
            {params.value?.fullName || 'N/A'}
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
      renderCell: (params) => (
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
            {params.value?.class?.className || 'N/A'}
          </Typography>
        </Box>
      )
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
              {params.value || 'N/A'}
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
              paginationModel: { page: 0, pageSize: isMobile ? 10 : isTablet ? 15 : 25 },
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
