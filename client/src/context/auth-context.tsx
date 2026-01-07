import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'business';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role?: 'user' | 'business') => void;
  logout: () => void;
  register: (email: string, name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const login = (email: string, role: 'user' | 'business' = 'user') => {
    // Mock login
    const mockUser = {
      id: 'u-1',
      email,
      name: email.split('@')[0],
      role,
    };
    setUser(mockUser);
    toast({
      title: "Bentornato!",
      description: `Accesso effettuato come ${mockUser.name}`,
    });
  };

  const register = (email: string, name: string) => {
    const mockUser = {
      id: 'u-new',
      email,
      name,
      role: 'user' as const,
    };
    setUser(mockUser);
    toast({
      title: "Benvenuto!",
      description: "Account creato con successo.",
    });
  };

  const logout = () => {
    setUser(null);
    toast({
      title: "Disconnesso",
      description: "A presto!",
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
