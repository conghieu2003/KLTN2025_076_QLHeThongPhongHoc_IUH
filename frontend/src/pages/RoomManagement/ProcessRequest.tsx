import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, FormControl, InputLabel, Select, MenuItem, Alert, Chip, CircularProgress, Paper, Stack, TextField, Grid, useTheme, useMediaQuery } from '@mui/material';
import { Person as PersonIcon, Class as ClassIcon, Room as RoomIcon, Schedule as ScheduleIcon, ArrowBack as ArrowBackIcon, Save as SaveIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon, Pending as PendingIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { roomService, scheduleManagementService, scheduleExceptionService } from '../../services/api';
import { formatDateForAPI, parseDateFromAPI } from '../../utils/transDateTime';

interface ProcessRequestData {
    id: number;
    requestTypeId: number;
    classScheduleId?: number;
    requesterId: number;
    requestDate: string;
    timeSlotId: number;
    changeType?: string;
    reason: string;
    requestStatusId: number;
    createdAt: string;
    movedToTimeSlotId?: number;
    movedToDate?: string;
    movedToDayOfWeek?: number;
    exceptionDate?: string;
    exceptionType?: string;
    newClassRoomId?: number;
    newTimeSlotId?: number;
    newDate?: string; // Cho thi giữa kỳ
    class?: { // Cho thi cuối kỳ
        id: number;
        code: string;
        className: string;
        subjectName: string;
        subjectCode: string;
        maxStudents: number;
        departmentId: number;
        classRoomTypeId?: number;
        ClassRoomType?: {
            id: number;
            name: string;
        };
        teacher?: {
            id: number;
            teacherCode: string;
            user?: {
                id: number;
                fullName: string;
                email: string;
            };
        };
    };
    requester?: {
        id: number;
        fullName: string;
        email: string;
        teacher?: {
            id: number;
            teacherCode: string;
        };
    };
    RequestType?: {
        id: number;
        name: string;
    };
    RequestStatus?: {
        id: number;
        name: string;
    };
    approver?: {
        id: number;
        fullName: string;
        email: string;
    };
    approvedAt?: string;
    note?: string;
        classSchedule?: {
        id: number;
        class?: {
            id: number;
            code: string;
            className: string;
            subjectName: string;
            subjectCode: string;
            maxStudents: number;
            departmentId: number; // Thêm departmentId
            teacher?: {
                id: number;
                teacherCode: string;
                user?: {
                    id: number;
                    fullName: string;
                    email: string;
                };
            };
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
        dayOfWeek: number;
        timeSlotId: number;
        timeSlot?: {
            id: number;
            slotName?: string;
            startTime?: string;
            endTime?: string;
        };
    };
    movedToTimeSlot?: {
        id: number;
        slotName?: string;
        startTime?: string;
        endTime?: string;
    };
    newTimeSlot?: {
        id: number;
        slotName?: string;
        startTime?: string;
        endTime?: string;
    };
    newClassRoom?: {
        id: number;
        code: string;
        name: string;
        capacity: number;
        ClassRoomType?: {
            name: string;
        };
    };
}

interface SuggestedRoom {
    id: number;
    code: string;
    name: string;
    capacity: number;
    building: string;
    floor: number;
    ClassRoomType?: {
        name: string;
    };
    isAvailable: boolean;
    isFreedByException?: boolean;
    exceptionInfo?: {
        className: string;
        exceptionType: string;
        exceptionReason: string;
        exceptionTypeName: string;
    };
}

const ProcessRequest: React.FC = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [requestData, setRequestData] = useState<ProcessRequestData | null>(null);
    const [suggestedRooms, setSuggestedRooms] = useState<SuggestedRoom[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<number | ''>('');
    const [adminNote, setAdminNote] = useState('');
    const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | ''>('');
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [timeSlots, setTimeSlots] = useState<any[]>([]);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (requestId) {
            loadRequestData();
        }
    }, [requestId]); 

    useEffect(() => {
        const loadTimeSlots = async () => {
            try {
                const response = await scheduleExceptionService.getTimeSlots();
                if (response.success && response.data) {
                    setTimeSlots(response.data);
                }
            } catch (error) {
                console.error('Error loading time slots:', error);
            }
        };
        loadTimeSlots();
    }, []);

    const loadRequestData = async () => {
        try {
            setLoading(true);
            const response = await roomService.getScheduleRequestById(parseInt(requestId!));
            if (response.success) {
                setRequestData(response.data);
                await loadSuggestedRooms(response.data);
                await loadAvailableTeachers(response.data);
            } else {
                toast.error('Không thể tải thông tin yêu cầu');
                navigate('/rooms/requests/list');
            }
        } catch (error) {
            console.error('Error loading request data:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu');
            navigate('/rooms/requests/list');
        } finally {
            setLoading(false);
        }
    };

    const shouldShowRoomSelection = (request: ProcessRequestData): boolean => {
        const requestTypeId = request.requestTypeId;
        const noRoomNeeded = [5, 9]; 
    
        return !noRoomNeeded.includes(requestTypeId);
    };

    const loadAvailableTeachers = async (request: ProcessRequestData) => {
        try {
            const isExam = request.requestTypeId === 6; // Thi giữa kỳ
            const isFinalExam = request.requestTypeId === 10; // Thi cuối kỳ
            const isSubstitute = request.requestTypeId === 9; // Đổi giáo viên
            
            if (!isExam && !isFinalExam && !isSubstitute) {
                setAvailableTeachers([]);
                return;
            }

            let targetDate: string | undefined;
            let targetTimeSlotId: number | undefined;
            let departmentId: number | undefined;

            if (isExam) {
                let examDate: string | undefined;
                let examTimeSlotId: number | undefined;
                
                if (request.movedToDate && request.movedToTimeSlotId) {
                    examDate = request.movedToDate;
                    examTimeSlotId = request.movedToTimeSlotId;
                } else if (request.newDate && request.newTimeSlotId) {
                    examDate = request.newDate;
                    examTimeSlotId = request.newTimeSlotId;
                }
                // xử lý thi giữa kỳ
                if (examDate && examTimeSlotId) {
                    const parsedDate = parseDateFromAPI(examDate) || new Date(examDate);
                    targetDate = formatDateForAPI(parsedDate) || examDate.split('T')[0];
                    targetTimeSlotId = examTimeSlotId;
                    if (request.classSchedule?.class?.departmentId) {
                        departmentId = request.classSchedule.class.departmentId;
                    }
                }
                // xử lý thi giữa kỳ
            } else if (isFinalExam && request.exceptionDate && request.newTimeSlotId) {
                const parsedDate = parseDateFromAPI(request.exceptionDate) || new Date(request.exceptionDate);
                targetDate = formatDateForAPI(parsedDate) || request.exceptionDate.split('T')[0];
                targetTimeSlotId = request.newTimeSlotId;
                if (request.class?.departmentId) {
                    departmentId = request.class.departmentId;
                }
                // xử lý đổi giáo viên
            } else if (isSubstitute && request.exceptionDate && request.classSchedule) {
                const parsedDate = parseDateFromAPI(request.exceptionDate) || new Date(request.exceptionDate);
                targetDate = formatDateForAPI(parsedDate) || request.exceptionDate.split('T')[0];
                targetTimeSlotId = request.classSchedule.timeSlotId;
                if (request.classSchedule?.class?.departmentId) {
                    departmentId = request.classSchedule.class.departmentId;
                }
            }

            if (!targetDate || !targetTimeSlotId) {
                setAvailableTeachers([]);
                return;
            }

            // Lấy teacherId của giảng viên đang yêu cầu đổi lịch để loại bỏ khỏi danh sách
            let excludeTeacherId: number | undefined = undefined;
            if (isSubstitute && request.classSchedule?.class?.teacher?.id) {
                excludeTeacherId = request.classSchedule.class.teacher.id;
            } else if (isExam && request.classSchedule?.class?.teacher?.id) {
                excludeTeacherId = request.classSchedule.class.teacher.id;
            } else if (isFinalExam && request.class?.teacher?.id) {
                excludeTeacherId = request.class.teacher.id;
            }

            setLoadingTeachers(true);
            const response = await scheduleManagementService.getAvailableTeachers(
                targetDate,
                targetTimeSlotId,
                departmentId,
                excludeTeacherId
            );

            if (response.success) {
                setAvailableTeachers(response.data || []);
            } else {
                setAvailableTeachers([]);
                toast.error(response.message || 'Lỗi lấy danh sách giảng viên trống');
            }
        } catch (error: any) {
            console.error('Error loading available teachers:', error);
            setAvailableTeachers([]);
        } finally {
            setLoadingTeachers(false);
        }
    };

    const loadSuggestedRooms = async (request: ProcessRequestData) => {
        try {
            if (!shouldShowRoomSelection(request)) {
                setSuggestedRooms([]);
                return;
            }

            let classMaxStudents = 0;
            let classRoomTypeId = '1';
            let departmentId: number | undefined = undefined;
            
            // Xử lý thi cuối kỳ
            if (request.requestTypeId === 10 && request.class) {
                classMaxStudents = request.class.maxStudents || 0;
                departmentId = request.class.departmentId;
        
                if (request.class.classRoomTypeId) {
                    classRoomTypeId = String(request.class.classRoomTypeId);
                } else if (request.class.ClassRoomType?.name) {
                    classRoomTypeId = request.class.ClassRoomType.name === 'Thực hành' ? '2' : '1';
                } else {
                    classRoomTypeId = '1';
                }
            } else if (request.classSchedule?.class) {
                classMaxStudents = request.classSchedule.class.maxStudents || 0;
                departmentId = request.classSchedule.class.departmentId;
                if (request.classSchedule.classRoom?.ClassRoomType?.name) {
                    classRoomTypeId = request.classSchedule.classRoom.ClassRoomType.name === 'Thực hành' ? '2' : '1';
                } else {
                    classRoomTypeId = '1';
                }
            }
            const isRoomChange = request.requestTypeId === 7; // Đổi phòng
            const isMoved = request.RequestType?.name === 'Đổi lịch' || request.requestTypeId === 8;
            const isExam = request.requestTypeId === 6; // Thi giữa kỳ
            const isFinalExam = request.requestTypeId === 10; // Thi cuối kỳ
            
            let targetDate: string | undefined;
            let targetTimeSlotId: number | undefined;
            let targetDayOfWeek: number | undefined;
            
            if (isRoomChange && request.classSchedule && request.exceptionDate) {
                const parsedDate = parseDateFromAPI(request.exceptionDate) || new Date(request.exceptionDate);
                targetDate = formatDateForAPI(parsedDate) || request.exceptionDate.split('T')[0];
                if (request.classSchedule.timeSlot?.id) {
                    targetTimeSlotId = request.classSchedule.timeSlot.id;
                } else if (request.classSchedule.timeSlotId) {
                    targetTimeSlotId = request.classSchedule.timeSlotId;
                } 
                if (targetDate) {
                    const dateObj = parseDateFromAPI(targetDate) || new Date(targetDate);
                    targetDayOfWeek = dateObj.getDay() === 0 ? 1 : dateObj.getDay() + 1;
                }
            } else if (isMoved) {
                if (request.movedToDate && request.movedToTimeSlotId) {
                    const parsedDate = parseDateFromAPI(request.movedToDate) || new Date(request.movedToDate);
                    targetDate = formatDateForAPI(parsedDate) || request.movedToDate.split('T')[0];
                    targetTimeSlotId = request.movedToTimeSlotId;
                    if (request.movedToDayOfWeek) {
                        targetDayOfWeek = request.movedToDayOfWeek;
                    } else if (targetDate) {
                        const dateObj = parseDateFromAPI(targetDate) || new Date(targetDate);
                        targetDayOfWeek = dateObj.getDay() === 0 ? 1 : dateObj.getDay() + 1;
                    }
                } else if (request.exceptionDate && request.classSchedule) {
                    const parsedDate = parseDateFromAPI(request.exceptionDate) || new Date(request.exceptionDate);
                    targetDate = formatDateForAPI(parsedDate) || request.exceptionDate.split('T')[0];
                    if (request.classSchedule.timeSlot?.id) {
                        targetTimeSlotId = request.classSchedule.timeSlot.id;
                    } else if (request.classSchedule.timeSlotId) {
                        targetTimeSlotId = request.classSchedule.timeSlotId;
                    }
                    if (targetDate) {
                        const dateObj = parseDateFromAPI(targetDate) || new Date(targetDate);
                        targetDayOfWeek = dateObj.getDay() === 0 ? 1 : dateObj.getDay() + 1;
                    }
                }
            } else if (isExam) {
                let examDate: string | undefined;
                let examTimeSlotId: number | undefined;
                
                if (request.movedToDate && request.movedToTimeSlotId) {
                    examDate = request.movedToDate;
                    examTimeSlotId = request.movedToTimeSlotId;
                } else if (request.newDate && request.newTimeSlotId) {
                    examDate = request.newDate;
                    examTimeSlotId = request.newTimeSlotId;
                } else if (request.exceptionDate && request.classSchedule) {
                    examDate = request.exceptionDate;
                    if (request.classSchedule.timeSlot?.id) {
                        examTimeSlotId = request.classSchedule.timeSlot.id;
                    } else if (request.classSchedule.timeSlotId) {
                        examTimeSlotId = request.classSchedule.timeSlotId;
                    }
                }
                
                if (examDate && examTimeSlotId) {
                    const parsedDate = parseDateFromAPI(examDate) || new Date(examDate);
                    targetDate = formatDateForAPI(parsedDate) || examDate.split('T')[0];
                    targetTimeSlotId = examTimeSlotId;
                    if (request.movedToDayOfWeek) {
                        targetDayOfWeek = request.movedToDayOfWeek;
                    } else if (targetDate) {
                        const dateObj = parseDateFromAPI(targetDate) || new Date(targetDate);
                        targetDayOfWeek = dateObj.getDay() === 0 ? 1 : dateObj.getDay() + 1;
                    }
                }
            } else if (isFinalExam) {
                // Thi cuối kỳ: dùng exceptionDate và newTimeSlotId
                if (request.exceptionDate) {
                    const parsedDate = parseDateFromAPI(request.exceptionDate) || new Date(request.exceptionDate);
                    targetDate = formatDateForAPI(parsedDate) || request.exceptionDate.split('T')[0];
                    
                    if (request.newTimeSlotId) {
                        targetTimeSlotId = request.newTimeSlotId;
                    } else {
                    }
                    
                    if (targetDate) {
                        const dateObj = parseDateFromAPI(targetDate) || new Date(targetDate);
                        targetDayOfWeek = dateObj.getDay() === 0 ? 1 : dateObj.getDay() + 1;
                    }
                }
            }
            
            if (targetTimeSlotId && (targetTimeSlotId < 1 || targetTimeSlotId > 30)) {
                toast.error(`Lỗi:không hợp lệ (${targetTimeSlotId}). Vui lòng kiểm tra dữ liệu.`);
                setSuggestedRooms([]);
                return;
            }

            if (targetDate && targetTimeSlotId && targetDayOfWeek) {
                const availableRoomsResponse = await roomService.getAvailableRoomsForException(
                    Number(targetTimeSlotId),
                    Number(targetDayOfWeek),
                    targetDate,
                    classMaxStudents,
                    classRoomTypeId,
                    departmentId ? String(departmentId) : undefined 
                );

                if (availableRoomsResponse.success && availableRoomsResponse.data) {
                    const { normalRooms, freedRooms, occupiedRooms } = availableRoomsResponse.data;
                    const occupiedIds = (occupiedRooms || []).map((r: any) => parseInt(String(r.id)));
                    
                    const allAvailable = [
                        ...(freedRooms || []).map((room: any) => ({ 
                            ...room, 
                            isFreedByException: true,
                            sortPriority: 1 
                        })),
                        ...(normalRooms || []).map((room: any) => ({ 
                            ...room, 
                            isFreedByException: false,
                            sortPriority: 2
                        }))
                    ];

                    const availableRooms = allAvailable.filter((room: any) => {
                        const roomIdNum = parseInt(String(room.id));
                        return !occupiedIds.includes(roomIdNum);
                    });

                    availableRooms.sort((a: any, b: any) => {
                        if (a.sortPriority !== b.sortPriority) {
                            return a.sortPriority - b.sortPriority;
                        }
                        const aDiff = Math.abs(a.capacity - classMaxStudents);
                        const bDiff = Math.abs(b.capacity - classMaxStudents);
                        return aDiff - bDiff;
                    });

                    setSuggestedRooms(availableRooms.slice(0, 15)); // Top 15 suggestions

                    if ((freedRooms?.length || 0) > 0) {
                        toast.info(
                            `Có ${freedRooms.length} phòng trống do lớp khác nghỉ/thi trong ngày này`,
                            { autoClose: 5000 }
                        );
                    }

                    return;
                } 
            } 
            
            const roomsResponse = await roomService.getAllRooms();
            
            if (roomsResponse.success) {
                const allRooms = roomsResponse.data;

                let suggested = allRooms.filter((room: any) => {
                    const capacityMatch = room.capacity >= classMaxStudents;
                    const roomType = room.type || room.ClassRoomType?.name;
                    const typeMatch = roomType === 'Thực hành' ||
                        (classRoomTypeId === '1' && roomType === 'Lý thuyết');
                    const available = room.isAvailable !== false;

                    return capacityMatch && typeMatch && available;
                });

                if (request.RequestType?.name === 'Đổi lịch' && request.movedToTimeSlotId && request.movedToDayOfWeek) {
                    const schedulesResponse = await roomService.getSchedulesByTimeSlotAndDate(
                        Number(request.movedToTimeSlotId),
                        Number(request.movedToDayOfWeek)
                    );

                    if (schedulesResponse.success) {
                        const existingSchedules = schedulesResponse.data;
                        suggested = suggested.filter((room: any) => {
                            const hasConflict = existingSchedules.some((schedule: any) =>
                                schedule.classRoomId && schedule.classRoomId === parseInt(room.id)
                            );
                            return !hasConflict;
                        });
                    }
                }

                suggested.sort((a: any, b: any) => {
                    const aDiff = Math.abs(a.capacity - classMaxStudents);
                    const bDiff = Math.abs(b.capacity - classMaxStudents);
                    return aDiff - bDiff;
                });

                setSuggestedRooms(suggested.slice(0, 10));
            }
        } catch (error) {
            toast.error('Không thể tải danh sách phòng đề xuất');
            setSuggestedRooms([]);
        }
    };

    const handleProcessRequest = async () => {
        const needsRoomSelection = requestData && shouldShowRoomSelection(requestData);
        const isMidtermExam = requestData?.requestTypeId === 6; 
        
        if (needsRoomSelection && !selectedRoomId && !isMidtermExam) {
            toast.error('Vui lòng chọn phòng học');
            return;
        }

        // Bắt buộc chọn giảng viên cho thi cuối kỳ
        if (requestData?.requestTypeId === 10 && !selectedTeacherId) {
            toast.error('Vui lòng chọn giảng viên cho lịch thi cuối kỳ');
            return;
        }

        try {
            setProcessing(true);

            const updateResponse = await roomService.updateScheduleRequestStatus(
                parseInt(requestId!),
                2,
                adminNote || 'Yêu cầu đã được chấp nhận và phân phòng',
                selectedRoomId ? selectedRoomId.toString() : undefined,
                selectedTeacherId ? Number(selectedTeacherId) : undefined
            );

            if (updateResponse.success) {
                toast.success('Đã xử lý yêu cầu thành công');
                navigate('/rooms/requests/list');
            } else {
                toast.error('Có lỗi xảy ra khi xử lý yêu cầu');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi xử lý yêu cầu');
        } finally {
            setProcessing(false);
        }
    };

    const getDayName = (dayOfWeek: number): string => {
        const days = ['', 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[dayOfWeek] || '';
    };

    const getTimeSlotName = (timeSlotId?: number, timeSlot?: { slotName?: string; id?: number }): string => {
        if (timeSlot?.slotName) {
            return timeSlot.slotName;
        }
        if (timeSlotId) {
            const slot = timeSlots.find(ts => ts.id === timeSlotId);
            if (slot?.slotName) {
                return slot.slotName;
            }
            return `Tiết ${timeSlotId}`;
        }
        return 'Chưa xác định';
    };

    const getRequestTypeText = (requestTypeId: number): string => {
        switch (requestTypeId) {
            case 7: return 'Đổi phòng';
            case 8: return 'Đổi lịch';
            case 9: return 'Đổi giáo viên';
            default: return 'Không xác định';
        }
    };
    // xóa ngoại lệ
    const handleDeleteException = async () => {
        if (!requestData) return;
        const isException = requestData.requestTypeId >= 5 && requestData.requestTypeId <= 10;
        if (!isException) {
            toast.error('Chỉ có thể xóa các yêu cầu ngoại lệ');
            return;
        }
        if (requestData.requestTypeId !== 10 && !requestData.classScheduleId) {
            toast.error('Không thể xóa ngoại lệ này vì thiếu thông tin lịch học');
            return;
        }

        const confirmMessage = requestData.requestTypeId === 10 
            ? 'Bạn có chắc chắn muốn xóa ngoại lệ thi cuối kỳ này? Lịch sẽ trở về trạng thái ban đầu.'
            : 'Bạn có chắc chắn muốn xóa ngoại lệ này? Lịch sẽ trở về trạng thái ban đầu.';

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setDeleting(true);
            const response = await scheduleExceptionService.deleteScheduleException(requestData.id);

            if (response.success) {
                toast.success('Đã xóa ngoại lệ thành công. Lịch đã trở về trạng thái ban đầu.');
                navigate('/rooms/requests/list');
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi xóa ngoại lệ');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa ngoại lệ');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!requestData) {
        return (
            <Alert severity="error">
                Không tìm thấy thông tin yêu cầu
            </Alert>
        );
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 1.5, md: 3 } }}>
            {/* Header */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
                <Grid size={{ xs: 'auto' }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/rooms/requests/list')}
                        size={isMobile ? "small" : "medium"}
                        sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem' }
                        }}
                    >
                        Quay lại
                    </Button>
                </Grid>
                <Grid size={{ xs: 'auto', sm: 'auto', md: 'auto' }} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                        variant="h4" 
                        component="h1"
                        sx={{
                            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                            fontWeight: 'bold',
                            color: 'primary.main',
                            wordBreak: 'break-word',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        Xử lý yêu cầu #{requestData.id}
                    </Typography>
                </Grid>
            </Grid>

            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                {/* Thông tin yêu cầu */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                            <Typography 
                                variant="h6" 
                                gutterBottom
                                sx={{
                                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                    mb: { xs: 1.5, sm: 2 }
                                }}
                            >
                                Thông tin yêu cầu
                            </Typography>

                            <Stack spacing={{ xs: 1.5, sm: 2 }}>
                                <Box>
                                    <Typography 
                                        variant="subtitle2" 
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                    >
                                        Trạng thái:
                                    </Typography>
                                    <Chip
                                        icon={(() => {
                                            const statusName = requestData.RequestStatus?.name?.toLowerCase() || '';
                                            if (statusName.includes('đã duyệt') || statusName.includes('approved') || statusName.includes('hoàn thành') || statusName.includes('completed')) {
                                                return <ApproveIcon />;
                                            } else if (statusName.includes('từ chối') || statusName.includes('rejected')) {
                                                return <RejectIcon />;
                                            } else {
                                                return <PendingIcon />;
                                            }
                                        })()}
                                        label={requestData.RequestStatus?.name || 'Chưa xác định'}
                                        color={(() => {
                                            const statusName = requestData.RequestStatus?.name?.toLowerCase() || '';
                                            if (statusName.includes('đã duyệt') || statusName.includes('approved') || statusName.includes('hoàn thành') || statusName.includes('completed')) {
                                                return 'success';
                                            } else if (statusName.includes('từ chối') || statusName.includes('rejected')) {
                                                return 'error';
                                            } else {
                                                return 'warning';
                                            }
                                        })()}
                                        size="small"
                                        variant="filled"
                                        sx={{ 
                                            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                                            height: { xs: 24, sm: 28, md: 32 },
                                            mt: 0.5
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography 
                                        variant="subtitle2" 
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                    >
                                        Loại yêu cầu:
                                    </Typography>
                                    <Chip
                                        label={requestData.RequestType?.name || getRequestTypeText(requestData.requestTypeId)}
                                        color="primary"
                                        size="small"
                                        sx={{ 
                                            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                                            height: { xs: 20, sm: 24, md: 28 },
                                            mt: 0.5
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography 
                                        variant="subtitle2" 
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                    >
                                        Người yêu cầu:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                        <PersonIcon sx={{ 
                                            mr: 1, 
                                            fontSize: { xs: 14, sm: 16, md: 18 } 
                                        }} />
                                        <Typography 
                                            variant="body2"
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                        >
                                            {requestData.requester?.fullName}
                                            {(requestData.requester?.teacher?.teacherCode || requestData.classSchedule?.class?.teacher?.teacherCode) && (
                                                <Typography 
                                                    component="span" 
                                                    variant="caption" 
                                                    color="text.secondary"
                                                    sx={{ 
                                                        ml: 1,
                                                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                                                    }}
                                                >
                                                    ({requestData.requester?.teacher?.teacherCode || requestData.classSchedule?.class?.teacher?.teacherCode})
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Box>

                                    {/* Hiển thị giáo viên của lớp học nếu khác với người yêu cầu */}
                                    {requestData.classSchedule?.class?.teacher && 
                                     requestData.classSchedule.class.teacher.user?.fullName && 
                                     requestData.classSchedule.class.teacher.user.fullName !== requestData.requester?.fullName && (
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}
                                            >
                                                Giáo viên lớp học: {requestData.classSchedule.class.teacher.user.fullName}
                                                {requestData.classSchedule.class.teacher.teacherCode && (
                                                    <Typography 
                                                        component="span" 
                                                        variant="caption" 
                                                        color="text.secondary"
                                                        sx={{ 
                                                            ml: 0.5,
                                                            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' }
                                                        }}
                                                    >
                                                        ({requestData.classSchedule.class.teacher.teacherCode})
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                <Box>
                                    <Typography 
                                        variant="subtitle2" 
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                    >
                                        Lý do yêu cầu:
                                    </Typography>
                                    <Paper sx={{ 
                                        p: { xs: 1, sm: 1.5, md: 2 }, 
                                        mt: 0.5, 
                                        bgcolor: 'grey.50' 
                                    }}>
                                        <Typography 
                                            variant="body2"
                                            sx={{ 
                                                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                                                wordBreak: 'break-word',
                                                whiteSpace: 'normal'
                                            }}
                                        >
                                            {requestData.reason}
                                        </Typography>
                                    </Paper>
                                </Box>

                                <Box>
                                    <Typography 
                                        variant="subtitle2" 
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                    >
                                        Ngày gửi:
                                    </Typography>
                                    <Typography 
                                        variant="body2"
                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                    >
                                        {new Date(requestData.createdAt).toLocaleDateString('vi-VN')}
                                    </Typography>
                                </Box>

                                {/* Hiển thị ngày ngoại lệ nếu có */}
                                {requestData.exceptionDate && (
                                    <Box>
                                        <Typography 
                                            variant="subtitle2" 
                                            color="text.secondary"
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                        >
                                            Ngày ngoại lệ:
                                        </Typography>
                                        <Typography 
                                            variant="body2"
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                        >
                                            {new Date(requestData.exceptionDate).toLocaleDateString('vi-VN')}
                                        </Typography>
                                    </Box>
                                )}

                                {/* Hiển thị thông tin người duyệt và ngày duyệt nếu đã được xử lý */}
                                {requestData.approver && requestData.approvedAt && (
                                    <>
                                        <Box>
                                            <Typography 
                                                variant="subtitle2" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                            >
                                                Người xử lý:
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <PersonIcon sx={{ 
                                                    mr: 1, 
                                                    fontSize: { xs: 14, sm: 16, md: 18 },
                                                    color: 'success.main'
                                                }} />
                                                <Typography 
                                                    variant="body2"
                                                    sx={{ 
                                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                                                        color: 'success.main',
                                                        fontWeight: 'medium'
                                                    }}
                                                >
                                                    {requestData.approver.fullName}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Typography 
                                                variant="subtitle2" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                            >
                                                Ngày xử lý:
                                            </Typography>
                                            <Typography 
                                                variant="body2"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                            >
                                                {new Date(requestData.approvedAt).toLocaleDateString('vi-VN')}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                {/* Hiển thị ghi chú nếu có */}
                                {requestData.note && (
                                    <Box>
                                        <Typography 
                                            variant="subtitle2" 
                                            color="text.secondary"
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                        >
                                            Ghi chú:
                                        </Typography>
                                        <Paper sx={{ 
                                            p: { xs: 1, sm: 1.5, md: 2 }, 
                                            mt: 0.5, 
                                            bgcolor: 'info.light',
                                            border: '1px solid',
                                            borderColor: 'info.main'
                                        }}>
                                            <Typography 
                                                variant="body2"
                                                sx={{ 
                                                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                                                    wordBreak: 'break-word',
                                                    whiteSpace: 'normal',
                                                    color: 'info.dark'
                                                }}
                                            >
                                                {requestData.note}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Thông tin lớp học */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                            <Typography 
                                variant="h6" 
                                gutterBottom
                                sx={{
                                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                    mb: { xs: 1.5, sm: 2 }
                                }}
                            >
                                Thông tin lớp học
                            </Typography>

                            {(requestData.classSchedule?.class || requestData.class) ? (
                                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                                    <Box>
                                        <Typography 
                                            variant="subtitle2" 
                                            color="text.secondary"
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                        >
                                            Tên lớp:
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                            <ClassIcon sx={{ 
                                                mr: 1, 
                                                fontSize: { xs: 14, sm: 16, md: 18 } 
                                            }} />
                                            <Typography 
                                                variant="body2"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                            >
                                                {requestData.classSchedule?.class?.className || requestData.class?.className}
                                            </Typography>
                                        </Box>
                                        {/* <Typography 
                                            variant="caption" 
                                            color="text.secondary"
                                            sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}
                                        >
                                            {requestData.classSchedule?.class?.subjectName || requestData.class?.subjectName} ({requestData.classSchedule?.class?.subjectCode || requestData.class?.subjectCode})
                                        </Typography> */}
                                    </Box>

                                    <Box>
                                        <Typography 
                                            variant="subtitle2" 
                                            color="text.secondary"
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                        >
                                            Sĩ số:
                                        </Typography>
                                        <Typography 
                                            variant="body2"
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                        >
                                            {requestData.classSchedule?.class?.maxStudents || requestData.class?.maxStudents} sinh viên
                                        </Typography>
                                    </Box>

                                    {requestData.classSchedule && (
                                        <Box>
                                            <Typography 
                                                variant="subtitle2" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                            >
                                                Lịch học hiện tại:
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <ScheduleIcon sx={{ 
                                                    mr: 1, 
                                                    fontSize: { xs: 14, sm: 16, md: 18 } 
                                                }} />
                                                <Typography 
                                                    variant="body2"
                                                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                                >
                                                    {getDayName(requestData.classSchedule.dayOfWeek)} - {getTimeSlotName(requestData.classSchedule.timeSlotId, requestData.classSchedule.timeSlot)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    {/* Hiển thị lịch yêu cầu cho đổi lịch */}
                                    {requestData.RequestType?.name === 'Đổi lịch' && requestData.movedToTimeSlotId && requestData.movedToDayOfWeek && (
                                        <Box>
                                            <Typography 
                                                variant="subtitle2" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                            >
                                                Lịch học yêu cầu:
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <ScheduleIcon sx={{ 
                                                    mr: 1, 
                                                    fontSize: { xs: 14, sm: 16, md: 18 }, 
                                                    color: 'primary.main' 
                                                }} />
                                                <Typography 
                                                    variant="body2" 
                                                    color="primary.main" 
                                                    fontWeight="bold"
                                                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                                >
                                                    {getDayName(requestData.movedToDayOfWeek)} - {getTimeSlotName(requestData.movedToTimeSlotId, requestData.movedToTimeSlot)}
                                                </Typography>
                                            </Box>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}
                                            >
                                                Thứ trong tuần: {getDayName(requestData.movedToDayOfWeek)}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Hiển thị phòng đã xử lý (newClassRoom) nếu có, nếu không thì hiển thị phòng hiện tại */}
                                    {(requestData.newClassRoom || requestData.classSchedule?.classRoom) && (
                                        <Box>
                                            <Typography 
                                                variant="subtitle2" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                            >
                                                {requestData.newClassRoom ? 'Phòng đã phân:' : 'Phòng hiện tại:'}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                <RoomIcon sx={{ 
                                                    mr: 1, 
                                                    fontSize: { xs: 14, sm: 16, md: 18 },
                                                    color: requestData.newClassRoom ? 'success.main' : 'inherit'
                                                }} />
                                                <Typography 
                                                    variant="body2"
                                                    sx={{ 
                                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                                                        color: requestData.newClassRoom ? 'success.main' : 'inherit',
                                                        fontWeight: requestData.newClassRoom ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {requestData.newClassRoom 
                                                        ? `${requestData.newClassRoom.name} (${requestData.newClassRoom.code})`
                                                        : `${requestData.classSchedule?.classRoom?.name} (${requestData.classSchedule?.classRoom?.code})`}
                                                </Typography>
                                            </Box>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                                sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}
                                            >
                                                Sức chứa: {requestData.newClassRoom?.capacity || requestData.classSchedule?.classRoom?.capacity} chỗ
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            ) : (
                                <Alert 
                                    severity="info"
                                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                >
                                    Yêu cầu phòng độc lập (không liên quan đến lớp học cụ thể)
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Chọn phòng học - Chỉ hiển thị khi cần và chưa xử lý */}
            {requestData && shouldShowRoomSelection(requestData) && requestData.RequestStatus?.name !== 'Hoàn thành' && requestData.RequestStatus?.name !== 'Đã duyệt' && (
            <Box sx={{ mt: { xs: 2, sm: 2.5, md: 3 } }}>
                <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                        <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                mb: { xs: 1.5, sm: 2 }
                            }}
                        >
                            Chọn phòng học phù hợp
                        </Typography>

                        {requestData.RequestType?.name === 'Đổi lịch' && (
                            <Alert 
                                severity="info" 
                                sx={{ 
                                    mb: { xs: 1.5, sm: 2 },
                                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                            >
                                <Typography 
                                    variant="body2"
                                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                                >
                                    <strong>Lưu ý:</strong> Các phòng được đề xuất đã được kiểm tra không trùng lịch với lịch học yêu cầu.
                                    Lịch yêu cầu: {getDayName(requestData.movedToDayOfWeek || 7)} - Tiết {requestData.movedToTimeSlotId}
                                </Typography>
                            </Alert>
                        )}

                        {requestData.requestTypeId === 6 && requestData.exceptionType === 'exam' && (
                            <Alert 
                                severity="info" 
                                sx={{ 
                                    mb: { xs: 1.5, sm: 2 },
                                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }}
                            >
                            </Alert>
                        )}

                        <FormControl 
                            fullWidth 
                            size={isMobile ? "small" : "medium"}
                            sx={{ mb: { xs: 1.5, sm: 2 } }}
                        >
                            <InputLabel 
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            >
                                Phòng học đề xuất
                            </InputLabel>
                            <Select
                                value={selectedRoomId}
                                onChange={(e) => setSelectedRoomId(e.target.value as number)}
                                label="Phòng học đề xuất"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            >
                                {suggestedRooms.map((room) => (
                                    <MenuItem 
                                        key={room.id} 
                                        value={room.id}
                                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                    >
                                        <Box sx={{ width: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography 
                                                    variant="body1"
                                                    sx={{ 
                                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                                                        wordBreak: 'break-word'
                                                    }}
                                                >
                                                    {room.name} ({room.code})
                                                </Typography>
                                                {room.isFreedByException && (
                                                    <Chip
                                                        label="🎉 Trống do ngoại lệ"
                                                        size="small"
                                                        color="success"
                                                        sx={{ 
                                                            fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }, 
                                                            height: { xs: 18, sm: 20, md: 20 },
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary"
                                                sx={{ 
                                                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                                                    wordBreak: 'break-word',
                                                    whiteSpace: 'normal',
                                                    display: 'block',
                                                    mt: 0.5
                                                }}
                                            >
                                                {room.building} - Tầng {room.floor} | Sức chứa: {room.capacity} |
                                                Loại: {room.ClassRoomType?.name}
                                            </Typography>
                                            {room.isFreedByException && room.exceptionInfo && (
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        display: 'block',
                                                        color: 'success.main',
                                                        fontStyle: 'italic',
                                                        mt: 0.5,
                                                        fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }
                                                    }}
                                                >
                                                    Lớp {room.exceptionInfo.className} {room.exceptionInfo.exceptionType === 'cancelled' ? 'nghỉ' : 'thi'}
                                                </Typography>
                                            )}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {suggestedRooms.length === 0 && (
                            <Alert 
                                severity="warning"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                            >
                                Không tìm thấy phòng học phù hợp. Vui lòng kiểm tra lại yêu cầu.
                            </Alert>
                        )}

                        {/* Chọn giảng viên cho thi giữa kỳ và thi cuối kỳ */}
                        {(requestData.requestTypeId === 6 || requestData.requestTypeId === 10) && (
                            <FormControl 
                                fullWidth 
                                size={isMobile ? "small" : "medium"}
                                sx={{ mt: { xs: 1.5, sm: 2 } }}
                                required={requestData.requestTypeId === 10}
                            >
                                <InputLabel 
                                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                    {requestData.requestTypeId === 10 ? 'Chọn giảng viên *' : 'Chọn giảng viên (tùy chọn)'}
                                </InputLabel>
                                <Select
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value as number)}
                                    label={requestData.requestTypeId === 10 ? 'Chọn giảng viên *' : 'Chọn giảng viên (tùy chọn)'}
                                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                    disabled={loadingTeachers}
                                    required={requestData.requestTypeId === 10}
                                >
                                    {requestData.requestTypeId === 6 && (
                                        <MenuItem value="">
                                            <em>Không chọn (dùng giảng viên của lớp)</em>
                                        </MenuItem>
                                    )}
                                    {loadingTeachers ? (
                                        <MenuItem disabled value="">
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CircularProgress size={16} />
                                                <Typography variant="body2">Đang tải...</Typography>
                                            </Box>
                                        </MenuItem>
                                    ) : availableTeachers.length > 0 ? (
                                        availableTeachers.map((teacher) => (
                                            <MenuItem 
                                                key={teacher.id} 
                                                value={teacher.id}
                                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                            >
                                                {teacher.fullName || teacher.name} {teacher.teacherCode && `(${teacher.teacherCode})`}
                                            </MenuItem>
                                        ))
                                    ) : (
                                        <MenuItem disabled value="">
                                            Không có giảng viên trống vào thời điểm này
                                        </MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        )}
                    </CardContent>
                </Card>
            </Box>
            )}

            {/* Chọn giảng viên thay thế cho đổi giáo viên - Phần riêng vì không cần chọn phòng */}
            {requestData && requestData.requestTypeId === 9 && requestData.RequestStatus?.name !== 'Hoàn thành' && requestData.RequestStatus?.name !== 'Đã duyệt' && (
            <Box sx={{ mt: { xs: 2, sm: 2.5, md: 3 } }}>
                <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                        <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{
                                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                                mb: { xs: 1.5, sm: 2 }
                            }}
                        >
                            Chọn giảng viên thay thế
                        </Typography>

                        <Alert 
                            severity="info" 
                            sx={{ 
                                mb: { xs: 1.5, sm: 2 },
                                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                            }}
                        >
                            <Typography 
                                variant="body2"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                            >
                                <strong>Lưu ý:</strong> Chỉ hiển thị các giảng viên cùng khoa và không có tiết dạy vào thời điểm này.
                                {requestData.exceptionDate && requestData.classSchedule && (
                                    <> Ngày: {new Date(requestData.exceptionDate).toLocaleDateString('vi-VN')} - Tiết {requestData.classSchedule.timeSlotId}</>
                                )}
                            </Typography>
                        </Alert>

                        <FormControl 
                            fullWidth 
                            size={isMobile ? "small" : "medium"}
                        >
                            <InputLabel 
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            >
                                Chọn giảng viên thay thế
                            </InputLabel>
                            <Select
                                value={selectedTeacherId}
                                onChange={(e) => setSelectedTeacherId(e.target.value as number)}
                                label="Chọn giảng viên thay thế"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                disabled={loadingTeachers}
                            >
                                {loadingTeachers ? (
                                    <MenuItem disabled value="">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CircularProgress size={16} />
                                            <Typography variant="body2">Đang tải danh sách giảng viên...</Typography>
                                        </Box>
                                    </MenuItem>
                                ) : availableTeachers.length > 0 ? (
                                    availableTeachers.map((teacher) => (
                                        <MenuItem 
                                            key={teacher.id} 
                                            value={teacher.id}
                                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                        >
                                            {teacher.fullName || teacher.name} {teacher.teacherCode && `(${teacher.teacherCode})`}
                                        </MenuItem>
                                    ))
                                ) : (
                                    <MenuItem disabled value="">
                                        Không có giảng viên trống vào thời điểm này
                                    </MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </CardContent>
                </Card>
            </Box>
            )}


            {/* Ghi chú và nút xử lý - Chỉ hiển thị khi chưa xử lý */}
            {requestData.RequestStatus?.name !== 'Hoàn thành' && requestData.RequestStatus?.name !== 'Đã duyệt' && (
            <Box sx={{ mt: { xs: 2, sm: 2.5, md: 3 } }}>
                <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={isMobile ? 2 : 3}
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            label="Ghi chú của admin"
                            placeholder="Nhập ghi chú về việc xử lý yêu cầu..."
                            size={isMobile ? "small" : "medium"}
                            InputLabelProps={{
                                sx: { fontSize: { xs: '0.7rem', sm: '0.75rem' } }
                            }}
                            sx={{ 
                                mb: { xs: 1.5, sm: 2 },
                                '& .MuiInputBase-root': {
                                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                }
                            }}
                        />

                        <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} justifyContent="flex-end">
                            <Grid size={{ xs: 6, sm: 'auto' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/rooms/requests/list')}
                                    fullWidth={isMobile}
                                    size={isMobile ? "medium" : "large"}
                                    sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                    }}
                                >
                                    Hủy
                                </Button>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 'auto' }}>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleProcessRequest}
                                    disabled={
                                        ((requestData && shouldShowRoomSelection(requestData) && !selectedRoomId) || 
                                         (requestData?.requestTypeId === 9 && !selectedTeacherId) ||
                                         (requestData?.requestTypeId === 10 && !selectedTeacherId)) || 
                                        processing
                                    }
                                    fullWidth={isMobile}
                                    size={isMobile ? "medium" : "large"}
                                    sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                    }}
                                >
                                    {processing ? 'Đang xử lý...' : 'Xử lý yêu cầu'}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
            )}

            {requestData && 
             (requestData.RequestStatus?.name === 'Hoàn thành' || requestData.RequestStatus?.name === 'Đã duyệt') &&
             requestData.requestTypeId >= 5 && 
             requestData.requestTypeId <= 10 && (
            <Box sx={{ mt: { xs: 2, sm: 2.5, md: 3 } }}>
                <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
                        <Alert 
                            severity="info" 
                            sx={{ 
                                mb: { xs: 1.5, sm: 2 },
                                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                            }}
                        >
                            <Typography 
                                variant="body2"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } }}
                            >
                                <strong>Lưu ý:</strong> Xóa ngoại lệ này sẽ trả lịch học về trạng thái ban đầu. 
                                {requestData.requestTypeId === 10 
                                    ? ' (Thi cuối kỳ)'
                                    : requestData.classScheduleId 
                                        ? ' Lịch học sẽ trở về phòng và thời gian ban đầu.'
                                        : ''}
                            </Typography>
                        </Alert>

                        <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} justifyContent="flex-end">
                            <Grid size={{ xs: 12, sm: 'auto' }}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={handleDeleteException}
                                    disabled={deleting || (requestData.requestTypeId !== 10 && !requestData.classScheduleId)}
                                    fullWidth={isMobile}
                                    size={isMobile ? "medium" : "large"}
                                    sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                    }}
                                >
                                    {deleting ? 'Đang xóa...' : 'Xóa ngoại lệ'}
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
            )}
        </Box>
    );
};

export default ProcessRequest;
