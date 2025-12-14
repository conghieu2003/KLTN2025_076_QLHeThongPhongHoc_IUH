import React, { useState, useEffect } from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Box, Typography, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch, FormControlLabel, Alert, CircularProgress } from '@mui/material';
import { roomService, equipmentService } from '../../services/api';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, CheckCircle as CheckIcon, Cancel as CancelIcon} from '@mui/icons-material';

interface Equipment {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  isRequired: boolean;
}

interface RoomEquipment {
  id: string;
  equipmentId: string;
  quantity: number;
  isWorking: boolean;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  note?: string;
  equipment: Equipment;
}

interface RoomFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  roomId?: string;
  departments: Array<{ id: number; name: string }>;
  roomTypes: Array<{ id: number; name: string }>;
}

const RoomForm: React.FC<RoomFormProps> = ({open, onClose, onSave, roomId, departments, roomTypes}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [roomEquipment, setRoomEquipment] = useState<RoomEquipment[]>([]);
  const [editingEquipment, setEditingEquipment] = useState<RoomEquipment | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    building: '',
    floor: '',
    capacity: '',
    campus: '',
    classRoomTypeId: '',
    departmentId: '',
    description: '',
    isAvailable: true
  });

  const [equipmentForm, setEquipmentForm] = useState({
    equipmentId: '',
    quantity: '1',
    isWorking: true,
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    note: ''
  });

  useEffect(() => {
    if (open) {
      loadEquipmentList();
      if (roomId) {
        loadRoomData();
      } else {
        resetForm();
      }
    }
  }, [open, roomId]);

  const loadEquipmentList = async () => {
    try {
      const response = await equipmentService.getAllEquipment();
      if (response.success) {
        setEquipmentList(response.data);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
    }
  };

  const loadRoomData = async () => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      const roomResponse = await roomService.getRoomById(roomId);
      if (roomResponse.success) {
        const room = roomResponse.data;
        setFormData({
          code: room.roomNumber || '',
          name: room.name || '',
          building: room.building || '',
          floor: room.floor?.toString() || '',
          capacity: room.capacity?.toString() || '',
          campus: room.campus || '',
          classRoomTypeId: roomTypes.find(t => t.name === room.type)?.id.toString() || '',
          departmentId: departments.find(d => d.name === room.department)?.id.toString() || '',
          description: room.description || '',
          isAvailable: room.isAvailable !== false
        });
      }

      const equipmentResponse = await equipmentService.getRoomEquipment(roomId);
      if (equipmentResponse.success) {
        setRoomEquipment(equipmentResponse.data);
      }
    } catch (error: any) {
      setError(error.message || 'Lỗi tải dữ liệu phòng học');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      building: '',
      floor: '',
      capacity: '',
      campus: '',
      classRoomTypeId: '',
      departmentId: '',
      description: '',
      isAvailable: true
    });
    setRoomEquipment([]);
    setEditingEquipment(null);
    setEquipmentForm({
      equipmentId: '',
      quantity: '1',
      isWorking: true,
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      note: ''
    });
    setError(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEquipmentFormChange = (field: string, value: any) => {
    setEquipmentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddEquipment = () => {
    if (!equipmentForm.equipmentId) {
      setError('Vui lòng chọn thiết bị');
      return;
    }

    const equipment = equipmentList.find(e => e.id === equipmentForm.equipmentId);
    if (!equipment) return;

    const newRoomEquipment: RoomEquipment = {
      id: editingEquipment?.id || `temp-${Date.now()}`,
      equipmentId: equipmentForm.equipmentId,
      quantity: parseInt(equipmentForm.quantity) || 1,
      isWorking: equipmentForm.isWorking,
      lastMaintenanceDate: equipmentForm.lastMaintenanceDate || undefined,
      nextMaintenanceDate: equipmentForm.nextMaintenanceDate || undefined,
      note: equipmentForm.note || undefined,
      equipment
    };

    if (editingEquipment) {
      setRoomEquipment(prev =>
        prev.map(eq => eq.id === editingEquipment.id ? newRoomEquipment : eq)
      );
      setEditingEquipment(null);
    } else {
      setRoomEquipment(prev => [...prev, newRoomEquipment]);
    }

    setEquipmentForm({
      equipmentId: '',
      quantity: '1',
      isWorking: true,
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      note: ''
    });
  };

  const handleEditEquipment = (eq: RoomEquipment) => {
    setEditingEquipment(eq);
    setEquipmentForm({
      equipmentId: eq.equipmentId,
      quantity: eq.quantity.toString(),
      isWorking: eq.isWorking,
      lastMaintenanceDate: eq.lastMaintenanceDate || '',
      nextMaintenanceDate: eq.nextMaintenanceDate || '',
      note: eq.note || ''
    });
  };

  const handleDeleteEquipment = (eqId: string) => {
    setRoomEquipment(prev => prev.filter(eq => eq.id !== eqId));
  };

  const handleCancelEdit = () => {
    setEditingEquipment(null);
    setEquipmentForm({
      equipmentId: '',
      quantity: '1',
      isWorking: true,
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      note: ''
    });
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate
      if (!formData.code || !formData.name || !formData.building || !formData.capacity) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        setLoading(false);
        return;
      }

      const roomData = {
        code: formData.code,
        name: formData.name,
        building: formData.building,
        floor: parseInt(formData.floor) || 1,
        capacity: parseInt(formData.capacity),
        campus: formData.campus || null,
        classRoomTypeId: parseInt(formData.classRoomTypeId),
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        description: formData.description || null,
        isAvailable: formData.isAvailable
      };

      let savedRoom;
      if (roomId) {
        const response = await roomService.updateRoom(roomId, roomData);
        if (!response.success) throw new Error(response.message);
        savedRoom = response.data;
      } else {
        const response = await roomService.createRoom(roomData);
        if (!response.success) throw new Error(response.message);
        savedRoom = response.data;
      }

      // Save equipment
      const currentRoomId = roomId || savedRoom.id;
      
      // Get existing equipment
      const existingResponse = await equipmentService.getRoomEquipment(currentRoomId);
      const existingEquipment = existingResponse.success ? existingResponse.data : [];
      
      // Remove equipment that was deleted
      for (const existing of existingEquipment) {
        if (!roomEquipment.find(eq => eq.id === existing.id && !eq.id.startsWith('temp-'))) {
          await equipmentService.removeRoomEquipment(existing.id);
        }
      }

      // Add/Update equipment
      for (const eq of roomEquipment) {
        if (eq.id.startsWith('temp-')) {
          // New equipment
          await equipmentService.addRoomEquipment(currentRoomId, {
            equipmentId: eq.equipmentId,
            quantity: eq.quantity,
            isWorking: eq.isWorking,
            lastMaintenanceDate: eq.lastMaintenanceDate || null,
            nextMaintenanceDate: eq.nextMaintenanceDate || null,
            note: eq.note || null
          });
        } else {
          // Update existing
          await equipmentService.updateRoomEquipment(eq.id, {
            quantity: eq.quantity,
            isWorking: eq.isWorking,
            lastMaintenanceDate: eq.lastMaintenanceDate || null,
            nextMaintenanceDate: eq.nextMaintenanceDate || null,
            note: eq.note || null
          });
        }
      }

      onSave();
      onClose();
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Lỗi lưu phòng học');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {roomId ? 'Cập nhật phòng học' : 'Tạo phòng học mới'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && !roomId ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Mã phòng"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Tên phòng"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Tòa nhà"
                  value={formData.building}
                  onChange={(e) => handleInputChange('building', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Tầng"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => handleInputChange('floor', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Sức chứa"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Loại phòng</InputLabel>
                  <Select
                    value={formData.classRoomTypeId}
                    onChange={(e) => handleInputChange('classRoomTypeId', e.target.value)}
                    label="Loại phòng"
                    required
                  >
                    {roomTypes.map(type => (
                      <MenuItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Khoa</InputLabel>
                  <Select
                    value={formData.departmentId}
                    onChange={(e) => handleInputChange('departmentId', e.target.value)}
                    label="Khoa"
                  >
                    <MenuItem value="">Không có</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Cơ sở"
                  value={formData.campus}
                  onChange={(e) => handleInputChange('campus', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isAvailable}
                      onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
                    />
                  }
                  label="Phòng khả dụng"
                />
              </Grid>
            </Grid>

            {/* Equipment Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Thiết bị phòng học
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Thiết bị</InputLabel>
                    <Select
                      value={equipmentForm.equipmentId}
                      onChange={(e) => handleEquipmentFormChange('equipmentId', e.target.value)}
                      label="Thiết bị"
                      disabled={!!editingEquipment}
                    >
                      {equipmentList
                        .filter(eq => !roomEquipment.find(re => re.equipmentId === eq.id && re.id !== editingEquipment?.id))
                        .map(eq => (
                          <MenuItem key={eq.id} value={eq.id}>
                            {eq.name} ({eq.code})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    fullWidth
                    label="Số lượng"
                    type="number"
                    value={equipmentForm.quantity}
                    onChange={(e) => handleEquipmentFormChange('quantity', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={equipmentForm.isWorking}
                        onChange={(e) => handleEquipmentFormChange('isWorking', e.target.checked)}
                      />
                    }
                    label="Hoạt động"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Box display="flex" gap={1}>
                    {editingEquipment ? (
                      <>
                        <Button
                          variant="contained"
                          startIcon={<CheckIcon />}
                          onClick={handleAddEquipment}
                          size="small"
                        >
                          Lưu
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                          size="small"
                        >
                          Hủy
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddEquipment}
                        size="small"
                      >
                        Thêm
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {roomEquipment.length > 0 && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Thiết bị</TableCell>
                        <TableCell align="center">Số lượng</TableCell>
                        <TableCell align="center">Trạng thái</TableCell>
                        <TableCell align="center">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {roomEquipment.map(eq => (
                        <TableRow key={eq.id}>
                          <TableCell>
                            {eq.equipment.name}
                            <Chip
                              label={eq.equipment.category}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </TableCell>
                          <TableCell align="center">{eq.quantity}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={eq.isWorking ? 'Hoạt động' : 'Hỏng'}
                              color={eq.isWorking ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEditEquipment(eq)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteEquipment(eq.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomForm;

