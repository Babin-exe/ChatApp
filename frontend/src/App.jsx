import { Navigate, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import Login from "./pages/Login/Login.jsx";
import Messages from "./pages/Messages.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import { UseSocketContext } from "./context/socketContext.js";

const RouteLoader = () => (
  <div className="page-wrap auth-page">
    <div className="auth-shell auth-shell-compact">
      <div className="auth-top">
        <h1 className="auth-title">Checking session</h1>
        <p className="auth-subtitle">Just a moment.</p>
      </div>
    </div>
  </div>
);

const AuthRoute = ({ children }) => {
  const { authUser, authLoading } = UseSocketContext();

  if (authLoading) return <RouteLoader />;
  if (authUser) return <Navigate to="/message" replace />;

  return children;
};

const ProtectedRoute = ({ children }) => {
  const { authUser, authLoading } = UseSocketContext();

  if (authLoading) return <RouteLoader />;
  if (!authUser) return <Navigate to="/auth" replace />;

  return children;
};

function App() {
  return (
    <>
      <SocketContextProvider>
        <Toaster position="top-right" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth"
            element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            }
          />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/signup" element={<Navigate to="/auth" replace />} />
          <Route
            path="/message"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route path="/messages" element={<Navigate to="/message" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SocketContextProvider>
    </>
  );
}

export default App;
