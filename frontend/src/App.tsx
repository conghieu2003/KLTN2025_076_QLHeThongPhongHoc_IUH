import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './redux/store';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import UserManagement from './pages/Management/UserManagement';
import CreateUser from './pages/Management/CreateUser';
import RoomList from './pages/RoomManagement/RoomList';
import AvailableRooms from './pages/RoomManagement/AvailableRooms';
import RoomRequestForm from './pages/RoomManagement/RoomRequestForm';
import RoomRequestList from './pages/RoomManagement/RoomRequestList';
import RoomScheduling from './pages/RoomManagement/RoomScheduling';
import ProcessRequest from './pages/RoomManagement/ProcessRequest';
import WeeklySchedule from './pages/Schedule/WeeklySchedule';
import ScheduleManagement from './pages/Schedule/ScheduleManagement';
import Profile from './pages/Dashboard/Profile';
import EquipmentList from './pages/EquipmentManagement/EquipmentList';
import RoomIssueList from './pages/RoomManagement/RoomIssueList';
import TeacherClassManagement from './pages/RoomManagement/TeacherClassManagement';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>       
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Admin Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/profile" element={<Profile />} />
            
            <Route path="/users" element={<UserManagement />} />
            
            <Route path="/users/create" element={<CreateUser />} />
            
            <Route path="/rooms" element={<RoomList />} />
            
            <Route path="/rooms/available" element={<AvailableRooms />} />
            
            <Route path="/room-requests" element={<RoomRequestForm />} />
            
            <Route path="/rooms/requests/list" element={<RoomRequestList />} />
            
            <Route path="/rooms/requests/:requestId/process" element={<ProcessRequest />} />
            
            <Route path="/rooms/scheduling" element={<RoomScheduling />} />
            
            <Route path="/schedule/weekly" element={<WeeklySchedule />} />
            
            <Route path="/schedule/management" element={<ScheduleManagement />} />
            
            <Route path="/equipment" element={<EquipmentList />} />
            
            <Route path="/equipment/list" element={<EquipmentList />} />
            
            <Route path="/equipment/room-issues" element={<RoomIssueList />} />
            
            <Route path="/teacher/classes" element={<TeacherClassManagement />} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          className="custom-toast-container"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Toast responsive styling for mobile */
            @media (max-width: 600px) {
              .Toastify__toast-container {
                width: auto !important;
                max-width: 280px !important;
                min-width: 200px !important;
                padding: 0 !important;
                left: auto !important;
                right: 12px !important;
                top: 12px !important;
              }
              
              .Toastify__toast {
                font-size: 12px !important;
                padding: 8px 10px !important;
                min-height: 44px !important;
                max-width: 280px !important;
                width: auto !important;
                margin-bottom: 8px !important;
                border-radius: 8px !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
              }
              
              .Toastify__toast-body {
                padding: 0 !important;
                margin: 0 !important;
                font-size: 12px !important;
                line-height: 1.4 !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
              }
              
              .Toastify__close-button {
                width: 18px !important;
                height: 18px !important;
                opacity: 0.6 !important;
              }
              
              .Toastify__progress-bar {
                height: 2px !important;
              }
              
              .Toastify__toast-icon {
                width: 18px !important;
                height: 18px !important;
                margin-right: 8px !important;
              }
            }
            
            @media (min-width: 601px) and (max-width: 960px) {
              .Toastify__toast {
                font-size: 14px !important;
                padding: 12px 14px !important;
                min-height: 52px !important;
                border-radius: 10px !important;
              }
              
              .Toastify__toast-body {
                font-size: 14px !important;
              }
              
              .Toastify__toast-icon {
                width: 20px !important;
                height: 20px !important;
              }
            }
          `
        }} />
      </BrowserRouter>
    </Provider>
  );
};

export default App;
