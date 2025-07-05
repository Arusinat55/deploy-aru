import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../config/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      initialized: false,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      signInWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null });
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`
            }
          });
          if (error) throw error;
        } catch (error: any) {
          console.error('Google sign in error:', error);
          set({ error: error.message || 'Google authentication failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      signInWithEmail: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          set({ user: data.user, isAuthenticated: true });
        } catch (error: any) {
          console.error('Email sign in error:', error);
          set({ error: error.message || 'Email authentication failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      signUpWithEmail: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true, error: null });
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name
              }
            }
          });
          if (error) throw error;
          if (data.user) {
            set({ user: data.user, isAuthenticated: true });
          }
        } catch (error: any) {
          console.error('Email sign up error:', error);
          set({ error: error.message || 'Email registration failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null, isAuthenticated: false });
        } catch (error: any) {
          console.error('Sign out error:', error);
          set({ error: error.message || 'Sign out failed' });
        } finally {
          set({ isLoading: false });
        }
      },
      
      initialize: async () => {
        // Prevent multiple initializations
        if (get().initialized) {
          return;
        }

        try {
          set({ isLoading: true, error: null });
          
          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session error:', error);
            set({ error: error.message });
          } else if (session?.user) {
            set({ user: session.user, isAuthenticated: true });
          }
          
          // Set up auth state listener
          supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event, session?.user?.email);
            if (session?.user) {
              set({ user: session.user, isAuthenticated: true, error: null });
            } else {
              set({ user: null, isAuthenticated: false });
            }
          });
          
        } catch (error: any) {
          console.error('Auth initialization error:', error);
          set({ error: error.message || 'Authentication initialization failed' });
        } finally {
          set({ isLoading: false, initialized: true });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);