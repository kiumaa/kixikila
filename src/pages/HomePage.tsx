import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { OnboardingScreen } from '@/routes/LazyRoutes';

const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(0);
  
  // Redirect authenticated users to app
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <OnboardingScreen
        step={step}
        onNext={() => {
          if (step < 2) {
            setStep(step + 1);
          } else if (step === 2) {
            setStep(3);
          } else {
            window.location.href = '/entrar?type=register';
          }
        }}
        onSkip={() => {
          window.location.href = '/entrar?type=login';
        }}
      />
    </div>
  );
};

export default HomePage;