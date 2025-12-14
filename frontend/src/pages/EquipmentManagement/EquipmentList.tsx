import React, { useEffect, useState, useMemo } from 'react';
import { equipmentService } from '../../services/api';
import { Typography, Box, CircularProgress, Alert, Button, IconButton, Tooltip, Card, CardContent, Container, Chip, Paper, Grid, useTheme, useMediaQuery } from '@mui/material';
import { GridColDef, GridToolbar, useGridApiRef } from '@mui/x-data-grid';
import StyledDataGrid from '../../components/DataGrid/StyledDataGrid';
import { Refresh as RefreshIcon, Build as BuildIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Computer as ComputerIcon, Videocam as ProjectorIcon, VolumeUp as AudioIcon, Router as NetworkIcon, Settings as OtherIcon } from '@mui/icons-material';
import { authService } from '../../services/api';
import EquipmentForm from './EquipmentForm';
import { toast } from 'react-toastify';

interface Equipment {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  isRequired: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const EquipmentList = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const dataGridRef = useGridApiRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | undefined>();

  useEffect(() => {
    const role = authService.getUserRole();
    setUserRole(role);
    loadEquipment();
  }, [refreshKey]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await equipmentService.getAllEquipment();
      if (response.success) {
        setEquipment(response.data || []);
      } else {
        setError(response.message || 'Không thể tải danh sách thiết bị');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = (): void => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateEquipment = () => {
    setSelectedEquipmentId(undefined);
    setEquipmentFormOpen(true);
  };

  const handleEditEquipment = (equipmentId: string) => {
    setSelectedEquipmentId(equipmentId);
    setEquipmentFormOpen(true);
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      return;
    }

    try {
      const response = await equipmentService.deleteEquipment(equipmentId);
      if (response.success) {
        toast.success('Xóa thiết bị thành công');
        handleRefresh();
      } else {
        toast.error(response.message || 'Lỗi khi xóa thiết bị');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa thiết bị');
    }
  };

  const handleFormSuccess = () => {
    handleRefresh();
  };

  const getCategoryText = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'projector': 'Máy chiếu',
      'computer': 'Máy tính',
      'audio': 'Âm thanh',
      'network': 'Mạng',
      'other': 'Khác'
    };
    return categoryMap[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'projector':
        return <ProjectorIcon />;
      case 'computer':
        return <ComputerIcon />;
      case 'audio':
        return <AudioIcon />;
      case 'network':
        return <NetworkIcon />;
      default:
        return <OtherIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'projector':
        return 'primary';
      case 'computer':
        return 'info';
      case 'audio':
        return 'success';
      case 'network':
        return 'warning';
      default:
        return 'default';
    }
  };

  const equipmentStats = useMemo(() => {
    const stats = {
      total: equipment.length,
      projector: 0,
      computer: 0,
      audio: 0,
      network: 0,
      other: 0
    };

    equipment.forEach(eq => {
      if (eq.category === 'projector') stats.projector++;
      else if (eq.category === 'computer') stats.computer++;
      else if (eq.category === 'audio') stats.audio++;
      else if (eq.category === 'network') stats.network++;
      else stats.other++;
    });

    return stats;
  }, [equipment]);

