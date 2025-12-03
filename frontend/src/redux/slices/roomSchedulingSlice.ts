import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  scheduleManagementService
} from '../../services/api';

// Types
export interface ScheduleData {
  id: number;
  scheduleId: number;
  classId: number;
  dayOfWeek: number;
  dayName: string;
  timeSlotId: number;
  timeSlot: string;
  startTime: string;
  endTime: string;
  weekPattern: string;
  startWeek: number;
  endWeek: number;
  roomId?: number;
  roomName?: string;
  roomCode?: string;
  classRoomTypeId: number;
  classRoomTypeName: string;
  practiceGroup?: number;
  statusId: number;
  statusName: string;
  note: string;
}

export interface ClassForScheduling {
  id: number;
  classId: number;
  className: string;
  subjectCode: string;
  teacherName: string;
  departmentName: string;
  maxStudents: number;
  classRoomTypeId: number;
  classRoomTypeName: string;
  statusId: number;
  statusName: string;
  startDate?: string | null;
  endDate?: string | null;
  schedules: ScheduleData[];
}

export interface Department {
  id: number;
  name: string;
}

export interface Teacher {
  id: number;
  fullName: string;
  teacherCode: string;
  departmentId?: number;
  departmentName?: string;
}

export interface AssignmentStats {
  totalClasses: number;
  pendingClasses: number;
  assignedClasses: number;
  assignmentRate: number;
}

export interface RequestType {
  id: number;
  name: string;
}

export interface Room {
  id: number;
  name: string;
  code: string;
  capacity: number;
  building: string;
  floor: number;
  type: string;
  department: string;
  isSameDepartment: boolean;
  isAvailable: boolean;
  conflictInfo?: {
    time: string;
    className: string;
    teacherName: string;
  };
}

// State interface
interface RoomSchedulingState {
  // Data
  classes: ClassForScheduling[];
  departments: Department[];
  teachers: Teacher[];
  stats: AssignmentStats | null;
  requestTypes: RequestType[];
  availableRooms: Room[];
  
  // Filters
  selectedDepartment: string;
  selectedClass: string;
  selectedTeacher: string;
  selectedStatus: string;
  
  // UI State
  loading: boolean;
  refreshing: boolean; // Separate loading state for data refresh
  loadingRooms: boolean; // Loading state for room list
  error: string | null;
  successMessage: string | null;
  
  // Dialog state
  assignDialogOpen: boolean;
  selectedSchedule: ScheduleData | null;
  selectedRoom: string;
  isAssigning: boolean;
}

// Initial state
const initialState: RoomSchedulingState = {
  // Data
  classes: [],
  departments: [],
  teachers: [],
  stats: null,
  requestTypes: [],
  availableRooms: [],
  
  // Filters
  selectedDepartment: '',
  selectedClass: '',
  selectedTeacher: '',
  selectedStatus: '',
  
  // UI State
  loading: false,
  refreshing: false,
  loadingRooms: false,
  error: null,
  successMessage: null,
  
  // Dialog state
  assignDialogOpen: false,
  selectedSchedule: null,
  selectedRoom: '',
  isAssigning: false,
};

