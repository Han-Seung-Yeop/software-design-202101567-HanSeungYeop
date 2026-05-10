import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer } from './components/common/Toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import OAuthError from './pages/OAuthError';
import ParentLinkCode from './pages/ParentLinkCode';
import Dashboard from './pages/Dashboard';
import TeacherRegister from './pages/admin/TeacherRegister';
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
          {/* OAuth */}
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/success" element={<OAuthCallback />} />
          <Route path="/oauth/parent-link" element={<OAuthCallback />} />
          <Route path="/oauth/error" element={<OAuthError />} />
          <Route path="/parent-link" element={<ParentLinkCode />} />

          {/* Protected */}
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
              <Route path="/admin/teachers" element={<TeacherRegister />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
