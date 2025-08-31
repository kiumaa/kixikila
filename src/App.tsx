import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import AppPage from "./pages/AppPage";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import OnboardingPage from "./pages/OnboardingPage";
import KycPage from "./pages/KycPage";
import GroupDetailsPage from "./pages/GroupDetailsPage";
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import UserProtectedRoute from "./components/auth/UserProtectedRoute";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RequireKyc from "./components/auth/RequireKyc";
import SmartRedirect from "./components/auth/SmartRedirect";
import AuthInitializer from "./components/auth/AuthInitializer";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthInitializer>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Homepage - Onboarding for new users, redirect for authenticated */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Smart redirect for authenticated users */}
            <Route 
              path="/redirect" 
              element={
                <ProtectedRoute>
                  <SmartRedirect />
                </ProtectedRoute>
              } 
            />
            
            {/* Authentication Page - Login/Register */}
            <Route 
              path="/entrar" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <AuthPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Onboarding - For new users */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } 
            />
            
            {/* KYC Verification */}
            <Route 
              path="/kyc" 
              element={
                <ProtectedRoute>
                  <KycPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Group Details Page */}
            <Route 
              path="/groups/:groupId" 
              element={
                <UserProtectedRoute>
                  <RequireKyc>
                    <GroupDetailsPage />
                  </RequireKyc>
                </UserProtectedRoute>
              } 
            />
            
            {/* Payment Success - Public route */}
            <Route 
              path="/payment/success" 
              element={<PaymentSuccessPage />} 
            />
            
            {/* Main App - User Protected with KYC requirement */}
            <Route 
              path="/app/*" 
              element={
                <UserProtectedRoute>
                  <RequireKyc>
                    <AppPage />
                  </RequireKyc>
                </UserProtectedRoute>
              } 
            />
            
            {/* Admin Panel - Admin Protected */}
            <Route 
              path="/admin/*" 
              element={
                <AdminProtectedRoute>
                  <AdminPanel />
                </AdminProtectedRoute>
              } 
            />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AuthInitializer>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
