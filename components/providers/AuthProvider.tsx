"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Nav } from "@/components/navigation/Nav";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, logout } = useAuth();

  return (
    <>
      <Nav user={user} onSignOut={logout} />
      {children}
    </>
  );
}
