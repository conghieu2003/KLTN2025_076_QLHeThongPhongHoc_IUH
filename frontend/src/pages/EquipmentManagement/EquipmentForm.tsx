import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Typography, Alert, CircularProgress, Box, FormControlLabel, Switch } from '@mui/material';  
import { equipmentService } from '../../services/api';
import { toast } from 'react-toastify';

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  equipmentId?: string;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({open, onClose, onSave,equipmentId}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'other',
    description: '',
    isRequired: false
  });

  useEffect(() => {
    if (open) {
      if (equipmentId) {
        loadEquipment();
      } else {
        resetForm();
      }
    }
  }, [open, equipmentId]);

  const loadEquipment = async () => {
    if (!equipmentId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await equipmentService.getEquipmentById(equipmentId);
      if (response.success && response.data) {
        const eq = response.data;
        setFormData({
          code: eq.code || '',
          name: eq.name || '',
          category: eq.category || 'other',
          description: eq.description || '',
          isRequired: eq.isRequired || false
        });
      } else {
        setError(response.message || 'Không thể tải thông tin thiết bị');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải thông tin thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: 'other',
      description: '',
      isRequired: false
    });
    setError(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      setError('Vui lòng nhập mã thiết bị');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên thiết bị');
      return false;
    }
    if (!formData.category) {
      setError('Vui lòng chọn loại thiết bị');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (equipmentId) {
        response = await equipmentService.updateEquipment(equipmentId, formData);
      } else {
        response = await equipmentService.createEquipment(formData);
      }

      if (response.success) {
        toast.success(equipmentId ? 'Cập nhật thiết bị thành công' : 'Tạo thiết bị thành công');
        onSave();
        onClose();
        resetForm();
      } else {
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {equipmentId ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && !equipmentId ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Mã thiết bị"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                required
                placeholder="VD: PROJ001, COMP001"
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Tên thiết bị"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="VD: Máy chiếu, Máy tính"
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Loại thiết bị</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Loại thiết bị"
                  disabled={loading}
                >
                  <MenuItem value="projector">Máy chiếu</MenuItem>
                  <MenuItem value="computer">Máy tính</MenuItem>
                  <MenuItem value="audio">Âm thanh</MenuItem>
                  <MenuItem value="network">Mạng</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRequired}
                    onChange={(e) => handleInputChange('isRequired', e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Thiết bị bắt buộc"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Thiết bị bắt buộc phải có trong một số loại phòng học
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Mô tả"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={4}
                placeholder="Mô tả chi tiết về thiết bị..."
                disabled={loading}
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Đang lưu...' : equipmentId ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentForm;

