import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem, RadioGroup, FormControlLabel, Radio, IconButton, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Grid, useTheme, useMediaQuery } from '@mui/material';
import { Print as PrintIcon, ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon, Fullscreen as FullscreenIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchWeeklySchedule, fetchDepartments, fetchClasses, fetchTeachers, selectWeeklyScheduleLoading } from '../../redux/slices/scheduleSlice';
import { getSocket, initSocket } from '../../utils/socket';
import { authService } from '../../services/api';

interface WeeklyScheduleItem {
  id: number;
  classId: number;
  className: string;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  teacherCode: string;
  roomId: number;
  roomName: string;
  roomCode: string;
  roomType: string;
  dayOfWeek: number;
  dayName: string;
  timeSlot: string;
  timeRange: string;
  startTime: string;
  endTime: string;
  shift: string;
  shiftName: string;
  type: string;
  status: string;
  statusId: number;
  weekPattern: string;
  startWeek: number;
  endWeek: number;
  practiceGroup?: number;
  maxStudents: number;
  departmentId: number;
  departmentName: string;
  majorId?: number;
  majorName: string;
  timeSlotOrder: number;
  assignedAt: string;
  note?: string;
  exceptionDate?: string | null;
  exceptionType?: string | null;
  exceptionReason?: string | null;
  exceptionStatus?: string | null;
  requestTypeId?: number | null;
  isOriginalSchedule?: boolean;
  isMovedSchedule?: boolean;
  isStandaloneException?: boolean; 
  originalDayOfWeek?: number;
  originalTimeSlot?: string;
}

const getRequestTypeName = (requestTypeId: number) => {
  switch (requestTypeId) {
    case 1: return 'Chờ phân phòng';
    case 2: return 'Đã phân phòng';
    case 3: return 'Đang hoạt động';
    case 4: return 'Đã hủy';
    case 5: return 'Tạm ngưng';
    case 6: return 'Thi';
    case 7: return 'Đổi phòng';
    case 8: return 'Đổi lịch';
    case 9: return 'Đổi giáo viên';
    default: return 'Ngoại lệ';
  }
};

