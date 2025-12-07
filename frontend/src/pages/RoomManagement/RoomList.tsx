import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoomsThunk, selectRooms, selectRoomsLoading, selectRoomsError, clearRooms } from '../../redux/slices/roomSlice';
import { Room } from '../../types';
import { Typography, Box, CircularProgress, Alert, Button, IconButton, Tooltip, Card, CardContent, Container, Chip, Paper, Grid, useTheme, useMediaQuery } from '@mui/material';
import { GridColDef, GridToolbar, useGridApiRef } from '@mui/x-data-grid';
import StyledDataGrid from '../../components/DataGrid/StyledDataGrid';
import { Refresh as RefreshIcon, MeetingRoom as RoomIcon, School as TheoryIcon, Science as LabIcon, Computer as OnlineIcon } from '@mui/icons-material';

interface ExtendedRoom extends Room {
  location?: string;
}

const RoomList = () => {
  const dispatch = useDispatch();
  const rooms = useSelector(selectRooms) as ExtendedRoom[];
  const loading = useSelector(selectRoomsLoading);
  const error = useSelector(selectRoomsError);
  const [refreshKey, setRefreshKey] = useState(0);
  const dataGridRef = useGridApiRef();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    dispatch(fetchRoomsThunk() as any);
  }, [dispatch, refreshKey]);

  const handleRefresh = (): void => {
    dispatch(clearRooms());
    setRefreshKey(prev => prev + 1);
  };

  const getTypeText = (type: string) => {
    if (!type) return 'Chưa xác định';
    const typeLower = type.toLowerCase();
    switch (typeLower) {
      case 'lý thuyết': return 'Lý thuyết';
      case 'thực hành': return 'Thực hành';
      case 'online': return 'Trực tuyến';
      case 'theory':
      case 'lecture': return 'Lý thuyết';
      case 'lab':
      case 'practice': return 'Thực hành';
      case 'seminar': return 'Hội thảo';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    if (!type) return 'default';
    const typeLower = type.toLowerCase();
    switch (typeLower) {
      case 'lý thuyết':
      case 'theory':
      case 'lecture': return 'primary';
      case 'thực hành':
      case 'lab':
      case 'practice': return 'secondary';
      case 'online': return 'success';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    if (!type) return <RoomIcon />;
    const typeLower = type.toLowerCase();
    switch (typeLower) {
      case 'lý thuyết':
      case 'theory':
      case 'lecture': return <TheoryIcon />;
      case 'thực hành':
      case 'lab':
      case 'practice': return <LabIcon />;
      case 'online': return <OnlineIcon />;
      default: return <RoomIcon />;
    }
  };

  const roomStats = useMemo(() => {
    const stats = {
      total: rooms.length,
      theory: 0,
      practice: 0,
      online: 0,
      other: 0
    };

    rooms.forEach(room => {
      const roomType = room.type?.toLowerCase() || '';
      if (roomType === 'lý thuyết') {
        stats.theory++;
      } else if (roomType === 'thực hành') {
        stats.practice++;
      } else if (roomType === 'online') {
        stats.online++;
      } else {
        stats.other++;
      }
    });

    return stats;
  }, [rooms]);

  const columns: GridColDef[] = [
    {
      field: 'roomNumber',
      headerName: 'Số phòng',
      ...(isMobile || isTablet ? { 
        flex: 0.6, 
        minWidth: 100
      } : { 
        flex: 0.15,
        minWidth: 100
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
          <RoomIcon color="primary" sx={{ fontSize: { xs: 14, sm: 16, md: 18 } }} />
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
      field: 'building',
      headerName: 'Tòa nhà',
      ...(isMobile || isTablet ? { 
        flex: 0.5, 
        minWidth: 80
      } : { 
        flex: 0.12,
        minWidth: 80
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
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
      field: 'floor',
      headerName: 'Tầng',
      ...(isMobile || isTablet ? { 
        flex: 0.4, 
        minWidth: 60
      } : { 
        flex: 0.08,
        minWidth: 60
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' }
          }}
        >
          {params.value}
        </Typography>
      )
    },
    {
      field: 'capacity',
      headerName: 'Sức chứa',
      ...(isMobile || isTablet ? { 
        flex: 0.6, 
        minWidth: 90
      } : { 
        flex: 0.12,
        minWidth: 90
      }),
      filterable: !isMobile,
      sortable: true,
      headerAlign: 'center',
      align: 'center',
      disableColumnMenu: isMobile,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 'medium',
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.875rem' },
            wordBreak: 'break-word',
            whiteSpace: 'normal'
          }}
        >
          {params.value} người
        </Typography>
      )
    },
    {
      field: 'type',
      headerName: 'Loại phòng',
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
          icon={getTypeIcon(params.value)}
          label={getTypeText(params.value)}
          color={getTypeColor(params.value) as any}
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
      field: 'description',
      headerName: 'Mô tả',
      ...(isMobile || isTablet ? { 
        flex: 1.8, 
        minWidth: 150
      } : { 
        flex: 0.35,
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
    }
  ];

  if (loading) {
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
          Đang tải danh sách phòng học...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6">Không thể tải danh sách phòng học</Typography>
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
                Quản lý phòng học
              </Typography>
            </Grid>
            
            <Grid size={{ xs: 'auto', sm: 'auto', md: 'auto' }} sx={{ flexShrink: 0 }}>
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
                  <RoomIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'primary.main' }} />
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
                    Tổng phòng
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
                    {roomStats.total}
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
                  <TheoryIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'primary.main' }} />
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
                    Lý thuyết
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
                    {roomStats.theory}
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
                  <LabIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'secondary.main' }} />
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
                    Thực hành
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    color="secondary.main" 
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }, 
                      fontWeight: 'bold',
                      lineHeight: 1.1
                    }}
                  >
                    {roomStats.practice}
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
                  <OnlineIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18 }, color: 'success.main' }} />
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
                    Trực tuyến
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
                    {roomStats.online}
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
          rows={rooms}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
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
    </Box>
  );
};

export default RoomList;