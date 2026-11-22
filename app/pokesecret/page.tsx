'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './pokesecret.module.css';

interface Pokemon {
  id: number;
  name: string;
  image: string;
}

export default function PokemonSecret() {
  const [counter, setCounter] = useState(0);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRandomPokemon = async () => {
    setLoading(true);
    try {
      const randomId = Math.floor(Math.random() * 1025) + 1;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      const data = await response.json();

      setPokemon({
        id: data.id,
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
      });
      setCounter((prev) => prev + 1);
    } catch (error) {
      console.error('Error fetching Pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Simplified Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span>ARCADE VAULT</span>
        </Link>
        <h1 className={styles.title}>POKéMON CATCHER</h1>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.card}>
          {/* Counter */}
          <div className={styles.counterSection}>
            <span className={styles.counterLabel}>Pokémon Capturados:</span>
            <div className={styles.counter}>{counter}</div>
          </div>

          {/* Pokemon Display */}
          <div className={styles.pokemonDisplay}>
            {pokemon ? (
              <>
                <img
                  src={pokemon.image}
                  alt={pokemon.name}
                  className={styles.pokemonImage}
                />
                <h2 className={styles.pokemonName}>{pokemon.name}</h2>
                <span className={styles.pokemonId}>#{pokemon.id.toString().padStart(3, '0')}</span>
              </>
            ) : (
              <div className={styles.placeholder}>
                <span>¡PULSA EL BOTÓN!</span>
              </div>
            )}
          </div>

          {/* Button */}
          <button
            onClick={fetchRandomPokemon}
            disabled={loading}
            className={`${styles.button} ${loading ? styles.loading : ''}`}
          >
            {loading ? 'CAPTURANDO...' : 'CAPTURAR POKÉMON'}
          </button>
        </div>
      </main>
    </div>
  );
}
