import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { toast } from 'react-toastify';
import { roomService, roomIssueService } from '../../services/api';
import { Typography, Box, CircularProgress, Alert, Button, IconButton, Tooltip, Card, CardContent, Chip, Paper, Grid, useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Tabs, Tab } from '@mui/material';
import { Refresh as RefreshIcon, Warning as WarningIcon, Build as BuildIcon, Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import EquipmentRequestDialog from './EquipmentRequestDialog';

interface TeacherSchedule {
  id: number;
  class: {
    id: number;
    code: string;
    className: string;
    subjectName: string;
    subjectCode: string;
    maxStudents: number;
  };
  classRoom: {
    id: number;
    code: string;
    name: string;
    capacity: number;
    ClassRoomType?: {
      name: string;
    };
  };
  timeSlot: {
    id: number;
    slotName: string;
    startTime: string;
    endTime: string;
    shift: number;
  };
  dayOfWeek: number;
  dayName: string;
}

const TeacherClassManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useSelector((state: RootState) => state.auth);

  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  // Equipment request dialog
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);

  // Room issue dialog
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    issueType: 'equipment',
    affectedEquipmentId: '',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: '',
    autoCreateException: false
  });

  const loadSchedules = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await roomService.getTeacherSchedules(user.id);
      if (response.success) {
        const formattedSchedules = (response.data || []).map((schedule: any) => ({
          ...schedule,
          dayName: getDayName(schedule.dayOfWeek)
        }));
        setSchedules(formattedSchedules);
      } else {
        setError(response.message || 'Không thể tải danh sách lớp học');
      }
    } catch (err: any) {
      setError('Không thể tải danh sách lớp học');
      console.error('Error loading schedules:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSchedules();
  }, [refreshKey, loadSchedules]);

  const getDayName = (dayOfWeek: number): string => {
    const days = ['', 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayOfWeek] || '';
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleOpenEquipmentDialog = (schedule: TeacherSchedule) => {
    setSelectedSchedule(schedule);
    setEquipmentDialogOpen(true);
  };

  const handleCloseEquipmentDialog = () => {
    setEquipmentDialogOpen(false);
    setSelectedSchedule(null);
  };

  const handleOpenIssueDialog = (schedule: TeacherSchedule) => {
    setSelectedSchedule(schedule);
    setIssueForm({
      title: '',
      description: '',
      severity: 'medium',
      issueType: 'equipment',
      affectedEquipmentId: '',
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: '',
      autoCreateException: false
    });
    setIssueDialogOpen(true);
  };

  const handleCloseIssueDialog = () => {
    setIssueDialogOpen(false);
    setSelectedSchedule(null);
    setIssueForm({
      title: '',
      description: '',
      severity: 'medium',
      issueType: 'equipment',
      affectedEquipmentId: '',
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: '',
      autoCreateException: false
    });
  };

  const handleSubmitIssue = async () => {
    if (!selectedSchedule || !user?.id) return;

    if (!issueForm.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }

    if (!issueForm.description.trim()) {
      toast.error('Vui lòng nhập mô tả');
      return;
    }

    try {
      const issueData = {
        classRoomId: selectedSchedule.classRoom.id.toString(),
        reportedBy: user.id.toString(),
        issueType: issueForm.issueType,
        title: issueForm.title.trim(),
        description: issueForm.description.trim(),
        severity: issueForm.severity,
        startDate: issueForm.startDate,
        endDate: issueForm.endDate || null,
        affectedEquipmentId: issueForm.affectedEquipmentId || null,
        autoCreateException: issueForm.autoCreateException
      };

      const response = await roomIssueService.createRoomIssue(issueData);
      if (response.success) {
        toast.success('Báo cáo vấn đề thành công');
        handleCloseIssueDialog();
        handleRefresh();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi báo cáo vấn đề');
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi báo cáo vấn đề');
      console.error('Error creating issue:', error);
    }
  };

  const filteredSchedules = useMemo(() => {
    if (!searchTerm) return schedules;

    const term = searchTerm.toLowerCase();
    return schedules.filter(schedule => 
      schedule.class.className.toLowerCase().includes(term) ||
      schedule.class.code.toLowerCase().includes(term) ||
      schedule.class.subjectName.toLowerCase().includes(term) ||
      schedule.classRoom.name.toLowerCase().includes(term) ||
      schedule.classRoom.code.toLowerCase().includes(term)
    );
  }, [schedules, searchTerm]);

  if (loading && schedules.length === 0) {
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
          Đang tải danh sách lớp học...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Không thể tải danh sách lớp học</Typography>
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
      </Box>
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
          backgroundColor: '#f5f5f5',
          minHeight: '100vh'
        }}
      >
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
            Quản lý lớp/phòng dạy học
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
          >
            Xem và quản lý các lớp học và phòng học bạn đang dạy
          </Typography>
        </Box>

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
                minHeight: { xs: '40px', sm: '48px', md: '48px' }
              }
            }}
          >
            <Tab label="Danh sách lớp/phòng" />
          </Tabs>
        </Paper>

        {/* Search and Actions */}
        <Paper sx={{ p: { xs: 0.75, sm: 1, md: 1.25 }, mb: { xs: 1.5, sm: 2, md: 3 }, boxShadow: 2 }}>
          <Grid container spacing={{ xs: 1, sm: 1.25, md: 1.5 }} alignItems="center">
            <Grid size={{ xs: 12, sm: 8, md: 9 }}>
              <TextField
                fullWidth
                size="small"
                label="Tìm kiếm lớp/phòng"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nhập tên lớp, mã lớp, môn học hoặc phòng..."
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    height: { xs: '32px', sm: '36px', md: '40px' }
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                fullWidth
                size="small"
                sx={{ 
                  height: { xs: '32px', sm: '36px', md: '40px' },
                  fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' }
                }}
              >
                Làm mới
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Schedules List */}
        <Paper sx={{ boxShadow: 3 }}>
          <Box sx={{ p: { xs: 1, sm: 1.5, md: 2 }, borderBottom: '1px solid #e0e0e0' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
              }}
            >
              Danh sách lớp/phòng của bạn ({filteredSchedules.length})
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
                          {schedule.class.className}
                        </Typography>
                        <Chip
                          label={schedule.classRoom.ClassRoomType?.name || 'Phòng học'}
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
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          <strong>Mã lớp:</strong> {schedule.class.code}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: { xs: 0.75, sm: 1 },
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          <strong>Môn học:</strong> {schedule.class.subjectName}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: { xs: 0.75, sm: 1 },
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          <strong>Phòng:</strong> {schedule.classRoom.name} ({schedule.classRoom.code})
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: { xs: 0.75, sm: 1 },
                            fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                          }}
                        >
                          <strong>Thời gian:</strong> {schedule.dayName} - {schedule.timeSlot.slotName}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Tooltip title="Yêu cầu thiết bị">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<BuildIcon />}
                            onClick={() => handleOpenEquipmentDialog(schedule)}
                            sx={{ 
                              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                              minWidth: { xs: 'auto', sm: '120px' }
                            }}
                          >
                            {!isMobile && 'Thiết bị'}
                          </Button>
                        </Tooltip>
                        <Tooltip title="Báo cáo vấn đề">
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<WarningIcon />}
                            onClick={() => handleOpenIssueDialog(schedule)}
                            sx={{ 
                              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                              minWidth: { xs: 'auto', sm: '120px' }
                            }}
                          >
                            {!isMobile && 'Báo cáo'}
                          </Button>
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
                  {searchTerm ? 'Không tìm thấy lớp/phòng nào' : 'Không có lớp/phòng nào'}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mt: 1,
                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                  }}
                >
                  {searchTerm ? 'Hãy thử tìm kiếm với từ khóa khác' : 'Bạn chưa có lớp học nào được phân công'}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Equipment Request Dialog */}
        {selectedSchedule && (
          <EquipmentRequestDialog
            open={equipmentDialogOpen}
            onClose={handleCloseEquipmentDialog}
            roomId={selectedSchedule.classRoom.id.toString()}
            roomName={selectedSchedule.classRoom.name}
            type="request"
            userId={user?.id || 0}
            onSuccess={() => {
              handleCloseEquipmentDialog();
              handleRefresh();
            }}
          />
        )}

        {/* Room Issue Dialog */}
        <Dialog 
          open={issueDialogOpen} 
          onClose={handleCloseIssueDialog}
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6">Báo cáo vấn đề phòng học</Typography>
            </Box>
            <IconButton onClick={handleCloseIssueDialog} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedSchedule && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Phòng:</strong> {selectedSchedule.classRoom.name} ({selectedSchedule.classRoom.code})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Lớp:</strong> {selectedSchedule.class.className}
                  </Typography>
                </Alert>

                <FormControl fullWidth size="small">
                  <InputLabel>Loại vấn đề</InputLabel>
                  <Select
                    value={issueForm.issueType}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, issueType: e.target.value }))}
                    label="Loại vấn đề"
                  >
                    <MenuItem value="equipment">Thiết bị</MenuItem>
                    <MenuItem value="infrastructure">Cơ sở hạ tầng</MenuItem>
                    <MenuItem value="maintenance">Bảo trì</MenuItem>
                    <MenuItem value="other">Khác</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Tiêu đề"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  size="small"
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Mô tả chi tiết"
                  value={issueForm.description}
                  onChange={(e) => setIssueForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                  placeholder="Mô tả chi tiết vấn đề..."
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Mức độ nghiêm trọng</InputLabel>
                  <Select
                    value={issueForm.severity}
                    onChange={(e) => setIssueForm(prev => ({ ...prev, severity: e.target.value }))}
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
                    label="Ngày bắt đầu"
                    value={issueForm.startDate ? dayjs(issueForm.startDate) : null}
                    onChange={(newValue) => {
                      if (newValue) {
                        setIssueForm(prev => ({ ...prev, startDate: newValue.format('YYYY-MM-DD') }));
                      }
                    }}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="Ngày kết thúc (tùy chọn)"
                    value={issueForm.endDate ? dayjs(issueForm.endDate) : null}
                    onChange={(newValue) => {
                      if (newValue) {
                        setIssueForm(prev => ({ ...prev, endDate: newValue.format('YYYY-MM-DD') }));
                      } else {
                        setIssueForm(prev => ({ ...prev, endDate: '' }));
                      }
                    }}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseIssueDialog}>Hủy</Button>
            <Button 
              onClick={handleSubmitIssue} 
              variant="contained" 
              color="warning"
              disabled={!issueForm.title.trim() || !issueForm.description.trim()}
            >
              Gửi báo cáo
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TeacherClassManagement;

