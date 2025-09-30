'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/supabase/client';
import type { User } from '@supabase/supabase-js';

// Create the authentication context
export const AuthContext = createContext({});

// Custom hook to access the authentication context
export const useAuthContext = () => useContext(AuthContext);

interface AuthContextProviderProps {
  children: ReactNode;
}

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  // Set up state to track the authenticated user and loading status
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to authentication state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Unsubscribe from the authentication state changes when the component is unmounted
    return () => subscription.unsubscribe();
  }, []);

  // Provide the authentication context to child components
  return (
    <AuthContext.Provider value={{ user }}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
}
