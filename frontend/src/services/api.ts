import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { User, ApiResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL;

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// thêm token vào header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// xử lý lỗi 401 (token hết hạn)
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// đăng nhập
export const authService = {
  login: async (identifier: string, password: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/auth/login', { identifier, password });

      if (response.data.success) {
        const { token, user } = response.data.data;
        const role = user.role;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('role', role);

        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        message: response.data.message || 'Đăng nhập thất bại',
        errorCode: response.data.errorCode || 'LOGIN_FAILED'
      };
    } catch (error: any) {
      // Xóa thông tin đăng nhập nếu có lỗi
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');

      // Trả về thông báo lỗi từ backend nếu có
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || 'Thông tin đăng nhập không chính xác',
          errorCode: error.response.data.errorCode || 'INVALID_CREDENTIALS'
        };
      }

      // Xử lý timeout
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          message: 'Server đang khởi động, vui lòng thử lại sau vài giây...',
          errorCode: 'TIMEOUT_ERROR'
        };
      }

      // Xử lý network error
      if (error.code === 'ERR_NETWORK' || !error.response) {
        return {
          success: false,
          message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.',
          errorCode: 'CONNECTION_ERROR'
        };
      }

      return {
        success: false,
        message: 'Có lỗi xảy ra khi đăng nhập',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  },

  // Đăng xuất
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  },

  // Đăng ký tài khoản
  register: async (userData: any): Promise<any> => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  // Lấy thông tin hồ sơ người dùng
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Cập nhật thông tin hồ sơ
  updateProfile: async (userData: Partial<User>): Promise<any> => {
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Đổi mật khẩu
  changePassword: async (passwordData: { oldPassword: string; newPassword: string }): Promise<any> => {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  // Quên mật khẩu
  forgotPassword: async (identifier: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/auth/forgot-password', { identifier });
      return response.data;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Đặt lại mật khẩu
  resetPassword: async (passwordData: { token: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/auth/reset-password', passwordData);
      return response.data;
    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Lấy vai trò người dùng
  getUserRole: (): string | null => {
    return localStorage.getItem('role');
  },

  // Lấy thông tin người dùng
  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// Schedule Service
export const scheduleService = {
  getAllSchedules: async (): Promise<any> => {
    const response = await api.get('/schedules');
    return response.data;
  },

  getRoomSchedule: async (roomId: string): Promise<any> => {
    const response = await api.get(`/schedules/room/${roomId}`);
    return response.data;
  },

  getTeacherSchedule: async (teacherId: string): Promise<any> => {
    const response = await api.get(`/schedules/teacher/${teacherId}`);
    return response.data;
  },

  getStudentSchedule: async (studentId: string): Promise<any> => {
    const response = await api.get(`/schedules/student/${studentId}`);
    return response.data;
  },

  createSchedule: async (scheduleData: any): Promise<any> => {
    const response = await api.post('/schedules', scheduleData);
    return response.data;
  },

  updateSchedule: async (scheduleId: string, scheduleData: any): Promise<any> => {
    const response = await api.put(`/schedules/${scheduleId}`, scheduleData);
    return response.data;
  },

  deleteSchedule: async (scheduleId: string): Promise<any> => {
    const response = await api.delete(`/schedules/${scheduleId}`);
    return response.data;
  },
};

// Room Service
export const roomService = {
  getAllRooms: async (): Promise<any> => {
    const response = await api.get('/rooms');
    return response.data;
  },

  getRoomById: async (roomId: string): Promise<any> => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
  },

  createRoom: async (roomData: any): Promise<any> => {
    const response = await api.post('/rooms', roomData);
    return response.data;
  },

  updateRoom: async (roomId: string, roomData: any): Promise<any> => {
    const response = await api.put(`/rooms/${roomId}`, roomData);
    return response.data;
  },

  deleteRoom: async (roomId: string): Promise<any> => {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  },

  createRoomRequest: async (requestData: any): Promise<any> => {
    const response = await api.post('/rooms/requests', requestData);
    return response.data;
  },

  getRoomRequests: async (): Promise<any> => {
    const response = await api.get('/rooms/requests/all');
    return response.data;
  },

  updateRoomRequestStatus: async (requestId: string, status: string): Promise<any> => {
    const response = await api.put(`/rooms/requests/${requestId}/status`, { status });
    return response.data;
  },

  getTeachersWithClasses: async (): Promise<any> => {
    const response = await api.get('/rooms/teachers-with-classes');
    return response.data;
  },

  getTeachers: async (): Promise<any> => {
    const response = await api.get('/rooms/teachers');
    return response.data;
  },

  getTimeSlots: async (): Promise<any> => {
    const response = await api.get('/rooms/time-slots');
    return response.data;
  },

  // Schedule Request APIs
  createScheduleRequest: async (requestData: any): Promise<any> => {
    const response = await api.post('/schedule-requests', requestData);
    return response.data;
  },

  getScheduleRequests: async (filters?: {
    status?: number;
    requestType?: number;
    requesterId?: number;
    page?: number;
    limit?: number;
  }): Promise<any> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status.toString());
    if (filters?.requestType) params.append('requestType', filters.requestType.toString());
    if (filters?.requesterId) params.append('requesterId', filters.requesterId.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/schedule-requests?${params.toString()}`);
    return response.data;
  },

  getTeacherSchedules: async (teacherId: number): Promise<any> => {
    const response = await api.get(`/rooms/teacher/${teacherId}/schedules`);
    return response.data;
  },

  getClassScheduleById: async (scheduleId: number): Promise<any> => {
    const response = await api.get(`/rooms/schedule/${scheduleId}`);
    return response.data;
  },

  getScheduleRequestById: async (requestId: number): Promise<any> => {
    const response = await api.get(`/schedule-requests/${requestId}`);
    return response.data;
  },

  updateScheduleRequestStatus: async (requestId: number, status: number, note?: string, selectedRoomId?: string, substituteTeacherId?: number): Promise<any> => {
    const response = await api.put(`/schedule-requests/${requestId}/status`, { status, note, selectedRoomId, substituteTeacherId });
    return response.data;
  },

  getSchedulesByTimeSlotAndDate: async (timeSlotId: number, dayOfWeek: number, date?: string): Promise<any> => {
    try {
      const params: any = {
        timeSlotId,
        dayOfWeek
      };
      
      // Thêm date parameter nếu có
      if (date) {
        params.date = date;
      }
      
      const response = await api.get('/rooms/schedules/by-time-slot', { params });
      return { success: true, data: response.data.data };
    } catch (error: any) {
      console.error('Error getting schedules:', error);
      return { success: false, data: [] };
    }
  },

  // API mới: Lấy phòng available cho ngoại lệ (bao gồm phòng trống do ngoại lệ khác)
  getAvailableRoomsForException: async (
    timeSlotId: number, 
    dayOfWeek: number, 
    date: string,
    capacity?: number,
    classRoomTypeId?: string,
    departmentId?: string
  ): Promise<any> => {
    try {
      const params: any = {
        timeSlotId,
        dayOfWeek,
        date
      };
      
      if (capacity) params.capacity = capacity;
      if (classRoomTypeId) params.classRoomTypeId = classRoomTypeId;
      if (departmentId) params.departmentId = departmentId;
      
      const response = await api.get('/rooms/available-for-exception', { params });
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      console.error('Error getting available rooms for exception:', error);
      return { success: false, data: { normalRooms: [], freedRooms: [], occupiedRooms: [], totalAvailable: 0 } };
    }
  },
};

// User Service
export const userService = {
  getCurrentUser: (): User | null => {
    return JSON.parse(localStorage.getItem('user') || 'null');
  },

  listUsers: async (role?: 'admin' | 'teacher' | 'student' | 'all', username?: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/users/list', {
      role: role && role !== 'all' ? role : undefined,
      username
    });
    return response.data;
  },

  // Lấy data form init: next code + preview username + departments + majors
  getNextCode: async (role: 'teacher' | 'student'): Promise<ApiResponse<{ code: string; previewUsername: string; departments: { id: number; name: string }[]; majors: { id: number; name: string }[] }>> => {
    const response = await api.get(`/users/next-code`, { params: { role } });
    return response.data;
  },

  getDepartments: async (): Promise<ApiResponse<{ id: number; name: string }[]>> => {
    const response = await api.get('/users/departments');
    return response.data;
  },

  getMajors: async (departmentId?: number): Promise<ApiResponse<{ id: number; name: string }[]>> => {
    const response = await api.get('/users/majors', { params: { departmentId } });
    return response.data;
  },

  createUser: async (userData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/users/create', userData);
      return response.data;
    } catch (error: any) {
      console.error('Create user error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  updateUser: async (userId: number, userData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      console.error('Update user error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  sendEmail: async (emailData: { userId: number; subject: string; content: string; includeCredentials: boolean }): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post('/users/send-email', emailData);
      return response.data;
    } catch (error: any) {
      console.error('Send email error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },
};

// quản lý lịch học
export const scheduleManagementService = {
  getAvailableTeachers: async (date: string, timeSlotId: number, departmentId?: number, excludeTeacherId?: number): Promise<ApiResponse<any[]>> => {
    try {
      const params: any = { date, timeSlotId: String(timeSlotId) };
      if (departmentId) {
        params.departmentId = String(departmentId);
      }
      if (excludeTeacherId) {
        params.excludeTeacherId = String(excludeTeacherId);
      }
      const response = await api.get('/schedule-management/teachers/available', { params });
      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi lấy danh sách giảng viên trống',
        data: []
      };
    }
  },
  getClassesForScheduling: async (): Promise<any> => {
    const response = await api.get('/schedule-management/classes');
    return response.data;
  },

  getSchedulingStats: async (): Promise<any> => {
    const response = await api.get('/schedule-management/stats');
    return response.data;
  },

  getAvailableRoomsForSchedule: async (scheduleId: string): Promise<any> => {
    const response = await api.get(`/schedule-management/available-rooms/${scheduleId}`);
    return response.data;
  },

  assignRoomToSchedule: async (scheduleId: string, roomId: string): Promise<any> => {
    const response = await api.post(`/schedule-management/assign-room/${scheduleId}`, { roomId });
    return response.data;
  },

  unassignRoomFromSchedule: async (scheduleId: string): Promise<any> => {
    const response = await api.delete(`/schedule-management/unassign-room/${scheduleId}`);
    return response.data;
  },

  getDepartments: async (): Promise<any> => {
    const response = await api.get('/schedule-management/departments');
    return response.data;
  },

  getTeachers: async (): Promise<any> => {
    const response = await api.get('/schedule-management/teachers');
    return response.data;
  },

  getRequestTypes: async (): Promise<any> => {
    const response = await api.get('/schedule-management/request-types');
    return response.data;
  },

  // Lấy lịch học theo tuần
  getWeeklySchedule: async (weekStartDate: string, filters: any = {}): Promise<any> => {
    const params = new URLSearchParams();
    params.append('weekStartDate', weekStartDate);

    if (filters.departmentId) params.append('departmentId', filters.departmentId.toString());
    if (filters.classId) params.append('classId', filters.classId.toString());
    if (filters.teacherId) params.append('teacherId', filters.teacherId.toString());

    const response = await api.get(`/schedule-management/weekly-schedule?${params.toString()}`);
    return response.data;
  },

  getClassRoomTypes: async (): Promise<any> => {
    const response = await api.get('/classroom-types');
    return response.data;
  },

  getRoomsByDepartmentAndType: async (departmentId: string, classRoomTypeId: string): Promise<any> => {
    const response = await api.get(`/rooms/filter?departmentId=${departmentId}&classRoomTypeId=${classRoomTypeId}`);
    return response.data;
  },
};

// Class Schedule Service
export const classScheduleService = {
  getAllSchedules: async (): Promise<any> => {
    const response = await api.get('/class-schedules');
    return response.data;
  },

  getSchedulesByClass: async (classId: string): Promise<any> => {
    const response = await api.get(`/class-schedules/class/${classId}`);
    return response.data;
  },

  getSchedulesByTeacher: async (teacherId: string): Promise<any> => {
    const response = await api.get(`/class-schedules/teacher/${teacherId}`);
    return response.data;
  },

  getSchedulesByRoom: async (roomId: string): Promise<any> => {
    const response = await api.get(`/class-schedules/room/${roomId}`);
    return response.data;
  },

  getSchedulesByWeek: async (week: string): Promise<any> => {
    const response = await api.get(`/class-schedules/week/${week}`);
    return response.data;
  },

  getSchedulesByDate: async (date: string): Promise<any> => {
    const response = await api.get(`/class-schedules/date/${date}`);
    return response.data;
  },

  createSchedule: async (scheduleData: any): Promise<any> => {
    const response = await api.post('/class-schedules', scheduleData);
    return response.data;
  },

  updateSchedule: async (scheduleId: string, scheduleData: any): Promise<any> => {
    const response = await api.put(`/class-schedules/${scheduleId}`, scheduleData);
    return response.data;
  },

  deleteSchedule: async (scheduleId: string): Promise<any> => {
    const response = await api.delete(`/class-schedules/${scheduleId}`);
    return response.data;
  },

  checkScheduleConflict: async (scheduleId: string, teacherId: string, dayOfWeek: string, timeSlotId: string): Promise<any> => {
    const response = await api.get(`/class-schedules/conflict/${scheduleId}`, {
      params: { teacherId, dayOfWeek, timeSlotId }
    });
    return response.data;
  },
};

// lịch học
export const enhancedScheduleService = {
  // Lấy danh sách lịch học theo filter
  getSchedules: async (filter: any = {}): Promise<any> => {
    try {
      const params = new URLSearchParams();

      if (filter.departmentId) params.append('departmentId', filter.departmentId.toString());
      if (filter.classId) params.append('classId', filter.classId.toString());
      if (filter.teacherId) params.append('teacherId', filter.teacherId.toString());
      if (filter.scheduleType) params.append('scheduleType', filter.scheduleType);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const response = await api.get(`/schedules?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw error;
    }
  },

  // Lấy danh sách khoa
  getDepartments: async (): Promise<any> => {
    try {
      const response = await api.get('/departments');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Lấy danh sách lớp học
  getClasses: async (departmentId?: number): Promise<any> => {
    try {
      const params = departmentId ? `?departmentId=${departmentId}` : '';
      const response = await api.get(`/classes${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  // Lấy danh sách giảng viên
  getTeachers: async (departmentId?: number): Promise<any> => {
    try {
      const params = departmentId ? `?departmentId=${departmentId}` : '';
      const response = await api.get(`/teachers${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },

  // Lấy lịch học theo tuần
  getWeeklySchedule: async (weekStartDate: string, filter: any = {}): Promise<any> => {
    try {
      const params = new URLSearchParams();
      params.append('weekStartDate', weekStartDate);

      if (filter.departmentId) params.append('departmentId', filter.departmentId.toString());
      if (filter.classId) params.append('classId', filter.classId.toString());
      if (filter.teacherId) params.append('teacherId', filter.teacherId.toString());
      if (filter.scheduleType) params.append('scheduleType', filter.scheduleType);

      const response = await api.get(`/schedules/weekly?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
      throw error;
    }
  },

  // Tạo lịch học mới
  createSchedule: async (scheduleData: any): Promise<any> => {
    try {
      const response = await api.post('/schedules', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  // Cập nhật lịch học
  updateSchedule: async (id: number, scheduleData: any): Promise<any> => {
    try {
      const response = await api.put(`/schedules/${id}`, scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  },

  // Xóa lịch học
  deleteSchedule: async (id: number): Promise<void> => {
    try {
      await api.delete(`/schedules/${id}`);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  },

  // In lịch học
  printSchedule: async (filter: any = {}): Promise<Blob> => {
    try {
      const params = new URLSearchParams();

      if (filter.departmentId) params.append('departmentId', filter.departmentId.toString());
      if (filter.classId) params.append('classId', filter.classId.toString());
      if (filter.teacherId) params.append('teacherId', filter.teacherId.toString());
      if (filter.scheduleType) params.append('scheduleType', filter.scheduleType);
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const response = await api.get(`/schedules/print?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error printing schedule:', error);
      throw error;
    }
  }
};

// Profile Service
export const profileService = {
  getProfile: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  getProfileById: async (userId: number): Promise<ApiResponse<any>> => {
    try {
      const response = await api.get(`/profile/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get profile by ID error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  updatePersonalProfile: async (personalData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put('/profile/personal', personalData);
      return response.data;
    } catch (error: any) {
      console.error('Update personal profile error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  updateFamilyInfo: async (familyData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put('/profile/family', familyData);
      return response.data;
    } catch (error: any) {
      console.error('Update family info error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  updateAcademicProfile: async (academicData: any): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put('/profile/academic', academicData);
      return response.data;
    } catch (error: any) {
      console.error('Update academic profile error:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw error;
    }
  },
};

// Schedule Exception Service
export const scheduleExceptionService = {
  // Lấy danh sách ngoại lệ lịch học
  getScheduleExceptions: async (): Promise<any> => {
    const response = await api.get('/schedule-exceptions');
    return response.data;
  },

  // Lấy danh sách lịch học có thể tạo ngoại lệ
  getAvailableSchedules: async (): Promise<any> => {
    const response = await api.get('/schedule-exceptions/available/schedules');
    return response.data;
  },

  // Tạo ngoại lệ lịch học
  createScheduleException: async (data: any): Promise<any> => {
    const response = await api.post('/schedule-exceptions', data);
    return response.data;
  },

  // Cập nhật ngoại lệ lịch học
  updateScheduleException: async (id: number, data: any): Promise<any> => {
    const response = await api.put(`/schedule-exceptions/${id}`, data);
    return response.data;
  },

  // Xóa ngoại lệ lịch học
  deleteScheduleException: async (id: number): Promise<any> => {
    const response = await api.delete(`/schedule-exceptions/${id}`);
    return response.data;
  },

  // Lấy thông tin ngoại lệ theo ID
  getScheduleExceptionById: async (id: number): Promise<any> => {
    const response = await api.get(`/schedule-exceptions/${id}`);
    return response.data;
  },

  // Lấy danh sách khoa
  getDepartments: async (): Promise<any> => {
    const response = await api.get('/departments');
    return response.data;
  },

  // Lấy danh sách tiết học
  getTimeSlots: async (): Promise<any> => {
    const response = await api.get('/rooms/time-slots');
    return response.data;
  },

  // Lấy danh sách phòng học
  getRooms: async (): Promise<any> => {
    const response = await api.get('/rooms');
    return response.data;
  },

  // Lấy danh sách giảng viên
  getTeachers: async (): Promise<any> => {
    const response = await api.get('/teachers');
    return response.data;
  },

  // Lấy danh sách loại ngoại lệ (RequestType)
  getRequestTypes: async (): Promise<any> => {
    const response = await api.get('/rooms/request-types');
    return response.data;
  }
};

export default api;