const ScheduleTableHeader = memo(({ selectedDate, headerRef }: { selectedDate: Dayjs, headerRef: React.RefObject<HTMLTableSectionElement> }) => {
  const currentWeek = useMemo(() => {
    const dayOfWeek = selectedDate.day(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    let startOfWeek;
    
    // Tính ngày bắt đầu tuần (Thứ 2)
    if (dayOfWeek === 0) { // Chủ nhật
      startOfWeek = selectedDate.subtract(6, 'day'); // Lùi 6 ngày để đến Thứ 2
    } else {
      startOfWeek = selectedDate.subtract(dayOfWeek - 1, 'day'); // Lùi để đến Thứ 2
    }
    
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.add(i, 'day');
      weekDays.push({
        dayOfWeek: i === 6 ? 1 : i + 2, // 2=Thứ 2, 3=Thứ 3, ..., 7=Thứ 7, 1=Chủ nhật
        date: day,
        dayName: dayNames[i],
        dayNumber: day.format('DD/MM/YYYY')
      });
    }
    return weekDays;
  }, [selectedDate]);

  return (
    <TableHead ref={headerRef}>
      <TableRow>
        <TableCell 
          sx={{ 
            backgroundColor: '#e3f2fd', 
            textAlign: 'center',
            minWidth: { xs: '80px', sm: '100px', md: '120px' },
            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
            fontWeight: 'bold',
            border: '1px solid #ddd',
            position: 'sticky',
            left: 0,
            zIndex: 2
          }}
        >
          Ca học
        </TableCell>
        {currentWeek.map((day, index) => (
          <TableCell 
            key={`${day.dayNumber}-${index}`} 
            sx={{ 
              backgroundColor: '#1976d2', 
              color: 'white',
              textAlign: 'center',
              minWidth: { xs: '70px', sm: '100px', md: '150px' },
              maxWidth: { xs: '80px', sm: 'none', md: 'none' },
              padding: { xs: '4px 2px', sm: '8px', md: '12px' },
              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
              fontWeight: 'bold',
              border: '1px solid #ddd',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}
          >
            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                  lineHeight: 1.2
                }}
              >
                {day.dayName}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.9, 
                  mt: { xs: 0.25, md: 0.5 }, 
                  display: 'block',
                  fontSize: { xs: '0.55rem', sm: '0.7rem', md: '0.75rem' },
                  lineHeight: 1.2
                }}
              >
                {day.dayNumber}
              </Typography>
            </Box>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
});

ScheduleTableHeader.displayName = 'ScheduleTableHeader';

const ScheduleTableBody = memo(({ 
  scheduleGrid, 
  getScheduleColor,
  selectedDate
}: { 
  scheduleGrid: any[], 
  getScheduleColor: (schedule: WeeklyScheduleItem) => string,
  selectedDate: Dayjs
}) => {
  // Memoize schedule color function để tránh re-render
  const memoizedGetScheduleColor = useCallback(getScheduleColor, [getScheduleColor]);
  
  return (
    <TableBody>
      {scheduleGrid.map((shift, shiftIndex) => (
        <TableRow key={shift.key}>
          <TableCell 
            sx={{ 
              backgroundColor: shift.color, 
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
              border: '1px solid #ddd',
              position: 'sticky',
              left: 0,
              zIndex: 1,
              minWidth: { xs: '80px', sm: '100px', md: '120px' }
            }}
          >
            {shift.name}
          </TableCell>
          {shift.schedules.map((daySchedules: WeeklyScheduleItem[], dayIndex: number) => (
            <TableCell 
              key={dayIndex} 
              sx={{ 
                padding: { xs: '2px', sm: '6px', md: '8px' }, 
                verticalAlign: 'top',
                minHeight: { xs: '80px', sm: '100px', md: '120px' },
                minWidth: { xs: '70px', sm: '100px', md: '150px' },
                maxWidth: { xs: '80px', sm: 'none', md: 'none' },
                border: '1px solid #ddd',
                // Prevent dragging cells on mobile
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                touchAction: 'pan-x pan-y'
              }}
            >
              {daySchedules.map((schedule: WeeklyScheduleItem) => {
                
                return (
                <Card 
                  key={schedule.id}
                  draggable={false}
                  sx={{ 
                    mb: { xs: 0.5, sm: 0.75, md: 1 }, 
                    backgroundColor: memoizedGetScheduleColor(schedule),
                    border: '1px solid #ddd',
                    position: 'relative',
                    '&:last-child': { mb: 0 },
                    // Prevent dragging and text selection on mobile
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    touchAction: 'pan-x pan-y',
                    pointerEvents: 'auto',
                    // Prevent text selection callout on iOS
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    // Prevent dragging
                    cursor: 'default',
                    '@media (max-width: 600px)': {
                      touchAction: 'pan-x pan-y',
                      WebkitUserDrag: 'none',
                      KhtmlUserDrag: 'none',
                      MozUserDrag: 'none',
                      OUserDrag: 'none',
                      userDrag: 'none'
                    }
                  }}
                  onDragStart={(e) => e.preventDefault()}
                  onDrag={(e) => e.preventDefault()}
                  onDragEnd={(e) => e.preventDefault()}
                >
                  {/* Exception label - hiển thị cho cả lịch gốc và lịch đã chuyển */}
                  {schedule.requestTypeId && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        fontSize: { xs: '0.5rem', sm: '0.55rem', md: '0.6rem' },
                        padding: { xs: '1px 3px', sm: '2px 4px' },
                        borderRadius: '0 4px 0 4px',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}
                    >
                      {getRequestTypeName(schedule.requestTypeId)}
                    </Box>
                  )}
                  
                  <CardContent sx={{ p: { xs: 0.5, sm: 0.75, md: 1 }, '&:last-child': { pb: { xs: 0.5, sm: 0.75, md: 1 } } }}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontWeight: 'bold', 
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                        wordBreak: 'break-word',
                        lineHeight: 1.2
                      }}
                    >
                      {schedule.className}
                    </Typography>
                    {/* <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                        wordBreak: 'break-word'
                      }}
                    >
                      {schedule.classCode} - {schedule.subjectCode}
                    </Typography> */}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }
                      }}
                    >
                      {/* Tiết: */}
                       {schedule.timeSlot}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                        wordBreak: 'break-word'
                      }}
                    >
                      {/* Phòng: */}
                       {schedule.roomName}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                        wordBreak: 'break-word'
                      }}
                    >
                      GV: {schedule.teacherName}
                    </Typography>
                    {schedule.practiceGroup && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }
                        }}
                      >
                        Nhóm: {schedule.practiceGroup}
                      </Typography>
                    )}
                    {schedule.exceptionReason && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                          fontStyle: 'italic',
                          color: 'text.secondary',
                          mt: 0.5,
                          wordBreak: 'break-word'
                        }}
                      >
                        Lý do: {schedule.exceptionReason}
                      </Typography>
                    )}
                    {schedule.isMovedSchedule && schedule.note && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                          fontStyle: 'italic',
                          color: 'primary.main',
                          mt: 0.5,
                          fontWeight: 'bold',
                          wordBreak: 'break-word'
                        }}
                      >
                        📍 {schedule.note}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
});

