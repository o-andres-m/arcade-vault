"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@/types";
import styles from "./Nav.module.css";

interface NavProps {
  user: User | null;
  onSignOut: () => void;
}

export function Nav({ user, onSignOut }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const closeMobile = () => setMobileOpen(false);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/biblioteca" className={styles.logo} onClick={closeMobile}>
          <div className={styles.logoMark} />
          <span className={styles.logoText}>ARCADE VAULT</span>
        </Link>

        <div className={styles.links}>
          <Link
            href="/biblioteca"
            className={isActive("/biblioteca") ? styles.active : ""}
          >
            BIBLIOTECA
          </Link>
          <Link
            href="/salon"
            className={isActive("/salon") ? styles.active : ""}
          >
            SALÓN DE LA FAMA
          </Link>
        </div>

        <div className={styles.spacer} />

        <div className={styles.coinCounter}>
          <div className={styles.coin} />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <button onClick={onSignOut} className={styles.authBtn}>
            {user.name} · SALIR
          </button>
        ) : (
          <Link href="/auth" className={styles.authBtn}>
            INICIAR SESIÓN
          </Link>
        )}

        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile panel */}
      <div
        className={`${styles.mobileBackdrop} ${mobileOpen ? styles.open : ""}`}
        onClick={closeMobile}
      />
      <div className={`${styles.mobilePanel} ${mobileOpen ? styles.open : ""}`}>
        <button
          className={styles.closeBtn}
          onClick={closeMobile}
          aria-label="Cerrar menú"
        >
          ✕
        </button>

        <Link
          href="/biblioteca"
          className={isActive("/biblioteca") ? styles.active : ""}
          onClick={closeMobile}
        >
          BIBLIOTECA
        </Link>
        <Link
          href="/salon"
          className={isActive("/salon") ? styles.active : ""}
          onClick={closeMobile}
        >
          SALÓN DE LA FAMA
        </Link>

        <div className={styles.divider} />

        <div className={styles.mobileCoinCounter}>
          <div className={styles.coin} />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <>
            <div className={styles.userName}>{user.name}</div>
            <button onClick={() => { onSignOut(); closeMobile(); }} className={styles.signOutBtn}>
              CERRAR SESIÓN
            </button>
          </>
        ) : (
          <Link href="/auth" className={styles.authLink} onClick={closeMobile}>
            INICIAR SESIÓN
          </Link>
        )}
      </div>
    </>
  );
}
