import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { userService } from '../../services/api';
import { User } from '../../types';

// loại tùy chọn
export interface OptionItem { id: number; name: string }
// form khởi tạo người dùng
export interface UserFormInit {
  code: string;
  previewUsername: string;
  departments: OptionItem[];
  majors: OptionItem[];
  defaultValues: {
    campus: string;
    trainingType: string;
    degreeLevel: string;
    academicYear?: string;
    enrollmentDate: string;
    title?: string;
  };
}

// slice
export interface UserState {
  previewCode: string;
  previewUsername: string;
  departments: OptionItem[];
  majors: OptionItem[];
  defaultValues: {
    campus: string;
    trainingType: string;
    degreeLevel: string;
    academicYear?: string;
    enrollmentDate: string;
    title?: string;
  };
  // User management state
  users: User[];
  usersLoading: boolean;
  usersError: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  previewCode: '',
  previewUsername: '',
  departments: [],
  majors: [],
  defaultValues: {
    campus: '',
    trainingType: '',
    degreeLevel: '',
    academicYear: '',
    enrollmentDate: '',
    title: ''
  },
  // quản lý người dùng
  users: [],
  usersLoading: false,
  usersError: null,
  isLoading: false,
  error: null
};

// lấy form khởi tạo người dùng
export const fetchFormInit = createAsyncThunk(
  'user/fetchFormInit',
  async (role: 'teacher' | 'student', { rejectWithValue }) => {
    try {
      const res = await userService.getNextCode(role);
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || 'Không thể tải dữ liệu khởi tạo');
      }
      return res.data as UserFormInit;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Không thể tải dữ liệu khởi tạo');
    }
  }
);

// lấy danh sách khoa
export const fetchDepartments = createAsyncThunk(
  'user/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await userService.getDepartments();
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || 'Không thể tải khoa');
      }
      return res.data as OptionItem[];
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Không thể tải khoa');
    }
  }
);

// lấy danh sách chuyên ngành
export const fetchMajors = createAsyncThunk(
  'user/fetchMajors',
  async (params: { departmentId?: number }, { rejectWithValue }) => {
    try {
      const res = await userService.getMajors(params?.departmentId);
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || 'Không thể tải chuyên ngành');
      }
      return res.data as OptionItem[];
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Không thể tải chuyên ngành');
    }
  }
);

// tạo người dùng
export const createUserThunk = createAsyncThunk(
  'user/create',
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await userService.createUser(payload);
      if (!res.success) {
        return rejectWithValue(res.message || 'Tạo người dùng thất bại');
      }
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Tạo người dùng thất bại');
    }
  }
);

// lấy danh sách người dùng
export const fetchUsersThunk = createAsyncThunk(
  'user/fetchUsers',
  async (params: { role?: 'admin' | 'teacher' | 'student' | 'all'; username?: string }, { rejectWithValue }) => {
    try {
      const res = await userService.listUsers(params.role, params.username);
      if (!res.success) {
        return rejectWithValue(res.message || 'Không thể tải danh sách người dùng');
      }
      return res.data || [];
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Không thể tải danh sách người dùng');
    }
  }
);

// cập nhật người dùng
export const updateUserThunk = createAsyncThunk(
  'user/update',
  async (params: { userId: number; userData: any }, { rejectWithValue }) => {
    try {
      const res = await userService.updateUser(params.userId, params.userData);
      if (!res.success) {
        return rejectWithValue(res.message || 'Cập nhật người dùng thất bại');
      }
      return { userId: params.userId, userData: params.userData };
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Cập nhật người dùng thất bại');
    }
  }
);

// slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => { state.error = null; },
    clearUsersError: (state) => { state.usersError = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFormInit.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchFormInit.fulfilled, (state, action: PayloadAction<UserFormInit>) => {
        state.isLoading = false;
        state.previewCode = action.payload.code;
        state.previewUsername = action.payload.previewUsername;
        state.departments = action.payload.departments || [];
        state.majors = action.payload.majors || [];
        state.defaultValues = action.payload.defaultValues || {
          campus: '',
          trainingType: '',
          degreeLevel: '',
          academicYear: '',
          enrollmentDate: '',
          title: ''
        };
      })
      .addCase(fetchFormInit.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload as string;
        state.previewCode = ''; state.previewUsername = ''; state.departments = []; state.majors = [];
        state.defaultValues = {
          campus: '',
          trainingType: '',
          degreeLevel: '',
          academicYear: '',
          enrollmentDate: '',
          title: ''
        };
      })
      .addCase(fetchDepartments.fulfilled, (state, action: PayloadAction<OptionItem[]>) => {
        state.departments = action.payload;
      })
      .addCase(fetchMajors.fulfilled, (state, action: PayloadAction<OptionItem[]>) => {
        state.majors = action.payload;
      })
      .addCase(fetchUsersThunk.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchUsersThunk.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsersThunk.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.payload as string;
      })
      .addCase(updateUserThunk.fulfilled, (state, action) => {
        const { userId, userData } = action.payload;
        state.users = state.users.map(user =>
          user.id === userId ? { 
            ...user, 
            phone: userData.phone,
            status: userData.isActive ? 'active' : 'inactive',
            isActive: userData.isActive
          } : user
        );
      });
  }
});

export const { clearUserError, clearUsersError } = userSlice.actions;

export default userSlice.reducer;