// Async thunks
export const loadAllData = createAsyncThunk(
  'roomScheduling/loadAllData',
  async (_, { rejectWithValue }) => {
    try {
      const [classesResponse, departmentsResponse, teachersResponse, statsResponse, requestTypesResponse] = await Promise.all([
        scheduleManagementService.getClassesForScheduling(),
        scheduleManagementService.getDepartments(),
        scheduleManagementService.getTeachers(),
        scheduleManagementService.getSchedulingStats(),
        scheduleManagementService.getRequestTypes()
      ]);

      return {
        classes: classesResponse.data || [],
        departments: departmentsResponse.data || [],
        teachers: teachersResponse.data || [],
        stats: statsResponse.data || null,
        requestTypes: requestTypesResponse.data || []
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải dữ liệu');
    }
  }
);

// Load only schedule data (classes and stats) for faster refresh
export const loadScheduleData = createAsyncThunk(
  'roomScheduling/loadScheduleData',
  async (_, { rejectWithValue }) => {
    try {
      const [classesResponse, statsResponse] = await Promise.all([
        scheduleManagementService.getClassesForScheduling(),
        scheduleManagementService.getSchedulingStats()
      ]);

      return {
        classes: classesResponse.data || [],
        stats: statsResponse.data || null
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải dữ liệu lịch học');
    }
  }
);

export const loadAvailableRooms = createAsyncThunk(
  'roomScheduling/loadAvailableRooms',
  async (scheduleId: string, { rejectWithValue }) => {
    try {
      const response = await scheduleManagementService.getAvailableRoomsForSchedule(scheduleId);
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải danh sách phòng');
    }
  }
);

export const loadRoomsByDepartmentAndType = createAsyncThunk(
  'roomScheduling/loadRoomsByDepartmentAndType',
  async ({ departmentId, classRoomTypeId }: { departmentId: string, classRoomTypeId: string }, { rejectWithValue }) => {
    try {
      const response = await scheduleManagementService.getRoomsByDepartmentAndType(departmentId, classRoomTypeId);
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi tải danh sách phòng');
    }
  }
);

export const assignRoomToSchedule = createAsyncThunk(
  'roomScheduling/assignRoomToSchedule',
  async ({ scheduleId, roomId }: { scheduleId: string, roomId: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await scheduleManagementService.assignRoomToSchedule(scheduleId, roomId);
      
      // Auto refresh schedule data after successful assignment
      dispatch(loadScheduleData());
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi gán phòng');
    }
  }
);

export const unassignRoomFromSchedule = createAsyncThunk(
  'roomScheduling/unassignRoomFromSchedule',
  async (scheduleId: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await scheduleManagementService.unassignRoomFromSchedule(scheduleId);
      
      // Auto refresh schedule data after successful unassignment
      dispatch(loadScheduleData());
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi hủy gán phòng');
    }
  }
);

// Slice
const roomSchedulingSlice = createSlice({
  name: 'roomScheduling',
  initialState,
  reducers: {
    // Filter actions
    setSelectedDepartment: (state, action: PayloadAction<string>) => {
      state.selectedDepartment = action.payload;
      // Reset other filters when department changes
      state.selectedClass = '';
      state.selectedTeacher = '';
    },
    setSelectedClass: (state, action: PayloadAction<string>) => {
      state.selectedClass = action.payload;
    },
    setSelectedTeacher: (state, action: PayloadAction<string>) => {
      state.selectedTeacher = action.payload;
    },
    setSelectedStatus: (state, action: PayloadAction<string>) => {
      state.selectedStatus = action.payload;
    },
    
    // UI actions
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },
    
    // Dialog actions
    openAssignDialog: (state, action: PayloadAction<ScheduleData>) => {
      state.assignDialogOpen = true;
      state.selectedSchedule = action.payload;
      state.selectedRoom = '';
    },
    closeAssignDialog: (state) => {
      state.assignDialogOpen = false;
      state.selectedSchedule = null;
      state.selectedRoom = '';
    },
    setSelectedRoom: (state, action: PayloadAction<string>) => {
      state.selectedRoom = action.payload;
    },
    
    // Clear messages
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    
    // Socket real-time update actions
    updateScheduleFromSocket: (state, action: PayloadAction<any>) => {
      const { scheduleId, scheduleStatusId, classId, classStatusId, roomId, roomName, roomCode } = action.payload;
      
      // Update schedule in classes
      state.classes = state.classes.map(cls => {
        if (cls.classId === classId) {
          // Update class status
          cls.statusId = classStatusId;
          
          // Update schedule
          cls.schedules = cls.schedules.map(schedule => {
            if (schedule.scheduleId === scheduleId) {
              return {
                ...schedule,
                statusId: scheduleStatusId,
                roomId: roomId || undefined,
                roomName: roomName || undefined,
                roomCode: roomCode || undefined
              };
            }
            return schedule;
          });
        }
        return cls;
      });
    },
    
    updateStatsFromSocket: (state, action: PayloadAction<AssignmentStats>) => {
      state.stats = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load all data
      .addCase(loadAllData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAllData.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload.classes;
        state.departments = action.payload.departments;
        state.teachers = action.payload.teachers;
        state.stats = action.payload.stats;
        state.requestTypes = action.payload.requestTypes;
      })
      .addCase(loadAllData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Load schedule data only
      .addCase(loadScheduleData.pending, (state) => {
        state.refreshing = true;
        state.error = null;
      })
      .addCase(loadScheduleData.fulfilled, (state, action) => {
        state.refreshing = false;
        state.classes = action.payload.classes;
        state.stats = action.payload.stats;
      })
      .addCase(loadScheduleData.rejected, (state, action) => {
        state.refreshing = false;
        state.error = action.payload as string;
      })
      
      // Load available rooms
      .addCase(loadAvailableRooms.pending, (state) => {
        state.loadingRooms = true;
        state.error = null;
      })
      .addCase(loadAvailableRooms.fulfilled, (state, action) => {
        state.loadingRooms = false;
        state.availableRooms = action.payload;
      })
      .addCase(loadAvailableRooms.rejected, (state, action) => {
        state.loadingRooms = false;
        state.error = action.payload as string;
      })
      
      // Load rooms by department and type
      .addCase(loadRoomsByDepartmentAndType.pending, (state) => {
        state.loadingRooms = true;
        state.error = null;
      })
      .addCase(loadRoomsByDepartmentAndType.fulfilled, (state, action) => {
        state.loadingRooms = false;
        state.availableRooms = action.payload;
      })
      .addCase(loadRoomsByDepartmentAndType.rejected, (state, action) => {
        state.loadingRooms = false;
        state.error = action.payload as string;
      })
      
      // Assign room
      .addCase(assignRoomToSchedule.pending, (state) => {
        state.isAssigning = true;
        state.error = null;
      })
      .addCase(assignRoomToSchedule.fulfilled, (state, action) => {
        state.isAssigning = false;
        state.successMessage = 'Gán phòng thành công';
        state.assignDialogOpen = false;
        state.selectedSchedule = null;
        state.selectedRoom = '';
        // Refresh data
        // Note: In a real app, you might want to update the specific class/schedule in the state
      })
      .addCase(assignRoomToSchedule.rejected, (state, action) => {
        state.isAssigning = false;
        state.error = action.payload as string;
      })
      
      // Unassign room
      .addCase(unassignRoomFromSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unassignRoomFromSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'Hủy gán phòng thành công';
        // Refresh data
      })
      .addCase(unassignRoomFromSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setSelectedDepartment,
  setSelectedClass,
  setSelectedTeacher,
  setSelectedStatus,
  setError,
  setSuccessMessage,
  openAssignDialog,
  closeAssignDialog,
  setSelectedRoom,
  clearMessages,
  updateScheduleFromSocket,
  updateStatsFromSocket
} = roomSchedulingSlice.actions;

export default roomSchedulingSlice.reducer;
