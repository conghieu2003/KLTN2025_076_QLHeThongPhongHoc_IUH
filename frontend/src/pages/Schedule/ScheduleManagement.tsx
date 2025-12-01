import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { createScheduleException, getScheduleExceptions, getAvailableSchedules, updateScheduleException, deleteScheduleException, clearError, ScheduleException, AvailableSchedule, CreateScheduleExceptionData } from '../../redux/slices/scheduleExceptionSlice'; 
import { scheduleExceptionService, roomService, scheduleManagementService } from '../../services/api';
import { Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, Alert, CircularProgress, Tooltip, Grid, useTheme, useMediaQuery } from '@mui/material';
import { toast } from 'react-toastify';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Schedule as ScheduleIcon, Person as PersonIcon, Cancel as CloseIcon, Warning as WarningIcon, SwapHoriz as SwapIcon, Info as InfoIcon } from '@mui/icons-material'; 
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import { formatDateForAPI, parseDateFromAPI, TransDateTime, formatTimeFromAPI } from '../../utils/transDateTime';

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

const getExceptionTypeFromRequestType = (requestTypeId: number): string => {
  switch (requestTypeId) {
    case 5: return 'paused'; // Tạm ngưng
    case 6: return 'exam'; // Thi giữa kỳ
    case 8: return 'moved'; // Đổi lịch
    case 9: return 'substitute'; // Đổi giáo viên
    case 10: return 'finalExam'; // Thi cuối kỳ
    default: return 'cancelled';
  }
};

const getRequestTypeIdFromExceptionType = (exceptionType: string): number => {
  switch (exceptionType) {
    case 'cancelled': return 5; // Tạm ngưng
    case 'exam': return 6; // Thi giữa kỳ
    case 'moved': return 8; // Đổi lịch
    case 'substitute': return 9; // Đổi giáo viên
    case 'finalExam': return 10; // Thi cuối kỳ
    default: return 5;
  }
};

