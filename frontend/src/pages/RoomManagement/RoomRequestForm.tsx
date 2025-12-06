import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { scheduleExceptionService, roomService, scheduleManagementService } from '../../services/api';
import { Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab, Alert, CircularProgress, Tooltip, Grid, useTheme, useMediaQuery } from '@mui/material';
import { toast } from 'react-toastify';
import { Add as AddIcon, Delete as DeleteIcon, Schedule as ScheduleIcon, Person as PersonIcon, Cancel as CloseIcon, Warning as WarningIcon, SwapHoriz as SwapIcon, Info as InfoIcon, Send as SendIcon, Room as RoomIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/vi';
import { formatDateForAPI, parseDateFromAPI, TransDateTime, formatTimeFromAPI } from '../../utils/transDateTime';
import { getSocket, initSocket } from '../../utils/socket';

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
  name?: string;
  fullName?: string;
  code?: string;
  teacherCode?: string;
  departmentId: number;
}

interface RequestType {
  id: number;
  name: string;
}

interface ScheduleRequest {
  id: number;
  requestTypeId: number;
  classScheduleId?: number;
  classId?: number;
  requesterId: number;
  requestDate: string;
  timeSlotId: number;
  exceptionDate?: string;
  exceptionType?: string;
  newDate?: string;
  newTimeSlotId?: number;
  newClassRoomId?: number;
  substituteTeacherId?: number;
  reason: string;
  note?: string;
  requestStatusId: number;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  RequestType?: { id: number; name: string };
  RequestStatus?: { id: number; name: string };
  classSchedule?: any;
  newTimeSlot?: TimeSlot;
  newClassRoom?: Room;
  substituteTeacher?: Teacher;
}

interface AvailableSchedule {
  id: number;
  classId: number;
  className: string;
  classCode: string;
  subjectName: string;
  subjectCode: string;
  teacherId: number;
  teacherName: string;
  teacherCode: string;
  departmentId: number;
  departmentName: string;
  roomId?: number;
  roomName?: string;
  roomCode?: string;
  dayOfWeek: number;
  dayName: string;
  timeSlotId: number;
  slotName: string;
  startTime: string;
  endTime: string;
  shift: number;
  classType: string;
  practiceGroup?: number;
}

interface CreateScheduleRequestData {
  requestTypeId: number;
  classScheduleId?: number;
  classId?: number;
  requesterId: number;
  requestDate: string;
  timeSlotId: number;
  exceptionDate?: string;
  exceptionType?: string;
  newDate?: string;
  newTimeSlotId?: number;
  newClassRoomId?: number;
  substituteTeacherId?: number;
  reason: string;
  note?: string;
}

const getExceptionTypeFromRequestType = (requestTypeId: number): string => {
  switch (requestTypeId) {
    case 5: return 'paused'; // Tạm ngưng
    case 6: return 'exam'; // Thi giữa kỳ
    case 7: return 'roomChange'; // Đổi phòng
    case 8: return 'moved'; // Đổi lịch
    case 9: return 'substitute'; // Đổi giáo viên
    case 10: return 'finalExam'; // Thi cuối kỳ
    default: return 'cancelled';
  }
};

const getRequestTypeIdFromExceptionType = (exceptionType: string): number => {
  switch (exceptionType) {
    case 'cancelled': return 5; // Tạm ngưng
    case 'paused': return 5; // Tạm ngưng
    case 'exam': return 6; // Thi giữa kỳ
    case 'roomChange': return 7; // Đổi phòng
    case 'moved': return 8; // Đổi lịch
    case 'substitute': return 9; // Đổi giáo viên
    case 'finalExam': return 10; // Thi cuối kỳ
    default: return 5;
  }
};

