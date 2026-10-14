export type Neon = "cyan" | "magenta" | "yellow" | "green";

export type Actividad = {
  player: string;
  gameId: string; // id existente en GAMES; el título se resuelve desde GAMES
  score: number;
  ago: string;
  color: Neon; // color del nombre del jugador
};

export type TopJugador = { rank: number; player: string; score: number };

// Aquí se conectaría la API REST / Supabase
export const ACTIVIDAD: Actividad[] = [
  { player: "NEONFOX", gameId: "caida", score: 184220, ago: "hace 2 min", color: "magenta" },
  { player: "PX_KAI", gameId: "gloton", score: 96400, ago: "hace 5 min", color: "yellow" },
  { player: "Z3R0COOL", gameId: "invasores", score: 54190, ago: "hace 8 min", color: "green" },
  { player: "VAULT_07", gameId: "rocas", score: 41200, ago: "hace 12 min", color: "cyan" },
  { player: "GLITCHA", gameId: "bloque-buster", score: 28450, ago: "hace 18 min", color: "cyan" },
  { player: "ARKADYA", gameId: "serpentina", score: 7820, ago: "hace 24 min", color: "green" },
  { player: "CYBER_LU", gameId: "ranaria", score: 18900, ago: "hace 31 min", color: "yellow" },
];

// Aquí se conectaría la API REST / Supabase
export const TOP_HOY: TopJugador[] = [
  { rank: 1, player: "NEONFOX", score: 312840 },
  { rank: 2, player: "PX_KAI", score: 248110 },
  { rank: 3, player: "M00NRYU", score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA", score: 138900 },
];
