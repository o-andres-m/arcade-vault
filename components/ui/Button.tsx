import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "magenta" | "yellow";
  size?: "sm" | "md" | "lg" | "xl";
  pulse?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "default",
  size = "md",
  pulse = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        styles.btn,
        styles[variant],
        styles[size],
        pulse && styles.pulse,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