const createExceptionTypes = (requestTypes: RequestType[]) => {
  const exceptionTypeMap = {
    'cancelled': { label: 'Hủy lớp', color: 'error', icon: <CloseIcon /> },
    'paused': { label: 'Tạm ngưng', color: 'error', icon: <CloseIcon /> },
    'exam': { label: 'Thi giữa kỳ', color: 'secondary', icon: <ScheduleIcon /> },
    'roomChange': { label: 'Đổi phòng', color: 'warning', icon: <RoomIcon /> },
    'moved': { label: 'Chuyển lịch', color: 'warning', icon: <SwapIcon /> },
    'substitute': { label: 'Thay giảng viên', color: 'info', icon: <PersonIcon /> },
    'finalExam': { label: 'Thi cuối kỳ', color: 'secondary', icon: <ScheduleIcon /> }
  };

  return requestTypes
    .filter(rt => rt.id >= 5 && rt.id <= 10 && rt.id !== 10) // Bỏ thi cuối kỳ (ID 10) - chỉ admin mới tạo được
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

const RoomRequestForm = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentTab, setCurrentTab] = useState(0);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExceptionType, setSelectedExceptionType] = useState('');
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ScheduleRequest | null>(null);

  // API data state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  // State cho danh sách lịch học và yêu cầu
  const [availableSchedules, setAvailableSchedules] = useState<AvailableSchedule[]>([]);
  const [myRequests, setMyRequests] = useState<ScheduleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State cho phòng available
  const [availableRoomsForException, setAvailableRoomsForException] = useState<any[]>([]);
  const [occupiedRoomIds, setOccupiedRoomIds] = useState<number[]>([]);
  const [checkingRooms, setCheckingRooms] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateScheduleRequestData & { classId?: number }>({
    requestTypeId: 5,
    classScheduleId: 0,
    classId: undefined,
    requesterId: user?.id || 0,
    requestDate: dayjs().format('YYYY-MM-DD'),
    timeSlotId: 0,
    exceptionDate: dayjs().format('YYYY-MM-DD'),
    exceptionType: 'cancelled',
    reason: '',
    note: ''
  });

  const socketInitialized = useRef(false);

  // Setup socket listeners
  useEffect(() => {
    if (!socketInitialized.current && user?.id) {
      const socket = getSocket() || initSocket(user.id);
      socketInitialized.current = true;

      const handleScheduleExceptionUpdated = (data: any) => {
        console.log('[RoomRequestForm] Nhận event schedule-exception-updated:', data);
        // Reload danh sách yêu cầu của giảng viên
        loadMyRequests();
      };

      const handleScheduleUpdated = (data: any) => {
        console.log('[RoomRequestForm] Nhận event schedule-updated:', data);
        // Reload danh sách lịch học
        loadAvailableSchedules();
      };

      socket.on('schedule-exception-updated', handleScheduleExceptionUpdated);
      socket.on('schedule-updated', handleScheduleUpdated);

      return () => {
        socket.off('schedule-exception-updated', handleScheduleExceptionUpdated);
        socket.off('schedule-updated', handleScheduleUpdated);
        socketInitialized.current = false;
      };
    }
  }, [user?.id]);

  // Load data on component mount
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setApiLoading(true);
    try {
      const [timeSlotsRes, teachersRes, requestTypesRes, classesRes] = await Promise.all([
        scheduleExceptionService.getTimeSlots(),
        scheduleExceptionService.getTeachers(),
        scheduleExceptionService.getRequestTypes(),
        scheduleManagementService.getClassesForScheduling()
      ]);

      if (timeSlotsRes.success) setTimeSlots(timeSlotsRes.data || []);
      if (teachersRes.success) {
        // Map dữ liệu để đảm bảo có name và fullName
        const mappedTeachers = (teachersRes.data || []).map((teacher: any) => ({
          id: teacher.id,
          name: teacher.name || teacher.fullName || '',
          fullName: teacher.fullName || teacher.name || '',
          code: teacher.code || teacher.teacherCode || '',
          teacherCode: teacher.teacherCode || teacher.code || '',
          departmentId: teacher.departmentId || 0
        }));
        setTeachers(mappedTeachers);
      }
      if (requestTypesRes.success) setRequestTypes(requestTypesRes.data || []);
      
      if (classesRes && classesRes.success && classesRes.data) {
        setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      } else if (Array.isArray(classesRes)) {
        setClasses(classesRes);
      } else {
        setClasses([]);
      }

      // Load lịch học của giảng viên
      await loadAvailableSchedules();
      
      // Load yêu cầu của giảng viên
      await loadMyRequests();
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Có lỗi khi tải dữ liệu');
    } finally {
      setApiLoading(false);
    }
  };

  const loadAvailableSchedules = async () => {
    if (!user?.id) return;
    
    try {
      const response = await roomService.getTeacherSchedules(user.id);
      if (response.success) {
        // Transform data to match AvailableSchedule interface
        const schedules = response.data.map((schedule: any) => ({
          id: schedule.id,
          classId: schedule.class.id,
          className: schedule.class.className,
          classCode: schedule.class.code,
          subjectName: schedule.class.subjectName,
          subjectCode: schedule.class.subjectCode,
          teacherId: schedule.teacherId,
          teacherName: user.fullName || '',
          teacherCode: user.username || '',
          departmentId: schedule.class.departmentId || 0,
          departmentName: schedule.class.department?.name || '',
          roomId: schedule.classRoom?.id,
          roomName: schedule.classRoom?.name,
          roomCode: schedule.classRoom?.code,
          dayOfWeek: schedule.dayOfWeek,
          dayName: getDayName(schedule.dayOfWeek),
          timeSlotId: schedule.timeSlotId,
          slotName: `Tiết ${schedule.timeSlotId}`,
          startTime: schedule.timeSlot?.startTime || '',
          endTime: schedule.timeSlot?.endTime || '',
          shift: schedule.timeSlot?.shift || 1,
          classType: schedule.class.classType || 'theory',
          practiceGroup: schedule.class.practiceGroup
        }));
        setAvailableSchedules(schedules);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadMyRequests = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await roomService.getScheduleRequests({
        requesterId: user.id,
        page: 1,
        limit: 100
      });
      
      if (response.success) {
        setMyRequests(response.data || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      setError('Có lỗi khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['', 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayOfWeek] || '';
  };

  // Kiểm tra phòng available - CHỈ cho "moved" (đổi lịch), không check cho roomChange, exam và finalExam (admin sẽ chọn)
  useEffect(() => {
    const checkAvailableRooms = async () => {
      const isMoved = formData.exceptionType === 'moved';
      
      // CHỈ check phòng cho "moved" (đổi lịch), vì roomChange, exam và finalExam admin sẽ chọn phòng
      if (isMoved && formData.newDate && formData.newTimeSlotId) {
        setCheckingRooms(true);
        try {
          // Lấy departmentId từ lớp học đã chọn
          let departmentId: number | undefined = undefined;
          
          if (formData.classScheduleId) {
            const selectedSchedule = availableSchedules.find(s => s.id === formData.classScheduleId);
            departmentId = selectedSchedule?.departmentId;
          }
          
          const dateObj = parseDateFromAPI(formData.newDate) || new Date(formData.newDate);
          const dayOfWeek = dateObj.getDay() === 0 ? 1 : dateObj.getDay() + 1;
          
          const formattedDate = formatDateForAPI(dateObj) || formData.newDate;
          
          if (!formattedDate) {
            setCheckingRooms(false);
            return;
          }
          
          // Gọi API với departmentId để lọc phòng theo khoa
          const response = await roomService.getAvailableRoomsForException(
            formData.newTimeSlotId,
            dayOfWeek,
            formattedDate,
            undefined, // capacity
            undefined, // classRoomTypeId
            departmentId ? String(departmentId) : undefined // departmentId
          );

          if (response.success && response.data) {
            const data = response.data;
            const occupiedIds = (data.occupiedRooms || []).map((r: any) => parseInt(String(r.id)));
            const allAvailableRooms = [
              ...(data.normalRooms || []),
              ...(data.freedRooms || [])
            ];
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
        // Không check phòng cho exam và finalExam
        setAvailableRoomsForException([]);
        setOccupiedRoomIds([]);
      }
    };

    checkAvailableRooms();
  }, [formData.exceptionType, formData.newDate, formData.exceptionDate, formData.newTimeSlotId, formData.classScheduleId, availableSchedules]);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    let filtered = availableSchedules;

    if (selectedClass) {
      filtered = filtered.filter(schedule => schedule.className.toLowerCase().includes(selectedClass.toLowerCase()));
    }

    return filtered;
  }, [availableSchedules, selectedClass]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    let filtered = myRequests;

    if (selectedExceptionType) {
      filtered = filtered.filter(req => req.exceptionType === selectedExceptionType);
    }

    if (selectedDate) {
      filtered = filtered.filter(req => {
        const reqDate = parseDateFromAPI(req.exceptionDate || req.requestDate);
        if (!reqDate) return false;
        return dayjs(reqDate).isSame(selectedDate, 'day');
      });
    }

    return filtered;
  }, [myRequests, selectedExceptionType, selectedDate]);

  // Filter teachers based on exception type and selected schedule/class
  const filteredTeachers = useMemo(() => {
    // Nếu là thi cuối kỳ: lấy tất cả giáo viên
    if (formData.exceptionType === 'finalExam') {
      return teachers;
    }
    
    // Nếu là đổi giáo viên: chỉ lấy giáo viên của khoa tương ứng với lớp
    if (formData.exceptionType === 'substitute' && formData.classScheduleId) {
      const selectedSchedule = availableSchedules.find(s => s.id === formData.classScheduleId);
      if (selectedSchedule?.departmentId) {
        return teachers.filter(teacher => teacher.departmentId === selectedSchedule.departmentId);
      }
    }
    
    // Mặc định: lấy tất cả
    return teachers;
  }, [teachers, formData.exceptionType, formData.classScheduleId, availableSchedules]);

  const handleOpenRequestDialog = (schedule?: AvailableSchedule, request?: ScheduleRequest) => {
    if (request) {
      setEditingRequest(request);
      const exceptionDate = formatDateForAPI(request.exceptionDate || request.requestDate) || dayjs().format('YYYY-MM-DD');
      const newDate = request.newDate ? formatDateForAPI(request.newDate) : undefined;
      
      setFormData({
        requestTypeId: request.requestTypeId,
        classScheduleId: request.classScheduleId || 0,
        classId: request.classId || undefined,
        requesterId: user?.id || 0,
        requestDate: formatDateForAPI(request.requestDate) || dayjs().format('YYYY-MM-DD'),
        timeSlotId: request.timeSlotId,
        exceptionDate: exceptionDate,
        exceptionType: request.exceptionType || 'cancelled',
        newTimeSlotId: request.newTimeSlotId,
        newClassRoomId: request.newClassRoomId,
        newDate: newDate,
        substituteTeacherId: request.substituteTeacherId,
        reason: request.reason,
        note: request.note || ''
      });
    } else if (schedule) {
      setEditingRequest(null);
      const today = TransDateTime(new Date());
      setFormData({
        requestTypeId: 5,
        classScheduleId: schedule.id,
        requesterId: user?.id || 0,
        requestDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD'),
        timeSlotId: schedule.timeSlotId,
        exceptionDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD'),
        exceptionType: 'cancelled',
        reason: '',
        note: ''
      });
    } else {
      setEditingRequest(null);
      const today = TransDateTime(new Date());
      setFormData({
        requestTypeId: 5,
        classScheduleId: 0,
        classId: undefined,
        requesterId: user?.id || 0,
        requestDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD'),
        timeSlotId: 0,
        exceptionDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD'),
        exceptionType: 'cancelled',
        reason: '',
        note: ''
      });
    }
    setRequestDialogOpen(true);
  };

  const handleCloseRequestDialog = () => {
    setRequestDialogOpen(false);
    setEditingRequest(null);
    const today = TransDateTime(new Date());
    setFormData({
      requestTypeId: 5,
      classScheduleId: 0,
      classId: undefined,
      requesterId: user?.id || 0,
      requestDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD'),
      timeSlotId: 0,
      exceptionDate: formatDateForAPI(today) || dayjs().format('YYYY-MM-DD'),
      exceptionType: 'cancelled',
      reason: '',
      note: ''
    });
  };

  const handleSaveRequest = async () => {
    const isFinalExam = formData.exceptionType === 'finalExam';
    
    // Validation
    if (isFinalExam) {
      if (!formData.classId || formData.classId === 0) {
        toast.error('Vui lòng chọn lớp học');
        return;
      }
      if (!formData.exceptionDate) {
        toast.error('Vui lòng chọn ngày thi');
        return;
      }
      if (!formData.newTimeSlotId) {
        toast.error('Vui lòng chọn tiết thi');
        return;
      }
      // KHÔNG yêu cầu newClassRoomId - admin sẽ chọn phòng khi duyệt
    } else {
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
      toast.error('Vui lòng nhập lý do');
      return;
    }

    // ⭐ Giảng viên không cần chọn phòng cho "moved" (đổi lịch) và "exam" (thi giữa kỳ) - admin sẽ chọn khi duyệt
    // Chỉ yêu cầu ngày và tiết cho "moved" và "exam"
    if (formData.exceptionType === 'moved') {
      if (!formData.newDate || !formData.newTimeSlotId) {
        toast.error('Vui lòng chọn đầy đủ: ngày chuyển đến và tiết chuyển đến');
        return;
      }
      // Không yêu cầu newClassRoomId - admin sẽ chọn phòng khi duyệt
    } else if (formData.exceptionType === 'exam') {
      // Thi giữa kỳ: Chỉ cần ngày và tiết, không cần phòng (admin sẽ chọn)
      if (!formData.newDate || !formData.newTimeSlotId) {
        toast.error('Vui lòng chọn ngày và tiết thi');
        return;
      }
    } else if (formData.exceptionType === 'roomChange') {
      // Đổi phòng: Chỉ cần ngày ngoại lệ, không cần phòng mới (admin sẽ chọn)
      if (!formData.exceptionDate) {
        toast.error('Vui lòng chọn ngày ngoại lệ');
        return;
      }
    }

    // Không yêu cầu giảng viên thay thế cho "substitute" (đổi giáo viên) - admin sẽ sắp xếp
    // Không yêu cầu cho "finalExam" (admin sẽ sắp xếp)

    try {
      const requestTypeId = getRequestTypeIdFromExceptionType(formData.exceptionType || 'cancelled');
      const exceptionDate = formData.exceptionDate ? formatDateForAPI(formData.exceptionDate) || formData.exceptionDate : formData.exceptionDate;
      const newDate = formData.newDate ? (formatDateForAPI(formData.newDate) || formData.newDate) : formData.newDate;
      
      const dataToSend: any = {
        ...formData,
        requestTypeId: requestTypeId,
        exceptionDate: exceptionDate
      };
      
      // ⭐ QUAN TRỌNG: Map newDate -> movedToDate cho đổi lịch (moved) và thi giữa kỳ (exam)
      if (formData.exceptionType === 'moved' || formData.exceptionType === 'exam') {
        if (newDate) {
          dataToSend.movedToDate = newDate;
          // Tính movedToDayOfWeek từ newDate
          const dateObj = parseDateFromAPI(newDate) || new Date(newDate);
          const dayOfWeek = dateObj.getDay();
          dataToSend.movedToDayOfWeek = dayOfWeek === 0 ? 1 : dayOfWeek + 1; // 1=CN, 2=T2, ..., 7=T7
        }
        // Map newTimeSlotId -> movedToTimeSlotId cho đổi lịch và thi giữa kỳ
        if (formData.newTimeSlotId) {
          dataToSend.movedToTimeSlotId = formData.newTimeSlotId;
        }
        // Không gửi newDate và newTimeSlotId nữa, đã map sang movedToDate và movedToTimeSlotId
        dataToSend.newDate = undefined;
        dataToSend.newTimeSlotId = undefined;
      } else if (newDate) {
        // Các loại khác vẫn dùng newDate
        dataToSend.newDate = newDate;
      }
      
      if (isFinalExam) {
        dataToSend.classScheduleId = undefined;
        dataToSend.classId = formData.classId;
        // Không gửi newClassRoomId và substituteTeacherId - admin sẽ sắp xếp
        dataToSend.newClassRoomId = undefined;
        dataToSend.substituteTeacherId = undefined;
      } else {
        dataToSend.classId = undefined;
      }
      
      // Với roomChange và exam: không gửi newClassRoomId - admin sẽ sắp xếp
      if (formData.exceptionType === 'roomChange' || formData.exceptionType === 'exam') {
        dataToSend.newClassRoomId = undefined;
      }
      
      // Với finalExam và substitute: không gửi substituteTeacherId - admin sẽ sắp xếp
      if (formData.exceptionType === 'finalExam' || formData.exceptionType === 'substitute') {
        dataToSend.substituteTeacherId = undefined;
      }
      
      // ⭐ QUAN TRỌNG: Không gửi movedToClassRoomId cho giảng viên - admin sẽ chọn khi duyệt
      if (formData.exceptionType === 'moved' || formData.exceptionType === 'exam') {
        dataToSend.movedToClassRoomId = undefined;
      }

      if (editingRequest) {
        // Không cho phép edit request đã tạo (chỉ admin mới edit được)
        toast.warning('Không thể chỉnh sửa yêu cầu đã gửi. Vui lòng liên hệ admin.');
        return;
      } else {
        const response = await roomService.createScheduleRequest(dataToSend);
        if (response.success) {
          toast.success('Gửi yêu cầu thành công! Đang chờ admin phê duyệt.');
          handleCloseRequestDialog();
          loadMyRequests();
        } else {
          toast.error(response.message || 'Có lỗi xảy ra khi gửi yêu cầu');
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || 'Có lỗi xảy ra khi lưu yêu cầu';
      toast.error(errorMessage);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) {
      try {
        // Chỉ cho phép xóa request đang pending
        const request = myRequests.find(r => r.id === id);
        if (request && request.requestStatusId !== 1) {
          toast.warning('Chỉ có thể xóa yêu cầu đang chờ duyệt');
          return;
        }
        
        const response = await roomService.updateScheduleRequestStatus(id, 3, 'Giảng viên hủy yêu cầu');
        if (response.success) {
          toast.success('Đã hủy yêu cầu');
          loadMyRequests();
        } else {
          toast.error('Có lỗi xảy ra khi hủy yêu cầu');
        }
      } catch (error) {
        toast.error('Có lỗi xảy ra khi hủy yêu cầu');
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
            Yêu cầu phòng / lịch học
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
          >
            Tạo và quản lý yêu cầu ngoại lệ cho lịch học của bạn
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
            onClose={() => setError(null)}
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
            <Tab label="Yêu cầu đã gửi" />
          </Tabs>
        </Paper>

        {/* Filters */}
        <Paper sx={{ p: { xs: 0.75, sm: 1, md: 1.25 }, mb: { xs: 1.5, sm: 2, md: 3 }, boxShadow: 2 }}>
          <Grid container spacing={{ xs: 1, sm: 1.25, md: 1.5 }}>
            <Grid size={{ xs: 6, sm: 6, md: currentTab === 1 ? 4 : 6 }}>
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

            {currentTab === 1 && (
              <>
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
              </>
            )}

            <Grid size={{ xs: 12, sm: 12, md: currentTab === 1 ? 4 : 6 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }} />}
                onClick={() => handleOpenRequestDialog()}
                fullWidth
                size="small"
                sx={{ 
                  height: { xs: '32px', sm: '36px', md: '36px' },
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
                  py: { xs: '4px', sm: '6px', md: '8px' }
                }}
              >
                Tạo yêu cầu mới
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
                Danh sách lịch học của bạn ({filteredSchedules.length})
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
                      onClick={() => handleOpenRequestDialog(schedule)}
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
                            <strong>Phòng:</strong> {schedule.roomName || 'Chưa có phòng'}
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
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Tạo yêu cầu">
                            <IconButton 
                              size={isMobile ? "small" : "medium"}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRequestDialog(schedule);
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
          /* Requests List */
          <Paper sx={{ boxShadow: 3 }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Danh sách yêu cầu đã gửi ({filteredRequests.length})
              </Typography>
            </Box>

            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {filteredRequests.map((request) => {
                  const typeInfo = getExceptionTypeInfo(request.exceptionType || 'cancelled');
                  return (
                    <Box key={request.id} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                              {request.classSchedule?.class?.className || 'Lớp học'}
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
                              <strong>{request.exceptionType === 'finalExam' ? 'Ngày thi:' : 'Ngày ngoại lệ:'}</strong> {
                                (() => {
                                  const reqDate = parseDateFromAPI(request.exceptionDate || request.requestDate);
                                  return reqDate ? dayjs(reqDate).format('DD/MM/YYYY') : dayjs(request.exceptionDate || request.requestDate).format('DD/MM/YYYY');
                                })()
                              }
                            </Typography>

                            {request.newTimeSlot && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Tiết mới:</strong> {request.newTimeSlot.slotName}
                              </Typography>
                            )}

                            {request.newClassRoom && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Phòng mới:</strong> {request.newClassRoom.name}
                              </Typography>
                            )}

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, mt: 2 }}>
                              <strong>Trạng thái:</strong> 
                              <Chip 
                                label={request.RequestStatus?.name || 'Chờ duyệt'}
                                size="small"
                                color={request.requestStatusId === 2 ? 'success' : request.requestStatusId === 3 ? 'error' : 'warning'}
                                sx={{ ml: 1 }}
                              />
                            </Typography>
                          </Box>

                          <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                            <strong>Lý do:</strong> "{request.reason}"
                          </Typography>

                          {request.note && (
                            <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', p: 1, backgroundColor: 'info.light', borderRadius: 1 }}>
                              <strong>Ghi chú từ admin:</strong> "{request.note}"
                            </Typography>
                          )}

                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {request.requestStatusId === 1 && (
                              <Tooltip title="Hủy yêu cầu">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteRequest(request.id)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  );
                })}
              </Box>

              {filteredRequests.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    Không có yêu cầu nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Hãy tạo yêu cầu mới hoặc thay đổi bộ lọc
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* Request Dialog - Tương tự ScheduleManagement */}
        <Dialog 
          open={requestDialogOpen} 
          onClose={handleCloseRequestDialog}
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
                {editingRequest ? 'Xem yêu cầu' : 'Tạo yêu cầu ngoại lệ'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseRequestDialog} size="small">
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
                {(formData.classScheduleId && formData.classScheduleId > 0) && (() => {
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
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              PHÒNG HỌC
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedSchedule.roomName || 'Chưa có phòng'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              THỜI GIAN
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {selectedSchedule.dayName} - {selectedSchedule.slotName}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
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

              {/* Chọn lịch học hoặc lớp học */}
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
                            return `${selectedClass.className || ''} - ${selectedClass.code || selectedClass.subjectCode || ''}`;
                          }
                          return <em>-- Chọn lớp học --</em>;
                        }}
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          const classId = selectedValue ? parseInt(String(selectedValue)) : undefined;
                          setFormData(prev => ({ 
                            ...prev, 
                            classId: classId,
                            newTimeSlotId: undefined,
                            newClassRoomId: undefined
                          }));
                        }}
                        label="Chọn lớp học"
                        disabled={editingRequest !== null}
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
                            const displayName = `${cls.className || ''} - ${cls.code || cls.subjectCode || ''}`;
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
                            newTimeSlotId: undefined,
                            newClassRoomId: undefined,
                            newDate: undefined,
                            substituteTeacherId: undefined
                          }));
                        }}
                        label="Chọn lịch học"
                        disabled={editingRequest !== null}
                      >
                        <MenuItem value="">
                          <em>-- Chọn lịch học --</em>
                        </MenuItem>
                        {availableSchedules.map(schedule => (
                          <MenuItem key={schedule.id} value={schedule.id}>
                            {schedule.className} - {schedule.classCode} | {schedule.dayName} - {schedule.slotName} | {schedule.roomName || 'Chưa có phòng'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              )}

              {/* Loại ngoại lệ */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Loại ngoại lệ</InputLabel>
                    <Select
                      value={formData.exceptionType}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        setFormData(prev => {
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
                      disabled={editingRequest !== null}
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

              {/* Chọn ngày ngoại lệ */}
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
                    disabled={editingRequest !== null}
                  />
                </Box>
              </Box>

              {/* Conditional fields - Moved */}
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
                        disabled={editingRequest !== null}
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
                          disabled={editingRequest !== null}
                        >
                          {timeSlots.map(slot => (
                            <MenuItem key={slot.id} value={slot.id}>
                              {slot.slotName} ({formatTimeFromAPI(slot.startTime)}-{formatTimeFromAPI(slot.endTime)})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    {/* ⭐ Ẩn dropdown chọn phòng cho giảng viên - admin sẽ chọn phòng khi duyệt */}
                    {/* Giảng viên không thể chọn phòng cho đổi lịch và thi giữa kỳ */}
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Alert severity="info" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                        <Typography variant="caption">
                          Admin sẽ chọn phòng khi duyệt yêu cầu
                        </Typography>
                      </Alert>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Conditional fields - Exam */}
              {formData.exceptionType === 'exam' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <DatePicker
                        label="Ngày thi"
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
                              newDate: formattedDate
                            }));
                          } else {
                            setFormData(prev => ({ 
                              ...prev, 
                              newDate: undefined
                            }));
                          }
                        }}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        disabled={editingRequest !== null}
                      />
                    </Box>

                    <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Tiết thi</InputLabel>
                        <Select
                          value={formData.newTimeSlotId || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            newTimeSlotId: parseInt(String(e.target.value))
                          }))}
                          label="Tiết thi"
                          disabled={editingRequest !== null}
                        >
                          {timeSlots.map(slot => (
                            <MenuItem key={slot.id} value={slot.id}>
                              {slot.slotName} ({formatTimeFromAPI(slot.startTime)}-{formatTimeFromAPI(slot.endTime)})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Conditional fields - Final Exam */}
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
                            newTimeSlotId: parseInt(String(e.target.value))
                          }))}
                          label="Tiết thi"
                          disabled={editingRequest !== null}
                        >
                          {timeSlots.map(slot => (
                            <MenuItem key={slot.id} value={slot.id}>
                              {slot.slotName} ({formatTimeFromAPI(slot.startTime)}-{formatTimeFromAPI(slot.endTime)})
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Substitute teacher - Ẩn vì admin sẽ sắp xếp */}
              {/* {formData.exceptionType === 'substitute' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Giảng viên thay thế</InputLabel>
                      <Select
                        value={formData.substituteTeacherId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, substituteTeacherId: parseInt(String(e.target.value)) }))}
                        label="Giảng viên thay thế"
                        disabled={editingRequest !== null || !formData.classScheduleId}
                      >
                        {filteredTeachers.length > 0 ? (
                          filteredTeachers.map(teacher => {
                            const teacherName = teacher.name || teacher.fullName || '';
                            return (
                              <MenuItem key={teacher.id} value={teacher.id}>
                                {teacherName}
                              </MenuItem>
                            );
                          })
                        ) : (
                          <MenuItem disabled value="">
                            {formData.classScheduleId ? 'Không có giáo viên trong khoa này' : 'Vui lòng chọn lịch học trước'}
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              )} */}

              {/* Giảng viên cho thi cuối kỳ - Ẩn vì admin sẽ sắp xếp */}
              {/* {formData.exceptionType === 'finalExam' && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Giảng viên (tùy chọn)</InputLabel>
                      <Select
                        value={formData.substituteTeacherId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, substituteTeacherId: parseInt(String(e.target.value)) || undefined }))}
                        label="Giảng viên (tùy chọn)"
                        disabled={editingRequest !== null}
                      >
                        <MenuItem value="">
                          <em>Không chọn (dùng giảng viên của lớp)</em>
                        </MenuItem>
                        {filteredTeachers.map(teacher => {
                          const teacherName = teacher.name || teacher.fullName || '';
                          return (
                            <MenuItem key={teacher.id} value={teacher.id}>
                              {teacherName}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              )} */}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Lý do"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  size="small"
                  required
                  disabled={editingRequest !== null}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Ghi chú"
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  size="small"
                  disabled={editingRequest !== null}
                />
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseRequestDialog} variant="outlined">
              {editingRequest ? 'Đóng' : 'Hủy'}
            </Button>
            {!editingRequest && (
              <Button 
                onClick={handleSaveRequest} 
                variant="contained" 
                color="primary"
                disabled={
                  loading || 
                  !formData.reason.trim() ||
                  (formData.exceptionType === 'finalExam' 
                    ? (!formData.classId || formData.classId === 0 || !formData.newTimeSlotId)
                    : (!formData.classScheduleId || formData.classScheduleId === 0))
                }
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              >
                Gửi yêu cầu
              </Button>
            )}
          </DialogActions>
        </Dialog>

      </Box>
    </LocalizationProvider>
  );
};

export default RoomRequestForm;
