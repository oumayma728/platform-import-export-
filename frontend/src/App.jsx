import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import LoginScreen from './LoginScreen.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PaymentCancelPage from './pages/PaymentCancelPage.jsx';
import PaymentChatSuccessPage from './pages/PaymentChatSuccessPage.jsx';
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx';
import SubscriptionPage from './pages/SubscriptionPage.jsx';

function RootGate() {
  const { isAuthenticated, handleLogin, authError, loginLoading } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <LoginScreen
      onLogin={async (email, password) => {
        const ok = await handleLogin(email, password);
        if (ok) {
          navigate('/dashboard');
        }
      }}
      error={authError}
      loading={loginLoading}
    />
  );
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootGate />} />

      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/cancel" element={<PaymentCancelPage />} />
      <Route path="/payment/chat-success" element={<PaymentChatSuccessPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/salons" element={<DashboardPage />} />
          <Route path="/rendez-vous" element={<DashboardPage />} />
          <Route path="/messaging" element={<DashboardPage />} />
          <Route path="/conversations/:conversationId" element={<DashboardPage />} />
          <Route path="/marketplace" element={<DashboardPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/stands/:standId" element={<DashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
