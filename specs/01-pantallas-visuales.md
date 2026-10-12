# SPEC 01 — Pantallas visuales de ARCADE VAULT

> **Status:** Aprobado
> **Depends on:** Ninguna (parte del scaffold con `globals.css` y `layout.tsx` ya estilizados)
> **Date:** 2026-10-12
> **Objective:** Portar las 5 pantallas de `references/templates/` (biblioteca, detalle, reproductor, acceso, Salón de la Fama) más la navegación a rutas de Next.js App Router, solo la parte visual y sin implementar ningún juego.

---

## Por qué existe este spec

`references/templates/` contiene un prototipo React en un solo documento HTML (router por hash, React por CDN, globals en `window`). El proyecto real es Next.js 16 con App Router. Este spec fija cómo se traduce ese prototipo sin cambiar su aspecto, para que la implementación no improvise rutas, estado ni estilos.

---

## Alcance

**Dentro:**

- Navegación sticky con enlaces, contador de créditos decorativo, botón de auth/usuario y panel móvil con hamburguesa.
- Pantalla **Biblioteca** (`/`): hero, búsqueda por nombre, chips de categoría, grid de tarjetas con tilt 3D, estado "NO HAY RESULTADOS".
- Pantalla **Detalle** (`/juego/[id]`): portada, tags, descripción, stats, botones "JUGAR AHORA" / "VOLVER AL VAULT", panel "MEJORES PUNTUACIONES" top 10.
- Pantalla **Reproductor** (`/jugar/[id]`): HUD, bisel CRT con arena simulada en CSS, pausa, fin, salir, modal "FIN DEL JUEGO" con guardado y animación typewriter.
- Pantalla **Acceso** (`/acceso`): tabs "INICIAR SESIÓN" / "CREAR CUENTA", invitado, botones sociales inertes.
- Pantalla **Salón de la Fama** (`/salon`): tabs por juego, podio, tabla top 12 con entrada escalonada, "TU MEJOR MARCA".
- Datos mock de juegos y rankings, sesión de usuario y puntuaciones en `localStorage`.
- Footer común y `lang="es"` (ya presente en `app/layout.tsx`).

**Fuera de alcance (para specs futuros):**

- Cualquier juego real o carga de juegos HTML externos en `<iframe sandbox>`.
- Backend real (REST / Supabase), OAuth real de Google/GitHub, validación de formularios, contraseñas.
- Mezclar las puntuaciones guardadas en `localStorage` dentro de los rankings globales mock.
- Panel "tweaks" del prototipo (clases `.tw-*`), contador de créditos funcional.
- Tests automatizados, metadata SEO por página, internacionalización.
- Reescribir estilos con Tailwind.

---

## Modelo de datos

Datos mock en `lib/games.ts` (copiados del template, tipados):

```ts
export type Categoria = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type Game = {
  id: string; // slug en la URL: "bloque-buster", "caida", ...
  title: string;
  short: string; // 1 línea, tarjeta
  long: string; // 2-3 frases, detalle
  cat: Categoria;
  cover: string; // clase CSS existente: "cover-bricks", "cover-tetro", ...
  color: "cyan" | "magenta" | "yellow" | "green"; // variante del botón JUGAR
  best: number; // mejor puntuación global mock
  plays: string; // "12.4K"
};

export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date "DD/MM/2026"
export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;
export function seededScores(seed: number, count?: number): ScoreRow[]; // determinista, como en el template
```

Sesión y puntuaciones en `lib/session.tsx` (provider cliente, `"use client"`):

```ts
export type User = { name: string }; // mayúsculas, máx. 10 caracteres
export type SavedScore = { game: string; score: number; name: string; at: number };
```

Claves de `localStorage` (mismas del template, sin versionar):

- `av_user`: `User` serializado; ausente = invitado.
- `av_scores`: `SavedScore[]` serializado.

Convenciones:

- Números con `toLocaleString("es-ES")`.
- Todo el texto de UI en español.
- Punto de enchufe del backend: `lib/session.tsx` lleva el comentario `// Aquí se conectaría la API REST / Supabase` sobre `login` y `saveScore`.

