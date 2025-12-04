import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { enhancedScheduleService, scheduleManagementService } from '../../services/api';

// loại lịch học
export interface ScheduleItem {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  roomId: number;
  roomName?: string;
  teacherId: number;
  teacherName?: string;
  classId: number;
  className?: string;
  type: 'class' | 'practice' | 'exam' | 'meeting' | 'event';
  status: 'pending' | 'active' | 'cancelled' | 'completed';
  dayOfWeek?: number;
  timeSlot?: string;
  weekPattern?: string;
  startWeek?: number;
  endWeek?: number;
  note?: string;
}

// lọc lịch học
export interface ScheduleFilter {
  departmentId?: number;
  classId?: number;
  teacherId?: number;
  scheduleType?: string;
  startDate?: string;
  endDate?: string;
  weekStartDate?: string;
}

// khoa
export interface Department {
  id: number;
  name: string;
  code?: string;
}

// lớp học
export interface Class {
  id: number;
  name: string;
  className?: string;
  code?: string;
  departmentId?: number;
  maxStudents?: number;
}

// giảng viên
export interface Teacher {
  id: number;
  name: string;
  code?: string;
  departmentId?: number;
  departmentName?: string;
}

// slice
interface ScheduleState {
  schedules: ScheduleItem[];
  weeklySchedules: any[]; 
  departments: Department[];
  classes: Class[];
  teachers: Teacher[];
  loading: boolean;
  weeklyScheduleLoading: boolean; 
  error: string | null;
  filters: ScheduleFilter;
}

// Initial state
const initialState: ScheduleState = {
  schedules: [],
  weeklySchedules: [],
  departments: [],
  classes: [],
  teachers: [],
  loading: false,
  weeklyScheduleLoading: false,
  error: null,
  filters: {}
};

// lấy danh sách lịch học
export const fetchSchedules = createAsyncThunk(
  'schedule/fetchSchedules',
  async (filters: ScheduleFilter = {}) => {
    const response = await enhancedScheduleService.getSchedules(filters);
    return response.data || response;
  }
);

// lấy lịch học theo tuần
export const fetchWeeklySchedule = createAsyncThunk(
  'schedule/fetchWeeklySchedule',
  async ({ weekStartDate, filters }: { weekStartDate: string; filters: ScheduleFilter }) => {
    const response = await scheduleManagementService.getWeeklySchedule(weekStartDate, filters);
    return response.data || response;
  }
);

// lấy danh sách khoa
export const fetchDepartments = createAsyncThunk(
  'schedule/fetchDepartments',
  async () => {
    const response = await enhancedScheduleService.getDepartments();
    return response.data || response;
  }
);

// lấy danh sách lớp học
export const fetchClasses = createAsyncThunk(
  'schedule/fetchClasses',
  async (departmentId?: number) => {
    const response = await enhancedScheduleService.getClasses(departmentId);
    return response.data || response;
  }
);

// lấy danh sách giảng viên
export const fetchTeachers = createAsyncThunk(
  'schedule/fetchTeachers',
  async (departmentId?: number) => {
    const response = await enhancedScheduleService.getTeachers(departmentId);
    return response.data || response;
  }
);

// tạo lịch học
export const createSchedule = createAsyncThunk(
  'schedule/createSchedule',
  async (scheduleData: Partial<ScheduleItem>) => {
    const response = await enhancedScheduleService.createSchedule(scheduleData);
    return response.data || response;
  }
);

// cập nhật lịch học
export const updateSchedule = createAsyncThunk(
  'schedule/updateSchedule',
  async ({ id, scheduleData }: { id: number; scheduleData: Partial<ScheduleItem> }) => {
    const response = await enhancedScheduleService.updateSchedule(id, scheduleData);
    return response.data || response;
  }
);

// xóa lịch học
export const deleteSchedule = createAsyncThunk(
  'schedule/deleteSchedule',
  async (id: number) => {
    await enhancedScheduleService.deleteSchedule(id);
    return id;
  }
);

// slice
const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ScheduleFilter>) => {
      state.filters = action.payload;
    },
    clearSchedules: (state) => {
      state.schedules = [];
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch schedules';
      });

    builder
      .addCase(fetchDepartments.pending, (state) => {
        if (state.departments.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload.data || action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch departments';
      });

    builder
      .addCase(fetchClasses.pending, (state) => {
        if (state.classes.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload.data || action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch classes';
      });

    builder
      .addCase(fetchTeachers.pending, (state) => {
        if (state.teachers.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading = false;
        state.teachers = action.payload.data || action.payload;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch teachers';
      });

    builder
      .addCase(fetchWeeklySchedule.pending, (state) => {
        state.weeklyScheduleLoading = true;
        state.error = null;
      })
      .addCase(fetchWeeklySchedule.fulfilled, (state, action) => {
        state.weeklyScheduleLoading = false;
        state.weeklySchedules = action.payload.data || action.payload;
      })
      .addCase(fetchWeeklySchedule.rejected, (state, action) => {
        state.weeklyScheduleLoading = false;
        state.error = action.error.message || 'Failed to fetch weekly schedule';
      });

    builder
      .addCase(createSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules.push(action.payload);
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create schedule';
      });

    builder
      .addCase(updateSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSchedule.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.schedules.findIndex(schedule => schedule.id === action.payload.id);
        if (index !== -1) {
          state.schedules[index] = action.payload;
        }
      })
      .addCase(updateSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update schedule';
      });

    builder
      .addCase(deleteSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = state.schedules.filter(schedule => schedule.id !== action.payload);
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete schedule';
      });
  }
});

export const { setFilters, clearSchedules, clearError } = scheduleSlice.actions;
export const selectSchedules = (state: { schedule: ScheduleState }) => state.schedule.schedules;
export const selectDepartments = (state: { schedule: ScheduleState }) => state.schedule.departments;
export const selectClasses = (state: { schedule: ScheduleState }) => state.schedule.classes;
export const selectTeachers = (state: { schedule: ScheduleState }) => state.schedule.teachers;
export const selectScheduleLoading = (state: { schedule: ScheduleState }) => state.schedule.loading;
export const selectWeeklyScheduleLoading = (state: { schedule: ScheduleState }) => state.schedule.weeklyScheduleLoading;
export const selectScheduleError = (state: { schedule: ScheduleState }) => state.schedule.error;
export const selectScheduleFilters = (state: { schedule: ScheduleState }) => state.schedule.filters;

export default scheduleSlice.reducer;
