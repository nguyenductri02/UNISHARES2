import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import UniSharePage from './pages/UnisharePage';
import UniShareUpload from './pages/UnishareUpload';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';
import ModeratorPage from './pages/ModeratorPage';
import DocumentView from './pages/DocumentView';
import EditDocument from './pages/EditDocument';
import GroupDetailPage from './pages/GroupDetailPage';
import ChatPage from './pages/ChatPage';
import AIChatPage from './pages/AIChatPage';
import EchoTestPage from './pages/EchoTestPage';
import DirectSocketTestPage from './pages/DirectSocketTestPage';
import WebSocketTestPage from './pages/WebSocketTestPage';
import SearchResultsPage from './pages/SearchResultsPage';
import PopularGroupsPage from './pages/PopularGroupsPage';
import NewStudyGroupsPage from './pages/NewStudyGroupsPage';
import PopularDocumentsPage from './pages/PopularDocumentsPage';
import AllDocumentsPage from './pages/AllDocumentsPage';
import NewDocumentsPage from './pages/NewDocumentsPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import 'bootstrap/dist/css/bootstrap.min.css';
import { authService } from './services';
import { isAdmin, isModerator } from './utils/roleUtils';
import { Nav, Spinner, Alert } from 'react-bootstrap';

// Protected route component for admin routes - only for admin users
const AdminRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (!authService.isLoggedIn()) {
          navigate('/login');
          return;
        }

        const userData = await authService.getCurrentUser();
        setUser(userData);

        // Only allow admin role, redirect moderators away
        if (!isAdmin(userData)) {
          // If user is moderator, redirect to moderator dashboard
          if (isModerator(userData)) {
            navigate('/moderator/dashboard');
            return;
          }
          // Otherwise redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking user permissions:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  return isAdmin(user) ? children : null;
};

// Protected route component for moderator routes - only for moderator users
const ModeratorRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (!authService.isLoggedIn()) {
          navigate('/login');
          return;
        }

        const userData = await authService.getCurrentUser();
        setUser(userData);

        // Only allow moderator role, redirect admins away
        if (!isModerator(userData)) {
          // If user is admin, redirect to admin dashboard
          if (isAdmin(userData)) {
            navigate('/admin/dashboard');
            return;
          }
          // Otherwise redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking user permissions:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  if (loading) {
    return <div className="text-center p-5">Loading...</div>;
  }

  return isModerator(user) ? children : null;
};

// Protected route for authenticated users
const ProtectedRoute = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(authService.isLoggedIn());
  const navigate = useNavigate();

  useEffect(() => {
    if (!authenticated) {
      navigate('/login');
    }
  }, [authenticated, navigate]);

  return authenticated ? children : null;
};

function App() {
  return (
    <div className="App d-flex flex-column min-vh-100">
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          
          {/* Search results page */}
          <Route path="/search" element={<SearchResultsPage />} />
          
          {/* Document view route from homepage */}
          <Route path="/document/:id" element={<DocumentView />} />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/profile/:section" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          {/* Document sharing routes */}
          <Route path="/unishare-files" element={<AllDocumentsPage />} />
          <Route path="/unishare-files/home" element={<UniShareUpload activeSection="home" />} />
          <Route path="/unishare-files/popular" element={<PopularDocumentsPage />} />
          <Route path="/unishare-files/new" element={<NewDocumentsPage />} />
          <Route path="/unishare-files/upload" element={
            <ProtectedRoute>
              <UniShareUpload activeSection="upload" />
            </ProtectedRoute>
          }/>
          <Route path="/unishare-files/my-files" element={
            <ProtectedRoute>
              <UniShareUpload activeSection="my-files" />
            </ProtectedRoute>
          } />
          <Route path="/unishare-files/history" element={
            <ProtectedRoute>
              <UniShareUpload activeSection="history" />
            </ProtectedRoute>
          } />
          <Route path="/unishare-files/shared" element={
            <ProtectedRoute>
              <UniShareUpload activeSection="shared" />
            </ProtectedRoute>
          } />
          <Route path="/unishare-files/trash" element={
            <ProtectedRoute>
              <UniShareUpload activeSection="trash" />
            </ProtectedRoute>
          } />
          
          {/* New routes for document viewing and editing */}
          <Route path="/unishare-files/view/:id" element={
            <ProtectedRoute>
              <DocumentView />
            </ProtectedRoute>
          } />
          <Route path="/unishare-files/edit/:id" element={
            <ProtectedRoute>
              <EditDocument />
            </ProtectedRoute>
          } />
          
          {/* General unishare routes for groups/courses */}
          <Route path="/unishare" element={<UniSharePage />} />          
          <Route path="/unishare/:section" element={<UniSharePage />} />
          <Route path="/unishare/groups/:groupId" element={
            <ProtectedRoute>
              <GroupDetailPage />
            </ProtectedRoute>
          } />          <Route path="/unishare/chats/:chatId" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          
          {/* AI Chat routes */}
          <Route path="/ai-chat" element={
            <ProtectedRoute>
              <AIChatPage />
            </ProtectedRoute>
          } />
          <Route path="/ai-chat/:chatId" element={
            <ProtectedRoute>
              <AIChatPage />
            </ProtectedRoute>
          } />
          
          {/* Popular Groups Page */}
          <Route path="/unishare/popular-groups" element={<PopularGroupsPage />} />
          
          {/* New Study Groups Page */}
          <Route path="/unishare/new-groups" element={<NewStudyGroupsPage />} />
            {/* Terms of service page */}
          <Route path="/unishare/terms" element={<TermsOfServicePage />} />
            {/* Echo WebSocket Test Page */}
          <Route path="/test-echo" element={<EchoTestPage />} />
          
          {/* WebSocket Connection Test Page */}
          <Route path="/test-websocket" element={<WebSocketTestPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Admin routes with protected access */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          <Route path="/admin/:tab" element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          } />
          
          {/* Moderator routes with protected access */}
          <Route path="/moderator" element={
            <ModeratorRoute>
              <ModeratorPage />
            </ModeratorRoute>
          } />
          <Route path="/moderator/:tab" element={
            <ModeratorRoute>
              <ModeratorPage />
            </ModeratorRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