  const columns: GridColDef[] = [
    {
      field: 'code',
      headerName: 'Mã thiết bị',
      ...(isMobile || isTablet ? { 
        flex: 0.8, 
        minWidth: 100
      } : { 
        flex: 0.15,
        minWidth: 120
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
          <BuildIcon color="primary" sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'bold', 
              color: 'primary.main',
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' }
            }}
          >
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'name',
      headerName: 'Tên thiết bị',
      ...(isMobile || isTablet ? { 
        flex: 1.2, 
        minWidth: 150
      } : { 
        flex: 0.25,
        minWidth: 200
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
            wordBreak: 'break-word',
            whiteSpace: 'normal'
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'category',
      headerName: 'Loại',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 120
      } : { 
        flex: 0.18,
        minWidth: 120
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Chip
          icon={getCategoryIcon(params.value)}
          label={getCategoryText(params.value)}
          color={getCategoryColor(params.value) as any}
          size="small"
          variant="outlined"
          sx={{ 
            fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' },
            height: { xs: 20, sm: 24, md: 28 },
            whiteSpace: 'normal',
            '& .MuiChip-label': {
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              padding: { xs: '0 4px', sm: '0 6px', md: '0 8px' }
            }
          }}
        />
      )
    },
    {
      field: 'isRequired',
      headerName: 'Bắt buộc',
      ...(isMobile || isTablet ? { 
        flex: 0.6, 
        minWidth: 80
      } : { 
        flex: 0.12,
        minWidth: 100
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Có' : 'Không'}
          color={params.value ? 'error' : 'default'}
          size="small"
          variant={params.value ? 'filled' : 'outlined'}
          sx={{ 
            fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' },
            height: { xs: 20, sm: 24, md: 28 }
          }}
        />
      )
    },
    {
      field: 'description',
      headerName: 'Mô tả',
      ...(isMobile || isTablet ? { 
        flex: 1.8, 
        minWidth: 150
      } : { 
        flex: 0.3,
        minWidth: 200
      }),
      filterable: !isMobile,
      sortable: true,
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
            maxWidth: '100%',
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' }
          }}
        >
          {params.value || 'Không có mô tả'}
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Thao tác',
      ...(isMobile || isTablet ? { 
        flex: 1, 
        minWidth: 120
      } : { 
        flex: 0.2,
        minWidth: 150
      }),
      sortable: false,
      filterable: false,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: true,
      renderCell: (params) => {
        const eq = params.row as Equipment;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            {userRole === 'admin' && (
              <>
                <Tooltip title="Chỉnh sửa">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleEditEquipment(eq.id)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Xóa">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteEquipment(eq.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        );
      }
    }
  ];

  if (loading && equipment.length === 0) {
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
          Đang tải danh sách thiết bị...
        </Typography>
      </Box>
    );
  }

  if (error && equipment.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6">Không thể tải danh sách thiết bị</Typography>
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
          </CardContent>
        </Card>
      </Container>
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
      {/* Header Card */}
      <Card sx={{ mb: { xs: 1.5, sm: 2, md: 2.5 }, boxShadow: 3, flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid size={{ xs: 'auto', sm: 'auto', md: 'auto' }} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h4" component="h1" sx={{ 
                color: 'primary.main', 
                fontWeight: 'bold',
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                wordBreak: 'break-word',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Quản lý thiết bị phòng học
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 'auto', sm: 'auto', md: 'auto' }} sx={{ flexShrink: 0, display: 'flex', gap: 1 }}>
              {userRole === 'admin' && (
                <Tooltip title="Thêm thiết bị mới">
                  <IconButton 
                    onClick={handleCreateEquipment}
                    color="success"
                    sx={{ 
                      bgcolor: 'success.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'success.dark'
                      }
                    }}
                  >
                    <AddIcon fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Làm mới dữ liệu">
                <IconButton 
                  onClick={handleRefresh}
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
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid 
        container 
        spacing={{ xs: 0.75, sm: 1, md: 1.5 }} 
        sx={{ 
          mb: { xs: 1.5, sm: 2, md: 2.5 },
          flexShrink: 0,
          justifyContent: 'center'
        }}
      >
        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <BuildIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'primary.main' }} />
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
                    Tổng thiết bị
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
                    {equipmentStats.total}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <ProjectorIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'primary.main' }} />
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
                    Máy chiếu
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    color="primary.main" 
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, 
                      fontWeight: 'bold',
                      lineHeight: 1.1
                    }}
                  >
                    {equipmentStats.projector}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <ComputerIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'info.main' }} />
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
                    Máy tính
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
                    {equipmentStats.computer}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <AudioIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'success.main' }} />
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
                    Âm thanh
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
                    {equipmentStats.audio}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <NetworkIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'warning.main' }} />
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
                    Mạng
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
                    {equipmentStats.network}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 4, sm: 4, md: 2 }}>
          <Card sx={{ height: { xs: 55, sm: 65, md: 75 } }}>
            <CardContent sx={{ p: { xs: 0.75, sm: 0.875, md: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 0.875, md: 1 } } }}>
              <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ height: '100%', textAlign: 'center' }} spacing={0.25}>
                <Grid size={{ xs: 12 }}>
                  <OtherIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'text.secondary' }} />
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
                    Khác
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
                    {equipmentStats.other}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* DataGrid */}
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
          rows={equipment}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          disableRowSelectionOnClick
          disableColumnFilter={isMobile}
          disableColumnMenu={isMobile}
          disableColumnResize={isMobile || isTablet}
          autoPageSize={false}
          columnHeaderHeight={isMobile ? 48 : isTablet ? 52 : 56}
          getRowHeight={() => 'auto'}
          isMobile={isMobile}
          isTablet={isTablet}
          density="comfortable"
          checkboxSelection={false}
          disableColumnSelector={false}
          disableDensitySelector={false}
          slots={{
            toolbar: isMobile ? undefined : GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: false,
            },
          }}
        />
      </Paper>

      {/* Equipment Form Dialog */}
      <EquipmentForm
        open={equipmentFormOpen}
        onClose={() => {
          setEquipmentFormOpen(false);
          setSelectedEquipmentId(undefined);
        }}
        onSave={handleFormSuccess}
        equipmentId={selectedEquipmentId}
      />
    </Box>
  );
};

export default EquipmentList;

