import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../config/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      
      signInWithGoogle: async () => {
        try {
          set({ isLoading: true });
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`
            }
          });
          if (error) throw error;
        } catch (error) {
          console.error('Google sign in error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      signInWithEmail: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          set({ user: data.user, isAuthenticated: true });
        } catch (error) {
          console.error('Email sign in error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      signUpWithEmail: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true });
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
        } catch (error) {
          console.error('Email sign up error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      signOut: async () => {
        try {
          set({ isLoading: true });
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Sign out error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      
      initialize: async () => {
        try {
          set({ isLoading: true });
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            set({ user: session.user, isAuthenticated: true });
          }
          
          // Listen for auth changes
          supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
              set({ user: session.user, isAuthenticated: true });
            } else {
              set({ user: null, isAuthenticated: false });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
        } finally {
          set({ isLoading: false });
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