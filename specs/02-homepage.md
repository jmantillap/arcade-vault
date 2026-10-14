# SPEC 02 — Homepage de ARCADE VAULT

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-10-14
> **Objective:** Portar la landing de `references/templates/home-about/home.jsx` a `/`, mover la Biblioteca a `/biblioteca` y añadir "Inicio" a la navegación, solo la parte visual con datos mock.

---

## Por qué existe este spec

El SPEC 01 dejó la Biblioteca en `/`. El template nuevo (`references/templates/home-about/`) trae una landing de marketing (hero, ventajas, juegos, stats, actividad, precios, CTA final) que debe ser la puerta de entrada. Eso obliga a mover la Biblioteca a otra ruta y a retocar enlaces del SPEC 01. Este spec fija el movimiento para que no se improvise.

El template también trae `about.jsx` (Acerca de + Contacto). Queda fuera: va en un spec aparte.

---

## Alcance

**Dentro:**

- Home en `/` con las secciones del template, en este orden: hero (siluetas pixel flotantes, "▸ INSERTA UNA MONEDA_", título de 3 líneas, 2 CTAs, "DESLIZA ▼"), `// 01 ¿POR QUÉ ARCADE VAULT?` (4 tarjetas con icono SVG), `// 02 JUEGOS DISPONIBLES AHORA` (6 mini-tarjetas + "VER TODOS LOS JUEGOS →"), banda de stats (3 bloques), `// 03 ACTIVIDAD EN VIVO` (ticker de últimas puntuaciones + "TOP JUGADORES · HOY"), `// 04 PRECIOS` (plan único + 3 preguntas frecuentes), CTA final "¿LISTO PARA JUGAR?".
- Animación de entrada al hacer scroll (`.reveal` → `.in` con `IntersectionObserver`).
- Mover la Biblioteca de `/` a `/biblioteca` sin cambiar su contenido.
- Nav: nuevo enlace "Inicio" (`/`); "Biblioteca" pasa a `/biblioteca`. Aplica a barra y panel móvil.
- Actualizar los enlaces del SPEC 01 que apuntaban a la Biblioteca en `/`.
- Datos mock de actividad y top de jugadores en `lib/home.ts`.
- Estilos del Home añadidos a `app/globals.css` (solo lo que falte respecto a `references/templates/home-about/styles.css`).
- Soporte `prefers-reduced-motion`: sin animaciones, contenido siempre visible.

**Fuera de alcance (para specs futuros):**

- "Acerca de" y formulario de Contacto (`about.jsx`), enlace "Acerca de" en el Nav y ruta `/acerca`.
- Datos reales de actividad/ranking, mezcla con `av_scores` de `localStorage`.
- Ocultar o cambiar los CTAs de registro según la sesión.
- Contador de créditos funcional, pagos o planes reales (el "plan único" es solo texto).
- SEO por página, tests automatizados, internacionalización.
- Reescribir estilos con Tailwind.

---

## Modelo de datos

Nuevo `lib/home.ts` (mock, tipado). No toca `lib/games.ts` ni `lib/session.tsx`.

```ts
export type Neon = "cyan" | "magenta" | "yellow" | "green";

export type Actividad = {
  player: string; // "NEONFOX"
  gameId: string; // id existente en GAMES; el título se resuelve desde GAMES
  score: number;
  ago: string; // "hace 2 min"
  color: Neon; // color del nombre del jugador
};

export type TopJugador = { rank: number; player: string; score: number };

export const ACTIVIDAD: Actividad[]; // 7 filas, las del template
export const TOP_HOY: TopJugador[]; // 5 filas, las del template
```

Convenciones:

- `gameId` debe existir en `GAMES` (`bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `rocas`, `ranaria`); el ticker muestra `GAMES.find(...).title` (en mayúsculas, como en `lib/games.ts`).
- Números con `toLocaleString("es-ES")`.
- Los textos estáticos (ventajas, stats, precios, FAQ) viven en el JSX del Home; no son datos.
- Las 6 mini-tarjetas salen de `GAMES.slice(0, 6)`.
- Punto de enchufe del backend: `lib/home.ts` lleva el comentario `// Aquí se conectaría la API REST / Supabase` sobre `ACTIVIDAD` y `TOP_HOY`.

---

## Plan de implementación

Antes de empezar: leer en `node_modules/next/dist/docs/` las guías de Cache Components y de Server/Client Components (requerido por `AGENTS.md`) e invocar `/frontend-design` para la UI (requerido por `CLAUDE.md`).

1. Mover la Biblioteca: crear `app/biblioteca/page.tsx` que renderiza `<Library />`. Verificación: `npm run dev`, `/biblioteca` muestra la Biblioteca idéntica a la actual.
2. Actualizar enlaces a la Biblioteca (`/` → `/biblioteca`) en `app/juego/[id]/page.tsx` ("VOLVER AL VAULT"), `components/game-player.tsx` ("VOLVER AL VAULT") y `components/hall-of-fame.tsx` ("VOLVER A LA BIBLIOTECA"). `components/auth-form.tsx` sigue haciendo `router.push("/")` (el Home). Verificación: los tres botones llevan a `/biblioteca`.
3. Actualizar `components/nav.tsx`: añadir "Inicio" (`/`) en barra y panel móvil; "Biblioteca" a `/biblioteca`. "Inicio" activo solo con `pathname === "/"`; "Biblioteca" activo en `/biblioteca`, `/juego/*` y `/jugar/*`. El logo sigue yendo a `/`. Verificación: subrayado correcto en cada ruta.
4. Crear `lib/home.ts` con `Neon`, `Actividad`, `TopJugador`, `ACTIVIDAD`, `TOP_HOY`. Verificación: `npx tsc --noEmit` sin errores.
5. Añadir a `app/globals.css` las clases del Home que falten (comparar contra `references/templates/home-about/styles.css`: `.home*`, `.hero-*`, `.silo*`, `.section-*`, `.feature-*`, `.mini-*`, `.stat-*`, `.activity-*`, `.tick*`, `.top-*`, `.pricing-*`, `.price-card`, `.pc-*`, `.faq-*`, `.home-final`, `.final-*`, `.reveal`, `.lb-link`) más un bloque `@media (prefers-reduced-motion: reduce)` que deje `.reveal` visible sin transición y apague animaciones del Home. No añadir clases de "Acerca de". Verificación: `npm run build` compila el CSS.
6. Crear `components/home-reveal.tsx` (cliente, devuelve `null`): en `useEffect` observa los `.reveal`, añade `.in` al intersectar (umbral 0.12) y desconecta al desmontar. Si no existe `IntersectionObserver`, añade `.in` a todos de inmediato. Verificación: al hacer scroll, las secciones aparecen una vez.
7. Crear los componentes del Home como Server Components: `components/home-silhouettes.tsx` (8 SVG decorativos con `aria-hidden`), `components/feature-icon.tsx` (iconos GAMEPAD/FREE/TROPHY/ROCKET) y `components/mini-card.tsx` (`Link` a `/juego/[id]`). Verificación: `tsc` sin errores.
8. Reemplazar `app/page.tsx` por el Home (Server Component) con las 6 secciones y `<HomeReveal />`. Enlaces con `next/link`: "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" a `/biblioteca`; "CREAR CUENTA" y "EMPEZAR GRATIS →" a `/acceso`; "VER SALÓN →" a `/salon`; mini-tarjetas a `/juego/[id]`. Verificación: abrir `/` y recorrer cada sección y CTA.
9. Limpieza: `npm run lint` y `npm run build` sin errores; revisar que no queden referencias a la Biblioteca en `/`.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/` y `/biblioteca` cargan sin errores ni avisos de hidratación en la consola.
- [ ] `/biblioteca` conserva el comportamiento del SPEC 01: 8 tarjetas, búsqueda "caída" deja 1, "SHOOTER" deja 2, sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] `/` muestra, en orden: hero, `// 01`, `// 02`, stats, `// 03`, `// 04` y CTA final "¿LISTO PARA JUGAR?".
- [ ] El hero muestra "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA" en 3 líneas y las 8 siluetas decorativas, con `aria-hidden="true"`.
- [ ] La sección `// 01` tiene 4 tarjetas: "JUEGOS CLÁSICOS", "100% GRATIS", "LADDER BOARDS", "SIEMPRE CRECIENDO".
- [ ] La sección `// 02` muestra 6 mini-tarjetas con los primeros 6 juegos de `GAMES`; clic en una lleva a `/juego/[id]` de ese juego.
- [ ] La banda de stats muestra "12+ JUEGOS", "MILES DE PARTIDAS" y "GLOBAL RANKING".
- [ ] El ticker muestra 7 filas y "TOP JUGADORES · HOY" 5 filas; las 3 primeras llevan las clases `top1`, `top2`, `top3`; los puntos usan formato `es-ES` (ej. `312.840`).
- [ ] Cada nombre de juego del ticker coincide con el título de un juego de `GAMES`.
- [ ] La sección `// 04` muestra "$0 / SIEMPRE", 6 ventajas y 3 preguntas frecuentes.
- [ ] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" llevan a `/biblioteca`; "CREAR CUENTA" y "EMPEZAR GRATIS →" llevan a `/acceso`; "VER SALÓN →" lleva a `/salon`.
- [ ] Al hacer scroll, cada sección con `.reveal` recibe la clase `in` una sola vez.
- [ ] Con `prefers-reduced-motion: reduce` todas las secciones se ven sin hacer scroll y sin animaciones.
- [ ] El Nav muestra "Inicio", "Biblioteca" y "Salón de la Fama" (barra y panel móvil); no muestra "Acerca de".
- [ ] "Inicio" está activo solo en `/`; "Biblioteca" en `/biblioteca`, `/juego/*` y `/jugar/*`; "Salón de la Fama" en `/salon`.
- [ ] "VOLVER AL VAULT" (detalle y reproductor) y "VOLVER A LA BIBLIOTECA" (Salón) llevan a `/biblioteca`.
- [ ] Tras iniciar sesión en `/acceso` se redirige a `/`.
- [ ] Con 375 px de ancho no hay scroll horizontal en `/`.
- [ ] Todo el texto visible está en español.

---

## Decisiones tomadas y descartadas

- **Sí:** Home en `/`, Biblioteca en `/biblioteca`. Igual que el template (Inicio y Biblioteca separados) y URL raíz con la landing.
- **No:** Home en `/inicio` con la Biblioteca en `/`. Cero impacto en rutas, pero la raíz no sería la landing.
- **No:** Home y Biblioteca como secciones de una sola página. Se aparta del template.
- **Sí:** "Acerca de" y Contacto en un spec aparte. Mantiene este spec en una sola pantalla; el Nav omite "Acerca de" hasta entonces.
- **Sí:** actividad y top en `lib/home.ts` como mock fijo, con `gameId` resuelto contra `GAMES`. Coherente con SPEC 01 (sin backend) y evita nombres de juego que no existen.
- **No:** derivar el top de `seededScores`. "hace X min" seguiría siendo inventado y se pierde fidelidad al template.
- **No:** mezclar `av_scores` en la actividad. SPEC 01 ya decidió no mezclar guardadas con globales mock.
- **Sí:** CTAs de registro iguales con y sin sesión. Evita leer `localStorage` en el Home (parpadeo, hidratación); el Home puede ser Server Component estático.
- **Sí:** soporte `prefers-reduced-motion`. Desvío deliberado del template por accesibilidad.
- **Sí:** Home como Server Component; solo `HomeReveal` es cliente. Minimiza JS enviado.
- **Sí:** reutilizar `globals.css` y añadir solo lo que falte. Misma decisión que SPEC 01; sin Tailwind.
- **Sí:** el login redirige a `/` (Home). Cambio mínimo: no se toca `auth-form.tsx`. Si se prefiere `/biblioteca`, se cambia después.
- **Sí:** el "plan único" de precios es solo texto, sin lógica de pagos.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `.reveal` oculta contenido hasta que corre el JS; sin JS las secciones no se ven | Aceptado para un prototipo visual; con `prefers-reduced-motion` y sin `IntersectionObserver` el contenido queda visible. |
| Enlaces a `/` que debían ir a la Biblioteca se quedan sin actualizar | Paso 9 busca `href="/"` y `push("/")` en `app/` y `components/`; solo el logo y el redirect de login pueden quedar. |
| Criterios del SPEC 01 que citan la Biblioteca en `/` quedan desactualizados | Este spec los reemplaza; el SPEC 01 no se edita (histórico). |
| Clases del template duplicadas o en conflicto con `globals.css` | Paso 5 compara antes de añadir; solo se agregan clases ausentes. |
| Siluetas absolutas o la banda de stats provocan scroll horizontal en móvil | Criterio de 375 px; revisar `overflow` de `.home` y `.home-hero`. |
| Un `gameId` del mock deja de existir en `GAMES` | Criterio que cruza el ticker con `GAMES`; resolver con `find` y omitir la fila si no hay coincidencia. |

---

## Qué **no** está en este spec

- "Acerca de", formulario de Contacto y ruta `/acerca`.
- Datos reales de actividad o ranking, backend REST / Supabase.
- CTAs que cambian según la sesión.
- Créditos funcionales o pagos reales.
- Tests automatizados y SEO por página.
- Reescritura de estilos con Tailwind.

Cada uno, si llega, va en su propio spec.
