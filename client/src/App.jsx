import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from './components/common/Toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentDetail from './pages/students/StudentDetail';
import GradeList from './pages/grades/GradeList';
import AttendanceList from './pages/attendances/AttendanceList';
import BehaviorList from './pages/behaviors/BehaviorList';
import AttitudeList from './pages/attitudes/AttitudeList';
import SpecialNoteList from './pages/specialNotes/SpecialNoteList';
import FeedbackList from './pages/feedbacks/FeedbackList';
import CounselingList from './pages/counselings/CounselingList';
import CounselingSearch from './pages/counselings/CounselingSearch';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<StudentList />} />
              <Route path="/students/:id" element={<StudentDetail />} />
              <Route path="/grades" element={<GradeList />} />
              <Route path="/attendances" element={<AttendanceList />} />
              <Route path="/behaviors" element={<BehaviorList />} />
              <Route path="/attitudes" element={<AttitudeList />} />
              <Route path="/special-notes" element={<SpecialNoteList />} />
              <Route path="/feedbacks" element={<FeedbackList />} />
              <Route path="/counselings" element={<CounselingList />} />
              <Route path="/counselings/search" element={<CounselingSearch />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
