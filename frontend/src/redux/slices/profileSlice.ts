import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { profileService, authService } from '../../services/api';

// Types
export interface PersonalProfile {
  id: number;
  userId: number;
  idCardNumber?: string;
  idCardIssueDate?: string;
  idCardIssuePlace?: string;
  placeOfBirth?: string;
  permanentAddress?: string;
  phoneEmergency?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyInfo {
  id: number;
  userId: number;
  fatherFullName?: string;
  fatherYearOfBirth?: number;
  fatherPhone?: string;
  motherFullName?: string;
  motherYearOfBirth?: number;
  motherPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicProfile {
  id: number;
  userId: number;
  role: string;
  campus?: string;
  trainingType?: string;
  degreeLevel?: string;
  academicYear?: string;
  enrollmentDate?: string;
  classCode?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentInfo {
  id: number;
  userId: number;
  studentCode: string;
  departmentId?: number;
  majorId?: number;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  major?: {
    id: number;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeacherInfo {
  id: number;
  userId: number;
  teacherCode: string;
  departmentId?: number;
  majorId?: number;
  department?: {
    id: number;
    name: string;
    code: string;
  };
  major?: {
    id: number;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  gender?: string;
  dateOfBirth?: string;
  role: 'admin' | 'teacher' | 'student';
  teacherCode?: string;
  studentCode?: string;
  isActive: boolean;
}

export interface ProfileData {
  user: User;
  personalProfile?: PersonalProfile;
  familyInfo?: FamilyInfo;
  academicProfile?: AcademicProfile;
  studentInfo?: StudentInfo;
  teacherInfo?: TeacherInfo;
}

interface ProfileState {
  profileData: ProfileData | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
  updateError: string | null;
  changingPassword: boolean;
  changePasswordError: string | null;
}

const initialState: ProfileState = {
  profileData: null,
  loading: false,
  error: null,
  updating: false,
  updateError: null,
  changingPassword: false,
  changePasswordError: null,
};

// Async thunks
export const fetchProfileData = createAsyncThunk(
  'profile/fetchProfileData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileService.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin profile'
      );
    }
  }
);

export const updatePersonalProfile = createAsyncThunk(
  'profile/updatePersonalProfile',
  async (personalData: Partial<PersonalProfile>, { rejectWithValue }) => {
    try {
      const response = await profileService.updatePersonalProfile(personalData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin cá nhân'
      );
    }
  }
);

export const updateFamilyInfo = createAsyncThunk(
  'profile/updateFamilyInfo',
  async (familyData: Partial<FamilyInfo>, { rejectWithValue }) => {
    try {
      const response = await profileService.updateFamilyInfo(familyData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin gia đình'
      );
    }
  }
);

export const updateAcademicProfile = createAsyncThunk(
  'profile/updateAcademicProfile',
  async (academicData: Partial<AcademicProfile>, { rejectWithValue }) => {
    try {
      const response = await profileService.updateAcademicProfile(academicData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin học vấn'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (userData: { fullName?: string; email?: string; phone?: string; address?: string }, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'profile/changePassword',
  async (passwordData: { oldPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(passwordData);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu'
      );
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.updateError = null;
      state.changePasswordError = null;
    },
    clearProfileData: (state) => {
      state.profileData = null;
      state.error = null;
      state.updateError = null;
      state.changePasswordError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile data
    builder
      .addCase(fetchProfileData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfileData.fulfilled, (state, action: PayloadAction<ProfileData>) => {
        state.loading = false;
        state.profileData = action.payload;
        state.error = null;
      })
      .addCase(fetchProfileData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update personal profile
    builder
      .addCase(updatePersonalProfile.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updatePersonalProfile.fulfilled, (state, action: PayloadAction<ProfileData>) => {
        state.updating = false;
        state.profileData = action.payload;
        state.updateError = null;
      })
      .addCase(updatePersonalProfile.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload as string;
      });

    // Update family info
    builder
      .addCase(updateFamilyInfo.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateFamilyInfo.fulfilled, (state, action: PayloadAction<ProfileData>) => {
        state.updating = false;
        state.profileData = action.payload;
        state.updateError = null;
      })
      .addCase(updateFamilyInfo.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload as string;
      });

    // Update academic profile
    builder
      .addCase(updateAcademicProfile.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateAcademicProfile.fulfilled, (state, action: PayloadAction<ProfileData>) => {
        state.updating = false;
        state.profileData = action.payload;
        state.updateError = null;
      })
      .addCase(updateAcademicProfile.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.updating = false;
        if (state.profileData) {
          state.profileData.user = action.payload;
        }
        state.updateError = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload as string;
      });

    // Change password
    builder
      .addCase(changePassword.pending, (state) => {
        state.changingPassword = true;
        state.changePasswordError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.changingPassword = false;
        state.changePasswordError = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.changingPassword = false;
        state.changePasswordError = action.payload as string;
      });
  },
});

export const { clearError, clearProfileData } = profileSlice.actions;
export default profileSlice.reducer;