const createExceptionTypes = (requestTypes: RequestType[]) => {
  const exceptionTypeMap = {
    'cancelled': { label: 'Hủy lớp', color: 'error', icon: <CloseIcon /> },
    'exam': { label: 'Thi giữa kỳ', color: 'secondary', icon: <ScheduleIcon /> },
    'moved': { label: 'Chuyển lịch', color: 'warning', icon: <SwapIcon /> },
    'substitute': { label: 'Thay giảng viên', color: 'info', icon: <PersonIcon /> },
    'finalExam': { label: 'Thi cuối kỳ', color: 'secondary', icon: <ScheduleIcon /> }
  };

  return requestTypes
    .filter(rt => rt.id >= 5 && rt.id <= 10) // Chỉ lấy loại ngoại lệ (ID 5-10, bao gồm thi cuối kỳ)
    .map(rt => {
      const exceptionType = getExceptionTypeFromRequestType(rt.id);
      const typeInfo = exceptionTypeMap[exceptionType as keyof typeof exceptionTypeMap] || 
                      { label: rt.name, color: 'default', icon: <CloseIcon /> };
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
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [editingException, setEditingException] = useState<ScheduleException | null>(null);

  // API data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [classes, setClasses] = useState<any[]>([]); // Danh sách lớp học cho thi cuối kỳ
  const [apiLoading, setApiLoading] = useState(false);

  // State để lưu danh sách phòng available cho ngoại lệ
  const [availableRoomsForException, setAvailableRoomsForException] = useState<any[]>([]);
  const [occupiedRoomIds, setOccupiedRoomIds] = useState<number[]>([]);
  const [checkingRooms, setCheckingRooms] = useState(false);

  // Form state for creating/editing exception
  const [formData, setFormData] = useState<CreateScheduleExceptionData & { classId?: number }>({
    classScheduleId: 0,
    classId: undefined, // Thêm classId cho thi cuối kỳ
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
        dispatch(getScheduleExceptions({ getAll: true }));
        dispatch(getAvailableSchedules({}));

        // Load API data
        const [departmentsRes, timeSlotsRes, teachersRes, requestTypesRes, classesRes] = await Promise.all([
          scheduleExceptionService.getDepartments(),
          scheduleExceptionService.getTimeSlots(),
          scheduleExceptionService.getTeachers(),
          scheduleExceptionService.getRequestTypes(),
          scheduleManagementService.getClassesForScheduling() // Load classes cho thi cuối kỳ
        ]);

        if (departmentsRes.success) {
          setDepartments(departmentsRes.data || []);
        }
        if (timeSlotsRes.success) {
          setTimeSlots(timeSlotsRes.data || []);
        }
        if (teachersRes.success) {
          setTeachers(teachersRes.data || []);
        }
        if (requestTypesRes.success) {
          setRequestTypes(requestTypesRes.data || []);
        }
        // Xử lý classes response
        if (classesRes && classesRes.success && classesRes.data) {
          setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
        } else if (Array.isArray(classesRes)) {
          setClasses(classesRes);
        } else if (classesRes?.data && Array.isArray(classesRes.data)) {
          setClasses(classesRes.data);
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setClasses([]);
      } finally {
        setApiLoading(false);
      }
    };

    loadData();
  }, [dispatch]);

  // Kiểm tra phòng available khi chọn ngày/tiết mới cho exception moved/exam/finalExam - chỉ lấy phòng của khoa
  useEffect(() => {
    const checkAvailableRooms = async () => {
      const isFinalExam = formData.exceptionType === 'finalExam';
      const isMovedOrExam = formData.exceptionType === 'moved' || formData.exceptionType === 'exam';
      
      // Thi cuối kỳ: dùng exceptionDate và newTimeSlotId
      // Moved/Exam: dùng newDate và newTimeSlotId
      const targetDate = isFinalExam ? formData.exceptionDate : formData.newDate;
      
      if ((isMovedOrExam && formData.newDate && formData.newTimeSlotId) ||
          (isFinalExam && formData.exceptionDate && formData.newTimeSlotId)) {
        
        setCheckingRooms(true);
        try {
          // Tính dayOfWeek từ targetDate (1=CN, 2=T2, ..., 7=T7)
          if (!targetDate) {
            setCheckingRooms(false);
            return;
          }
          
          // Lấy departmentId và classRoomTypeId từ lớp học đã chọn
          let departmentId: number | undefined = undefined;
          let classRoomTypeId: string | undefined = undefined;
          let classMaxStudents: number | undefined = undefined;
          
          if (isFinalExam && formData.classId) {
            const selectedClass = classes.find(c => {
              const classId = c.classId || c.id;
              return classId === formData.classId;
            });
            departmentId = selectedClass?.departmentId;
            
            // Lấy thông tin loại phòng từ schedule đầu tiên có phòng hoặc từ class
            if (selectedClass) {
              classMaxStudents = selectedClass.maxStudents;
              
              // Ưu tiên lấy từ classRoomTypeId của class
              if (selectedClass.classRoomTypeId) {
                classRoomTypeId = String(selectedClass.classRoomTypeId);
              } else if (selectedClass.schedules && Array.isArray(selectedClass.schedules)) {
                const firstScheduleWithRoom = selectedClass.schedules.find((s: any) => {
                  const hasRoom = (s.roomId !== null && s.roomId !== undefined) || 
                                 (s.classRoomId !== null && s.classRoomId !== undefined) ||
                                 (s.roomName && s.roomName !== null);
                  const hasValidStatus = s.statusId === 2 || s.statusId === 3;
                  return hasRoom && hasValidStatus;
                });
                
                if (firstScheduleWithRoom) {
                  // Lấy loại phòng từ schedule
                  classRoomTypeId = firstScheduleWithRoom.classRoomTypeId 
                    ? String(firstScheduleWithRoom.classRoomTypeId)
                    : (firstScheduleWithRoom.classRoomTypeName === 'Thực hành' ? '2' : '1');
                }
              }
              
              // Nếu vẫn chưa có, mặc định là lý thuyết
              if (!classRoomTypeId) {
                classRoomTypeId = '1';
              }
            }
          } else if (formData.classScheduleId) {
            const selectedSchedule = availableSchedules.find(s => s.id === formData.classScheduleId);
            departmentId = selectedSchedule?.departmentId;
            // Lấy loại phòng từ schedule
            classRoomTypeId = selectedSchedule?.classType === 'practice' ? '2' : '1';
          }
          
          const dateObj = parseDateFromAPI(targetDate) || new Date(targetDate);
          const dayOfWeek = dateObj.getDay() === 0 ? 1 : dateObj.getDay() + 1;
          
          const formattedDate = formatDateForAPI(dateObj) || targetDate;
          
          if (!formattedDate) {
            setCheckingRooms(false);
            return;
          }
          
          // Gọi API với departmentId và classRoomTypeId để lọc phòng theo khoa và loại phòng
          const response = await roomService.getAvailableRoomsForException(
            formData.newTimeSlotId,
            dayOfWeek,
            formattedDate,
            classMaxStudents, // capacity
            classRoomTypeId, // classRoomTypeId - lý thuyết (1) hoặc thực hành (2)
            departmentId ? String(departmentId) : undefined // departmentId
          );

          if (response.success && response.data) {
            const data = response.data;
            
            // Lấy danh sách phòng occupied (convert về number để so sánh)
            const occupiedIds = (data.occupiedRooms || []).map((r: any) => parseInt(String(r.id)));
            
            // Lấy danh sách tất cả phòng available (normal + freed)
            // Filter lại để loại bỏ phòng bị occupied
            const allAvailableRooms = [
              ...(data.normalRooms || []),
              ...(data.freedRooms || [])
            ];
            
            // Chỉ giữ lại phòng không bị occupied (so sánh với số để đảm bảo type matching)
            const availableRooms = allAvailableRooms.filter((room: any) => {
              const roomIdNum = parseInt(String(room.id));
              return !occupiedIds.includes(roomIdNum);
            });
            
            setAvailableRoomsForException(availableRooms);
            setOccupiedRoomIds(occupiedIds);
          } else {
            setAvailableRoomsForException([]);
            setOccupiedRoomIds([]);
          }
        } catch (error) {
          console.error('Error checking available rooms:', error);
          setAvailableRoomsForException([]);
          setOccupiedRoomIds([]);
        } finally {
          setCheckingRooms(false);
        }
        } else {
          // Reset khi không phải moved/exam/finalExam hoặc chưa đủ thông tin
          setAvailableRoomsForException([]);
          setOccupiedRoomIds([]);
        }
      };

      checkAvailableRooms();
    }, [formData.exceptionType, formData.newDate, formData.exceptionDate, formData.newTimeSlotId, formData.classScheduleId, formData.classId, availableSchedules, classes]);

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
      filtered = filtered.filter(exp => {
        const expDate = parseDateFromAPI(exp.exceptionDate);
        if (!expDate) return false;
        return dayjs(expDate).isSame(selectedDate, 'day');
      });
    }

    return filtered;
  }, [exceptions, selectedExceptionType, selectedDate]);

  const handleOpenExceptionDialog = (schedule?: AvailableSchedule, exception?: ScheduleException) => {
    if (exception) {
      setEditingException(exception);
      // Sử dụng formatDateForAPI để đảm bảo timezone chính xác
      const exceptionDate = formatDateForAPI(exception.exceptionDate) || dayjs().format('YYYY-MM-DD');
      const newDate = exception.newDate ? formatDateForAPI(exception.newDate) : undefined;
      
      setFormData({
        classScheduleId: exception.classScheduleId || 0,
        classId: (exception as any).classId || undefined, // Lấy classId nếu có (thi cuối kỳ)
        exceptionDate: exceptionDate,
        exceptionType: exception.exceptionType,
        newTimeSlotId: exception.newTimeSlotId,
        newClassRoomId: exception.newClassRoomId,
        newDate: newDate,
        substituteTeacherId: exception.substituteTeacherId,
        reason: exception.reason,
        note: exception.note || ''
      });
    } else if (schedule) {
      setEditingException(null);
      
      // Tự động điền schedule ID, ngày mặc định là hôm nay
      const today = TransDateTime(new Date());
      setFormData({
        classScheduleId: schedule.id,
        exceptionDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD'),
        exceptionType: 'cancelled',
        reason: '',
        note: ''
      });
    } else {
      // Mở dialog tạo mới không có schedule được chọn trước
      setEditingException(null);
      const today = TransDateTime(new Date());
      setFormData({
        classScheduleId: 0,
        classId: undefined,
        exceptionDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD'),
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
    const today = TransDateTime(new Date());
    setFormData({
      classScheduleId: 0,
      classId: undefined,
      exceptionDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD'),
      exceptionType: 'cancelled',
      reason: '',
      note: ''
    });
  };

  const handleSaveException = async () => {
    // Clear previous messages
    dispatch(clearError());

    // Validation
    const isFinalExam = formData.exceptionType === 'finalExam';
    
    if (isFinalExam) {
      // Thi cuối kỳ: cần classId, exceptionDate, newTimeSlotId, newClassRoomId
      if (!formData.classId || formData.classId === 0) {
        toast.error('Vui lòng chọn lớp học');
        return;
      }
      if (!formData.exceptionDate) {
        toast.error('Vui lòng chọn ngày thi');
        return;
      }
      if (!formData.newTimeSlotId || !formData.newClassRoomId) {
        toast.error('Vui lòng chọn tiết và phòng cho lịch thi');
        return;
      }
    } else {
      // Các loại khác: cần classScheduleId
      if (!formData.classScheduleId || formData.classScheduleId === 0) {
        toast.error('Vui lòng chọn lịch học');
        return;
      }
      if (!formData.exceptionDate) {
        toast.error('Vui lòng chọn ngày ngoại lệ');
        return;
      }
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
      
        // Kiểm tra phòng đã chọn có bị occupied không
        // Vì dropdown chỉ hiển thị phòng available, nên chỉ cần kiểm tra occupied
        // occupiedRoomIds đã được convert về number ở useEffect
        if (occupiedRoomIds.length > 0 && occupiedRoomIds.includes(formData.newClassRoomId)) {
          toast.error('Phòng đã chọn đã có lớp ngoại lệ! Vui lòng chọn phòng khác.');
          return;
        }
      }
      
      // Kiểm tra phòng cho thi cuối kỳ
      if (isFinalExam && occupiedRoomIds.length > 0 && occupiedRoomIds.includes(formData.newClassRoomId!)) {
        toast.error('Phòng đã chọn đã có lớp ngoại lệ! Vui lòng chọn phòng khác.');
        return;
      }

    if (formData.exceptionType === 'substitute' && !formData.substituteTeacherId) {
      toast.error('Vui lòng chọn giảng viên thay thế');
      return;
    }

    try {
      // Chuyển đổi exceptionType thành requestTypeId
      const requestTypeId = getRequestTypeIdFromExceptionType(formData.exceptionType);
      
      // Đảm bảo exceptionDate và newDate được format đúng với timezone
      const exceptionDate = formData.exceptionDate ? formatDateForAPI(formData.exceptionDate) || formData.exceptionDate : formData.exceptionDate;
      const newDate = formData.newDate ? (formatDateForAPI(formData.newDate) || formData.newDate) : formData.newDate;
      
      const dataToSend: any = {
        ...formData,
        requestTypeId: requestTypeId,
        exceptionDate: exceptionDate,
        ...(newDate && { newDate: newDate })
      };
      
      // Với thi cuối kỳ, không gửi classScheduleId, chỉ gửi classId
      if (isFinalExam) {
        dataToSend.classScheduleId = undefined;
        dataToSend.classId = formData.classId;
      } else {
        dataToSend.classId = undefined;
      }

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
      dispatch(getScheduleExceptions({ getAll: true }));
    } catch (error: any) {
      const errorMessage = error?.message || error?.payload || 'Có lỗi xảy ra khi lưu ngoại lệ';
      toast.error(errorMessage);
    }
  };

  const handleDeleteException = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ngoại lệ này?')) {
      try {
        await dispatch(deleteScheduleException(id)).unwrap();
        toast.success('Xóa ngoại lệ thành công!');
        dispatch(getScheduleExceptions({ getAll: true }));
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
                            <strong>Giờ học:</strong> {formatTimeFromAPI(schedule.startTime)} - {formatTimeFromAPI(schedule.endTime)}
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
                              <strong>{exception.exceptionType === 'finalExam' ? 'Ngày thi:' : 'Ngày ngoại lệ:'}</strong> {
                                (() => {
                                  const expDate = parseDateFromAPI(exception.exceptionDate);
                                  return expDate ? dayjs(expDate).format('DD/MM/YYYY') : dayjs(exception.exceptionDate).format('DD/MM/YYYY');
                                })()
                              }
                            </Typography>
                            {exception.exceptionType !== 'finalExam' && (
                              <>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  <strong>Lịch gốc:</strong> {exception.slotName} ({formatTimeFromAPI(exception.startTime)}-{formatTimeFromAPI(exception.endTime)})
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  <strong>Phòng gốc:</strong> {exception.roomName} ({exception.roomCode})
                                </Typography>
                              </>
                            )}
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              <strong>Giảng viên:</strong> {exception.teacherName}
                            </Typography>

                            {/* Hiển thị thông tin chuyển đến nếu là moved, exam hoặc finalExam */}
                            {(exception.exceptionType === 'moved' || exception.exceptionType === 'exam' || exception.exceptionType === 'finalExam') && (
                              <Box sx={{ mt: 2, p: 2, backgroundColor: exception.exceptionType === 'finalExam' ? 'secondary.light' : 'warning.light', borderRadius: 1, border: '1px solid', borderColor: exception.exceptionType === 'finalExam' ? 'secondary.main' : 'warning.main' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: exception.exceptionType === 'finalExam' ? 'secondary.dark' : 'warning.dark' }}>
                                  {exception.exceptionType === 'finalExam' ? 'Thông tin thi:' : 'Thông tin chuyển đến:'}
                                </Typography>
                                {exception.newDate && exception.exceptionType !== 'finalExam' && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    <strong>Ngày mới:</strong> {
                                      (() => {
                                        const newDate = parseDateFromAPI(exception.newDate);
                                        return newDate ? dayjs(newDate).format('DD/MM/YYYY') : dayjs(exception.newDate).format('DD/MM/YYYY');
                                      })()
                                    }
                                  </Typography>
                                )}
                                {exception.newTimeSlotName && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    <strong>{exception.exceptionType === 'finalExam' ? 'Tiết thi:' : 'Tiết mới:'}</strong> {exception.newTimeSlotName} ({formatTimeFromAPI(exception.newTimeSlotStart)}-{formatTimeFromAPI(exception.newTimeSlotEnd)})
                                  </Typography>
                                )}
                                {exception.newClassRoomName && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                    <strong>{exception.exceptionType === 'finalExam' ? 'Phòng thi:' : 'Phòng mới:'}</strong> {exception.newClassRoomName} ({exception.newClassRoomCode})
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
                              {formatTimeFromAPI(selectedSchedule.startTime)} - {formatTimeFromAPI(selectedSchedule.endTime)}
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

              {/* Chọn lịch học hoặc lớp học (tùy loại ngoại lệ) */}
              {formData.exceptionType === 'finalExam' ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 100%', minWidth: '300px' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Chọn lớp học</InputLabel>
                      <Select
                        value={
                          formData.classId && classes.length > 0 
                            ? (() => {
                                const found = classes.find(c => {
                                  const classId = c.classId || c.id;
                                  return classId === formData.classId;
                                });
                                return found ? String(formData.classId) : '';
                              })()
                            : ''
                        }
                        displayEmpty
                        renderValue={(selected) => {
                          if (!selected) {
                            return <em>-- Chọn lớp học --</em>;
                          }
                          const selectedClass = classes.find(c => {
                            const classId = c.classId || c.id;
                            return String(classId) === selected;
                          });
                          if (selectedClass) {
                            return `${selectedClass.className} - ${selectedClass.code || selectedClass.subjectCode || ''}`;
                          }
                          return <em>-- Chọn lớp học --</em>;
                        }}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          const classId = selectedValue ? parseInt(String(selectedValue)) : undefined;
                          setFormData(prev => ({ 
                            ...prev, 
                            classId: classId,
                            // Reset other fields when changing class
                            newTimeSlotId: undefined,
                            newClassRoomId: undefined
                          }));
                        }}
                        label="Chọn lớp học"
                      >
                        <MenuItem value="">
                          <em>-- Chọn lớp học --</em>
                        </MenuItem>
                        {(() => {
                          if (!Array.isArray(classes) || classes.length === 0) {
                            return (
                              <MenuItem disabled value="">
                                <em>{Array.isArray(classes) && classes.length === 0 ? 'Đang tải danh sách lớp học...' : 'Không có lớp học'}</em>
                              </MenuItem>
                            );
                          }
                          
                          // Lọc lớp có schedule đã có phòng
                          const filteredClasses = classes.filter(cls => {
                            const schedules = cls.schedules || [];
                            if (schedules.length === 0) return false;
                            
                            // Kiểm tra xem có schedule nào có phòng không
                            const schedulesWithRooms = schedules.filter((s: any) => {
                              const hasRoom = (s.roomId !== null && s.roomId !== undefined) || 
                                             (s.classRoomId !== null && s.classRoomId !== undefined) ||
                                             (s.roomName && s.roomName !== null && s.roomName !== 'Chưa xác định');
                              const hasValidStatus = s.statusId === 2 || s.statusId === 3;
                              return hasRoom && hasValidStatus;
                            });
                            
                            return schedulesWithRooms.length > 0;
                          });
                          
                          if (filteredClasses.length === 0) {
                            return (
                              <MenuItem disabled value="">
                                <em>Không có lớp học nào đã có phòng</em>
                              </MenuItem>
                            );
                          }
                          
                          return filteredClasses.map(cls => {
                            // Lấy classId (có thể là id hoặc classId)
                            const classId = cls.classId || cls.id;
                            const displayName = `${cls.className || 'Chưa có tên'} - ${cls.code || cls.subjectCode || ''}`;
                            return (
                              <MenuItem key={classId} value={String(classId)}>
                                {displayName}
                              </MenuItem>
                            );
                          });
                        })()}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              ) : (
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
              )}

              {/* Loại ngoại lệ - Di chuyển lên trên */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Loại ngoại lệ</InputLabel>
                    <Select
                      value={formData.exceptionType}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        setFormData(prev => {
                          // Với thi cuối kỳ: reset classScheduleId, giữ classId nếu có
                          // Với các loại khác: giữ classScheduleId, reset classId
                          return {
                            ...prev, 
                            exceptionType: newType,
                            classScheduleId: newType === 'finalExam' ? 0 : (prev.classScheduleId || 0),
                            classId: newType === 'finalExam' ? prev.classId : undefined,
                            newTimeSlotId: undefined,
                            newClassRoomId: undefined,
                            newDate: undefined,
                            substituteTeacherId: undefined
                          };
                        });
                      }}
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

              {/* Chọn ngày ngoại lệ - DatePicker tự do */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <DatePicker
                    label={formData.exceptionType === 'finalExam' ? "Ngày thi" : "Ngày ngoại lệ"}
                    value={formData.exceptionDate ? (() => {
                      const parsedDate = parseDateFromAPI(formData.exceptionDate);
                      return parsedDate ? dayjs(parsedDate) : dayjs(formData.exceptionDate);
                    })() : null}
                    onChange={(newValue: Dayjs | null) => {
                      if (newValue) {
                        const dateValue = newValue.toDate();
                        const transDate = TransDateTime(dateValue);
                        const formattedDate = formatDateForAPI(transDate);
                        setFormData(prev => ({ 
                          ...prev, 
                          exceptionDate: formattedDate || newValue.format('YYYY-MM-DD')
                        }));
                      } else {
                        const today = TransDateTime(new Date());
                        setFormData(prev => ({ 
                          ...prev, 
                          exceptionDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD')
                        }));
                      }
                    }}
                    slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
                  />
                </Box>
                </Box>

              {/* Conditional fields based on exception type */}
              {/* Với moved: hiển thị đầy đủ ngày/tiết/phòng chuyển đến */}
              {formData.exceptionType === 'moved' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <DatePicker
                        label="Ngày chuyển đến"
                        value={formData.newDate ? (() => {
                          const parsedDate = parseDateFromAPI(formData.newDate);
                          return parsedDate ? dayjs(parsedDate) : dayjs(formData.newDate);
                        })() : null}
                        onChange={(newValue: Dayjs | null) => {
                          if (newValue) {
                            const dateValue = newValue.toDate();
                            const transDate = TransDateTime(dateValue);
                            const formattedDate = formatDateForAPI(transDate);
                            setFormData(prev => ({ 
                              ...prev, 
                              newDate: formattedDate,
                              // Reset phòng khi đổi ngày
                              newClassRoomId: undefined
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              newDate: undefined,
                              newClassRoomId: undefined
                            }));
                          }
                        }}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tiết chuyển đến</InputLabel>
                        <Select
                          value={formData.newTimeSlotId || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            newTimeSlotId: parseInt(String(e.target.value)),
                            // Reset phòng khi đổi tiết
                            newClassRoomId: undefined
                          }))}
                          label="Tiết chuyển đến"
                        >
                          {timeSlots.map(slot => (
                            <MenuItem key={slot.id} value={slot.id}>
                              {slot.slotName} ({formatTimeFromAPI(slot.startTime)}-{formatTimeFromAPI(slot.endTime)})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>
                          Phòng chuyển đến
                          {checkingRooms && ' (Đang kiểm tra...)'}
                        </InputLabel>
                        <Select
                          value={formData.newClassRoomId || ''}
                          onChange={(e) => {
                            const selectedRoomId = parseInt(String(e.target.value));
                            
                            // Kiểm tra phòng có trong danh sách available không (convert id về number để so sánh)
                            const selectedRoom = availableRoomsForException.find((r: any) => {
                              const roomIdNum = parseInt(String(r.id));
                              return roomIdNum === selectedRoomId;
                            });
                            if (!selectedRoom) {
                              toast.error('Phòng không khả dụng! Vui lòng chọn phòng khác.');
                              setFormData(prev => ({ ...prev, newClassRoomId: undefined }));
                              return;
                            }
                            
                            // Kiểm tra xem phòng có bị occupied không
                            if (occupiedRoomIds.includes(selectedRoomId)) {
                              toast.error('Phòng này đã có lớp ngoại lệ! Vui lòng chọn phòng khác.');
                              setFormData(prev => ({ ...prev, newClassRoomId: undefined }));
                              return;
                            }
                            
                            // Phòng available, cho phép chọn
                            setFormData(prev => ({ ...prev, newClassRoomId: selectedRoomId }));
                          }}
                          label="Phòng chuyển đến"
                          disabled={checkingRooms || !formData.newDate || !formData.newTimeSlotId}
                        >
                          {checkingRooms ? (
                            <MenuItem value="" disabled>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2">Đang kiểm tra phòng...</Typography>
                              </Box>
                            </MenuItem>
                          ) : availableRoomsForException.length > 0 ? (
                            // Chỉ hiển thị phòng available (filter lại để loại bỏ occupied)
                            availableRoomsForException
                              .filter((room: any) => {
                                const roomIdNum = parseInt(String(room.id));
                                return !occupiedRoomIds.includes(roomIdNum);
                              })
                              .map((room: any) => {
                                const isFreed = room.isFreedByException;
                                const roomIdNum = parseInt(String(room.id)); // Convert về number cho value
                                return (
                                  <MenuItem key={room.id} value={roomIdNum}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                      <Typography variant="body2">
                                        {room.name} ({room.code}) - {room.capacity} chỗ
                                      </Typography>
                                      {isFreed && (
                                        <Typography variant="caption" color="info.main" sx={{ fontSize: '0.65rem' }}>
                                          🎉 Trống do ngoại lệ
                                        </Typography>
                                      )}
                                    </Box>
                                  </MenuItem>
                                );
                              })
                          ) : (
                            <MenuItem value="" disabled>
                              Không có phòng trống
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      
                      {/* Cảnh báo nếu phòng đã chọn bị occupied */}
                      {formData.newClassRoomId && occupiedRoomIds.includes(formData.newClassRoomId) && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          Phòng này đã có lớp ngoại lệ! Vui lòng chọn phòng khác.
                        </Alert>
                      )}
                      
                      {/* Thông báo số phòng available */}
                      {formData.newDate && formData.newTimeSlotId && !checkingRooms && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {availableRoomsForException.length > 0 
                            ? `Có ${availableRoomsForException.length} phòng trống cho ngày/tiết này`
                            : 'Không có phòng trống cho ngày/tiết này'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Với exam: hiển thị ngày/tiết/phòng chuyển đến (thi giữa kỳ) */}
              {formData.exceptionType === 'exam' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <DatePicker
                        label="Ngày chuyển đến"
                        value={formData.newDate ? (() => {
                          const parsedDate = parseDateFromAPI(formData.newDate);
                          return parsedDate ? dayjs(parsedDate) : dayjs(formData.newDate);
                        })() : null}
                        onChange={(newValue: Dayjs | null) => {
                          if (newValue) {
                            const dateValue = newValue.toDate();
                            const transDate = TransDateTime(dateValue);
                            const formattedDate = formatDateForAPI(transDate);
                            setFormData(prev => ({ 
                              ...prev, 
                              newDate: formattedDate,
                              newClassRoomId: undefined
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              newDate: undefined,
                              newClassRoomId: undefined
                            }));
                          }
                        }}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tiết chuyển đến</InputLabel>
                        <Select
                          value={formData.newTimeSlotId || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            newTimeSlotId: parseInt(String(e.target.value)),
                            newClassRoomId: undefined
                          }))}
                          label="Tiết chuyển đến"
                        >
                          {timeSlots.map(slot => (
                            <MenuItem key={slot.id} value={slot.id}>
                              {slot.slotName} ({formatTimeFromAPI(slot.startTime)}-{formatTimeFromAPI(slot.endTime)})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>
                          Phòng chuyển đến
                          {checkingRooms && ' (Đang kiểm tra...)'}
                        </InputLabel>
                        <Select
                          value={formData.newClassRoomId || ''}
                          onChange={(e) => {
                            const selectedRoomId = parseInt(String(e.target.value));
                            const selectedRoom = availableRoomsForException.find((r: any) => {
                              const roomIdNum = parseInt(String(r.id));
                              return roomIdNum === selectedRoomId;
                            });
                            if (!selectedRoom) {
                              toast.error('Phòng không khả dụng! Vui lòng chọn phòng khác.');
                              setFormData(prev => ({ ...prev, newClassRoomId: undefined }));
                              return;
                            }
                            if (occupiedRoomIds.includes(selectedRoomId)) {
                              toast.error('Phòng này đã có lớp ngoại lệ! Vui lòng chọn phòng khác.');
                              setFormData(prev => ({ ...prev, newClassRoomId: undefined }));
                              return;
                            }
                            setFormData(prev => ({ ...prev, newClassRoomId: selectedRoomId }));
                          }}
                          label="Phòng chuyển đến"
                          disabled={checkingRooms || !formData.newDate || !formData.newTimeSlotId}
                        >
                          {checkingRooms ? (
                            <MenuItem value="" disabled>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2">Đang kiểm tra phòng...</Typography>
                              </Box>
                            </MenuItem>
                          ) : availableRoomsForException.length > 0 ? (
                            availableRoomsForException
                              .filter((room: any) => {
                                const roomIdNum = parseInt(String(room.id));
                                return !occupiedRoomIds.includes(roomIdNum);
                              })
                              .map((room: any) => {
                                const isFreed = room.isFreedByException;
                                const roomIdNum = parseInt(String(room.id));
                                return (
                                  <MenuItem key={room.id} value={roomIdNum}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                      <Typography variant="body2">
                                        {room.name} ({room.code}) - {room.capacity} chỗ
                                      </Typography>
                                      {isFreed && (
                                        <Typography variant="caption" color="info.main" sx={{ fontSize: '0.65rem' }}>
                                          🎉 Trống do ngoại lệ
                                        </Typography>
                                      )}
                                    </Box>
                                  </MenuItem>
                                );
                              })
                          ) : (
                            <MenuItem value="" disabled>
                              Không có phòng trống
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      {formData.newDate && formData.newTimeSlotId && !checkingRooms && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {availableRoomsForException.length > 0 
                            ? `Có ${availableRoomsForException.length} phòng trống cho ngày/tiết này`
                            : 'Không có phòng trống cho ngày/tiết này'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Với finalExam: chỉ hiển thị tiết và phòng thi (không có ngày chuyển đến) */}
              {formData.exceptionType === 'finalExam' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tiết thi</InputLabel>
                        <Select
                          value={formData.newTimeSlotId || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            newTimeSlotId: parseInt(String(e.target.value)),
                            newClassRoomId: undefined
                          }))}
                          label="Tiết thi"
                        >
                          {timeSlots.map(slot => (
                            <MenuItem key={slot.id} value={slot.id}>
                              {slot.slotName} ({formatTimeFromAPI(slot.startTime)}-{formatTimeFromAPI(slot.endTime)})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>
                          Phòng thi
                          {checkingRooms && ' (Đang kiểm tra...)'}
                        </InputLabel>
                        <Select
                          value={formData.newClassRoomId || ''}
                          onChange={(e) => {
                            const selectedRoomId = parseInt(String(e.target.value));
                            const selectedRoom = availableRoomsForException.find((r: any) => {
                              const roomIdNum = parseInt(String(r.id));
                              return roomIdNum === selectedRoomId;
                            });
                            if (!selectedRoom) {
                              toast.error('Phòng không khả dụng! Vui lòng chọn phòng khác.');
                              setFormData(prev => ({ ...prev, newClassRoomId: undefined }));
                              return;
                            }
                            if (occupiedRoomIds.includes(selectedRoomId)) {
                              toast.error('Phòng này đã có lớp ngoại lệ! Vui lòng chọn phòng khác.');
                              setFormData(prev => ({ ...prev, newClassRoomId: undefined }));
                              return;
                            }
                            setFormData(prev => ({ ...prev, newClassRoomId: selectedRoomId }));
                          }}
                          label="Phòng thi"
                          disabled={checkingRooms || !formData.exceptionDate || !formData.newTimeSlotId}
                        >
                          {checkingRooms ? (
                            <MenuItem value="" disabled>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2">Đang kiểm tra phòng...</Typography>
                              </Box>
                            </MenuItem>
                          ) : availableRoomsForException.length > 0 ? (
                            availableRoomsForException
                              .filter((room: any) => {
                                const roomIdNum = parseInt(String(room.id));
                                return !occupiedRoomIds.includes(roomIdNum);
                              })
                              .map((room: any) => {
                                const isFreed = room.isFreedByException;
                                const roomIdNum = parseInt(String(room.id));
                                return (
                                  <MenuItem key={room.id} value={roomIdNum}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                      <Typography variant="body2">
                                        {room.name} ({room.code}) - {room.capacity} chỗ
                                      </Typography>
                                      {isFreed && (
                                        <Typography variant="caption" color="info.main" sx={{ fontSize: '0.65rem' }}>
                                          🎉 Trống do ngoại lệ
                                        </Typography>
                                      )}
                                    </Box>
                                  </MenuItem>
                                );
                              })
                          ) : (
                            <MenuItem value="" disabled>
                              Không có phòng trống
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      {formData.exceptionDate && formData.newTimeSlotId && !checkingRooms && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {availableRoomsForException.length > 0 
                            ? `Có ${availableRoomsForException.length} phòng trống cho ngày/tiết này`
                            : 'Không có phòng trống cho ngày/tiết này'}
                        </Typography>
                      )}
                    </Box>
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
              disabled={
                loading || 
                !formData.reason.trim() ||
                (formData.exceptionType === 'finalExam' 
                  ? (!formData.classId || formData.classId === 0 || !formData.newTimeSlotId || !formData.newClassRoomId)
                  : (!formData.classScheduleId || formData.classScheduleId === 0))
              }
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