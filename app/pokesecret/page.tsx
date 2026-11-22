'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './pokesecret.module.css';

interface Pokemon {
  id: number;
  name: string;
  image: string;
}

const MAX_POKEMON_ID = 1025;

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatPokemonId(id: number): string {
  return id.toString().padStart(3, '0');
}

function getRandomPokemonId(): number {
  return Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
}

export default function PokemonSecret() {
  const [counter, setCounter] = useState(0);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRandomPokemon(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const randomId = getRandomPokemonId();
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const image =
        data.sprites.other?.['official-artwork']?.front_default ??
        data.sprites.front_default;

      setPokemon({ id: data.id, name: capitalize(data.name), image });
      setCounter((prev) => prev + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error capturando Pokémon';
      setError(message);
      console.error('Error fetching Pokemon:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <span>ARCADE VAULT</span>
        </Link>
        <h1 className={styles.title}>POKéMON CATCHER</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.counterSection}>
            <span className={styles.counterLabel}>Pokémon Capturados:</span>
            <div className={styles.counter}>{counter}</div>
          </div>

          <div className={styles.pokemonDisplay}>
            {pokemon ? (
              <>
                <img
                  src={pokemon.image}
                  alt={pokemon.name}
                  className={styles.pokemonImage}
                />
                <h2 className={styles.pokemonName}>{pokemon.name}</h2>
                <span className={styles.pokemonId}>#{formatPokemonId(pokemon.id)}</span>
              </>
            ) : (
              <div className={styles.placeholder}>
                <span>¡PULSA EL BOTÓN!</span>
              </div>
            )}
          </div>

          <button
            onClick={fetchRandomPokemon}
            disabled={loading}
            className={`${styles.button} ${loading ? styles.loading : ''}`}
          >
            {loading ? 'CAPTURANDO...' : 'CAPTURAR POKÉMON'}
          </button>

          {error && <div className={styles.error}>{error}</div>}
        </div>
      </main>
    </div>
  );
}
