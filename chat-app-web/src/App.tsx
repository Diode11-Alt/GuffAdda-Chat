import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ChatLayout from './pages/ChatLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import { WebRTCProvider } from './contexts/WebRTCContext';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/chat" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <WebRTCProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
                <Route path="/chat" element={<ProtectedRoute><ChatLayout /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </WebRTCProvider>
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
