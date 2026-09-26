'use client';

import { useEffect, useRef } from 'react';
import ContactForm from '@/components/contact/ContactForm';

// Hook para efectos reveal con IntersectionObserver
function useReveal() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Esperar al siguiente frame para asegurar que el DOM esté renderizado
    requestAnimationFrame(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      const elements = document.querySelectorAll('.reveal');
      elements.forEach((el) => observer.observe(el));

      // Cleanup cuando se desmonte el componente
      return () => observer.disconnect();
    });
  }, []);
}

// Componente de iconos SVG pixel art
function HighlightIcon({ kind }: { kind: 'HEART' | 'BROWSER' | 'PLANT' }) {
  if (kind === 'HEART') {
    return (
      <svg className="hl-icon" width="48" height="48" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="1" height="1" fill="currentColor"/>
        <rect x="3" y="2" width="2" height="1" fill="currentColor"/>
        <rect x="3" y="3" width="2" height="1" fill="currentColor"/>
        <rect x="5" y="3" width="1" height="1" fill="currentColor"/>
        <rect x="10" y="3" width="1" height="1" fill="currentColor"/>
        <rect x="11" y="2" width="2" height="1" fill="currentColor"/>
        <rect x="11" y="3" width="2" height="1" fill="currentColor"/>
        <rect x="13" y="3" width="1" height="1" fill="currentColor"/>
        <rect x="2" y="4" width="4" height="1" fill="currentColor"/>
        <rect x="10" y="4" width="4" height="1" fill="currentColor"/>
        <rect x="1" y="5" width="6" height="1" fill="currentColor"/>
        <rect x="9" y="5" width="6" height="1" fill="currentColor"/>
        <rect x="1" y="6" width="14" height="1" fill="currentColor"/>
        <rect x="1" y="7" width="14" height="1" fill="currentColor"/>
        <rect x="2" y="8" width="12" height="1" fill="currentColor"/>
        <rect x="3" y="9" width="10" height="1" fill="currentColor"/>
        <rect x="4" y="10" width="8" height="1" fill="currentColor"/>
        <rect x="5" y="11" width="6" height="1" fill="currentColor"/>
        <rect x="6" y="12" width="4" height="1" fill="currentColor"/>
        <rect x="7" y="13" width="2" height="1" fill="currentColor"/>
      </svg>
    );
  }

  if (kind === 'BROWSER') {
    return (
      <svg className="hl-icon" width="48" height="48" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="2" width="14" height="1" fill="currentColor"/>
        <rect x="1" y="3" width="1" height="10" fill="currentColor"/>
        <rect x="14" y="3" width="1" height="10" fill="currentColor"/>
        <rect x="1" y="13" width="14" height="1" fill="currentColor"/>
        <rect x="2" y="4" width="12" height="1" fill="currentColor"/>
        <rect x="3" y="3" width="1" height="1" fill="currentColor"/>
        <rect x="5" y="3" width="1" height="1" fill="currentColor"/>
        <rect x="7" y="3" width="1" height="1" fill="currentColor"/>
        <rect x="4" y="7" width="3" height="1" fill="currentColor"/>
        <rect x="9" y="7" width="3" height="1" fill="currentColor"/>
        <rect x="4" y="9" width="5" height="1" fill="currentColor"/>
        <rect x="4" y="11" width="4" height="1" fill="currentColor"/>
      </svg>
    );
  }

  if (kind === 'PLANT') {
    return (
      <svg className="hl-icon" width="48" height="48" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="2" width="2" height="1" fill="currentColor"/>
        <rect x="4" y="3" width="1" height="1" fill="currentColor"/>
        <rect x="7" y="3" width="1" height="1" fill="currentColor"/>
        <rect x="3" y="4" width="1" height="1" fill="currentColor"/>
        <rect x="8" y="4" width="1" height="1" fill="currentColor"/>
        <rect x="3" y="5" width="1" height="1" fill="currentColor"/>
        <rect x="8" y="5" width="1" height="1" fill="currentColor"/>
        <rect x="4" y="6" width="1" height="1" fill="currentColor"/>
        <rect x="7" y="6" width="1" height="1" fill="currentColor"/>
        <rect x="9" y="4" width="2" height="1" fill="currentColor"/>
        <rect x="10" y="5" width="2" height="1" fill="currentColor"/>
        <rect x="11" y="6" width="1" height="1" fill="currentColor"/>
        <rect x="11" y="7" width="1" height="1" fill="currentColor"/>
        <rect x="10" y="8" width="1" height="1" fill="currentColor"/>
        <rect x="7" y="7" width="1" height="8" fill="currentColor"/>
        <rect x="5" y="13" width="1" height="1" fill="currentColor"/>
        <rect x="9" y="13" width="1" height="1" fill="currentColor"/>
        <rect x="4" y="14" width="7" height="1" fill="currentColor"/>
      </svg>
    );
  }

  return null;
}

export default function AboutPage() {
  useReveal();

  return (
    <div className="about fade-in">
      {/* SECCIÓN ABOUT */}
      <section className="about-hero">
        <div className="about-container">
          <div className="kicker kicker-yellow">▸ ACERCA DE</div>
          <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
          <p className="about-mission">
            ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra
            misión es preservar y celebrar los arcades que definieron una
            generación, haciéndolos accesibles para todos, en cualquier lugar y
            sin costo.
          </p>

          <div className="highlight-row">
            <div className="highlight highlight-magenta reveal" style={{ transitionDelay: '0ms' }}>
              <HighlightIcon kind="HEART" />
              <p className="highlight-text">HECHO CON ❤️ PARA JUGADORES</p>
            </div>

            <div className="highlight highlight-cyan reveal" style={{ transitionDelay: '80ms' }}>
              <HighlightIcon kind="BROWSER" />
              <p className="highlight-text">
                JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR
              </p>
            </div>

            <div className="highlight highlight-green reveal" style={{ transitionDelay: '160ms' }}>
              <HighlightIcon kind="PLANT" />
              <p className="highlight-text">PROYECTO EN CONSTANTE CRECIMIENTO</p>
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER ANIMADO */}
      <div className="about-divider reveal">
        <div className="div-line"></div>
        <div className="div-pixels">
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              className="pixel"
              style={{ animationDelay: `${i * 80}ms` }}
            ></span>
          ))}
        </div>
        <div className="div-line"></div>
      </div>

      {/* SECCIÓN CONTACTO */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          {/* Intro */}
          <div className="contact-intro">
            <div className="kicker kicker-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-description">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o
              simplemente quieres saludar? Escríbenos.
            </p>

            <ul className="contact-tips">
              <li className="tip tip-cyan">
                <span className="tip-led tip-led-cyan"></span>
                RESPUESTA EN 24-48H
              </li>
              <li className="tip tip-yellow">
                <span className="tip-led tip-led-yellow"></span>
                SUGERENCIAS BIENVENIDAS
              </li>
              <li className="tip tip-magenta">
                <span className="tip-led tip-led-magenta"></span>
                SIN SPAM, JAMÁS
              </li>
            </ul>
          </div>

          {/* Formulario */}
          <div className="contact-form-wrapper">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
