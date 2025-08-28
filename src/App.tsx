import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import AppPage from "./pages/AppPage";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import UserProtectedRoute from "./components/auth/UserProtectedRoute";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  // Initialize Supabase auth and listen to state changes
  useSupabaseAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Homepage - Onboarding */}
            <Route path="/" element={<HomePage />} />
            
            {/* Authentication Page - Login/Register */}
            <Route path="/entrar" element={<AuthPage />} />
            
            {/* Main App - User Protected */}
            <Route 
              path="/app/*" 
              element={
                <UserProtectedRoute>
                  <AppPage />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
