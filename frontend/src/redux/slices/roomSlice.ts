import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';

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

interface RoomState {
  rooms: Room[];
  roomsLoading: boolean;
  roomsError: string | null;
  selectedRoom: Room | null;
}

const initialState: RoomState = {
  rooms: [],
  roomsLoading: false,
  roomsError: null,
  selectedRoom: null
};

// Async thunk để lấy danh sách phòng học
export const fetchRoomsThunk = createAsyncThunk(
  'room/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_URL}/rooms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách phòng học');
      }

      const result = await response.json();
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Không thể tải danh sách phòng học');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk để tạo yêu cầu phòng
export const createRoomRequestThunk = createAsyncThunk(
  'room/createRequest',
  async (requestData: {
    roomId: string;
    requestType: 'change' | 'request';
    reason: string;
    requestedDate?: string;
    requestedTime?: string;
  }, { rejectWithValue }) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${API_URL}/rooms/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra khi gửi yêu cầu!');
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setSelectedRoom: (state, action) => {
      state.selectedRoom = action.payload;
    },
    clearRoomsError: (state) => {
      state.roomsError = null;
    },
    clearRooms: (state) => {
      state.rooms = [];
      state.roomsLoading = false;
      state.roomsError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch rooms
      .addCase(fetchRoomsThunk.pending, (state) => {
        state.roomsLoading = true;
        state.roomsError = null;
      })
      .addCase(fetchRoomsThunk.fulfilled, (state, action) => {
        state.roomsLoading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRoomsThunk.rejected, (state, action) => {
        state.roomsLoading = false;
        state.roomsError = action.payload as string;
      })
      // Create room request
      .addCase(createRoomRequestThunk.pending, (state) => {
        // Không cần loading state cho create request
      })
      .addCase(createRoomRequestThunk.fulfilled, (state) => {
        // Reset selected room sau khi tạo request thành công
        state.selectedRoom = null;
      })
      .addCase(createRoomRequestThunk.rejected, (state, action) => {
        state.roomsError = action.payload as string;
      });
  }
});

export const { setSelectedRoom, clearRoomsError, clearRooms } = roomSlice.actions;

// Selectors
export const selectRooms = (state: RootState) => state.room.rooms;
export const selectRoomsLoading = (state: RootState) => state.room.roomsLoading;
export const selectRoomsError = (state: RootState) => state.room.roomsError;
export const selectSelectedRoom = (state: RootState) => state.room.selectedRoom;

export default roomSlice.reducer;
