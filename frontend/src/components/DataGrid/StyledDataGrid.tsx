import React from 'react';
import { DataGrid, DataGridProps, GridColDef } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import { useTheme, useMediaQuery, SxProps, Theme } from '@mui/material';

interface StyledDataGridProps extends Omit<DataGridProps, 'columns'> {
  isMobile?: boolean;
  isTablet?: boolean;
  columns: readonly GridColDef[];
  customSx?: SxProps<Theme>;
}

const StyledDataGridRoot = styled(DataGrid, {
  shouldForwardProp: (prop) => prop !== 'isMobile' && prop !== 'isTablet',
})<StyledDataGridProps>(({ theme, isMobile, isTablet }) => ({
  flex: 1,
  minHeight: 0,
  height: '100%',
  width: '100%',
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  
  '& .MuiDataGrid-root': {
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    ...(isMobile || isTablet ? {
      height: '100% !important',
      maxHeight: '100% !important'
    } : {})
  },
  
  '& .MuiDataGrid-main': {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...(isMobile || isTablet ? {
      overflow: 'hidden !important',
      position: 'relative',
      height: '100% !important',
      maxHeight: '100% !important'
    } : {})
  },
  
  '& .MuiDataGrid-container--top [role="row"]': {
    backgroundColor: theme.palette.primary.main,
  },
  
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: theme.palette.primary.main,
    color: 'black',
    borderBottom: '2px solid rgba(224, 224, 224, 1)',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    
    '& .MuiDataGrid-columnHeaderTitle': {
      color: 'black',
      fontWeight: 'bold',
      fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.8rem',
      whiteSpace: 'normal',
      lineHeight: 1.2,
      wordBreak: 'break-word',
      overflow: 'visible',
      textOverflow: 'clip'
    },
    
    '& .MuiDataGrid-columnHeader': {
      overflow: 'visible !important',
      '&:focus': { outline: 'none' },
      '&:focus-within': { outline: 'none' },
      '& .MuiDataGrid-columnHeaderTitleContainer': {
        width: '100%',
        overflow: 'visible !important'
      }
    }
  },
  
  '& .MuiDataGrid-virtualScroller': {
    flex: 1,
    minHeight: 0,
    overflowY: 'scroll !important',
    overflowX: 'scroll !important',
    maxHeight: '100% !important',
    height: '100% !important',
    WebkitOverflowScrolling: 'touch',
    touchAction: 'pan-x pan-y',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent',
    
    '&::-webkit-scrollbar': {
      width: isMobile || isTablet ? '10px' : '8px',
      height: isMobile || isTablet ? '10px' : '8px',
      display: 'block !important',
      ...(isMobile || isTablet ? {
        '-webkit-appearance': 'none'
      } : {})
    },
    
    '&::-webkit-scrollbar-track': {
      background: isMobile || isTablet ? 'rgba(0, 0, 0, 0.1) !important' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: isMobile || isTablet ? '5px' : '4px'
    },
    
    '&::-webkit-scrollbar-thumb': {
      background: isMobile || isTablet ? 'rgba(0, 0, 0, 0.4) !important' : 'rgba(0, 0, 0, 0.3)',
      borderRadius: isMobile || isTablet ? '5px' : '4px',
      ...(isMobile || isTablet ? {
        border: '2px solid transparent !important',
        backgroundClip: 'padding-box !important'
      } : {
        '&:hover': {
          background: 'rgba(0, 0, 0, 0.5)'
        }
      })
    },
    
    ...(isMobile || isTablet ? {
      overflow: 'scroll !important',
      position: 'relative',
      '-webkit-overflow-scrolling': 'touch',
      minHeight: '200px !important',
      scrollbarWidth: 'thin !important',
      scrollbarColor: 'rgba(0, 0, 0, 0.4) transparent !important'
    } : {})
  },
  
  '& .MuiDataGrid-virtualScrollerContent': {
    minHeight: 'auto !important',
    height: 'auto !important'
  },
  
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid rgba(224, 224, 224, 1)',
    backgroundColor: 'white',
    flexShrink: 0
  },
  
  '& .MuiDataGrid-toolbarContainer': {
    padding: isMobile ? '8px' : isTablet ? '12px' : '16px',
    display: isMobile ? 'none' : 'flex',
    flexShrink: 0
  },
  
  '& .MuiDataGrid-cell': {
    fontSize: isMobile ? '0.65rem' : isTablet ? '0.7rem' : '0.8rem',
    whiteSpace: 'normal !important',
    wordBreak: 'break-word',
    lineHeight: 1.4,
    borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
    overflow: 'visible !important',
    '&:focus': { outline: 'none' },
    '&:focus-within': { outline: 'none' }
  },
  
  '& .MuiDataGrid-row': {
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
    '& .MuiDataGrid-cell': {
      minHeight: isMobile ? '40px !important' : isTablet ? '45px !important' : '50px !important',
      maxHeight: 'none !important'
    }
  }
}));

const StyledDataGrid: React.FC<StyledDataGridProps> = ({ 
  isMobile, 
  isTablet, 
  columns,
  customSx,
  sx,
  ...props 
}) => {
  const theme = useTheme();
  const detectedMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const detectedTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const mobile = isMobile ?? detectedMobile;
  const tablet = isTablet ?? detectedTablet;
  
  // Generate minWidth styles for columns
  const getMinWidthStyles = (selector: 'columnHeader' | 'cell') => {
    if (!mobile && !tablet) return {};
    const styles: Record<string, any> = {};
    columns.forEach((col) => {
      if (col.field) {
        const minWidth = (col as any).minWidth;
        if (minWidth) {
          styles[`& .MuiDataGrid-${selector}[data-field="${col.field}"]`] = {
            minWidth: `${minWidth}px !important`
          };
        }
      }
    });
    return styles;
  };
  
  const mergedSx = {
    ...getMinWidthStyles('columnHeader'),
    ...getMinWidthStyles('cell'),
    ...customSx,
    ...sx
  };
  
  return (
    <StyledDataGridRoot
      isMobile={mobile}
      isTablet={tablet}
      columns={columns}
      sx={mergedSx}
      {...props}
    />
  );
};

export default StyledDataGrid;

