'use client';

// This is the entry point that redirects to the main React app
import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    // Redirect to the main app entry point
    window.location.replace('/');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">KIXIKILA</h1>
        <p>Redirecionando para a aplicação...</p>
      </div>
    </div>
  );
}