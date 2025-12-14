import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { toast } from 'react-toastify';
import { roomIssueService, authService, roomService } from '../../services/api';
import { Typography, Box, CircularProgress, Alert, Button, IconButton, Tooltip, Card, CardContent, Container, Chip, Paper, Stack, Grid, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { GridColDef, GridToolbar, useGridApiRef } from '@mui/x-data-grid';
import StyledDataGrid from '../../components/DataGrid/StyledDataGrid';
import { Refresh as RefreshIcon, Visibility as ViewIcon, CheckCircle as CheckIcon, Build as BuildIcon, Warning as WarningIcon, Close as CloseIcon, Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

interface RoomIssue {
  id: string;
  classRoomId: string;
  reportedBy: string;
  issueType: string;
  title: string;
  description: string;
  severity: string;
  startDate: string;
  endDate?: string;
  status: string;
  affectedEquipmentId?: string;
  autoCreateException: boolean;
  exceptionCreated: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  assignedTo?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
  room?: {
    id: string;
    code: string;
    name: string;
  };
  reporter?: {
    id: string;
    fullName: string;
    email: string;
  };
  resolver?: {
    id: string;
    fullName: string;
  };
  assignee?: {
    id: string;
    fullName: string;
  };
  equipment?: {
    id: string;
    code: string;
    name: string;
  };
}

const RoomIssueList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const { user } = useSelector((state: RootState) => state.auth);
  const dataGridRef = useGridApiRef();

  const [issues, setIssues] = useState<RoomIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('');

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<RoomIssue | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [selectedMaintenanceUserId, setSelectedMaintenanceUserId] = useState<string>('');
  const [maintenanceUsers, setMaintenanceUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    classRoomId: '',
    issueType: 'equipment',
    title: '',
    description: '',
    severity: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    affectedEquipmentId: '',
    autoCreateException: false
  });

  useEffect(() => {
    loadIssues();
  }, [refreshKey, statusFilter, severityFilter, issueTypeFilter]);

  const loadIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (severityFilter) filters.severity = severityFilter;
      if (issueTypeFilter) filters.issueType = issueTypeFilter;

      const response = await roomIssueService.getAllRoomIssues(filters);
      if (response.success) {
        setIssues(response.data || []);
      } else {
        setError(response.message || 'Không thể tải danh sách vấn đề');
      }
    } catch (err: any) {
      setError('Không thể tải danh sách vấn đề');
      console.error('Error loading issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleViewIssue = (issue: RoomIssue) => {
    setSelectedIssue(issue);
    setViewDialogOpen(true);
  };

  const handleAcceptIssue = async (issue: RoomIssue) => {
    if (!user?.id) return;

    try {
      const response = await roomIssueService.acceptRoomIssue(issue.id, user.id.toString());
      if (response.success) {
        toast.success('Đã nhận/phân công vấn đề thành công');
        handleRefresh();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi nhận/phân công vấn đề');
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi nhận/phân công vấn đề');
      console.error('Error accepting issue:', error);
    }
  };

  const handleResolveIssue = (issue: RoomIssue) => {
    setSelectedIssue(issue);
    setResolutionNote('');
    setResolveDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setViewDialogOpen(false);
    setResolveDialogOpen(false);
    setAssignDialogOpen(false);
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedIssue(null);
    setResolutionNote('');
    setSelectedMaintenanceUserId('');
    setFormData({
      classRoomId: '',
      issueType: 'equipment',
      title: '',
      description: '',
      severity: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      affectedEquipmentId: '',
      autoCreateException: false
    });
  };

  // Load maintenance users
  const loadMaintenanceUsers = async () => {
    try {
      const response = await roomIssueService.getMaintenanceUsers();
      if (response.success) {
        setMaintenanceUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error loading maintenance users:', error);
    }
  };

  // Load rooms for create/edit
  const [rooms, setRooms] = useState<any[]>([]);
  const loadRooms = async () => {
    try {
      const response = await roomService.getAllRooms();
      if (response.success) {
        setRooms(response.data || []);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  // Handle assign issue
  const handleAssignIssue = (issue: RoomIssue) => {
    setSelectedIssue(issue);
    setSelectedMaintenanceUserId(issue.assignedTo || '');
    setAssignDialogOpen(true);
    loadMaintenanceUsers();
  };

  const handleSaveAssign = async () => {
    if (!selectedIssue || !user?.id || !selectedMaintenanceUserId) {
      toast.error('Vui lòng chọn người bảo trì');
      return;
    }

    try {
      const response = await roomIssueService.assignRoomIssue(
        selectedIssue.id,
        selectedMaintenanceUserId,
        user.id.toString()
      );
      if (response.success) {
        toast.success('Đã phân công vấn đề thành công');
        handleCloseDialogs();
        handleRefresh();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi phân công');
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi phân công');
      console.error('Error assigning issue:', error);
    }
  };

  // Handle create issue
  const handleCreateIssue = () => {
    setFormData({
      classRoomId: '',
      issueType: 'equipment',
      title: '',
      description: '',
      severity: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      affectedEquipmentId: '',
      autoCreateException: false
    });
    setCreateDialogOpen(true);
    loadRooms();
  };

  const handleSaveCreate = async () => {
    if (!user?.id) return;

    if (!formData.classRoomId || !formData.title.trim() || !formData.description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const issueData = {
        classRoomId: formData.classRoomId.toString(),
        reportedBy: user.id.toString(),
        issueType: formData.issueType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        severity: formData.severity,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        affectedEquipmentId: formData.affectedEquipmentId || null,
        autoCreateException: formData.autoCreateException
      };

      const response = await roomIssueService.createRoomIssue(issueData);
      if (response.success) {
        toast.success('Tạo vấn đề thành công');
        handleCloseDialogs();
        handleRefresh();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi tạo vấn đề');
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi tạo vấn đề');
      console.error('Error creating issue:', error);
    }
  };

  // Handle edit issue
  const handleEditIssue = (issue: RoomIssue) => {
    setSelectedIssue(issue);
    setFormData({
      classRoomId: issue.classRoomId,
      issueType: issue.issueType,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      startDate: issue.startDate ? new Date(issue.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: issue.endDate ? new Date(issue.endDate).toISOString().split('T')[0] : '',
      affectedEquipmentId: issue.affectedEquipmentId || '',
      autoCreateException: issue.autoCreateException
    });
    setEditDialogOpen(true);
    loadRooms();
  };

  const handleSaveEdit = async () => {
    if (!selectedIssue) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      const updateData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        severity: formData.severity,
        issueType: formData.issueType,
        startDate: formData.startDate,
        endDate: formData.endDate || null
      };

      const response = await roomIssueService.updateRoomIssue(selectedIssue.id, updateData);
      if (response.success) {
        toast.success('Cập nhật vấn đề thành công');
        handleCloseDialogs();
        handleRefresh();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi cập nhật');
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi cập nhật');
      console.error('Error updating issue:', error);
    }
  };

  // Handle delete issue
  const handleDeleteIssue = (issue: RoomIssue) => {
    setSelectedIssue(issue);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedIssue) return;

    try {
      const response = await roomIssueService.deleteRoomIssue(selectedIssue.id);
      if (response.success) {
        toast.success('Xóa vấn đề thành công');
        handleCloseDialogs();
        handleRefresh();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi xóa');
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi xóa vấn đề');
      console.error('Error deleting issue:', error);
    }
  };

  const handleSaveResolution = async () => {
    if (!selectedIssue || !user?.id) return;

    if (!resolutionNote.trim()) {
      toast.error('Vui lòng nhập ghi chú giải quyết');
      return;
    }

    try {
      const response = await roomIssueService.updateRoomIssue(selectedIssue.id, {
        status: 'resolved',
        resolvedBy: user.id.toString(),
        resolutionNote: resolutionNote.trim()
      });

      if (response.success) {
        toast.success('Đã giải quyết vấn đề thành công');
        handleCloseDialogs();
        handleRefresh();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi giải quyết vấn đề');
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi giải quyết vấn đề');
      console.error('Error resolving issue:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'error';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Mở';
      case 'in_progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      case 'closed': return 'Đã đóng';
      default: return status;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      case 'critical': return 'Nghiêm trọng';
      default: return severity;
    }
  };

  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'equipment': return 'Thiết bị';
      case 'infrastructure': return 'Cơ sở hạ tầng';
      case 'maintenance': return 'Bảo trì';
      case 'other': return 'Khác';
      default: return type;
    }
  };

  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter(i => i.status === 'open').length;
    const inProgress = issues.filter(i => i.status === 'in_progress').length;
    const resolved = issues.filter(i => i.status === 'resolved').length;
    const critical = issues.filter(i => i.severity === 'critical').length;

    return { total, open, inProgress, resolved, critical };
  }, [issues]);

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
      field: 'room',
      headerName: 'Phòng học',
      ...(isMobile || isTablet ? { 
        flex: 1.2, 
        minWidth: 120
      } : { 
        flex: 0.12,
        minWidth: 120
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, width: '100%' }}>
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
            {params.value?.name || params.value?.code || ''}
          </Typography>
        </Box>
      )
    },
    {
      field: 'title',
      headerName: 'Tiêu đề',
      ...(isMobile || isTablet ? { 
        flex: 1.5, 
        minWidth: 150
      } : { 
        flex: 0.15,
        minWidth: 150
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
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
            lineHeight: 1.4,
            wordBreak: 'break-word',
            whiteSpace: 'normal'
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'issueType',
      headerName: 'Loại',
      ...(isMobile || isTablet ? { 
        flex: 0.8, 
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
        <Chip
          label={getIssueTypeLabel(params.value)}
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
      field: 'severity',
      headerName: 'Mức độ',
      ...(isMobile || isTablet ? { 
        flex: 0.8, 
        minWidth: 90
      } : { 
        flex: 0.08,
        minWidth: 90
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Chip
          label={getSeverityLabel(params.value)}
          color={getSeverityColor(params.value) as any}
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
      field: 'status',
      headerName: 'Trạng thái',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 110
      } : { 
        flex: 0.10,
        minWidth: 110
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value) as any}
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
      field: 'reporter',
      headerName: 'Người báo cáo',
      ...(isMobile || isTablet ? { 
        flex: 1.2, 
        minWidth: 130
      } : { 
        flex: 0.12,
        minWidth: 130
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
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
            lineHeight: 1.4,
            wordBreak: 'break-word',
            whiteSpace: 'normal'
          }}
        >
          {params.value?.fullName || ''}
        </Typography>
      )
    },
    {
      field: 'startDate',
      headerName: 'Ngày bắt đầu',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 100
      } : { 
        flex: 0.10,
        minWidth: 100
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
      headerName: 'Thao tác',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 100
      } : { 
        flex: 0.12,
        minWidth: 100
      }),
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: true,
      renderCell: (params) => {
        const userRole = authService.getUserRole();
        const isAdmin = userRole === 'admin';
        const isAdminOrMaintenance = userRole === 'admin' || userRole === 'maintenance';
        
        return (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Xem chi tiết">
              <IconButton
                size="small"
                onClick={() => handleViewIssue(params.row)}
                color="primary"
                sx={{ padding: { xs: 0.25, sm: 0.5 } }}
              >
                <ViewIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <>
                <Tooltip title="Sửa">
                  <IconButton
                    size="small"
                    onClick={() => handleEditIssue(params.row)}
                    color="info"
                    sx={{ padding: { xs: 0.25, sm: 0.5 } }}
                  >
                    <EditIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
                  </IconButton>
                </Tooltip>
                {params.row.status === 'open' && (
                  <Tooltip title="Phân công">
                    <IconButton
                      size="small"
                      onClick={() => handleAssignIssue(params.row)}
                      color="warning"
                      sx={{ padding: { xs: 0.25, sm: 0.5 } }}
                    >
                      <PersonAddIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Xóa">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteIssue(params.row)}
                    color="error"
                    sx={{ padding: { xs: 0.25, sm: 0.5 } }}
                  >
                    <DeleteIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
            {!isAdmin && isAdminOrMaintenance && params.row.status === 'open' && (
              <Tooltip title="Nhận/Phân công">
                <IconButton
                  size="small"
                  onClick={() => handleAcceptIssue(params.row)}
                  color="warning"
                  sx={{ padding: { xs: 0.25, sm: 0.5 } }}
                >
                  <BuildIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
                </IconButton>
              </Tooltip>
            )}
            {params.row.status === 'in_progress' && (
              <Tooltip title="Giải quyết">
                <IconButton
                  size="small"
                  onClick={() => handleResolveIssue(params.row)}
                  color="success"
                  sx={{ padding: { xs: 0.25, sm: 0.5 } }}
                >
                  <CheckIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      }
    }
  ];

  if (loading && issues.length === 0) {
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
          Đang tải danh sách vấn đề...
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
              <Typography variant="h6">Không thể tải danh sách vấn đề</Typography>
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
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
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
                  Quản lý vấn đề phòng học
                </Typography>
              </Grid>

              <Grid size={{ xs: 'auto', sm: 'auto', md: 'auto' }} sx={{ flexShrink: 0, display: 'flex', gap: 1 }}>
                {authService.getUserRole() === 'admin' && (
                  <Tooltip title="Tạo vấn đề mới">
                    <IconButton
                      onClick={handleCreateIssue}
                      color="success"
                      sx={{
                        bgcolor: 'success.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'success.dark'
                        }
                      }}
                    >
                      <AddIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                  </Tooltip>
                )}
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
                    <WarningIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'primary.main' }} />
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
                      Tổng vấn đề
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
                    <WarningIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'error.main' }} />
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
                      Đang mở
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
                      {stats.open}
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
                    <BuildIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'warning.main' }} />
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
                      Đang xử lý
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
                      {stats.inProgress}
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
                    <CheckIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'success.main' }} />
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
                      Đã giải quyết
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
                      {stats.resolved}
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
                    <WarningIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'error.main' }} />
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
                      Nghiêm trọng
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
                      {stats.critical}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: { xs: 0.75, sm: 1, md: 1.25 }, mb: { xs: 1.5, sm: 2, md: 2.5 }, boxShadow: 2, flexShrink: 0 }}>
          <Grid container spacing={{ xs: 1, sm: 1.25, md: 1.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Trạng thái"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    height: { xs: '32px', sm: '36px', md: '40px' }
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Tất cả</MenuItem>
                  <MenuItem value="open" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Mở</MenuItem>
                  <MenuItem value="in_progress" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Đang xử lý</MenuItem>
                  <MenuItem value="resolved" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Đã giải quyết</MenuItem>
                  <MenuItem value="closed" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Đã đóng</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Mức độ</InputLabel>
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  label="Mức độ"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    height: { xs: '32px', sm: '36px', md: '40px' }
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Tất cả</MenuItem>
                  <MenuItem value="low" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Thấp</MenuItem>
                  <MenuItem value="medium" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Trung bình</MenuItem>
                  <MenuItem value="high" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Cao</MenuItem>
                  <MenuItem value="critical" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Nghiêm trọng</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Loại vấn đề</InputLabel>
                <Select
                  value={issueTypeFilter}
                  onChange={(e) => setIssueTypeFilter(e.target.value)}
                  label="Loại vấn đề"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    height: { xs: '32px', sm: '36px', md: '40px' }
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Tất cả</MenuItem>
                  <MenuItem value="equipment" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Thiết bị</MenuItem>
                  <MenuItem value="infrastructure" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Cơ sở hạ tầng</MenuItem>
                  <MenuItem value="maintenance" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Bảo trì</MenuItem>
                  <MenuItem value="other" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Khác</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setStatusFilter('');
                  setSeverityFilter('');
                  setIssueTypeFilter('');
                }}
                fullWidth
                size="small"
                sx={{ 
                  height: { xs: '32px', sm: '36px', md: '40px' },
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' }
                }}
              >
                Xóa bộ lọc
              </Button>
            </Grid>
          </Grid>
        </Paper>

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
            rows={issues}
            columns={columns}
            getRowId={(row) => row.id}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
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

        {/* View Dialog */}
        <Dialog 
          open={viewDialogOpen} 
          onClose={handleCloseDialogs}
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6">Chi tiết vấn đề</Typography>
            </Box>
            <IconButton onClick={handleCloseDialogs} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedIssue && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      PHÒNG HỌC
                    </Typography>
                    <Typography variant="body1">
                      {selectedIssue.room?.name || selectedIssue.room?.code || ''}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      TRẠNG THÁI
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getStatusLabel(selectedIssue.status)}
                        color={getStatusColor(selectedIssue.status) as any}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      MỨC ĐỘ
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={getSeverityLabel(selectedIssue.severity)}
                        color={getSeverityColor(selectedIssue.severity) as any}
                        size="small"
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      LOẠI VẤN ĐỀ
                    </Typography>
                    <Typography variant="body1">
                      {getIssueTypeLabel(selectedIssue.issueType)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      TIÊU ĐỀ
                    </Typography>
                    <Typography variant="body1">
                      {selectedIssue.title}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      MÔ TẢ
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedIssue.description}
                    </Typography>
                  </Grid>
                  {selectedIssue.equipment && (
                    <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      THIẾT BỊ BỊ ẢNH HƯỞNG
                    </Typography>
                    <Typography variant="body1">
                      {selectedIssue.equipment.name} ({selectedIssue.equipment.code})
                    </Typography>
                  </Grid>
                  )}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      NGƯỜI BÁO CÁO
                    </Typography>
                    <Typography variant="body1">
                      {selectedIssue.reporter?.fullName || ''}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      NGÀY BÁO CÁO
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedIssue.createdAt).toLocaleString('vi-VN')}
                    </Typography>
                  </Grid>
                  {selectedIssue.assignee && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          NGƯỜI ĐƯỢC PHÂN CÔNG
                        </Typography>
                        <Typography variant="body1">
                          {selectedIssue.assignee.fullName}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          NGÀY PHÂN CÔNG
                        </Typography>
                        <Typography variant="body1">
                          {selectedIssue.assignedAt ? new Date(selectedIssue.assignedAt).toLocaleString('vi-VN') : ''}
                        </Typography>
                      </Grid>
                    </>
                  )}
                  {selectedIssue.resolver && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          NGƯỜI GIẢI QUYẾT
                        </Typography>
                        <Typography variant="body1">
                          {selectedIssue.resolver.fullName}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          NGÀY GIẢI QUYẾT
                        </Typography>
                        <Typography variant="body1">
                          {selectedIssue.resolvedAt ? new Date(selectedIssue.resolvedAt).toLocaleString('vi-VN') : ''}
                        </Typography>
                      </Grid>
                      {selectedIssue.resolutionNote && (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            GHI CHÚ GIẢI QUYẾT
                          </Typography>
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {selectedIssue.resolutionNote}
                          </Typography>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Resolve Dialog */}
        <Dialog 
          open={resolveDialogOpen} 
          onClose={handleCloseDialogs}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon color="success" />
              <Typography variant="h6">Giải quyết vấn đề</Typography>
            </Box>
            <IconButton onClick={handleCloseDialogs} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedIssue && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Vấn đề:</strong> {selectedIssue.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Phòng:</strong> {selectedIssue.room?.name || selectedIssue.room?.code || ''}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Ghi chú giải quyết"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  required
                  placeholder="Nhập ghi chú về cách giải quyết vấn đề..."
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Hủy</Button>
            <Button 
              onClick={handleSaveResolution} 
              variant="contained" 
              color="success"
              disabled={!resolutionNote.trim()}
            >
              Xác nhận giải quyết
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assign Dialog */}
        <Dialog 
          open={assignDialogOpen} 
          onClose={handleCloseDialogs}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAddIcon color="warning" />
              <Typography variant="h6">Phân công người bảo trì</Typography>
            </Box>
            <IconButton onClick={handleCloseDialogs} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedIssue && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Vấn đề:</strong> {selectedIssue.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Phòng:</strong> {selectedIssue.room?.name || selectedIssue.room?.code || ''}
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Chọn người bảo trì</InputLabel>
                  <Select
                    value={selectedMaintenanceUserId}
                    onChange={(e) => setSelectedMaintenanceUserId(e.target.value)}
                    label="Chọn người bảo trì"
                  >
                    {maintenanceUsers.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.fullName} {user.maintenanceCode && `(${user.maintenanceCode})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Hủy</Button>
            <Button 
              onClick={handleSaveAssign} 
              variant="contained" 
              color="warning"
              disabled={!selectedMaintenanceUserId}
            >
              Phân công
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Dialog */}
        <Dialog 
          open={createDialogOpen} 
          onClose={handleCloseDialogs}
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddIcon color="success" />
              <Typography variant="h6">Tạo vấn đề mới</Typography>
            </Box>
            <IconButton onClick={handleCloseDialogs} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Phòng học *</InputLabel>
                <Select
                  value={formData.classRoomId}
                  onChange={(e) => setFormData({ ...formData, classRoomId: e.target.value })}
                  label="Phòng học *"
                >
                  {rooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      {room.name} ({room.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Loại vấn đề *</InputLabel>
                <Select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  label="Loại vấn đề *"
                >
                  <MenuItem value="equipment">Thiết bị</MenuItem>
                  <MenuItem value="infrastructure">Cơ sở hạ tầng</MenuItem>
                  <MenuItem value="maintenance">Bảo trì</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tiêu đề *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Mô tả chi tiết *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Mức độ nghiêm trọng</InputLabel>
                <Select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  label="Mức độ nghiêm trọng"
                >
                  <MenuItem value="low">Thấp</MenuItem>
                  <MenuItem value="medium">Trung bình</MenuItem>
                  <MenuItem value="high">Cao</MenuItem>
                  <MenuItem value="critical">Nghiêm trọng</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Ngày bắt đầu *"
                  value={formData.startDate ? dayjs(formData.startDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData({ ...formData, startDate: newValue.format('YYYY-MM-DD') });
                    }
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label="Ngày kết thúc (tùy chọn)"
                  value={formData.endDate ? dayjs(formData.endDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData({ ...formData, endDate: newValue.format('YYYY-MM-DD') });
                    } else {
                      setFormData({ ...formData, endDate: '' });
                    }
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Hủy</Button>
            <Button 
              onClick={handleSaveCreate} 
              variant="contained" 
              color="success"
              disabled={!formData.classRoomId || !formData.title.trim() || !formData.description.trim()}
            >
              Tạo vấn đề
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={handleCloseDialogs}
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon color="info" />
              <Typography variant="h6">Sửa vấn đề</Typography>
            </Box>
            <IconButton onClick={handleCloseDialogs} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Loại vấn đề *</InputLabel>
                <Select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  label="Loại vấn đề *"
                >
                  <MenuItem value="equipment">Thiết bị</MenuItem>
                  <MenuItem value="infrastructure">Cơ sở hạ tầng</MenuItem>
                  <MenuItem value="maintenance">Bảo trì</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Tiêu đề *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Mô tả chi tiết *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Mức độ nghiêm trọng</InputLabel>
                <Select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  label="Mức độ nghiêm trọng"
                >
                  <MenuItem value="low">Thấp</MenuItem>
                  <MenuItem value="medium">Trung bình</MenuItem>
                  <MenuItem value="high">Cao</MenuItem>
                  <MenuItem value="critical">Nghiêm trọng</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker
                  label="Ngày bắt đầu *"
                  value={formData.startDate ? dayjs(formData.startDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData({ ...formData, startDate: newValue.format('YYYY-MM-DD') });
                    }
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label="Ngày kết thúc (tùy chọn)"
                  value={formData.endDate ? dayjs(formData.endDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      setFormData({ ...formData, endDate: newValue.format('YYYY-MM-DD') });
                    } else {
                      setFormData({ ...formData, endDate: '' });
                    }
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Hủy</Button>
            <Button 
              onClick={handleSaveEdit} 
              variant="contained" 
              color="info"
              disabled={!formData.title.trim() || !formData.description.trim()}
            >
              Cập nhật
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={handleCloseDialogs}
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DeleteIcon color="error" />
              <Typography variant="h6">Xóa vấn đề</Typography>
            </Box>
            <IconButton onClick={handleCloseDialogs} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedIssue && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Typography variant="body1">
                  Bạn có chắc chắn muốn xóa vấn đề này không?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Tiêu đề:</strong> {selectedIssue.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Phòng:</strong> {selectedIssue.room?.name || selectedIssue.room?.code || ''}
                </Typography>
                <Alert severity="warning">
                  Hành động này không thể hoàn tác!
                </Alert>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialogs}>Hủy</Button>
            <Button 
              onClick={handleConfirmDelete} 
              variant="contained" 
              color="error"
            >
              Xóa
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default RoomIssueList;

