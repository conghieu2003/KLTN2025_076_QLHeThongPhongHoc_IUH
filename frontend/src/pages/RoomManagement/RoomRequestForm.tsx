import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Radio, RadioGroup, TextField, Paper } from '@mui/material';    
import { Class as ClassIcon, Room as RoomIcon, Schedule as ScheduleIcon, CheckCircle as CheckCircleIcon, Send as SendIcon, Info as InfoIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { roomService } from '../../services/api';

interface ScheduleRequestForm {
    requestType: 'room_request' | 'schedule_change' | 'exception' | 'time_change';
    classScheduleId?: number;
    requesterId: number;
    requestDate: string;
    timeSlotId: number;
    dayOfWeek?: number;
    changeType?: 'room_change' | 'time_change' | 'both' | 'exception';
    oldClassRoomId?: number;
    oldTimeSlotId?: number;
    exceptionDate?: string;
    exceptionType?: 'cancelled' | 'exam' | 'moved' | 'substitute';
    reason: string;
}

interface ClassSchedule {
    id: number;
    classId: number;
    teacherId: number;
    classRoomId?: number;
    dayOfWeek: number;
    timeSlotId: number;
    weekPattern: string;
    startWeek: number;
    endWeek: number;
    status: string;
    class: {
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
        type: string;
    };
    timeSlot: {
        id: number;
        slotName: string;
        startTime: string;
        endTime: string;
        shift: string;
    };
}

interface TimeSlot {
    id: number;
    slotName: string;
    startTime: string;
    endTime: string;
    shift: string;
}

// interface ClassRoom {
//     id: number;
//     code: string;
//     name: string;
//     capacity: number;
//     building: string;
//     floor: number;
//     type: string;
//     isAvailable: boolean;
// }

const RoomRequestForm: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [loading, setLoading] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const [formData, setFormData] = useState<ScheduleRequestForm>({
        requestType: 'room_request',
        requesterId: user?.id || 0,
        requestDate: new Date().toISOString().split('T')[0],
        timeSlotId: 0,
        reason: ''
    });

    const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);

    useEffect(() => {
        loadInitialData();
    }, []); 

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const timeSlotsResponse = await roomService.getTimeSlots();
            if (timeSlotsResponse.success) {
                setTimeSlots(timeSlotsResponse.data);
            }

            if (user?.id) {
                const schedulesResponse = await roomService.getTeacherSchedules(user.id);
                if (schedulesResponse.success) {
                    setClassSchedules(schedulesResponse.data);
                }
            }
        } catch (error) {
            toast.error('Lỗi tải dữ liệu');
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: string[] = [];

        console.log('Validation check:');
        console.log('- requestType:', formData.requestType);
        console.log('- selectedSchedule:', selectedSchedule);
        console.log('- timeSlotId:', formData.timeSlotId);
        console.log('- oldClassRoomId:', formData.oldClassRoomId);
        console.log('- reason:', formData.reason);

        if (!formData.requestType) {
            errors.push('Vui lòng chọn loại yêu cầu');
        }
        if (!selectedSchedule) {
            errors.push('Vui lòng chọn lớp học');
        }
        if (formData.requestType === 'time_change' && !formData.timeSlotId) {
            errors.push('Vui lòng chọn tiết học');
        }
        if (formData.requestType === 'time_change' && !formData.dayOfWeek) {
            errors.push('Vui lòng chọn thứ trong tuần');
        }
        if (!formData.reason.trim()) {
            errors.push('Vui lòng nhập lý do');
        }

        console.log('Validation errors:', errors);
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleScheduleChange = (scheduleId: string) => {
        const schedule = classSchedules.find(s => s.id === parseInt(scheduleId));
        setSelectedSchedule(schedule || null);
        setFormData(prev => ({
            ...prev,
            classScheduleId: schedule?.id || 0,
            oldClassRoomId: schedule?.classRoomId,
            oldTimeSlotId: schedule?.timeSlotId,
            dayOfWeek: schedule?.dayOfWeek,
            ...(prev.requestType !== 'schedule_change' && { timeSlotId: schedule?.timeSlotId || 0 })
        }));

    };

    const handleSubmit = async () => {
        console.log('handleSubmit called');
        console.log('formData:', formData);
        console.log('selectedSchedule:', selectedSchedule);
        console.log('user:', user);

        if (!validateForm()) {
            console.log('Validation failed');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                requestTypeId: getRequestTypeId(formData.requestType),
                classScheduleId: selectedSchedule?.id || null,
                requesterId: user?.id || 0,
                requestDate: new Date().toISOString().split('T')[0],
                reason: formData.reason,
                ...(formData.requestType === 'room_request' && {
                    timeSlotId: formData.timeSlotId
                }),
                ...(formData.requestType === 'time_change' && {
                    timeSlotId: selectedSchedule?.timeSlotId, 
                    changeType: 'time_change',
                    oldTimeSlotId: selectedSchedule?.timeSlotId,
                    movedToTimeSlotId: formData.timeSlotId, 
                    movedToDayOfWeek: formData.dayOfWeek 
                }),
                ...(formData.requestType === 'schedule_change' && {
                    timeSlotId: selectedSchedule?.timeSlotId,
                    changeType: 'room_change',
                    oldClassRoomId: selectedSchedule?.classRoomId
                }),
                ...(formData.requestType === 'exception' && {
                    timeSlotId: selectedSchedule?.timeSlotId,
                    exceptionType: 'cancelled',
                    exceptionDate: new Date().toISOString().split('T')[0]
                })
            };

            console.log('Sending request data:', requestData);
            console.log('formData.dayOfWeek:', formData.dayOfWeek);
            console.log('formData.timeSlotId:', formData.timeSlotId);
            const response = await roomService.createScheduleRequest(requestData);
            console.log('Response:', response);

            if (response.success) {
                toast.success('Yêu cầu đã được gửi thành công!');

                setFormData({
                    requestType: 'room_request',
                    requesterId: user?.id || 0,
                    requestDate: new Date().toISOString().split('T')[0],
                    timeSlotId: 0,
                    reason: ''
                });
                setSelectedSchedule(null);
            } else {
                toast.error(response.message || 'Có lỗi xảy ra khi gửi yêu cầu');
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi gửi yêu cầu');
            console.error('Error submitting request:', error);
        } finally {
            setLoading(false);
            setConfirmDialogOpen(false);
        }
    };

    const getDayName = (dayOfWeek: number): string => {
        const days = ['', 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[dayOfWeek] || '';
    };

    const getRequestTypeId = (requestType: string): number => {
        switch (requestType) {
            case 'room_request':
                return 7; // Đổi phòng
            case 'schedule_change':
                return 7; // Đổi phòng
            case 'time_change':
                return 8; // Đổi lịch
            case 'exception':
                return 8; // Đổi lịch
            default:
                return 7; // Mặc định là Đổi phòng
        }
    };

    const renderFormContent = () => {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Chọn loại yêu cầu */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Loại yêu cầu
                        </Typography>
                        <FormControl component="fieldset">
                            <RadioGroup
                                value={formData.requestType}
                                onChange={(e) => {
                                    const newRequestType = e.target.value as 'room_request' | 'schedule_change' | 'exception' | 'time_change';
                                    setFormData(prev => ({
                                        ...prev,
                                        requestType: newRequestType,
                                        classScheduleId: undefined,
                                        // Bỏ newClassRoomId
                                        newTimeSlotId: undefined,
                                        dayOfWeek: undefined,
                                        // Chỉ reset timeSlotId nếu không phải schedule_change
                                        ...(newRequestType !== 'schedule_change' && { timeSlotId: 0 })
                                    }));
                                    setSelectedSchedule(null);
                                    // Bỏ setAvailableRooms
                                }}
                                row
                            >
                                <FormControlLabel value="room_request" control={<Radio />} label="Xin phòng mới" />
                                <FormControlLabel value="schedule_change" control={<Radio />} label="Đổi phòng" />
                                <FormControlLabel value="time_change" control={<Radio />} label="Đổi lịch học" />
                                <FormControlLabel value="exception" control={<Radio />} label="Ngoại lệ" />
                            </RadioGroup>
                        </FormControl>
                    </CardContent>
                </Card>

                {/* Chọn lớp học */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            <ClassIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Chọn lớp học
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>Lớp học</InputLabel>
                            <Select
                                value={formData.classScheduleId?.toString() || ''}
                                onChange={(e) => handleScheduleChange(e.target.value)}
                                label="Lớp học"
                            >
                                {classSchedules.map((schedule) => (
                                    <MenuItem key={schedule.id} value={schedule.id}>
                                        <Box>
                                            <Typography variant="body1">{schedule.class.className}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {schedule.class.subjectName} ({schedule.class.subjectCode}) -
                                                {getDayName(schedule.dayOfWeek)} {schedule.timeSlot.slotName} -
                                                {schedule.classRoom?.name || 'Chưa có phòng'}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </CardContent>
                </Card>

                {/* Thông tin lớp học khi đã chọn */}
                {selectedSchedule && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Thông tin lớp học
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Tên lớp học:
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedSchedule.class.className}
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                                            Môn học:
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedSchedule.class.subjectName} ({selectedSchedule.class.subjectCode})
                                        </Typography>
                                    </Paper>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Paper sx={{ p: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Số sinh viên:
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedSchedule.class.maxStudents} sinh viên
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                                            Phòng hiện tại:
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedSchedule.classRoom?.name || ''}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Chọn thứ trong tuần và tiết học cho đổi lịch học */}
                {formData.requestType === 'time_change' && selectedSchedule && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Chọn thứ trong tuần và tiết học
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Thứ trong tuần</InputLabel>
                                        <Select
                                            value={formData.dayOfWeek || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value as number }))}
                                            label="Thứ trong tuần"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                                <MenuItem key={day} value={day}>
                                                    {getDayName(day)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tiết học</InputLabel>
                                        <Select
                                            value={formData.timeSlotId || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, timeSlotId: e.target.value as number }))}
                                            label="Tiết học"
                                        >
                                            {timeSlots.map((slot) => (
                                                <MenuItem key={slot.id} value={slot.id}>
                                                    <Box>
                                                        <Typography variant="body1">{slot.slotName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {slot.startTime} - {slot.endTime} ({slot.shift})
                                                        </Typography>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Chọn tiết học cho ngoại lệ */}
                {formData.requestType === 'exception' && selectedSchedule && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Chọn tiết học
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Tiết học hiện tại: {getDayName(selectedSchedule.dayOfWeek)} {selectedSchedule.timeSlot.slotName}
                                ({selectedSchedule.timeSlot.startTime}-{selectedSchedule.timeSlot.endTime})
                            </Alert>
                            <FormControl fullWidth>
                                <InputLabel>Tiết học</InputLabel>
                                <Select
                                    value={formData.timeSlotId || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, timeSlotId: e.target.value as number }))}
                                    label="Tiết học"
                                >
                                    {timeSlots.map((slot) => (
                                        <MenuItem key={slot.id} value={slot.id}>
                                            <Box>
                                                <Typography variant="body1">{slot.slotName}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {slot.startTime} - {slot.endTime} ({slot.shift})
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </CardContent>
                    </Card>
                )}

                {/* Thông báo về việc admin sẽ chọn phòng */}
                {(formData.requestType === 'room_request' || formData.requestType === 'schedule_change') && selectedSchedule && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <RoomIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Thông tin phòng học
                            </Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    <strong>Lưu ý:</strong> Admin sẽ xem xét yêu cầu và chọn phòng phù hợp cho lớp học này.
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Yêu cầu phòng có sức chứa tối thiểu <strong>{selectedSchedule.class.maxStudents} sinh viên</strong>
                                </Typography>
                                {selectedSchedule.classRoom && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Phòng hiện tại: <strong>{selectedSchedule.classRoom.name} ({selectedSchedule.classRoom.code})</strong>
                                    </Typography>
                                )}
                            </Alert>
                        </CardContent>
                    </Card>
                )}

                {/* Lý do yêu cầu */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Lý do yêu cầu
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder={
                                formData.requestType === 'room_request' ? 'Nhập lý do xin phòng mới...' :
                                    formData.requestType === 'schedule_change' ? 'Nhập lý do đổi phòng...' :
                                        formData.requestType === 'time_change' ? 'Nhập lý do đổi lịch học...' :
                                            'Nhập lý do xử lý ngoại lệ...'
                            }
                            variant="outlined"
                        />
                    </CardContent>
                </Card>

                {/* Thông tin tóm tắt */}
                {selectedSchedule && formData.reason && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Thông tin yêu cầu
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary">Thông tin lớp học:</Typography>
                                            <Typography variant="body1">{selectedSchedule.class.className}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedSchedule.class.subjectName} ({selectedSchedule.class.subjectCode})
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Số sinh viên: {selectedSchedule.class.maxStudents}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Paper sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary">Thông tin hiện tại:</Typography>
                                            <Typography variant="body1">
                                                {getDayName(selectedSchedule.dayOfWeek)} {selectedSchedule.timeSlot.slotName}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedSchedule.classRoom?.name || 'Chưa có phòng'}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                </Box>
                                {/* Bỏ hiển thị phòng yêu cầu vì admin sẽ chọn */}
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </Box>
        );
    };

    if (loading && !classSchedules.length) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Yêu cầu xin phòng
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Tạo yêu cầu đổi phòng, xin phòng mới hoặc xử lý ngoại lệ cho lớp học của bạn.
            </Typography>

            {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Box component="ul" sx={{ margin: 0, paddingLeft: 2.5 }}>
                        {validationErrors.map((error, index) => (
                            <Box component="li" key={index}>{error}</Box>
                        ))}
                    </Box>
                </Alert>
            )}

            {renderFormContent()}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<SendIcon />}
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={loading || !selectedSchedule || !formData.reason.trim()}
                    sx={{ minWidth: 200 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Gửi yêu cầu'}
                </Button>
            </Box>

            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Xác nhận gửi yêu cầu</DialogTitle>
                <DialogContent>
                    <Typography>
                        Bạn có chắc chắn muốn gửi yêu cầu này không?
                    </Typography>
                    {selectedSchedule && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Lớp học:</strong> {selectedSchedule.class.className}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Loại yêu cầu:</strong> {
                                    formData.requestType === 'room_request' ? 'Xin phòng mới' :
                                        formData.requestType === 'schedule_change' ? 'Đổi phòng' : 'Ngoại lệ'
                                }
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Hủy</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Xác nhận'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RoomRequestForm;