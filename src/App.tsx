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
import ProtectedRoute from "./components/auth/ProtectedRoute";

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
            
            {/* Main App - Protected */}
            <Route 
              path="/app" 
              element={
                <ProtectedRoute requireAuth={true} redirectTo="/entrar">
                  <AppPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Panel - Has its own authentication */}
            <Route 
              path="/admin/*" 
              element={<AdminPanel />} 
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
