"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Nav } from "@/components/navigation/Nav";
import { User } from "@/types";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { profile, isAuthenticated, signOut } = useAuth();

  // Convertir profile a User para compatibilidad con Nav
  const user: User | null = profile
    ? { name: profile.username }
    : null;

  return (
    <>
      <Nav user={user} onSignOut={signOut} />
      {children}
    </>
  );
}
