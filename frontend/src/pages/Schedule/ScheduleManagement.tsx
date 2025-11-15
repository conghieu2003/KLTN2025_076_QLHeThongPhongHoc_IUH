import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import {
  createScheduleException,
  getScheduleExceptions,
  getAvailableSchedules,
  updateScheduleException,
  deleteScheduleException,
  clearError,
  ScheduleException,
  AvailableSchedule,
  CreateScheduleExceptionData
} from '../../redux/slices/scheduleExceptionSlice';
import { scheduleExceptionService } from '../../services/api';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { toast } from 'react-toastify';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  SwapHoriz as SwapIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';

// Types for API data
interface Department {
  id: number;
  code: string;
  name: string;
}

interface TimeSlot {
  id: number;
  slotName: string;
  startTime: string;
  endTime: string;
  shift: string;
}

interface Room {
  id: number;
  code: string;
  name: string;
  capacity: number;
  building: string;
  floor: number;
  type: string;
}

interface Teacher {
  id: number;
  name: string;
  code: string;
  departmentId: number;
}

interface RequestType {
  id: number;
  name: string;
}

// Mapping từ RequestType ID sang exception type
const getExceptionTypeFromRequestType = (requestTypeId: number): string => {
  switch (requestTypeId) {
    case 5: return 'paused'; // Tạm ngưng
    case 6: return 'exam'; // Thi
    case 8: return 'moved'; // Đổi lịch
    case 9: return 'substitute'; // Đổi giáo viên
    default: return 'cancelled';
  }
};

// Mapping từ exception type sang RequestType ID
const getRequestTypeIdFromExceptionType = (exceptionType: string): number => {
  switch (exceptionType) {
    case 'cancelled': return 5; // Tạm ngưng
    case 'exam': return 6; // Thi
    case 'moved': return 8; // Đổi lịch
    case 'substitute': return 9; // Đổi giáo viên
    default: return 5;
  }
};

// Tạo exceptionTypes từ RequestType data
const createExceptionTypes = (requestTypes: RequestType[]) => {
  const exceptionTypeMap = {
    'cancelled': { label: 'Hủy lớp', color: 'error', icon: <CancelIcon /> },
    'exam': { label: 'Thi', color: 'secondary', icon: <ScheduleIcon /> },
    'moved': { label: 'Chuyển lịch', color: 'warning', icon: <SwapIcon /> },
    'substitute': { label: 'Thay giảng viên', color: 'info', icon: <PersonIcon /> }
  };

  return requestTypes
    .filter(rt => rt.id >= 5 && rt.id <= 9) // Chỉ lấy loại ngoại lệ (ID 5-9)
    .map(rt => {
      const exceptionType = getExceptionTypeFromRequestType(rt.id);
      const typeInfo = exceptionTypeMap[exceptionType as keyof typeof exceptionTypeMap] || 
                      { label: rt.name, color: 'default', icon: <CancelIcon /> };
      return {
        value: exceptionType,
        label: rt.name,
        color: typeInfo.color,
        icon: typeInfo.icon,
        requestTypeId: rt.id
      };
    });
};

