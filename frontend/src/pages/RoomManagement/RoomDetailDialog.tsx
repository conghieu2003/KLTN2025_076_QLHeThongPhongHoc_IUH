import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Divider, CircularProgress, Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, useTheme, useMediaQuery, Grid } from '@mui/material';
import {Close as CloseIcon, MeetingRoom as RoomIcon, School as TheoryIcon, Science as LabIcon, Computer as OnlineIcon, Build as EquipmentIcon, Warning as WarningIcon, CheckCircle as CheckIcon, Cancel as CancelIcon, Info as InfoIcon, MeetingRoom} from '@mui/icons-material';
import { roomService } from '../../services/api';

interface RoomDetailDialogProps {
  open: boolean;
  onClose: () => void;
  roomId: string | null;
}

interface RoomDetails {
  room: {
    id: string;
    roomNumber: string;
    name: string;
    building: string;
    floor: number;
    capacity: number;
    type: string;
    campus: string;
    department: string;
    description: string;
    isAvailable: boolean;
  };
  equipment: Array<{
    id: string;
    quantity: number;
    isWorking: boolean;
    lastMaintenanceDate: string | null;
    nextMaintenanceDate: string | null;
    note: string | null;
    equipment: {
      id: string;
      code: string;
      name: string;
      category: string;
      description: string;
    };
  }>;
  issues: Array<{
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    issueType: string;
    startDate: string;
    endDate: string | null;
    reporterName: string;
    equipmentName: string | null;
  }>;
}

const RoomDetailDialog: React.FC<RoomDetailDialogProps> = ({ open, onClose, roomId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<RoomDetails | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (open && roomId) {
      fetchRoomDetails();
    } else {
      setDetails(null);
      setError(null);
    }
  }, [open, roomId]);

  const fetchRoomDetails = async () => {
    if (!roomId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await roomService.getRoomDetails(roomId);
      if (response.success) {
        setDetails(response.data);
      } else {
        setError(response.message || 'Không thể tải thông tin phòng học');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải thông tin phòng học');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('lý thuyết') || typeLower.includes('theory') || typeLower.includes('lecture')) {
      return <TheoryIcon />;
    } else if (typeLower.includes('thực hành') || typeLower.includes('lab') || typeLower.includes('practice')) {
      return <LabIcon />;
    } else if (typeLower.includes('online')) {
      return <OnlineIcon />;
    }
    return <RoomIcon />;
  };

  const getTypeColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('lý thuyết') || typeLower.includes('theory') || typeLower.includes('lecture')) {
      return 'primary';
    } else if (typeLower.includes('thực hành') || typeLower.includes('lab') || typeLower.includes('practice')) {
      return 'secondary';
    } else if (typeLower.includes('online')) {
      return 'success';
    }
    return 'default';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Nghiêm trọng';
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return severity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Mở';
      case 'in_progress':
        return 'Đang xử lý';
      case 'resolved':
        return 'Đã giải quyết';
      case 'closed':
        return 'Đã đóng';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RoomIcon color="primary" />
          <Typography variant="h6" component="div">
            Chi tiết phòng học
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {details && !loading && (
          <Box>
            {/* Thông tin phòng học */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RoomIcon color="primary" />
                Thông tin phòng học
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Mã phòng</Typography>
                  <Typography variant="body1" fontWeight="bold">{details.room.roomNumber}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Tên phòng</Typography>
                  <Typography variant="body1" fontWeight="bold">{details.room.name}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Tòa nhà</Typography>
                  <Typography variant="body1">{details.room.building}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Tầng</Typography>
                  <Typography variant="body1">{details.room.floor}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Sức chứa</Typography>
                  <Typography variant="body1">{details.room.capacity} người</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Loại phòng</Typography>
                  <Chip
                    icon={getTypeIcon(details.room.type)}
                    label={details.room.type}
                    color={getTypeColor(details.room.type) as any}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Khoa</Typography>
                  <Typography variant="body1">{details.room.department || 'Chung'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">Cơ sở</Typography>
                  <Typography variant="body1">{details.room.campus || 'Chưa xác định'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                  <Chip
                    icon={details.room.isAvailable ? <CheckIcon /> : <CancelIcon />}
                    label={details.room.isAvailable ? 'Khả dụng' : 'Không khả dụng'}
                    color={details.room.isAvailable ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                {details.room.description && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">Mô tả</Typography>
                    <Typography variant="body1">{details.room.description}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Thiết bị */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EquipmentIcon color="primary" />
                Thiết bị ({details.equipment.length})
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              {details.equipment.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên thiết bị</TableCell>
                        <TableCell align="center">Số lượng</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                        <TableCell align="center">Bảo trì cuối</TableCell>
                        <TableCell align="center">Bảo trì tiếp theo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {details.equipment.map((eq) => (
                        <TableRow key={eq.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {eq.equipment.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {eq.equipment.code} - {eq.equipment.category}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{eq.quantity}</TableCell>
                          <TableCell align="center">
                            <Chip
                              icon={eq.isWorking ? <CheckIcon /> : <CancelIcon />}
                              label={eq.isWorking ? 'Hoạt động' : 'Hỏng'}
                              color={eq.isWorking ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {formatDate(eq.lastMaintenanceDate)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {formatDate(eq.nextMaintenanceDate)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" icon={<InfoIcon />}>
                  Phòng học này chưa có thiết bị nào được gán
                </Alert>
              )}
            </Paper>

            {/* Vấn đề phòng học */}
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                Vấn đề phòng học ({details.issues.length})
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              {details.issues.length > 0 ? (
                <Box>
                  {details.issues.map((issue) => (
                    <Box key={issue.id} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {issue.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            label={getSeverityLabel(issue.severity)}
                            color={getSeverityColor(issue.severity) as any}
                            size="small"
                          />
                          <Chip
                            label={getStatusLabel(issue.status)}
                            color={getStatusColor(issue.status) as any}
                            size="small"
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {issue.description}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Loại: {issue.issueType}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Báo cáo bởi: {issue.reporterName}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary">
                            Ngày bắt đầu: {formatDate(issue.startDate)}
                          </Typography>
                        </Grid>
                        {issue.endDate && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">
                              Ngày kết thúc: {formatDate(issue.endDate)}
                            </Typography>
                          </Grid>
                        )}
                        {issue.equipmentName && (
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary">
                              Thiết bị liên quan: {issue.equipmentName}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="success" icon={<CheckIcon />}>
                  Phòng học này không có vấn đề nào đang mở
                </Alert>
              )}
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomDetailDialog;

