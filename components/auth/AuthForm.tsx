"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import styles from "./AuthForm.module.css";

type TabType = "in" | "up";

export function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("in");
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const userName = user.trim().toUpperCase().slice(0, 10) || "PLAYER1";
    const newUser: User = { name: userName };

    // Guardar en localStorage
    localStorage.setItem("av_user", JSON.stringify(newUser));

    // Navegar a biblioteca
    router.push("/biblioteca");
  };

  const handleGuest = () => {
    // No guardar usuario (guest mode)
    router.push("/biblioteca");
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.mark} />
        <h2>ARCADE VAULT</h2>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={tab === "in" ? styles.on : ""} onClick={() => setTab("in")}>
          INICIAR SESIÓN
        </button>
        <button className={tab === "up" ? styles.on : ""} onClick={() => setTab("up")}>
          CREAR CUENTA
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="user">Usuario</label>
          <input
            id="user"
            type="text"
            placeholder="Ingresa tu usuario"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>

        {tab === "up" && (
          <div className={`${styles.field} ${styles.slideIn}`}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="pass">Contraseña</label>
          <input
            id="pass"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        <button type="submit" className={`btn ${styles.submitBtn}`}>
          {tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
        </button>
      </form>

      {/* Guest */}
      <button className={`btn ghost ${styles.guestBtn}`} onClick={handleGuest}>
        JUGAR COMO INVITADO
      </button>

      {/* Divider */}
      <div className={styles.divider}>O CONTINÚA CON</div>

      {/* Social buttons */}
      <div className={styles.social}>
        <button className={`btn ghost ${styles.socialBtn}`} disabled>
          ◆ GOOGLE
        </button>
        <button className={`btn ghost ${styles.socialBtn}`} disabled>
          ▣ GITHUB
        </button>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        Al continuar, aceptas nuestros términos de servicio y política de privacidad
      </div>
    </div>
  );
}