ScheduleTableBody.displayName = 'ScheduleTableBody';

const WeeklySchedule = memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { weeklySchedules, departments, classes, teachers, loading, error } = useSelector((state: RootState) => state.schedule);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const weeklyScheduleLoading = useSelector(selectWeeklyScheduleLoading);

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [scheduleType, setScheduleType] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [navigating, setNavigating] = useState(false);
  
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const socketInitialized = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function để tính weekStartDate
  const getWeekStartDate = (date: Dayjs) => {
    const dayOfWeek = date.day();
    const startOfWeek = dayOfWeek === 0 ? date.subtract(6, 'day') : date.subtract(dayOfWeek - 1, 'day');
    return startOfWeek.format('YYYY-MM-DD');
  };

  // Setup socket listeners
  useEffect(() => {
    if (!socketInitialized.current && user?.id) {
      const socket = getSocket() || initSocket(user.id);
      socketInitialized.current = true;

      const reloadSchedule = () => {
        const weekStartDate = getWeekStartDate(selectedDate);
        const filters = isAdmin ? {
          departmentId: selectedDepartment ? parseInt(selectedDepartment) : undefined,
          classId: selectedClass ? parseInt(selectedClass) : undefined,
          teacherId: selectedTeacher ? parseInt(selectedTeacher) : undefined
        } : {};
        dispatch(fetchWeeklySchedule({ weekStartDate, filters }));
      };

      const setupListeners = () => {
        if (!socket) return;
        socket.on('schedule-updated', reloadSchedule);
        socket.on('schedule-exception-updated', reloadSchedule);
      };

      if (socket.connected) {
        setupListeners();
      } else {
        socket.once('connect', setupListeners);
      }

      return () => {
        if (socket) {
          socket.off('schedule-updated', reloadSchedule);
          socket.off('schedule-exception-updated', reloadSchedule);
          socket.off('connect', setupListeners);
        }
        socketInitialized.current = false;
      };
    }
  }, [dispatch, user?.id, selectedDate, selectedDepartment, selectedClass, selectedTeacher, isAdmin]); 


  // Load initial data
  useEffect(() => {
    if (isAdmin) {
      if (departments.length === 0) dispatch(fetchDepartments());
      if (classes.length === 0) dispatch(fetchClasses());
      if (teachers.length === 0) dispatch(fetchTeachers());
    }
  }, [dispatch, isAdmin, departments.length, classes.length, teachers.length]);

  // Load schedule when filters change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const weekStartDate = getWeekStartDate(selectedDate);
      const filters = isAdmin ? {
        departmentId: selectedDepartment ? parseInt(selectedDepartment) : undefined,
        classId: selectedClass ? parseInt(selectedClass) : undefined,
        teacherId: selectedTeacher ? parseInt(selectedTeacher) : undefined
      } : {};
      dispatch(fetchWeeklySchedule({ weekStartDate, filters }));
    }, 100);
  }, [dispatch, selectedDate, selectedDepartment, selectedClass, selectedTeacher, isAdmin]);

  // Auto tắt navigating sau 3s
  useEffect(() => {
    if (navigating) {
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
      navigateTimerRef.current = setTimeout(() => {
        setNavigating(false);
      }, 500);
    }
    return () => {
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
      }
    };
  }, [navigating]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
      }
    };
  }, []);

  // Filter schedules
  const getFilteredSchedules = () => {
    if (!weeklySchedules || weeklySchedules.length === 0) return [];
    if (scheduleType === 'study') {
      return weeklySchedules.filter(s => s.type === 'theory' || s.type === 'practice');
    }
    if (scheduleType === 'exam') {
      return weeklySchedules.filter(s => s.type === 'exam');
    }
    return weeklySchedules;
  };

  // Build schedule grid
  const getScheduleGrid = () => {
    const filteredSchedules = getFilteredSchedules();
    const shifts = [
      { key: 'morning', name: 'Sáng', color: '#fff3cd' },
      { key: 'afternoon', name: 'Chiều', color: '#d1ecf1' },
      { key: 'evening', name: 'Tối', color: '#f8d7da' }
    ];

    return shifts.map(shift => {
      const shiftSchedules = Array.from({ length: 7 }, (_, i) => {
        const dayOfWeek = i === 6 ? 1 : i + 2;
        const daySchedules = filteredSchedules.filter(schedule => 
          schedule.dayOfWeek === dayOfWeek && schedule.shift === shift.key
        );
        return daySchedules.sort((a, b) => (a.timeSlotOrder || 0) - (b.timeSlotOrder || 0));
      });
      return { ...shift, schedules: shiftSchedules };
    });
  };

  const scheduleGrid = getScheduleGrid(); 

  const getRequestTypeColor = (requestTypeId: number): string => {
    switch (requestTypeId) {
      case 1: return '#e3f2fd';
      case 2: return '#f3e5f5';
      case 3: return '#e8f5e8';
      case 4: return '#f8d7da';
      case 5: return '#f8d7da';
      case 6: return '#fff3cd';
      case 7: return '#ffeaa7';
      case 8: return '#d1ecf1';
      case 9: return '#a8e6cf';
      default: return '#f8f9fa';
    }
  };

  const getScheduleColor = (schedule: WeeklyScheduleItem) => {
    if (schedule.exceptionDate && schedule.requestTypeId) {
      return getRequestTypeColor(schedule.requestTypeId);
    }
    switch (schedule.type) {
      case 'theory': return '#f8f9fa';
      case 'practice': return '#d4edda';
      case 'online': return '#cce7ff';
      default: return '#f8f9fa';
    }
  };

  const handlePreviousWeek = () => {
    if (!weeklyScheduleLoading && !navigating) {
      setNavigating(true);
      setSelectedDate(prev => prev.subtract(1, 'week'));
    }
  };

  const handleNextWeek = () => {
    if (!weeklyScheduleLoading && !navigating) {
      setNavigating(true);
      setSelectedDate(prev => prev.add(1, 'week'));
    }
  };

  const handleCurrentWeek = () => {
    if (!weeklyScheduleLoading) {
      setSelectedDate(dayjs());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter classes based on selected department
  const getFilteredClassesForDropdown = () => {
    if (!isAdmin || !selectedDepartment || !classes || classes.length === 0) return [];
    const selectedDept = departments?.find(d => d.id.toString() === selectedDepartment);
    if (!selectedDept) return [];
    return classes.filter(cls => cls.departmentId === selectedDept.id);
  };

  // Filter teachers based on selected department
  const getFilteredTeachersForDropdown = () => {
    if (!isAdmin || !selectedDepartment || !teachers || teachers.length === 0) return [];
    return teachers.filter(teacher => 
      teacher.departmentId && teacher.departmentId.toString() === selectedDepartment
    );
  };

  const filteredClassesForDropdown = getFilteredClassesForDropdown();
  const filteredTeachersForDropdown = getFilteredTeachersForDropdown();

  // Chỉ hiển thị loading toàn màn hình khi load initial data (departments, classes, teachers)
  // và chỉ khi là admin và chưa có data nào
  if (isAdmin && loading && departments.length === 0 && classes.length === 0 && teachers.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
      <Box sx={{ 
        p: { xs: 1, sm: 1.5, md: 3 }, 
        backgroundColor: '#f5f5f5', 
        minHeight: '100vh',
        overflowX: 'hidden',
        width: '100%',
        maxWidth: '100vw'
      }}>
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: { xs: 1.5, sm: 2 },
              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Filters Row - Only show for admin */}
        {isAdmin && (
          <Paper sx={{ p: { xs: 1, sm: 1.5, md: 1.5 }, mb: { xs: 1, sm: 1.5, md: 1 }, boxShadow: 2 }}>
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              <Grid size={{ xs: 6, sm: 4, md: 4 }}>
                <FormControl 
                  fullWidth 
                  size={isMobile ? "small" : "medium"}
                >
                  <InputLabel sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Theo khoa</InputLabel>
                  <Select
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      setSelectedClass('');
                      setSelectedTeacher('');
                    }}
                    label="Theo khoa"
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '4px',
                        height: { xs: '36px', sm: '40px' }
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Tất cả khoa</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept.id} value={dept.id.toString()} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 4, md: 4 }}>
                <FormControl 
                  fullWidth 
                  size={isMobile ? "small" : "medium"}
                >
                  <InputLabel sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Theo lớp</InputLabel>
                  <Select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    label="Theo lớp"
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '4px',
                        height: { xs: '36px', sm: '40px' }
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Tất cả lớp</MenuItem>
                    {filteredClassesForDropdown.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id.toString()} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {cls.className || cls.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                <FormControl 
                  fullWidth 
                  size={isMobile ? "small" : "medium"}
                >
                  <InputLabel sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Theo GV</InputLabel>
                  <Select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    label="Theo GV"
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      '& .MuiOutlinedInput-root': { 
                        borderRadius: '4px',
                        height: { xs: '36px', sm: '40px' }
                      }
                    }}
                  >
                    <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Tất cả GV</MenuItem>
                    {filteredTeachersForDropdown.map(teacher => (
                      <MenuItem key={teacher.id} value={teacher.id.toString()} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {teacher.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Title and Controls Row */}
        <Paper sx={{ p: { xs: 1, sm: 1.5, md: 1.5 }, mb: { xs: 1.5, sm: 2, md: 3 }, boxShadow: 3 }}>
          <Grid 
            container 
            spacing={{ xs: 1.5, sm: 2 }} 
            alignItems="center"
            sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
          >
            {/* Title */}
            <Grid size={{ xs: 12, md: 'auto' }} sx={{ mb: { xs: 1, md: 0 }, flexShrink: 0 }}>
              <Typography 
                variant="h6" 
                component="h1" 
                sx={{ 
                  color: 'primary.main', 
                  fontWeight: 'bold', 
                  fontSize: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
                  whiteSpace: 'nowrap'
                }}
              >
                Lịch học, lịch thi theo tuần
              </Typography>
            </Grid>
            
            {/* Radio buttons */}
            <Grid size={{ xs: 12, md: 'auto' }} sx={{ mb: { xs: 1, md: 0 }, flexShrink: 0 }}>
              <RadioGroup
                row
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value)}
                sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
              >
                <FormControlLabel 
                  value="all" 
                  control={<Radio size={isMobile ? "small" : "medium"} />} 
                  label="Tất cả" 
                  sx={{ 
                    mr: { xs: 1, md: 0.5 },
                    '& .MuiFormControlLabel-label': { 
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.75rem' },
                      ml: 0.5
                    }
                  }}
                />
                <FormControlLabel 
                  value="study" 
                  control={<Radio size={isMobile ? "small" : "medium"} />} 
                  label="Lịch học" 
                  sx={{ 
                    mr: { xs: 1, md: 0.5 },
                    '& .MuiFormControlLabel-label': { 
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.75rem' },
                      ml: 0.5
                    }
                  }}
                />
                <FormControlLabel 
                  value="exam" 
                  control={<Radio size={isMobile ? "small" : "medium"} />} 
                  label="Lịch thi" 
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.75rem' },
                      ml: 0.5
                    }
                  }}
                />
              </RadioGroup>
            </Grid>
              
            {/* Date and Navigation */}
            <Grid 
              size={{ xs: 12, md: 'auto' }} 
              sx={{ 
                mb: { xs: 1, md: 0 },
                ml: { md: 'auto' },
                flexShrink: 0
              }}
            >
              <Grid 
                container 
                spacing={{ xs: 1, sm: 1 }} 
                alignItems="center" 
                sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
              >
                <Grid size={{ xs: 12, sm: 'auto', md: 'auto' }}>
                  <DatePicker
                    label="Chọn ngày"
                    value={selectedDate}
                    onChange={(newValue) => {
                      if (newValue && !weeklyScheduleLoading) {
                        setSelectedDate(newValue);
                      }
                    }}
                    disabled={weeklyScheduleLoading || navigating}
                    slotProps={{ 
                      textField: { 
                        size: isMobile ? "small" : "medium",
                        fullWidth: isMobile,
                        sx: { 
                          minWidth: { md: '160px' },
                          '& .MuiOutlinedInput-root': { 
                            borderRadius: '4px',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            height: { xs: '36px', sm: '40px' }
                          },
                          '& .MuiInputLabel-root': {
                            fontSize: { xs: '0.7rem', sm: '0.75rem' }
                          }
                        }
                      } 
                    }}
                  />
                </Grid>
                
                <Grid size={{ xs: 6, sm: 'auto', md: 'auto' }}>
                  <Button
                    variant="outlined"
                    onClick={handleCurrentWeek}
                    size={isMobile ? "small" : "medium"}
                    disabled={weeklyScheduleLoading || navigating}
                    fullWidth={isMobile}
                    sx={{ 
                      borderRadius: '4px',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      textTransform: 'none',
                      px: { xs: 1, sm: 1.2 },
                      py: { xs: 0.5, sm: 0.6 },
                      height: { xs: '36px', sm: '40px' },
                      minWidth: { xs: 'auto', sm: '80px', md: '80px' }
                    }}
                  >
                    Hiện tại
                  </Button>
                </Grid>
                 
                <Grid size={{ xs: 6, sm: 'auto', md: 'auto' }}>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }} />}
                    onClick={handlePrint}
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                    sx={{ 
                      borderRadius: '4px',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      textTransform: 'none',
                      px: { xs: 1, sm: 1.2 },
                      py: { xs: 0.5, sm: 0.6 },
                      height: { xs: '36px', sm: '40px' },
                      minWidth: { xs: 'auto', sm: '80px', md: '80px' }
                    }}
                  >
                    {isMobile ? 'In' : 'In lịch'}
                  </Button>
                </Grid>
                 
                <Grid size={{ xs: 6, sm: 'auto', md: 'auto' }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreviousWeek}
                    size={isMobile ? "small" : "medium"}
                    startIcon={<ArrowBackIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }} />}
                    disabled={weeklyScheduleLoading || navigating}
                    fullWidth={isMobile}
                    sx={{ 
                      borderRadius: '4px',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      textTransform: 'none',
                      px: { xs: 1, sm: 1.2 },
                      py: { xs: 0.5, sm: 0.6 },
                      height: { xs: '36px', sm: '40px' },
                      minWidth: { xs: 'auto', sm: '80px', md: '80px' }
                    }}
                  >
                    {isMobile ? 'Trước' : 'Trở về'}
                  </Button>
                </Grid>
                 
                <Grid size={{ xs: 6, sm: 'auto', md: 'auto' }}>
                  <Button
                    variant="outlined"
                    onClick={handleNextWeek}
                    size={isMobile ? "small" : "medium"}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }} />}
                    disabled={weeklyScheduleLoading || navigating}
                    fullWidth={isMobile}
                    sx={{ 
                      borderRadius: '4px',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      textTransform: 'none',
                      px: { xs: 1, sm: 1.2 },
                      py: { xs: 0.5, sm: 0.6 },
                      height: { xs: '36px', sm: '40px' },
                      minWidth: { xs: 'auto', sm: '80px', md: '80px' }
                    }}
                  >
                    Tiếp
                  </Button>
                </Grid>
                 
                {!isMobile && (
                  <Grid size={{ xs: 'auto', sm: 'auto', md: 'auto' }}>
                    <IconButton 
                      color="primary"
                      size="medium"
                      sx={{ 
                        borderRadius: '4px',
                        border: '1px solid #1976d2',
                        height: '40px',
                        width: '40px',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.04)'
                        }
                      }}
                    >
                      <FullscreenIcon sx={{ fontSize: '0.75rem' }} />
                    </IconButton>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Schedule Grid */}
        <Paper sx={{ 
          boxShadow: 3, 
          position: 'relative', 
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%'
        }}>
          {/* Loading overlay cho weekly schedule */}
          {(weeklyScheduleLoading || navigating) && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
                borderRadius: '4px',
                backdropFilter: 'blur(2px)'
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={isMobile ? 30 : 40} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 1, 
                    color: 'text.secondary',
                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                  }}
                >
                  Đang tải lịch học...
                </Typography>
              </Box>
            </Box>
          )}
          <TableContainer 
            sx={{ 
              width: '100%',
              maxWidth: '100%',
              overflowX: { xs: 'auto', sm: 'auto', md: 'auto' },
              overflowY: { xs: 'auto', sm: 'auto', md: 'auto' },
              maxHeight: { xs: 'calc(100vh - 400px)', sm: 'calc(100vh - 450px)', md: 'calc(100vh - 300px)' },
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              '-webkit-overflow-scrolling': 'touch',
              // Force scroll on mobile
              '@media (max-width: 600px)': {
                overflowX: 'scroll !important',
                overflowY: 'auto !important',
                WebkitOverflowScrolling: 'touch',
                '-webkit-overflow-scrolling': 'touch',
                touchAction: 'pan-x pan-y',
                width: '100%',
                display: 'block',
                // Force scrollbar to be visible
                scrollbarWidth: 'thin',
                scrollbarColor: '#888 #f1f1f1'
              },
              // Desktop specific styles
              '@media (min-width: 960px)': {
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 300px)',
                width: '100%',
                display: 'block'
              },
              '&::-webkit-scrollbar': {
                width: { xs: '6px', md: '12px' },
                height: { xs: '6px', md: '12px' },
                display: { xs: 'block !important', md: 'block' },
                visibility: { xs: 'visible !important', md: 'visible' },
                opacity: { xs: '1 !important', md: '1' }
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                display: { xs: 'block !important', md: 'block' }
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888',
                borderRadius: '4px',
                display: { xs: 'block !important', md: 'block' },
                '&:hover': {
                  backgroundColor: '#555'
                }
              }
            }}
          >
            <Table 
              sx={{ 
                minWidth: { xs: '580px', sm: '700px', md: '800px' },
                width: { xs: '580px', sm: '700px', md: '100%' },
                tableLayout: { xs: 'auto', md: 'auto' }
              }}
            >
              <ScheduleTableHeader selectedDate={selectedDate} headerRef={headerRef} />
              <ScheduleTableBody 
                scheduleGrid={scheduleGrid} 
                getScheduleColor={getScheduleColor}
                selectedDate={selectedDate}
              />
            </Table>
          </TableContainer>
        </Paper>

        {/* Legend */}
        <Paper sx={{ p: { xs: 1.5, sm: 2, md: 2 }, mt: { xs: 2, sm: 2.5, md: 3 }, boxShadow: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: { xs: 1.5, sm: 2 },
              fontWeight: 'bold',
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
            }}
          >
            Chú thích:
          </Typography>
          
          {/* Loại lịch học */}
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: { xs: 1, sm: 1.5 },
              fontWeight: 'bold', 
              color: 'primary.main',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }
            }}
          >
            Loại lịch học:
          </Typography>
          <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Grid size={{ xs: 6, sm: 4, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Lịch học lý thuyết
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#d4edda', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Lịch học thực hành
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#cce7ff', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Lịch học trực tuyến
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Trạng thái ngoại lệ */}
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: { xs: 1, sm: 1.5 },
              fontWeight: 'bold', 
              color: 'error.main',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }
            }}
          >
            Trạng thái ngoại lệ:
          </Typography>
          <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#e3f2fd', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Chờ phân phòng
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#f3e5f5', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Đã phân phòng
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#e8f5e8', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Đang hoạt động
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#f8d7da', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Đã hủy / Tạm ngưng
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#fff3cd', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Thi
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#ffeaa7', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Đổi phòng
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#d1ecf1', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Đổi lịch
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: { xs: 16, sm: 18, md: 20 }, 
                  height: { xs: 16, sm: 18, md: 20 }, 
                  backgroundColor: '#a8e6cf', 
                  border: '1px solid #ddd',
                  flexShrink: 0
                }} />
                <Typography 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Đổi giáo viên
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
});

WeeklySchedule.displayName = 'WeeklySchedule';

export default WeeklySchedule;
