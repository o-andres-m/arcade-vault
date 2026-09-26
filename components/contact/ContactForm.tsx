'use client';

import { useState, FormEvent, useEffect } from 'react';
import styles from './ContactForm.module.css';

// Validación básica de formato de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  msg: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    msg: '',
  });

  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [userName, setUserName] = useState('');

  // Efecto para limpiar el shake después de 400ms
  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validar campos
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedMsg = form.msg.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMsg) {
      setShake(true);
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setShake(true);
      return;
    }

    if (trimmedMsg.length > 1000) {
      setShake(true);
      return;
    }

    // Enviar formulario
    setStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          msg: trimmedMsg,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUserName(trimmedName);
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Error al enviar el mensaje');
      }
    } catch (error) {
      setStatus('error');
      setErrorMsg('Error de conexión. Verifica tu internet e intenta nuevamente.');
      console.error('Error al enviar formulario:', error);
    }
  };

  const handleReset = () => {
    setForm({ name: '', email: '', msg: '' });
    setStatus('idle');
    setErrorMsg('');
    setUserName('');
  };

  const handleRetry = () => {
    setStatus('idle');
    setErrorMsg('');
  };

  // Renderizado condicional según estado
  if (status === 'success') {
    return (
      <div className={styles.terminalSuccess}>
        <div className={styles.termBar}>
          <div className={styles.termDots}>
            <span className={styles.dotRed}></span>
            <span className={styles.dotYellow}></span>
            <span className={styles.dotGreen}></span>
          </div>
          <div className={styles.termTitle}>vault@arcade:~</div>
        </div>
        <div className={styles.termBody}>
          <div className={styles.line}>
            <span className={styles.prompt}>vault@arcade:~$</span>
            <span> send_message</span>
          </div>
          <div className={styles.line}>
            <span className={styles.output}>→ CONECTANDO...</span>
          </div>
          <div className={styles.line}>
            <span className={styles.output}>→ MENSAJE ENVIADO</span>
          </div>
          <div className={styles.line}>
            <span className={styles.output}>
              → MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO.
            </span>
          </div>
          <div className={styles.line}>
            <span className={styles.output}>
              → GRACIAS, {userName.toUpperCase()}
              <span className={styles.caret}>_</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className={styles.btnTerminal}
        >
          ENVIAR OTRO MENSAJE
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={styles.terminalError}>
        <div className={styles.termBar}>
          <div className={styles.termDots}>
            <span className={styles.dotRed}></span>
            <span className={styles.dotYellow}></span>
            <span className={styles.dotGreen}></span>
          </div>
          <div className={styles.termTitle}>vault@arcade:~</div>
        </div>
        <div className={styles.termBody}>
          <div className={styles.line}>
            <span className={styles.prompt}>vault@arcade:~$</span>
            <span> send_message</span>
          </div>
          <div className={styles.line}>
            <span className={styles.errorOutput}>ERROR: {errorMsg}</span>
          </div>
          <div className={styles.line}>
            <span className={styles.prompt}>vault@arcade:~$</span>
            <span className={styles.caret}>_</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className={styles.btnTerminal}
        >
          REINTENTAR
        </button>
      </div>
    );
  }

  // Formulario (idle o sending)
  const charCount = form.msg.length;
  const isDisabled = status === 'sending';

  return (
    <form
      onSubmit={handleSubmit}
      className={`${styles.contactForm} ${shake ? styles.shake : ''}`}
    >
      <div className={styles.field}>
        <label htmlFor="name">NOMBRE</label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          disabled={isDisabled}
          autoComplete="name"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="email">EMAIL</label>
        <input
          type="email"
          id="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          disabled={isDisabled}
          autoComplete="email"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="msg">
          MENSAJE <span className={styles.charCount}>({charCount}/1000)</span>
        </label>
        <textarea
          id="msg"
          name="msg"
          value={form.msg}
          onChange={handleChange}
          disabled={isDisabled}
          rows={6}
          maxLength={1000}
        />
      </div>

      <button type="submit" disabled={isDisabled} className={styles.btnSubmit}>
        {isDisabled ? 'ENVIANDO...' : 'ENVIAR'}
      </button>
    </form>
  );
}
