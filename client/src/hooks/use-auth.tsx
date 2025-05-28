import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { queryClient, apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (username: string, password: string, email: string, fullName: string, isAdmin?: boolean) => Promise<User>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user");
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Failed to fetch user");
        return await res.json();
      } catch (err) {
        console.error("Error fetching user:", err);
        return null;
      }
    },
  });

  // Update admin status when user changes
  useEffect(() => {
    if (user) {
      setIsAdmin(user.isAdmin || false);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/user"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { 
      username: string; 
      password: string; 
      email: string; 
      fullName: string;
      isAdmin?: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/register", userData);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/user"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Simplified methods for consumers
  const login = (username: string, password: string) => {
    return loginMutation.mutateAsync({ username, password });
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  const register = (username: string, password: string, email: string, fullName: string, isAdmin?: boolean) => {
    return registerMutation.mutateAsync({ username, password, email, fullName, isAdmin });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error: error as Error | null,
        isAdmin,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
