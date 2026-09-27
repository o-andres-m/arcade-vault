import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Modal.module.css";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  variant?: "default" | "magenta";
  className?: string;
}

export function Modal({ open, onClose, children, variant = "default", className }: ModalProps) {
  if (!open) return null;

  const handleBackdropClick = () => {
    if (onClose) onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={cn(styles.modal, styles[variant], className)} onClick={handleModalClick}>
        {children}
      </div>
    </div>
  );
}
