import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { initialize } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        await initialize();
        navigate('/chat', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login?error=auth_failed', { replace: true });
      }
    };

    handleAuthCallback();
  }, [initialize, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};