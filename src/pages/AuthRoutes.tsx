import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './auth/LoginPage';
import SignupPage from './auth/SignupPage';
import SetPinPage from './auth/SetPinPage';
import MockAppPage from './MockAppPage';
import MockProtectedRoute from '@/components/auth/MockProtectedRoute';

const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default redirect to login */}
      <Route path="/" element={<Navigate to="login" replace />} />
      
      {/* Auth Pages */}
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="set-pin" element={<SetPinPage />} />
      
      {/* Mock App - Protected */}
      <Route 
        path="app" 
        element={
          <MockProtectedRoute>
            <MockAppPage />
          </MockProtectedRoute>
        } 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

export default AuthRoutes;