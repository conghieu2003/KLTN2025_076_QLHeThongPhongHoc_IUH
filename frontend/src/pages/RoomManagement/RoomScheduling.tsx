import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
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
  Schedule as ScheduleIcon,
  Room as RoomIcon,
  Person as PersonIcon,
  Class as ClassIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  AutoAwesome as AutoAssignIcon,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../redux/store';
import {
  loadAllData,
  loadAvailableRooms,
  loadRoomsByDepartmentAndType,
  assignRoomToSchedule,
  setSelectedDepartment,
  setSelectedClass,
  setSelectedTeacher,
  setSelectedStatus,
  setError,
  setSuccessMessage,
  openAssignDialog,
  closeAssignDialog,
  setSelectedRoom,
  updateScheduleFromSocket,
  updateStatsFromSocket
} from '../../redux/slices/roomSchedulingSlice';
import { scheduleManagementService } from '../../services/api';
import { 
  initSocket, 
  joinRoomScheduling, 
  leaveRoomScheduling
} from '../../utils/socket';

// Import types from slice
import type { 
  ScheduleData
} from '../../redux/slices/roomSchedulingSlice';

const RoomScheduling: React.FC = () => {
  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const dataGridRef = useGridApiRef();
  const {
    // Data
    classes,
    departments,
    teachers,
    stats,
    requestTypes,
    availableRooms,
    
    // Filters
    selectedDepartment,
    selectedClass,
    selectedTeacher,
    selectedStatus,
    
    // UI State
    loading,
    refreshing,
    loadingRooms,
    error,
    successMessage,
    
    // Dialog state
    assignDialogOpen,
    selectedSchedule,
    selectedRoom,
    isAssigning
  } = useSelector((state: RootState) => state.roomScheduling);
  

  // Load all data using Redux
  const handleLoadAllData = useCallback(() => {
    dispatch(loadAllData());
  }, [dispatch]);



  // Assign room to schedule using Redux
  const handleAssignRoom = () => {
    if (!selectedSchedule || !selectedRoom) return;
    
    dispatch(assignRoomToSchedule({
      scheduleId: selectedSchedule.scheduleId.toString(),
      roomId: selectedRoom
    }));
  };

  // Auto assign rooms for a class
  const handleAutoAssign = async (classId: number) => {
    try {
      // Tạm thời sử dụng logic đơn giản cho auto assign
      const classData = classes.find(c => c.classId === classId);
      if (classData && classData.schedules) {
        let successCount = 0;
        // Chỉ lấy lịch học chưa có phòng (statusId = 1)
        const pendingSchedules = classData.schedules.filter(schedule => schedule.statusId === 1);
        for (const schedule of pendingSchedules) {
          const roomsResponse = await scheduleManagementService.getAvailableRoomsForSchedule(schedule.scheduleId.toString());
          if (roomsResponse.data && roomsResponse.data.length > 0) {
            await scheduleManagementService.assignRoomToSchedule(schedule.scheduleId.toString(), roomsResponse.data[0].id.toString());
            successCount++;
          }
        }
        
        if (successCount > 0) {
          dispatch(setSuccessMessage(`Tự động gán phòng thành công: ${successCount} lịch học`));
        }
      }
    } catch (err: any) {
      console.error('Error auto assigning:', err);
      dispatch(setError(err.response?.data?.message || 'Lỗi tự động gán phòng'));
    }
  };

  // Open assign dialog
  const handleOpenAssignDialog = (schedule: ScheduleData) => {
    dispatch(openAssignDialog(schedule));
    
    // Clear previous room selection
    dispatch(setSelectedRoom(''));
    
    // Tìm thông tin lớp học để lấy departmentId
    const classInfo = classes.find(c => c.classId === schedule.classId);
    if (classInfo) {
      const department = departments.find(d => d.name === classInfo.departmentName);
      if (department) {
        dispatch(loadRoomsByDepartmentAndType({
          departmentId: department.id.toString(),
          classRoomTypeId: schedule.classRoomTypeId.toString()
        }));
      } else {
        // Fallback to available rooms for schedule
        dispatch(loadAvailableRooms(schedule.scheduleId.toString()));
      }
    } else {
      // Fallback to available rooms for schedule
      dispatch(loadAvailableRooms(schedule.scheduleId.toString()));
    }
  };

  // Filter classes based on selected filters
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      // Tìm departmentId từ departments array
      const department = departments.find(d => d.name === cls.departmentName);
      const departmentMatch = !selectedDepartment || (department && department.id.toString() === selectedDepartment);
      
      // Tìm teacherId từ teachers array
      const teacher = teachers.find(t => t.fullName === cls.teacherName);
      const teacherMatch = !selectedTeacher || (teacher && teacher.id.toString() === selectedTeacher);
      
      // Nếu có filter khoa, kiểm tra giáo viên có thuộc khoa đó không
      let teacherDepartmentMatch = true;
      if (selectedDepartment && teacher) {
        teacherDepartmentMatch = !!(teacher.departmentId && teacher.departmentId.toString() === selectedDepartment);
      }
      
      const classMatch = !selectedClass || cls.classId.toString() === selectedClass;
      const statusMatch = !selectedStatus || cls.statusId.toString() === selectedStatus;
      
      return departmentMatch && classMatch && teacherMatch && teacherDepartmentMatch && statusMatch;
    });
  }, [classes, departments, teachers, selectedDepartment, selectedClass, selectedTeacher, selectedStatus]);

  // Filter options for dropdowns based on selected department
  const filteredClassesForDropdown = useMemo(() => {
    if (!selectedDepartment) return classes;
    
    const selectedDept = departments.find(d => d.id.toString() === selectedDepartment);
    if (!selectedDept) return classes;
    
    return classes.filter(cls => cls.departmentName === selectedDept.name);
  }, [classes, departments, selectedDepartment]);

  const filteredTeachersForDropdown = useMemo(() => {
    if (!selectedDepartment) return teachers;
    
    return teachers.filter(teacher => 
      teacher.departmentId && teacher.departmentId.toString() === selectedDepartment
    );
  }, [teachers, selectedDepartment]);

  // Flatten schedules for grid display
  const scheduleRows = useMemo(() => {
    const rows: any[] = [];
    
      filteredClasses.forEach(cls => {
        // Hiển thị tất cả lịch học (cả chờ phân phòng và đã phân phòng)
        cls.schedules.forEach((schedule: ScheduleData) => {
        rows.push({
          id: `${cls.id}-${schedule.id}`,
          classId: cls.classId,
          className: cls.className,
          subjectCode: cls.subjectCode,
          teacherName: cls.teacherName,
          departmentName: cls.departmentName,
          scheduleId: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          dayName: schedule.dayName,
          timeSlot: schedule.timeSlot,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          weekPattern: schedule.weekPattern,
          startWeek: schedule.startWeek,
          endWeek: schedule.endWeek,
          note: schedule.note,
          status: schedule.statusId, // Sử dụng statusId từ schedule
          maxStudents: cls.maxStudents,
          classRoomTypeId: schedule.classRoomTypeId,
          classRoomTypeName: schedule.classRoomTypeName,
          practiceGroup: schedule.practiceGroup,
          roomId: schedule.roomId,
          roomName: schedule.roomName,
          roomCode: schedule.roomCode
        });
      });
    });
    
    return rows;
  }, [filteredClasses]);

  // Grid columns
  const columns: GridColDef[] = [
    {
      field: 'className',
      headerName: 'Tên lớp học',
      ...(isMobile || isTablet ? { 
        flex: 1.5, 
        minWidth: 180
      } : { 
        flex: 1,
        minWidth: 180
      }),
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Box>
          <Typography 
            variant="body2" 
            fontWeight="bold" 
            sx={{ 
              wordBreak: 'break-word',
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' }
            }}
          >
            {params.value}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' } }}
          >
            {params.row.subjectCode}
          </Typography>
        </Box>
      )
    },
    {
      field: 'teacherName',
      headerName: 'Giảng viên',
      ...(isMobile || isTablet ? { 
        flex: 1.2, 
        minWidth: 120
      } : { 
        flex: 0.8,
        minWidth: 120
      }),
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Box display="flex" alignItems="flex-start" gap={1} sx={{ width: '100%' }}>
          <PersonIcon 
            fontSize="small" 
            color="primary" 
            sx={{ 
              mt: 0.5, 
              flexShrink: 0,
              fontSize: { xs: 12, sm: 14, md: 16 }
            }} 
          />
          <Typography 
            variant="body2" 
            sx={{ 
              wordBreak: 'break-word', 
              whiteSpace: 'normal',
              lineHeight: 1.4,
              width: '100%',
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' }
            }}
          >
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'departmentName',
      headerName: 'Khoa',
      ...(isMobile || isTablet ? { 
        flex: 1.2, 
        minWidth: 150
      } : { 
        flex: 0.8,
        minWidth: 150
      }),
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
            width: '100%',
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' }
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'dayName',
      headerName: 'Thứ',
      ...(isMobile || isTablet ? { 
        flex: 0.6, 
        minWidth: 100
      } : { 
        flex: 0.5,
        minWidth: 100
      }),
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color="primary" 
          variant="outlined"
          sx={{
            whiteSpace: 'normal',
            height: 'auto',
            fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
            '& .MuiChip-label': {
              whiteSpace: 'normal',
              lineHeight: 1.2,
              padding: { xs: '2px 6px', sm: '3px 7px', md: '4px 8px' }
            }
          }}
        />
      )
    },
    {
      field: 'timeSlot',
      headerName: 'Tiết học',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 120
      } : { 
        flex: 0.8,
        minWidth: 120
      }),
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Box>
          <Typography 
            variant="body2"
            sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' } }}
          >
            {params.value}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' } }}
          >
            {params.row.startTime} - {params.row.endTime}
          </Typography>
        </Box>
      )
    },
    {
      field: 'classRoomTypeName',
      headerName: 'Phòng/lớp',
      ...(isMobile || isTablet ? { 
        flex: 0.8, 
        minWidth: 120
      } : { 
        flex: 0.6,
        minWidth: 120
      }),
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.row.classRoomTypeId === 1 ? 'primary' : params.row.classRoomTypeId === 2 ? 'secondary' : 'default'} 
          variant="outlined"
          sx={{
            whiteSpace: 'normal',
            height: 'auto',
            fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
            '& .MuiChip-label': {
              whiteSpace: 'normal',
              lineHeight: 1.2,
              padding: { xs: '2px 6px', sm: '3px 7px', md: '4px 8px' }
            }
          }}
        />
      )
    },
    {
      field: 'practiceGroup',
      headerName: 'Nhóm TH',
      ...(isMobile || isTablet ? { 
        flex: 0.6, 
        minWidth: 100
      } : { 
        flex: 0.5,
        minWidth: 100
      }),
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => {
        if (params.row.classRoomTypeId === 2 && params.value) {
          return (
            <Chip 
              label={`Nhóm ${params.value}`} 
              size="small" 
              color="secondary" 
              variant="filled"
              sx={{
                whiteSpace: 'normal',
                height: 'auto',
                fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                  padding: { xs: '2px 6px', sm: '3px 7px', md: '4px 8px' }
                }
              }}
            />
          );
        }
        return (
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' } }}
          >
            -
          </Typography>
        );
      }
    },
    {
      field: 'maxStudents',
      headerName: 'Số SV',
      ...(isMobile || isTablet ? { 
        flex: 0.5, 
        minWidth: 70
      } : { 
        flex: 0.4,
        minWidth: 70
      }),
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => {
        // Ẩn Số SV cho nhóm thực hành (classRoomTypeId === 2)
        if (params.row.classRoomTypeId === 2) {
          return (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' } }}
            >
              -
            </Typography>
          );
        }
        return (
          <Typography 
            variant="body2"
            sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' } }}
          >
            {params.value}
          </Typography>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Trạng thái',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 120
      } : { 
        flex: 0.8,
        minWidth: 120
      }),
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => {
        // Sử dụng trực tiếp statusId từ database
        const statusType = requestTypes.find(type => type.id === params.value);
        
        if (statusType) {
          let color: 'warning' | 'success' | 'default' = 'default';
          if (statusType.id === 1) color = 'warning'; // Chờ phân phòng
          else if (statusType.id === 2) color = 'success'; // Đã phân phòng
          
          return (
            <Chip 
              label={statusType.name} 
              size="small" 
              color={color}
              variant="filled"
              sx={{ 
                whiteSpace: 'normal',
                height: 'auto',
                fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                  padding: { xs: '2px 6px', sm: '3px 7px', md: '4px 8px' }
                }
              }}
            />
          );
        }
        
        return (
          <Chip 
            label="Không xác định" 
            size="small" 
            color="default"
            variant="filled"
            sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' } }}
          />
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      ...(isMobile || isTablet ? { 
        flex: 0.8, 
        minWidth: 90
      } : { 
        width: 120
      }),
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box display="flex" gap={0.5} justifyContent="center">
          <Tooltip title="Gán phòng">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenAssignDialog(params.row)}
              sx={{ padding: { xs: 0.25, sm: 0.5 } }}
            >
              <AssignmentIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Tự động gán phòng">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => handleAutoAssign(params.row.classId)}
              sx={{ padding: { xs: 0.25, sm: 0.5 } }}
            >
              <AutoAssignIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Get user from auth state for socket
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Socket connection ref
  const socketInitialized = useRef(false);

  // Initialize socket and join room on mount
  useEffect(() => {
    if (!socketInitialized.current && user?.id) {
      // Initialize socket
      const socket = initSocket(user.id);
      socketInitialized.current = true;

      // Wait for connection before joining room
      const handleConnect = () => {
        joinRoomScheduling();
      };

      // Join room immediately if already connected, otherwise wait for connection
      if (socket.connected) {
        joinRoomScheduling();
      } else {
        socket.once('connect', handleConnect);
      }

      // Listen for room assigned event
      const handleRoomAssigned = (data: any) => {
        dispatch(updateScheduleFromSocket(data));
        dispatch(setSuccessMessage(`Phòng ${data.roomName} đã được gán cho ${data.className} (real-time)`));
        
        // Auto close dialog if it's open and matches the assigned schedule
        if (selectedSchedule?.scheduleId === data.scheduleId) {
          dispatch(closeAssignDialog());
        }
      };

      // Listen for room unassigned event
      const handleRoomUnassigned = (data: any) => {
        dispatch(updateScheduleFromSocket(data));
        dispatch(setSuccessMessage(`Phòng đã được hủy gán cho ${data.className} (real-time)`));
      };

      // Listen for stats updated event
      const handleStatsUpdated = (stats: any) => {
        dispatch(updateStatsFromSocket(stats));
      };

      // Register event listeners
      socket.on('room-assigned', handleRoomAssigned);
      socket.on('room-unassigned', handleRoomUnassigned);
      socket.on('stats-updated', handleStatsUpdated);

      // Cleanup on unmount
      return () => {
        // Remove event listeners
        socket.off('room-assigned', handleRoomAssigned);
        socket.off('room-unassigned', handleRoomUnassigned);
        socket.off('stats-updated', handleStatsUpdated);
        socket.off('connect', handleConnect);
        
        leaveRoomScheduling();
        // Don't logout here as user might still be using socket in other components
        socketInitialized.current = false;
      };
    }
  }, [dispatch, user?.id, selectedSchedule]);

  // Load data on component mount
  useEffect(() => {
    handleLoadAllData();
  }, [handleLoadAllData]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
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
      {/* Header */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 1.5, sm: 2, md: 2.5 }, flexShrink: 0 }}>
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
            Sắp xếp phòng học
          </Typography>
        </Grid>
        <Grid size={{ xs: 'auto', sm: 'auto', md: 'auto' }} sx={{ flexShrink: 0 }}>
          <Tooltip title="Làm mới dữ liệu">
            <IconButton
              onClick={handleLoadAllData}
              disabled={loading}
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

      {/* Error/Success Messages */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
          }} 
          onClose={() => dispatch(setError(null))}
        >
          {error}
        </Alert>
      )}

      {isAssigning && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
          }}
        >
          Đang cập nhật trạng thái gán phòng...
        </Alert>
      )}

      {refreshing && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
          }}
        >
          Đang cập nhật dữ liệu...
        </Alert>
      )}

      {loadingRooms && assignDialogOpen && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
          }}
        >
          Đang tải danh sách phòng...
        </Alert>
      )}

        {/* Statistics Cards */}
        {stats && (
          <Grid 
            container 
            spacing={{ xs: 0.75, sm: 1, md: 1.5 }} 
            sx={{ 
              mb: { xs: 1.5, sm: 2, md: 2.5 },
              flexShrink: 0,
              justifyContent: 'center'
            }}
          >
            <Grid size={{ xs: 3, sm: 4, md: 2 }}>
              <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
                <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                  <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                    <Grid size={{ xs: 12 }}>
                      <ClassIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'primary.main' }} />
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
                        Tổng số lớp
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
                        {stats.totalClasses}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 3, sm: 4, md: 2 }}>
              <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
                <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                  <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                    <Grid size={{ xs: 12 }}>
                      <ScheduleIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'warning.main' }} />
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
                        Chờ phân phòng
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
                        {stats.pendingClasses}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 3, sm: 4, md: 2 }}>
              <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
                <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                  <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                    <Grid size={{ xs: 12 }}>
                      <RoomIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'success.main' }} />
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
                        Đã phân phòng
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
                        {stats.assignedClasses}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 3, sm: 4, md: 2 }}>
              <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
                <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
                  <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                    <Grid size={{ xs: 12 }}>
                      <CalendarIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'info.main' }} />
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
                        Tỷ lệ phân phòng
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
                        {stats.assignmentRate}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

      {/* Filters */}
        <Paper sx={{ p: { xs: 1, sm: 1.5, md: 2 }, mb: { xs: 1.5, sm: 2, md: 2.5 }, flexShrink: 0 }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
              mb: { xs: 1, sm: 1.5 }
            }}
          >
            Bộ lọc
          </Typography>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <FormControl 
                fullWidth 
                size={isMobile ? "small" : "medium"}
              >
                <InputLabel 
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  Khoa
                </InputLabel>
                <Select
                  value={selectedDepartment}
                  label="Khoa"
                  onChange={(e) => {
                    dispatch(setSelectedDepartment(e.target.value));
                    // Reset các filter khác khi thay đổi khoa
                    dispatch(setSelectedClass(''));
                    dispatch(setSelectedTeacher(''));
                  }}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Tất cả</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id.toString()} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <FormControl 
                fullWidth 
                size={isMobile ? "small" : "medium"}
              >
                <InputLabel 
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  Lớp học
                </InputLabel>
                <Select
                  value={selectedClass}
                  label="Lớp học"
                  onChange={(e) => dispatch(setSelectedClass(e.target.value))}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Tất cả</MenuItem>
                  {filteredClassesForDropdown.map((cls) => (
                    <MenuItem key={cls.classId} value={cls.classId.toString()} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {cls.className} ({cls.subjectCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <FormControl 
                fullWidth 
                size={isMobile ? "small" : "medium"}
              >
                <InputLabel 
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  Giảng viên
                </InputLabel>
                <Select
                  value={selectedTeacher}
                  label="Giảng viên"
                  onChange={(e) => dispatch(setSelectedTeacher(e.target.value))}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Tất cả</MenuItem>
                  {filteredTeachersForDropdown.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id.toString()} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {teacher.fullName} ({teacher.teacherCode})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <FormControl 
                fullWidth 
                size={isMobile ? "small" : "medium"}
              >
                <InputLabel 
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  Trạng thái
                </InputLabel>
                <Select
                  value={selectedStatus}
                  label="Trạng thái"
                  onChange={(e) => dispatch(setSelectedStatus(e.target.value))}
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  <MenuItem value="" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Tất cả</MenuItem>
                  {requestTypes.map(type => (
                    <MenuItem key={type.id} value={type.id.toString()} sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Data Grid */}
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
            rows={scheduleRows}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } }
            }}
            disableRowSelectionOnClick
            disableColumnFilter={isMobile}
            disableColumnMenu={isMobile}
            disableColumnResize={isMobile || isTablet}
            columnHeaderHeight={isMobile ? 48 : isTablet ? 52 : 56}
            getRowHeight={() => 'auto'}
            isMobile={isMobile}
            isTablet={isTablet}
            slots={{
              toolbar: isMobile ? undefined : GridToolbar,
            }}
          />
        </Paper>

      {/* Assign Room Dialog */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={() => dispatch(closeAssignDialog())} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
            pb: { xs: 1, sm: 1.5 }
          }}
        >
          Gán phòng cho lịch học
          {selectedSchedule && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
            >
              {selectedSchedule.dayName} - {selectedSchedule.timeSlot}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <FormControl 
            fullWidth 
            size={isMobile ? "small" : "medium"}
            sx={{ mt: { xs: 1, sm: 1.5, md: 2 } }}
          >
            <InputLabel
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              Chọn phòng
            </InputLabel>
            {loadingRooms ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  py: { xs: 2, sm: 2.5, md: 3 },
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  backgroundColor: '#f5f5f5'
                }}
              >
                <CircularProgress size={isMobile ? 20 : 24} sx={{ mr: 2 }} />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                >
                  Đang tải danh sách phòng...
                </Typography>
              </Box>
            ) : (
              <Select
                value={selectedRoom}
                label="Chọn phòng"
                onChange={(e) => dispatch(setSelectedRoom(e.target.value))}
                disabled={loadingRooms}
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              >
                {availableRooms.length === 0 ? (
                  <MenuItem 
                    disabled
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontStyle: 'italic',
                        fontSize: { xs: '0.7rem', sm: '0.75rem' }
                      }}
                    >
                      Không có phòng phù hợp
                    </Typography>
                  </MenuItem>
                ) : (
                  availableRooms.map((room) => {
                    const hasConflict = !room.isAvailable;
                    return (
                      <MenuItem 
                        key={room.id} 
                        value={room.id}
                        disabled={hasConflict}
                        sx={{ 
                          opacity: hasConflict ? 0.5 : 1,
                          backgroundColor: hasConflict ? '#ffebee' : 'transparent',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}
                      >
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Typography 
                              variant="body1" 
                              fontWeight="bold"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                            >
                              {room.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              <Chip 
                                label={room.type} 
                                size="small" 
                                color={room.type === 'Lý thuyết' ? 'primary' : 'secondary'} 
                                variant="outlined"
                                sx={{ 
                                  fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                                  height: { xs: 18, sm: 20, md: 24 }
                                }}
                              />
                              {hasConflict && (
                                <Chip 
                                  label="Đã sử dụng" 
                                  size="small" 
                                  color="error" 
                                  variant="filled"
                                  sx={{ 
                                    fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                                    height: { xs: 18, sm: 20, md: 24 }
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                              wordBreak: 'break-word',
                              whiteSpace: 'normal',
                              mt: 0.5
                            }}
                          >
                            {room.code} - {room.capacity} chỗ - {room.building} tầng {room.floor}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                              wordBreak: 'break-word',
                              whiteSpace: 'normal'
                            }}
                          >
                            {room.department} {room.isSameDepartment && '✓'}
                          </Typography>
                          {hasConflict && room.conflictInfo && (
                            <Typography 
                              variant="caption" 
                              color="error"
                              sx={{ 
                                fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' },
                                wordBreak: 'break-word',
                                whiteSpace: 'normal',
                                display: 'block',
                                mt: 0.5
                              }}
                            >
                              ⚠️ Đã được sử dụng bởi {room.conflictInfo.className} ({room.conflictInfo.teacherName}) 
                              trong khung giờ {room.conflictInfo.time}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1, sm: 1.5, md: 2 }, gap: { xs: 1, sm: 1.5 } }}>
          <Button 
            onClick={() => dispatch(closeAssignDialog())}
            size={isMobile ? "medium" : "large"}
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleAssignRoom} 
            variant="contained"
            disabled={!selectedRoom || isAssigning || loadingRooms}
            startIcon={isAssigning ? <CircularProgress size={isMobile ? 16 : 20} /> : <AssignmentIcon />}
            size={isMobile ? "medium" : "large"}
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
          >
            {isAssigning ? 'Đang gán phòng...' : loadingRooms ? 'Đang tải phòng...' : 'Gán phòng'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => dispatch(setSuccessMessage(null))}
        message={successMessage}
      />
    </Box>
  );
};

export default RoomScheduling;