---

## Plan de implementación

Antes de empezar: leer en `node_modules/next/dist/docs/` las guías de rutas dinámicas, Client Components y Cache Components (requerido por `AGENTS.md`), e invocar `/frontend-design` para la UI (requerido por `CLAUDE.md`).

1. Crear `lib/games.ts` con `Game`, `GAMES` (8 juegos del template), `CATS`, `seededScores`. Verificación: `npx tsc --noEmit` sin errores.
2. Crear `lib/session.tsx` (provider cliente con `user`, `login`, `signOut`, `saveScore`, lectura de `localStorage` dentro de `useEffect` y `try/catch`). Crear `components/nav.tsx` (cliente, `usePathname`, panel móvil) y envolver `app/layout.tsx`: dentro de `#root` van `Nav`, `<main className="av-main">{children}</main>` y el footer. Verificación: `npm run dev`, la barra se ve en `/`, el panel móvil abre y cierra.
3. Reemplazar `app/page.tsx` por la Biblioteca: `components/game-card.tsx` (cliente, tilt 3D) y `components/library.tsx` (cliente, estado `q` y `cat`). Tarjeta y botón "JUGAR" navegan a `/juego/[id]` con `next/link` o `router.push`. Verificación: filtrar por texto y categoría, probar el vacío.
4. Crear `app/juego/[id]/page.tsx`: detalle con `notFound()` si el id no existe, ranking `seededScores(id.length * 17 + 3, 10)`. Verificación: `/juego/caida` muestra el detalle; `/juego/xxx` muestra 404.
5. Crear `app/salon/page.tsx` + `components/hall-of-fame.tsx` (cliente): tabs, podio, tabla, "TU MEJOR MARCA" calculada desde `av_scores` del usuario y el juego activo; la fila solo aparece si hay marca. Verificación: cambiar de tab re-renderiza las filas con animación.
6. Crear `app/acceso/page.tsx` + `components/auth-form.tsx` (cliente): tabs, campos, "JUGAR COMO INVITADO", botones sociales sin acción. El envío llama a `login` y redirige a `/`. Verificación: tras entrar, la barra muestra el nombre en lugar de "Iniciar Sesión".
7. Crear `app/jugar/[id]/page.tsx` + `components/game-player.tsx` (cliente): HUD, CRT, arena simulada, pausa, fin, modal con guardado en `av_scores`, "JUGAR DE NUEVO", "VOLVER AL VAULT", "SALIR" a `/juego/[id]`. Verificación: terminar partida, guardar y ver el typewriter "PUNTUACIÓN GUARDADA".
8. Limpieza: eliminar restos del scaffold, comprobar que `globals.css` contiene todas las clases usadas (comparar contra `references/templates/styles.css`; solo se añade lo que falte). Verificación: `npm run lint` y `npm run build` sin errores.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/`, `/juego/caida`, `/jugar/caida`, `/acceso` y `/salon` cargan sin errores ni avisos de hidratación en la consola.
- [ ] `/juego/id-inexistente` y `/jugar/id-inexistente` devuelven la página 404.
- [ ] La Biblioteca muestra 8 tarjetas; escribir "caída" deja 1; elegir "SHOOTER" deja 2; una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Clic en una tarjeta o en su botón "JUGAR" navega a `/juego/[id]` de ese juego.
- [ ] El detalle muestra 10 filas en "MEJORES PUNTUACIONES" y las 3 primeras con color oro, plata y bronce.
- [ ] "JUGAR AHORA" lleva a `/jugar/[id]`; "VOLVER AL VAULT" lleva a `/`.
- [ ] En el reproductor la puntuación sube sola, "PAUSA" la congela y muestra "EN PAUSA", y "REANUDAR" la retoma.
- [ ] "FIN" abre el modal "FIN DEL JUEGO" con la puntuación final; "GUARDAR PUNTUACIÓN" añade una entrada a `localStorage["av_scores"]` y muestra "PUNTUACIÓN GUARDADA".
- [ ] "JUGAR DE NUEVO" reinicia puntuación, vidas y nivel; "SALIR" lleva a `/juego/[id]`.
- [ ] En `/acceso`, entrar con cualquier usuario guarda `av_user` y la barra muestra el nombre en mayúsculas (máx. 10 caracteres); "JUGAR COMO INVITADO" entra sin guardar `av_user`.
- [ ] Al hacer clic en el nombre de usuario de la barra se cierra la sesión y se borra `av_user`.
- [ ] El Salón muestra podio (oro al centro), 12 filas con entrada escalonada y una pestaña por cada uno de los 8 juegos.
- [ ] "TU MEJOR MARCA" aparece solo con sesión iniciada y al menos una puntuación guardada en ese juego, con el valor máximo guardado.
- [ ] El enlace activo de la barra se subraya en `/` (también en `/juego/*` y `/jugar/*`) y en `/salon`.
- [ ] Por debajo de 840 px los enlaces se ocultan y aparece la hamburguesa con panel lateral.
- [ ] Todo el texto visible está en español.
- [ ] Con `localStorage` bloqueado la app sigue funcionando sin excepciones (la sesión no persiste).

---

## Decisiones tomadas y descartadas

- **Sí:** rutas App Router reales (`/`, `/juego/[id]`, `/jugar/[id]`, `/acceso`, `/salon`). URLs compartibles e idiomático en Next.
- **No:** SPA con router por hash como el template. Va contra Next y Cache Components.
- **Sí:** reusar las clases globales ya presentes en `app/globals.css`. Fidelidad visual exacta, mínimo cambio.
- **No:** reescribir con Tailwind. Más trabajo y riesgo de divergir del diseño.
- **Sí:** datos mock en `lib/games.ts` y `seededScores`. Rankings deterministas, sin backend.
- **Sí:** sesión y puntuaciones en `localStorage` (`av_user`, `av_scores`) vía provider cliente. Permite probar el flujo completo de guardado.
- **No:** versionar las claves (`av_user:v1`). Es un prototipo visual; se versionan cuando exista backend.
- **Sí:** arena simulada del template en el reproductor. Hace visibles HUD, pausa, fin y guardado.
- **No:** `<iframe sandbox>` vacío. Es del spec del juego real.
- **Sí:** login falso que acepta cualquier dato (usuario vacío → `PLAYER1`). Igual que el template; la validación va con el backend.
- **Sí:** "TU MEJOR MARCA" calculada desde `av_scores`. Se desvía del template, que inventa el valor; un dato falso rotulado como marca personal engaña.
- **Sí:** los botones sociales (Google, GitHub) se renderizan sin acción.
- **Sí:** Nav, `main` y footer en `app/layout.tsx` para no repetirlos por página.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `cacheComponents: true` exige tratar `params` y datos dinámicos de forma específica en rutas dinámicas | Leer la guía en `node_modules/next/dist/docs/` antes del paso 4; usar `generateStaticParams` con los ids de `GAMES` si la guía lo indica. |
| Leer `localStorage` en el render provoca error de hidratación | Leerlo solo en `useEffect`; antes de montar se renderiza como invitado. |
| `localStorage` desactivado o lleno | Todas las lecturas y escrituras en `try/catch`; la app sigue sin persistencia. |
| JSON corrupto en `av_user` o `av_scores` | `JSON.parse` dentro de `try/catch` con valor por defecto (`null` / `[]`). |
| `setInterval` del reproductor sigue activo al salir de la pantalla | Limpiar el intervalo en el `return` del `useEffect`. |
| `globals.css` actual no cubre alguna clase del template | Paso 8 compara contra `references/templates/styles.css` y añade lo que falte. |

---

## Qué **no** está en este spec

- Juegos reales ni `<iframe sandbox>` para HTML externo.
- Backend REST / Supabase ni OAuth real.
- Puntuaciones guardadas integradas en los rankings globales.
- Tests automatizados.
- Reescritura de estilos con Tailwind.

Cada uno, si llega, va en su propio spec.