const ScheduleManagement = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { exceptions, availableSchedules, loading, error } = useSelector((state: RootState) => state.scheduleException);

  const [currentTab, setCurrentTab] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedExceptionType, setSelectedExceptionType] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [editingException, setEditingException] = useState<ScheduleException | null>(null);

  // API data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  // Form state for creating/editing exception
  const [formData, setFormData] = useState<CreateScheduleExceptionData>({
    classScheduleId: 0,
    exceptionDate: dayjs().format('YYYY-MM-DD'),
    exceptionType: 'cancelled',
    reason: '',
    note: ''
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setApiLoading(true);
      try {
        // Load Redux data
        dispatch(getScheduleExceptions({}));
        dispatch(getAvailableSchedules({}));

        // Load API data
        const [departmentsRes, timeSlotsRes, roomsRes, teachersRes, requestTypesRes] = await Promise.all([
          scheduleExceptionService.getDepartments(),
          scheduleExceptionService.getTimeSlots(),
          scheduleExceptionService.getRooms(),
          scheduleExceptionService.getTeachers(),
          scheduleExceptionService.getRequestTypes()
        ]);

        if (departmentsRes.success) {
          setDepartments(departmentsRes.data || []);
        }
        if (timeSlotsRes.success) {
          setTimeSlots(timeSlotsRes.data || []);
        }
        if (roomsRes.success) {
          setRooms(roomsRes.data || []);
        }
        if (teachersRes.success) {
          setTeachers(teachersRes.data || []);
        }
        if (requestTypesRes.success) {
          setRequestTypes(requestTypesRes.data || []);
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setApiLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  // Filter available schedules
  const filteredSchedules = useMemo(() => {
    let filtered = availableSchedules;

    if (selectedDepartment) {
      filtered = filtered.filter(schedule => schedule.departmentId === parseInt(selectedDepartment));
    }

    if (selectedClass) {
      filtered = filtered.filter(schedule => schedule.className.toLowerCase().includes(selectedClass.toLowerCase()));
    }

    if (selectedTeacher) {
      filtered = filtered.filter(schedule => schedule.teacherName.toLowerCase().includes(selectedTeacher.toLowerCase()));
    }

    return filtered;
  }, [availableSchedules, selectedDepartment, selectedClass, selectedTeacher]);

  // Filter exceptions
  const filteredExceptions = useMemo(() => {
    let filtered = exceptions;

    if (selectedExceptionType) {
      filtered = filtered.filter(exp => exp.exceptionType === selectedExceptionType);
    }

    if (selectedDate) {
      filtered = filtered.filter(exp => dayjs(exp.exceptionDate).isSame(selectedDate, 'day'));
    }

    return filtered;
  }, [exceptions, selectedExceptionType, selectedDate]);

  const handleOpenExceptionDialog = (schedule?: AvailableSchedule, exception?: ScheduleException) => {
    if (exception) {
      setEditingException(exception);
      setFormData({
        classScheduleId: exception.classScheduleId,
        exceptionDate: exception.exceptionDate,
        exceptionType: exception.exceptionType,
        newTimeSlotId: exception.newTimeSlotId,
        newClassRoomId: exception.newClassRoomId,
        newDate: exception.newDate,
        substituteTeacherId: exception.substituteTeacherId,
        reason: exception.reason,
        note: exception.note || ''
      });
    } else if (schedule) {
      setEditingException(null);
      
      // Tự động điền schedule ID, ngày mặc định là hôm nay
      setFormData({
        classScheduleId: schedule.id,
        exceptionDate: dayjs().format('YYYY-MM-DD'),
        exceptionType: 'cancelled',
        reason: '',
        note: ''
      });
    } else {
      // Mở dialog tạo mới không có schedule được chọn trước
      setEditingException(null);
      setFormData({
        classScheduleId: 0,
        exceptionDate: dayjs().format('YYYY-MM-DD'),
        exceptionType: 'cancelled',
        reason: '',
        note: ''
      });
    }
    setExceptionDialogOpen(true);
  };

  const handleCloseExceptionDialog = () => {
    setExceptionDialogOpen(false);
    setEditingException(null);
    setFormData({
      classScheduleId: 0,
      exceptionDate: dayjs().format('YYYY-MM-DD'),
      exceptionType: 'cancelled',
      reason: '',
      note: ''
    });
  };

  const handleSaveException = async () => {
    // Clear previous messages
    dispatch(clearError());

    // Validation
    if (!formData.classScheduleId || formData.classScheduleId === 0) {
      toast.error('Vui lòng chọn lịch học');
      return;
    }

    if (!formData.exceptionDate) {
      toast.error('Vui lòng chọn ngày ngoại lệ');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Vui lòng nhập lý do ngoại lệ');
      return;
    }

    // Additional validation for specific exception types
    if (formData.exceptionType === 'moved' || formData.exceptionType === 'exam') {
      if (!formData.newDate || !formData.newTimeSlotId || !formData.newClassRoomId) {
        toast.error('Vui lòng điền đầy đủ thông tin chuyển lịch (ngày mới, tiết mới, phòng mới)');
        return;
      }
    }

    if (formData.exceptionType === 'substitute' && !formData.substituteTeacherId) {
      toast.error('Vui lòng chọn giảng viên thay thế');
      return;
    }

    try {
      // Chuyển đổi exceptionType thành requestTypeId
      const requestTypeId = getRequestTypeIdFromExceptionType(formData.exceptionType);
      const dataToSend = {
        ...formData,
        requestTypeId: requestTypeId
      };

      if (editingException) {
        await dispatch(updateScheduleException({
          id: editingException.id,
          data: dataToSend
        })).unwrap();
        toast.success('Cập nhật ngoại lệ thành công!');
      } else {
        await dispatch(createScheduleException(dataToSend)).unwrap();
        toast.success('Tạo ngoại lệ thành công!');
      }
      handleCloseExceptionDialog();
      dispatch(getScheduleExceptions({}));
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu ngoại lệ');
    }
  };

  const handleDeleteException = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ngoại lệ này?')) {
      try {
        await dispatch(deleteScheduleException(id)).unwrap();
        toast.success('Xóa ngoại lệ thành công!');
        dispatch(getScheduleExceptions({}));
      } catch (error) {
        toast.error('Có lỗi xảy ra khi xóa ngoại lệ');
      }
    }
  };

  const getExceptionTypeInfo = (type: string) => {
    const exceptionTypes = createExceptionTypes(requestTypes);
    return exceptionTypes.find(t => t.value === type) || exceptionTypes[0];
  };

  const getShiftName = (shift: number) => {
    switch (shift) {
      case 1: return 'Sáng';
      case 2: return 'Chiều';
      case 3: return 'Tối';
      default: return 'Không xác định';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box sx={{ p: { xs: 1, sm: 1.5, md: 3 }, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 1.5, sm: 2, md: 3 } }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              mb: { xs: 0.5, sm: 1 },
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' },
              color: 'primary.main'
            }}
          >
            Quản lý ngoại lệ lịch học
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
          >
            Tạo và quản lý các ngoại lệ cho lịch học (hủy lớp, chuyển lịch, thi, thay giảng viên)
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: { xs: 1.5, sm: 2, md: 3 },
              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
            }} 
            onClose={() => dispatch(clearError())}
          >
            {error}
          </Alert>
        )}

        {/* Loading Alert */}
        {(loading || apiLoading) && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: { xs: 1.5, sm: 2, md: 3 },
              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={isMobile ? 16 : 20} />
              <Typography sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}>
                Đang tải dữ liệu...
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: { xs: 1.5, sm: 2, md: 3 }, boxShadow: 2 }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: { xs: '0.7rem', sm: '0.875rem', md: '1rem' },
                minHeight: { xs: '40px', sm: '48px', md: '48px' },
                padding: { xs: '8px 12px', sm: '12px 16px', md: '12px 16px' }
              }
            }}
          >
            <Tab label="Danh sách lịch học" />
            <Tab label="Ngoại lệ đã tạo" />
          </Tabs>
        </Paper>

        {/* Filters */}
        <Paper sx={{ p: { xs: 0.75, sm: 1, md: 1.25 }, mb: { xs: 1.5, sm: 2, md: 3 }, boxShadow: 2 }}>
          <Grid container spacing={{ xs: 1, sm: 1.25, md: 1.5 }}>
            <Grid size={{ xs: 6, sm: 6, md: 4 }}>
              <FormControl 
                fullWidth 
                size="small"
              >
                <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Theo khoa</InputLabel>
                <Select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  label="Theo khoa"
                  sx={{ 
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    height: { xs: '32px', sm: '36px', md: '40px' },
                    '& .MuiSelect-select': {
                      py: { xs: '6px', sm: '8px', md: '10px' }
                    }
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Tất cả khoa</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id} sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Tìm lớp học"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                placeholder="Nhập tên lớp..."
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    height: { xs: '32px', sm: '36px', md: '40px' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                  },
                  '& .MuiOutlinedInput-input': {
                    py: { xs: '6px', sm: '8px', md: '10px' }
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Tìm giảng viên"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                placeholder="Nhập tên GV..."
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    height: { xs: '32px', sm: '36px', md: '40px' }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                  },
                  '& .MuiOutlinedInput-input': {
                    py: { xs: '6px', sm: '8px', md: '10px' }
                  }
                }}
              />
            </Grid>

            {currentTab === 1 && (
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <FormControl 
                  fullWidth 
                  size="small"
                >
                  <InputLabel sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Loại ngoại lệ</InputLabel>
                  <Select
                    value={selectedExceptionType}
                    onChange={(e) => setSelectedExceptionType(e.target.value)}
                    label="Loại ngoại lệ"
                    sx={{ 
                      fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                      height: { xs: '32px', sm: '36px', md: '40px' },
                      '& .MuiSelect-select': {
                        py: { xs: '6px', sm: '8px', md: '10px' }
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>Tất cả</MenuItem>
                    {createExceptionTypes(requestTypes).map(type => (
                      <MenuItem key={type.value} value={type.value} sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid size={{ xs: 6, sm: 6, md: 4 }}>
              <DatePicker
                label="Ngày"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                slotProps={{ 
                  textField: { 
                    size: "small",
                    fullWidth: true,
                    sx: {
                      '& .MuiInputBase-root': {
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                        height: { xs: '32px', sm: '36px', md: '40px' }
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                      },
                      '& .MuiOutlinedInput-input': {
                        py: { xs: '6px', sm: '8px', md: '10px' }
                      }
                    }
                  } 
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }} />}
                onClick={() => handleOpenExceptionDialog()}
                fullWidth
                size="small"
                sx={{ 
                  height: { xs: '32px', sm: '36px', md: '36px' },
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
                  py: { xs: '4px', sm: '6px', md: '8px' }
                }}
              >
                Tạo ngoại lệ
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Content based on tab */}
        {currentTab === 0 ? (
          /* Available Schedules */
          <Paper sx={{ boxShadow: 3 }}>
            <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, borderBottom: '1px solid #e0e0e0' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
                }}
              >
                Danh sách lịch học có thể tạo ngoại lệ ({filteredSchedules.length})
              </Typography>
            </Box>

            <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {filteredSchedules.map((schedule) => (
                  <Grid key={schedule.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        height: '100%',
                        '&:hover': { 
                          boxShadow: 3,
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => handleOpenExceptionDialog(schedule)}
                    >
                      <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 1, sm: 1.5, md: 2 } }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                              wordBreak: 'break-word',
                              flex: 1,
                              mr: 1
                            }}
                          >
                            {schedule.className}
                          </Typography>
                          <Chip
                            label={schedule.departmentName}
                            size={isMobile ? "small" : "medium"}
                            color="primary"
                            variant="outlined"
                            sx={{
                              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                              height: { xs: 20, sm: 24, md: 28 }
                            }}
                          />
                        </Box>

                        <Box sx={{ mb: { xs: 1, sm: 1.5, md: 2 } }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: { xs: 0.75, sm: 1 },
                              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                              wordBreak: 'break-word'
                            }}
                          >
                            <strong>Mã lớp:</strong> {schedule.classCode}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: { xs: 0.75, sm: 1 },
                              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                              wordBreak: 'break-word'
                            }}
                          >
                            <strong>Giảng viên:</strong> {schedule.teacherName}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: { xs: 0.75, sm: 1 },
                              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                              wordBreak: 'break-word'
                            }}
                          >
                            <strong>Phòng:</strong> {schedule.roomName}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: { xs: 0.75, sm: 1 },
                              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                            }}
                          >
                            <strong>Thời gian:</strong> {schedule.dayName} - {schedule.slotName}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: { xs: 0.75, sm: 1 },
                              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                            }}
                          >
                            <strong>Ca:</strong> {getShiftName(schedule.shift)}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: { xs: 0.75, sm: 1 },
                              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                            }}
                          >
                            <strong>Giờ học:</strong> {schedule.startTime} - {schedule.endTime}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: { xs: 0.75, sm: 1 },
                              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                              display: 'flex',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 0.5
                            }}
                          >
                            <strong>Loại lớp:</strong> 
                            <Chip 
                              label={schedule.classType === 'theory' ? 'Lý thuyết' : 'Thực hành'} 
                              size={isMobile ? "small" : "medium"}
                              color={schedule.classType === 'theory' ? 'primary' : 'secondary'}
                              sx={{ 
                                fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                                height: { xs: 20, sm: 24, md: 28 }
                              }}
                            />
                            {schedule.practiceGroup && (
                              <Chip 
                                label={`Nhóm ${schedule.practiceGroup}`} 
                                size={isMobile ? "small" : "medium"}
                                color="secondary"
                                variant="outlined"
                                sx={{ 
                                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                                  height: { xs: 20, sm: 24, md: 28 }
                                }}
                              />
                            )}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Tạo ngoại lệ">
                            <IconButton 
                              size={isMobile ? "small" : "medium"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenExceptionDialog(schedule);
                              }}
                              sx={{ padding: { xs: 0.5, sm: 0.75, md: 1 } }}
                            >
                              <AddIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {filteredSchedules.length === 0 && (
                <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 4 } }}>
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' } }}
                  >
                    Không có lịch học nào
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mt: 1,
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                    }}
                  >
                    Hãy thay đổi bộ lọc hoặc kiểm tra dữ liệu
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        ) : (
          /* Exceptions List */
          <Paper sx={{ boxShadow: 3 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Danh sách ngoại lệ đã tạo ({filteredExceptions.length})
              </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {filteredExceptions.map((exception) => {
                  const typeInfo = getExceptionTypeInfo(exception.exceptionType);
                  return (
                    <Box key={exception.id} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                              {exception.className}
                            </Typography>
                            <Chip
                              icon={typeInfo.icon}
                              label={typeInfo.label}
                              color={typeInfo.color as any}
                              size="small"
                            />
                          </Box>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Ngày ngoại lệ:</strong> {dayjs(exception.exceptionDate).format('DD/MM/YYYY')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Lịch gốc:</strong> {exception.slotName} ({exception.startTime}-{exception.endTime})
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Phòng gốc:</strong> {exception.roomName} ({exception.roomCode})
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Giảng viên:</strong> {exception.teacherName}
                            </Typography>

                            {/* Hiển thị thông tin chuyển đến nếu là moved hoặc exam */}
                            {(exception.exceptionType === 'moved' || exception.exceptionType === 'exam') && (
                              <Box sx={{ mt: 2, p: 2, backgroundColor: 'warning.light', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'warning.dark' }}>
                                  Thông tin chuyển đến:
                                </Typography>
                                {exception.newDate && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    <strong>Ngày mới:</strong> {dayjs(exception.newDate).format('DD/MM/YYYY')}
                                  </Typography>
                                )}
                                {exception.newTimeSlotName && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    <strong>Tiết mới:</strong> {exception.newTimeSlotName} ({exception.newTimeSlotStart}-{exception.newTimeSlotEnd})
                                  </Typography>
                                )}
                                {exception.newClassRoomName && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    <strong>Phòng mới:</strong> {exception.newClassRoomName} ({exception.newClassRoomCode})
                                  </Typography>
                                )}
                              </Box>
                            )}

                            {/* Hiển thị thông tin giảng viên thay thế nếu là substitute */}
                            {exception.exceptionType === 'substitute' && exception.substituteTeacherName && (
                              <Box sx={{ mt: 2, p: 2, backgroundColor: 'info.light', borderRadius: 1, border: '1px solid', borderColor: 'info.main' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'info.dark' }}>
                                  Giảng viên thay thế:
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {exception.substituteTeacherName} ({exception.substituteTeacherCode})
                                </Typography>
                              </Box>
                            )}

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, mt: 2 }}>
                              <strong>Trạng thái:</strong> 
                              <Chip 
                                label={exception.statusName}
                                size="small"
                                color={exception.requestStatusId === 2 ? 'success' : exception.requestStatusId === 3 ? 'error' : 'warning'}
                                sx={{ ml: 1 }}
                              />
                            </Typography>
                          </Box>

                          <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                            <strong>Lý do:</strong> "{exception.reason}"
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenExceptionDialog(undefined, exception)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteException(exception.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </Box>

              {filteredExceptions.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    Không có ngoại lệ nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Hãy tạo ngoại lệ mới hoặc thay đổi bộ lọc
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* Exception Dialog */}
        <Dialog 
          open={exceptionDialogOpen} 
          onClose={handleCloseExceptionDialog}
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: { minHeight: '70vh' }
          }}
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            pb: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6" component="div">
                {editingException ? 'Chỉnh sửa ngoại lệ lịch học' : 'Tạo ngoại lệ lịch học'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseExceptionDialog} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Thông tin lịch học */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                  Thông tin lịch học
                </Typography>
                {formData.classScheduleId > 0 && (() => {
                  const selectedSchedule = availableSchedules.find(s => s.id === formData.classScheduleId);
                  return selectedSchedule ? (
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 3, 
                        mb: 2, 
                        border: '1px solid', 
                        borderColor: 'primary.light',
                        borderRadius: 2,
                        backgroundColor: 'grey.50'
                      }}
                    >
                      <Box sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                        gap: 2
                      }}>
                        {/* Thông tin cơ bản */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              TÊN LỚP
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedSchedule.className}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              MÃ LỚP
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedSchedule.classCode}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              KHOA
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedSchedule.departmentName}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Thông tin giảng viên và phòng */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              GIẢNG VIÊN
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedSchedule.teacherName}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              PHÒNG HỌC
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedSchedule.roomName}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              LOẠI LỚP
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={selectedSchedule.classType === 'theory' ? 'Lý thuyết' : 'Thực hành'} 
                                size="small" 
                                color={selectedSchedule.classType === 'theory' ? 'primary' : 'secondary'}
                                variant="filled"
                              />
                              {selectedSchedule.practiceGroup && (
                                <Chip 
                                  label={`Nhóm ${selectedSchedule.practiceGroup}`} 
                                  size="small" 
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>

                        {/* Thông tin thời gian */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              THỜI GIAN
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedSchedule.dayName} - {selectedSchedule.slotName}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              CA HỌC
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {getShiftName(selectedSchedule.shift)}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              GIỜ HỌC
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedSchedule.startTime} - {selectedSchedule.endTime}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        Không tìm thấy thông tin lịch học
                    </Typography>
                  </Alert>
                  );
                })()}
              </Box>

              {/* Chọn lịch học */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Chọn lịch học</InputLabel>
                    <Select
                      value={formData.classScheduleId || ''}
                      onChange={(e) => {
                        const scheduleId = parseInt(String(e.target.value));
                        setFormData(prev => ({ 
                          ...prev, 
                          classScheduleId: scheduleId,
                          // Reset other fields when changing schedule
                          newTimeSlotId: undefined,
                          newClassRoomId: undefined,
                          newDate: undefined,
                          substituteTeacherId: undefined
                        }));
                      }}
                      label="Chọn lịch học"
                    >
                      <MenuItem value="">
                        <em>-- Chọn lịch học --</em>
                      </MenuItem>
                      {availableSchedules.map(schedule => (
                        <MenuItem key={schedule.id} value={schedule.id}>
                          {schedule.className} - {schedule.classCode} | {schedule.dayName} - {schedule.slotName} | {schedule.roomName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Chọn ngày ngoại lệ - DatePicker tự do */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <DatePicker
                    label="Ngày ngoại lệ"
                    value={formData.exceptionDate ? dayjs(formData.exceptionDate) : null}
                    onChange={(newValue) => setFormData(prev => ({ 
                      ...prev, 
                      exceptionDate: newValue?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD')
                    }))}
                    slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
                  />
                </Box>
                </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Loại ngoại lệ</InputLabel>
                    <Select
                      value={formData.exceptionType}
                      onChange={(e) => setFormData(prev => ({ ...prev, exceptionType: e.target.value as any }))}
                      label="Loại ngoại lệ"
                    >
                      {createExceptionTypes(requestTypes).map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {type.icon}
                            {type.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Conditional fields based on exception type */}
              {(formData.exceptionType === 'moved' || formData.exceptionType === 'exam') && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <DatePicker
                      label="Ngày chuyển đến"
                      value={formData.newDate ? dayjs(formData.newDate) : null}
                      onChange={(newValue) => setFormData(prev => ({ 
                        ...prev, 
                        newDate: newValue?.format('YYYY-MM-DD')
                      }))}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>

                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tiết chuyển đến</InputLabel>
                      <Select
                        value={formData.newTimeSlotId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, newTimeSlotId: parseInt(String(e.target.value)) }))}
                        label="Tiết chuyển đến"
                      >
                        {timeSlots.map(slot => (
                          <MenuItem key={slot.id} value={slot.id}>
                            {slot.slotName} ({slot.startTime}-{slot.endTime})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Phòng chuyển đến</InputLabel>
                      <Select
                        value={formData.newClassRoomId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, newClassRoomId: parseInt(String(e.target.value)) }))}
                        label="Phòng chuyển đến"
                      >
                        {rooms.map(room => (
                          <MenuItem key={room.id} value={room.id}>
                            {room.name} ({room.code}) - {room.capacity} chỗ
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              )}

              {formData.exceptionType === 'substitute' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Giảng viên thay thế</InputLabel>
                      <Select
                        value={formData.substituteTeacherId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, substituteTeacherId: parseInt(String(e.target.value)) }))}
                        label="Giảng viên thay thế"
                      >
                        {teachers.map(teacher => (
                          <MenuItem key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Lý do ngoại lệ"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  size="small"
                  required
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Ghi chú"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  size="small"
                />
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseExceptionDialog} variant="outlined">
              Hủy
            </Button>
            <Button 
              onClick={handleSaveException} 
              variant="contained" 
              color="primary"
              disabled={loading || !formData.classScheduleId || !formData.reason.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {editingException ? 'Cập nhật' : 'Tạo ngoại lệ'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </LocalizationProvider>
  );
};

export default ScheduleManagement;