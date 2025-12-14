import React, { useState, useEffect } from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Typography, Alert, CircularProgress, Box, RadioGroup, FormControlLabel, Radio, FormLabel } from '@mui/material';
import { equipmentService, roomIssueService } from '../../services/api';
import { toast } from 'react-toastify';

interface EquipmentRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roomId: string;
  roomName: string;
  type: 'request' | 'report'; // 'request' = yêu cầu thêm thiết bị, 'report' = báo cáo lỗi
  userId: number;
}

const EquipmentRequestDialog: React.FC<EquipmentRequestDialogProps> = ({ open, onClose, onSuccess, roomId, roomName, type, userId}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<Array<{ id: string; name: string; code: string }>>([]);

  const [formData, setFormData] = useState({
    equipmentId: '',
    issueType: 'equipment',
    title: '',
    description: '',
    severity: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    affectedEquipmentId: ''
  });

  const loadEquipmentList = React.useCallback(async () => {
    try {
      if (type === 'report') {
        // Báo lỗi: chỉ lấy thiết bị của phòng được chọn
        const response = await equipmentService.getRoomEquipment(roomId);
        if (response.success) {
          // Transform từ room equipment format sang format cần thiết
          setEquipmentList(response.data.map((item: any) => ({
            id: item.equipment?.id || item.equipmentId,
            name: item.equipment?.name || '',
            code: item.equipment?.code || ''
          })).filter((item: any) => item.id && item.name)); // Filter out invalid items
        }
      } else {
        // Yêu cầu thêm: lấy tất cả thiết bị
        const response = await equipmentService.getAllEquipment();
        if (response.success) {
          setEquipmentList(response.data);
        }
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      toast.error('Lỗi tải danh sách thiết bị');
    }
  }, [type, roomId]);

  useEffect(() => {
    if (open) {
      loadEquipmentList();
      resetForm();
    }
  }, [open, loadEquipmentList]);

  const resetForm = () => {
    setFormData({
      equipmentId: '',
      issueType: 'equipment',
      title: '',
      description: '',
      severity: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      affectedEquipmentId: ''
    });
    setError(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (type === 'request') {
      // Yêu cầu thêm thiết bị - tạo RoomIssue với issueType = 'equipment'
      if (!formData.equipmentId || !formData.title || !formData.description) {
        setError('Vui lòng điền đầy đủ thông tin');
        return;
      }

      setLoading(true);
      try {
        const issueData = {
          classRoomId: roomId,
          reportedBy: userId,
          issueType: 'equipment',
          title: formData.title || `Yêu cầu thêm thiết bị: ${equipmentList.find(e => e.id === formData.equipmentId)?.name}`,
          description: formData.description,
          severity: 'low',
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          affectedEquipmentId: null, // Yêu cầu thêm thiết bị mới
          autoCreateException: false
        };

        const response = await roomIssueService.createRoomIssue(issueData);
        if (response.success) {
          toast.success('Yêu cầu thêm thiết bị đã được gửi thành công');
          onSuccess();
          onClose();
          resetForm();
        } else {
          const errorMsg = response.message || 'Lỗi tạo yêu cầu';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Lỗi tạo yêu cầu thêm thiết bị';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    } else {
      // Báo cáo lỗi thiết bị
      if (!formData.affectedEquipmentId || !formData.title || !formData.description) {
        setError('Vui lòng điền đầy đủ thông tin');
        return;
      }

      setLoading(true);
      try {
        const issueData = {
          classRoomId: roomId,
          reportedBy: userId,
          issueType: formData.issueType,
          title: formData.title,
          description: formData.description,
          severity: formData.severity,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          affectedEquipmentId: formData.affectedEquipmentId,
          autoCreateException: formData.severity === 'high' || formData.severity === 'critical'
        };

        const response = await roomIssueService.createRoomIssue(issueData);
        if (response.success) {
          toast.success('Báo cáo lỗi thiết bị đã được gửi thành công');
          onSuccess();
          onClose();
          resetForm();
        } else {
          const errorMsg = response.message || 'Lỗi báo cáo vấn đề';
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Lỗi báo cáo vấn đề';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {type === 'request' ? 'Yêu cầu thêm thiết bị' : 'Báo cáo lỗi thiết bị'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Phòng: <strong>{roomName}</strong>
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {type === 'request' ? (
            <>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Thiết bị cần thêm</InputLabel>
                  <Select
                    value={formData.equipmentId}
                    onChange={(e) => handleInputChange('equipmentId', e.target.value)}
                    label="Thiết bị cần thêm"
                  >
                    {equipmentList.map(eq => (
                      <MenuItem key={eq.id} value={eq.id}>
                        {eq.name} ({eq.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Tiêu đề yêu cầu"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="VD: Yêu cầu thêm máy chiếu cho phòng học"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Mô tả chi tiết *"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  placeholder="Mô tả lý do cần thêm thiết bị, số lượng, yêu cầu kỹ thuật..."
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Thiết bị bị lỗi</InputLabel>
                  <Select
                    value={formData.affectedEquipmentId}
                    onChange={(e) => handleInputChange('affectedEquipmentId', e.target.value)}
                    label="Thiết bị bị lỗi"
                  >
                    {equipmentList.map(eq => (
                      <MenuItem key={eq.id} value={eq.id}>
                        {eq.name} ({eq.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Loại vấn đề</FormLabel>
                  <RadioGroup
                    row
                    value={formData.issueType}
                    onChange={(e) => handleInputChange('issueType', e.target.value)}
                  >
                    <FormControlLabel value="equipment" control={<Radio />} label="Thiết bị" />
                    <FormControlLabel value="infrastructure" control={<Radio />} label="Cơ sở hạ tầng" />
                    <FormControlLabel value="maintenance" control={<Radio />} label="Bảo trì" />
                    <FormControlLabel value="other" control={<Radio />} label="Khác" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Tiêu đề *"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  placeholder="VD: Máy chiếu không hoạt động"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Mô tả chi tiết *"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  placeholder="Mô tả chi tiết vấn đề, triệu chứng, thời gian phát hiện..."
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>Mức độ nghiêm trọng</InputLabel>
                  <Select
                    value={formData.severity}
                    onChange={(e) => handleInputChange('severity', e.target.value)}
                    label="Mức độ nghiêm trọng"
                  >
                    <MenuItem value="low">Thấp</MenuItem>
                    <MenuItem value="medium">Trung bình</MenuItem>
                    <MenuItem value="high">Cao</MenuItem>
                    <MenuItem value="critical">Rất cao</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Ngày bắt đầu"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Ngày kết thúc (dự kiến)"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Gửi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentRequestDialog;

