import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Chip.module.css";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function Chip({ active = false, className, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(styles.chip, active && styles.active, className)}
      {...props}
    >
      {children}
    </button>
  );
}
