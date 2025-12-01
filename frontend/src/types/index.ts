// User types
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'student';
  teacherCode?: string | null;
  studentCode?: string | null;
  isActive: boolean;
  // Additional profile fields
  avatar?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  // Backend compatibility fields
  accountId?: number;
  status?: string;
  campus?: string;
  trainingType?: string;
  degreeLevel?: string;
  academicYear?: string;
  enrollmentDate?: string;
  classCode?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student extends User {
  role: 'student';
  studentId: string;
  classId?: string;
}

export interface Teacher extends User {
  role: 'teacher';
  teacherId: string;
  department?: string;
  title?: string;
}

export interface Admin extends User {
  role: 'admin';
}

// Class types
export interface Class {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  teacherId: string;
  subjectId: string;
  schedule: Schedule[];
  students: Student[];
  createdAt: Date;
  updatedAt: Date;
}

// Subject types
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schedule types
export interface Schedule {
  id: string;
  classId?: string;
  roomId: string;
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  startTime: string; // ISO string or HH:mm format
  endTime: string; // ISO string or HH:mm format
  startDate?: Date;
  endDate?: Date;
  status?: string;
  subject?: string; // Môn học
  subjectName?: string;
  roomName?: string;
  teacherName?: string;
  teacherId?: string;
  studentIds?: string[];
  title?: string; // Tiêu đề lịch
  description?: string; // Mô tả
  type?: string; // Loại lịch (class, exam, meeting, event)
  createdAt?: Date;
  updatedAt?: Date;
}

// Room types
export interface Room {
  id: string;
  roomNumber: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: string;
  campus?: string;
  description?: string;
  status: 'available' | 'inUse' | 'maintenance';
  currentClass?: string;
  currentSubject?: string;
  currentTeacher?: string;
  schedule?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Room Request types
export interface RoomRequest {
  id: string;
  requesterId: string;
  roomId: string;
  purpose: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Class Registration types
export interface ClassRegistration {
  id: string;
  studentId: string;
  classId: string;
  status: 'enrolled' | 'dropped' | 'completed';
  enrolledAt: Date;
  updatedAt: Date;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorCode?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'time';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

// Navigation types
export interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  children?: MenuItem[];
  roles?: string[];
}
