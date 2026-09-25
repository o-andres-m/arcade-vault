"use client";

import { useState, useEffect } from "react";
import { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Leer usuario de localStorage al montar
  useEffect(() => {
    const stored = localStorage.getItem("av_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        localStorage.removeItem("av_user");
      }
    }
    setLoading(false);
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem("av_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("av_user");
  };

  return { user, loading, login, logout };
}
