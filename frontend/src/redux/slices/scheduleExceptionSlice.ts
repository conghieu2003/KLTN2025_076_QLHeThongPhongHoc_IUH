import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// Types
export interface ScheduleException {
  id: number;
  classScheduleId: number;
  className: string;
  classCode: string;
  teacherName: string;
  roomName: string;
  roomCode: string;
  slotName: string;
  startTime: string;
  endTime: string;
  exceptionDate: string;
  exceptionType: 'cancelled' | 'exam' | 'moved' | 'substitute';
  // Thông tin chuyển đến (cho moved/exam)
  newTimeSlotId?: number;
  newTimeSlotName?: string;
  newTimeSlotStart?: string;
  newTimeSlotEnd?: string;
  newClassRoomId?: number;
  newClassRoomName?: string;
  newClassRoomCode?: string;
  newDate?: string;
  // Thông tin giảng viên thay thế (cho substitute)
  substituteTeacherId?: number;
  substituteTeacherName?: string;
  substituteTeacherCode?: string;
  reason: string;
  note?: string;
  requestStatusId: number;
  statusName: string;
  requestTypeName?: string;
  requesterName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSchedule {
  id: number;
  className: string;
  classCode: string;
  departmentId: number;
  departmentName: string;
  teacherName: string;
  teacherCode: string;
  roomName: string;
  roomCode: string;
  slotName: string;
  startTime: string;
  endTime: string;
  shift: number;
  dayOfWeek: number;
  startDate: string;
  endDate: string;
  nextClassDate: string;
  dayName: string;
  classType: 'theory' | 'practice';
  classRoomType: string;
  practiceGroup?: number | null;
}

export interface CreateScheduleExceptionData {
  classScheduleId: number;
  exceptionDate: string;
  exceptionType: 'cancelled' | 'exam' | 'moved' | 'substitute';
  newTimeSlotId?: number;
  newClassRoomId?: number;
  newDate?: string;
  substituteTeacherId?: number;
  reason: string;
  note?: string;
}

export interface UpdateScheduleExceptionData {
  exceptionType?: 'cancelled' | 'exam' | 'moved' | 'substitute';
  exceptionDate?: string;
  newTimeSlotId?: number;
  newClassRoomId?: number;
  newDate?: string;
  substituteTeacherId?: number;
  reason?: string;
  note?: string;
  requestStatusId?: number;
}

export interface ScheduleExceptionFilters {
  classScheduleId?: number;
  exceptionDate?: string;
  exceptionType?: string;
  status?: number;
  page?: number;
  limit?: number;
  getAll?: boolean;
}

export interface AvailableScheduleFilters {
  departmentId?: number;
  classId?: number;
  teacherId?: number;
  startDate?: string;
  endDate?: string;
}

interface ScheduleExceptionState {
  exceptions: ScheduleException[];
  availableSchedules: AvailableSchedule[];
  currentException: ScheduleException | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ScheduleExceptionState = {
  exceptions: [],
  availableSchedules: [],
  currentException: null,
  loading: false,
  error: null,
  successMessage: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

// Async thunks
export const createScheduleException = createAsyncThunk(
  'scheduleException/create',
  async (data: CreateScheduleExceptionData, { rejectWithValue }) => {
    try {
      const response = await api.post('/schedule-exceptions', data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi tạo ngoại lệ lịch học');
    }
  }
);

export const getScheduleExceptions = createAsyncThunk(
  'scheduleException/getAll',
  async (filters: ScheduleExceptionFilters & { getAll?: boolean } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/schedule-exceptions?${params.toString()}`);
      // Nếu getAll=true, response.data.data chỉ có data array, không có pagination
      // Nếu không, response.data.data có { data: [...], pagination: {...} }
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi lấy danh sách ngoại lệ');
    }
  }
);

export const getScheduleExceptionById = createAsyncThunk(
  'scheduleException/getById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/schedule-exceptions/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi lấy chi tiết ngoại lệ');
    }
  }
);

export const updateScheduleException = createAsyncThunk(
  'scheduleException/update',
  async ({ id, data }: { id: number; data: UpdateScheduleExceptionData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/schedule-exceptions/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi cập nhật ngoại lệ');
    }
  }
);

export const deleteScheduleException = createAsyncThunk(
  'scheduleException/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/schedule-exceptions/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi xóa ngoại lệ');
    }
  }
);

export const getAvailableSchedules = createAsyncThunk(
  'scheduleException/getAvailableSchedules',
  async (filters: AvailableScheduleFilters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/schedule-exceptions/available/schedules?${params.toString()}`);
      return response.data.data.data; 
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi lấy danh sách lịch học');
    }
  }
);

const scheduleExceptionSlice = createSlice({
  name: 'scheduleException',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    clearCurrentException: (state) => {
      state.currentException = null;
    },
    setPagination: (state, action: PayloadAction<{ page: number; limit: number }>) => {
      state.pagination.page = action.payload.page;
      state.pagination.limit = action.payload.limit;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create schedule exception
      .addCase(createScheduleException.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createScheduleException.fulfilled, (state, action) => {
        state.loading = false;
        state.exceptions.unshift(action.payload);
        state.error = null;
        state.successMessage = 'Tạo ngoại lệ lịch học thành công';
      })
      .addCase(createScheduleException.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Get schedule exceptions
      .addCase(getScheduleExceptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getScheduleExceptions.fulfilled, (state, action) => {
        state.loading = false;
        // Nếu có pagination, action.payload = { data: [...], pagination: {...} }
        // Nếu không có pagination (getAll=true), action.payload = { data: [...] }
        if (action.payload && action.payload.data && Array.isArray(action.payload.data)) {
          state.exceptions = action.payload.data;
          if (action.payload.pagination) {
            state.pagination = action.payload.pagination;
          }
        } else if (Array.isArray(action.payload)) {
          // Trường hợp backend trả về trực tiếp array
          state.exceptions = action.payload;
        } else {
          state.exceptions = [];
        }
        state.error = null;
      })
      .addCase(getScheduleExceptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get schedule exception by ID
      .addCase(getScheduleExceptionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getScheduleExceptionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentException = action.payload;
        state.error = null;
      })
      .addCase(getScheduleExceptionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update schedule exception
      .addCase(updateScheduleException.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateScheduleException.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.exceptions.findIndex(exp => exp.id === action.payload.id);
        if (index !== -1) {
          state.exceptions[index] = action.payload;
        }
        if (state.currentException?.id === action.payload.id) {
          state.currentException = action.payload;
        }
        state.error = null;
        state.successMessage = 'Cập nhật ngoại lệ lịch học thành công';
      })
      .addCase(updateScheduleException.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Delete schedule exception
      .addCase(deleteScheduleException.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteScheduleException.fulfilled, (state, action) => {
        state.loading = false;
        state.exceptions = state.exceptions.filter(exp => exp.id !== action.payload);
        if (state.currentException?.id === action.payload) {
          state.currentException = null;
        }
        state.error = null;
        state.successMessage = 'Xóa ngoại lệ lịch học thành công';
      })
      .addCase(deleteScheduleException.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Get available schedules
      .addCase(getAvailableSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAvailableSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.availableSchedules = action.payload;
        state.error = null;
      })
      .addCase(getAvailableSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError, setError, clearSuccessMessage, clearCurrentException, setPagination } = scheduleExceptionSlice.actions;
export default scheduleExceptionSlice.reducer;
