import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './auth/LoginPage';
import SignupPage from './auth/SignupPage';
import SetPinPage from './auth/SetPinPage';
import HomePage from './HomePage';
import MockAppPage from './MockAppPage';
import MockProtectedRoute from '@/components/auth/MockProtectedRoute';
import KycWizard from '@/components/kyc/KycWizard';
import KycStatusScreen from '@/components/kyc/KycStatusScreen';

const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default redirect to login */}
      <Route path="/" element={<Navigate to="login" replace />} />
      
      {/* Auth Pages */}
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route path="set-pin" element={<SetPinPage />} />
      
      {/* Home - Protected */}
      <Route 
        path="/home" 
        element={
          <MockProtectedRoute>
            <HomePage />
          </MockProtectedRoute>
        } 
      />
      
      {/* Mock App - Protected */}
      <Route 
        path="app" 
        element={
          <MockProtectedRoute>
            <MockAppPage />
          </MockProtectedRoute>
        } 
      />
      
      {/* KYC Routes - Protected */}
      <Route 
        path="kyc/verify" 
        element={
          <MockProtectedRoute>
            <KycWizard onClose={() => window.history.back()} onComplete={() => window.location.href = '/auth/kyc/status'} />
          </MockProtectedRoute>
        } 
      />
      <Route 
        path="kyc/status" 
        element={
          <MockProtectedRoute>
            <KycStatusScreen onBack={() => window.history.back()} />
          </MockProtectedRoute>
        } 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};

export default AuthRoutes;