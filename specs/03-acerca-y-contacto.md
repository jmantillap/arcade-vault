# SPEC 03 — Acerca de y Contacto con Resend

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-10-14
> **Objective:** Portar `references/templates/home-about/about.jsx` a `/acerca` (Acerca de + Contacto) y hacer que el formulario envíe un correo real al equipo con Resend desde una Server Action.

---

## Por qué existe este spec

El SPEC 02 dejó fuera "Acerca de" y Contacto (`about.jsx`) y avisó que irían en un spec aparte. A diferencia de los specs anteriores, este añade el primer código de servidor del proyecto (Server Action + servicio externo), así que fija remitente, validación y manejo de fallos para no improvisarlos.

---

## Alcance

**Dentro:**

- Ruta `/acerca` con las secciones del template, en este orden: hero "ACERCA DE ARCADE VAULT" (kicker, misión, 3 highlights con icono SVG: HEART, BROWSER, PLANT), divisor pixelado, sección "CONTÁCTANOS" (3 tips + formulario).
- Formulario con NOMBRE, CORREO ELECTRÓNICO, MENSAJE y botón "▶  ENVIAR MENSAJE", fiel al template.
- Envío con Server Action `enviarContacto` (`app/acerca/actions.ts`) usando el SDK `resend`.
- Un único correo al equipo; `replyTo` = correo del visitante. Sin autorrespuesta al visitante.
- Validación en cliente (animación `shake` si hay campos vacíos, igual que el template) y revalidación en servidor (campos obligatorios, formato de correo, longitudes).
- Anti-spam mínimo: honeypot oculto + límites de longitud.
- Estados: reposo, enviando (botón deshabilitado, "ENVIANDO…"), éxito (terminal `VAULT-OS // TERMINAL`, solo si Resend responde OK) y error (mensaje visible, el formulario conserva lo escrito).
- Nav: enlace "Acerca de" (`/acerca`) en barra y panel móvil, después de "Salón de la Fama" (como el template). Activo con `pathname.startsWith("/acerca")`.
- Variables de entorno `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` en `.env.local`; `.env.example` versionado.
- Animación de entrada `.reveal` (reutiliza `components/home-reveal.tsx`) y soporte `prefers-reduced-motion`.
- Estilos de Acerca/Contacto añadidos a `app/globals.css` (solo lo que falte respecto a `references/templates/home-about/styles.css`).
- `metadata` de la página: título en español.

**Fuera de alcance (para specs futuros):**

- Guardar mensajes en base de datos o bandeja en la app.
- Autorrespuesta o correo de confirmación al visitante (exige dominio verificado en Resend).
- Dominio propio verificado en Resend (se usa `onboarding@resend.dev` en desarrollo).
- Rate limit por IP, captcha (Turnstile/reCAPTCHA).
- Tests automatizados (el repo no tiene runner), SEO por página más allá del título, internacionalización.
- Plantilla de correo en HTML o React Email (el correo es texto plano).
- Reescribir estilos con Tailwind.

---

## Modelo de datos

Nuevo `lib/contacto.ts` (tipos, límites y validación compartidos por cliente y servidor). No toca `lib/games.ts`, `lib/home.ts` ni `lib/session.tsx`.

```ts
export const CONTACTO_LIMITES = { name: 80, email: 254, msg: 2000 } as const;

export type ContactoCampos = { name: string; email: string; msg: string };

export type ContactoEstado =
  | { status: "idle" }
  | { status: "ok"; name: string } // name = nombre recortado, para "GRACIAS, {NAME}"
  | { status: "error"; message: string };

// Devuelve el mensaje de error en español, o null si es válido.
export function validarContacto(c: ContactoCampos): string | null;
```

Variables de entorno (solo servidor, nunca `NEXT_PUBLIC_`):

```
RESEND_API_KEY=         # clave de Resend
CONTACT_TO_EMAIL=       # destino; con onboarding@resend.dev debe ser el correo de la cuenta Resend
CONTACT_FROM_EMAIL=ARCADE VAULT <onboarding@resend.dev>
```

Convenciones:

- `validarContacto` recorta con `trim()`; rechaza vacíos, correo sin formato válido y superar `CONTACTO_LIMITES`. El nombre no admite saltos de línea (evita inyección en el asunto).
- Honeypot: campo `website`, oculto con CSS (no `display:none` inline en el JSX final; clase `.hp`), `tabIndex={-1}`, `autoComplete="off"`. Si llega con valor, la acción responde `{ status: "ok" }` sin enviar nada.
- Asunto: `[ARCADE VAULT] Mensaje de {name}`. Cuerpo en `text` (no `html`), con nombre, correo y mensaje.
- Si faltan variables de entorno o Resend devuelve error: `console.error` en servidor con el detalle y al usuario `{ status: "error", message: "NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO MÁS TARDE." }`. Nunca se expone la clave ni el error crudo.
- Punto de enchufe del backend: `app/acerca/actions.ts` lleva el comentario `// Aquí se guardaría el mensaje en la base de datos (Supabase)` junto al envío.

---

## Plan de implementación

Antes de empezar: leer en `node_modules/next/dist/docs/` las guías de Server Actions / formularios y de Cache Components (requerido por `AGENTS.md`), consultar la documentación de Resend para Next.js e invocar `/frontend-design` para la UI (requerido por `CLAUDE.md`).

1. Dependencia y entorno: `npm install resend`; crear `.env.example` con las 3 variables vacías; añadir `!.env.example` a `.gitignore` (hoy `.env*` lo ignora). Verificación: `npm ls resend` y `git status` muestra `.env.example`.
2. Crear `lib/contacto.ts` con `CONTACTO_LIMITES`, `ContactoCampos`, `ContactoEstado` y `validarContacto`. Verificación: `npx tsc --noEmit` sin errores.
3. Crear `app/acerca/actions.ts` (`"use server"`) con `enviarContacto(prev, formData)`: honeypot, `validarContacto`, `new Resend(process.env.RESEND_API_KEY)`, `resend.emails.send({ from, to, replyTo, subject, text })`, manejo de `error` y de variables ausentes. Verificación: `tsc` sin errores.
4. Crear `components/highlight-icon.tsx` (Server Component, iconos HEART/BROWSER/PLANT del template). Verificación: `tsc` sin errores.
5. Añadir a `app/globals.css` las clases que falten (comparar contra `references/templates/home-about/styles.css`: `.about*`, `.kicker`, `.highlight*`, `.hl-*`, `.about-divider`, `.div-*`, `.contact-*`, `.tip*`, `.terminal-success`, `.term-*`, `.dot`, `.shake`, `.caret`, `.hp`) más un mensaje de error de formulario. Ampliar el bloque `@media (prefers-reduced-motion: reduce)` existente para apagar `.shake`, `.tip-led`, `.div-pixels span` y `.caret`. Verificación: `npm run build` compila el CSS.
6. Crear `components/contact-form.tsx` (cliente): `useActionState(enviarContacto, { status: "idle" })`, campos controlados, honeypot, `shake` 400 ms si hay campos vacíos (bloquea el envío), botón deshabilitado con "ENVIANDO…" mientras `isPending`, terminal de éxito con las líneas `[OK]` del template y `GRACIAS, {NAME}.`, mensaje de error, y "ENVIAR OTRO MENSAJE" que vuelve a reposo y limpia campos. Verificación: `tsc` sin errores.
7. Crear `app/acerca/page.tsx` (Server Component): hero, divisor, sección de contacto con `<ContactForm />` y `<HomeReveal />`; `export const metadata = { title: "Acerca de | ARCADE VAULT" }`. Verificación: `npm run dev`, `/acerca` muestra la página idéntica al template.
8. Actualizar `components/nav.tsx`: añadir `"acerca"` a `isActive` / `cls`, y el enlace "Acerca de" (`/acerca`) en barra y panel móvil después de "Salón de la Fama". Verificación: subrayado correcto en `/acerca` y en las demás rutas.
9. Prueba real: poner `RESEND_API_KEY` y `CONTACT_TO_EMAIL` en `.env.local`, enviar un mensaje desde `/acerca` y confirmar que llega con `replyTo` correcto. Luego `npm run lint` y `npm run build` sin errores.

---

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/acerca` carga sin errores ni avisos de hidratación en la consola.
- [ ] `/acerca` muestra, en orden: hero "ACERCA DE ARCADE VAULT", 3 highlights ("HECHO CON ❤️ PARA JUGADORES", "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", "PROYECTO EN CONSTANTE CRECIMIENTO"), divisor de 24 píxeles, "CONTÁCTANOS" con 3 tips y el formulario.
- [ ] El Nav muestra "Inicio", "Biblioteca", "Salón de la Fama" y "Acerca de" (barra y panel móvil); "Acerca de" está activo solo en `/acerca`.
- [ ] Enviar con algún campo vacío no llama al servidor y aplica la clase `shake` durante 400 ms.
- [ ] Enviar con un correo sin formato válido muestra un error en español y no envía el correo.
- [ ] Con datos válidos y `RESEND_API_KEY` correcta, llega un correo a `CONTACT_TO_EMAIL` con asunto `[ARCADE VAULT] Mensaje de {nombre}`, `replyTo` = correo del visitante y el mensaje en el cuerpo.
- [ ] Tras un envío exitoso se muestra la terminal con `MENSAJE RECIBIDO… GRACIAS, {NOMBRE EN MAYÚSCULAS}.`; "ENVIAR OTRO MENSAJE" vuelve al formulario vacío.
- [ ] Mientras se envía, el botón está deshabilitado y dice "ENVIANDO…".
- [ ] Con `RESEND_API_KEY` vacía o inválida se muestra "NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO MÁS TARDE.", el formulario conserva lo escrito y no aparece la terminal de éxito.
- [ ] Un campo `website` con valor no envía ningún correo y la UI responde como éxito.
- [ ] Nombre > 80, correo > 254 o mensaje > 2000 caracteres se rechazan en servidor.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente (búsqueda en `.next/static` sin resultados) ni en `git status` (`.env.local` ignorado, `.env.example` visible).
- [ ] Con `prefers-reduced-motion: reduce` el contenido de `/acerca` se ve sin hacer scroll y sin animaciones.
- [ ] Con 375 px de ancho no hay scroll horizontal en `/acerca`.
- [ ] Todo el texto visible está en español.

---

## Decisiones tomadas y descartadas

- **Sí:** Server Action con `useActionState`. Sin endpoint público extra y encaja con React 19.
- **No:** Route Handler `/api/contacto`. Más código y superficie pública sin beneficio hoy.
- **Sí:** remitente `onboarding@resend.dev` y destino en `CONTACT_TO_EMAIL`. Permite probar sin dominio; el dominio propio es un cambio de variable.
- **No:** exigir dominio verificado desde ya. Bloquea el avance por un trámite externo.
- **Sí:** solo `replyTo`, sin autorrespuesta. Con `onboarding@resend.dev` Resend no entrega a terceros; evita un segundo correo y un vector de spam.
- **Sí:** validación en cliente y servidor. El cliente da el `shake` del template; el servidor es la validación que cuenta.
- **Sí:** éxito solo si Resend responde OK. El template simula éxito siempre; aquí sería engañoso con un servicio real. Desvío deliberado del template.
- **Sí:** honeypot + límites de longitud. Cero dependencias; suficiente para un formulario de bajo tráfico.
- **No:** rate limit o captcha ahora. Requieren almacén o cuenta externa; spec aparte si el spam aparece.
- **Sí:** correo en texto plano. Evita inyección de HTML con contenido del visitante.
- **Sí:** ruta `/acerca`. Rutas en español (`/biblioteca`, `/salon`, `/acceso`) y lo anunciado en el SPEC 02.
- **Sí:** reutilizar `HomeReveal` y `globals.css`. Misma decisión que SPEC 01 y 02; sin Tailwind.
- **Sí:** soporte `prefers-reduced-motion`. Igual que SPEC 02.
- **Sí:** sin tests automatizados. El repo no tiene runner; añadirlo amplía el spec a otra área.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo entrega al correo de la cuenta Resend | `CONTACT_TO_EMAIL` documentado en `.env.example`; pasar a dominio verificado es un cambio de variables. |
| Spam por endpoint público sin rate limit | Honeypot y límites de longitud; si hay abuso, spec de rate limit/captcha. |
| Fuga de `RESEND_API_KEY` al cliente o al repo | Solo se lee en `actions.ts` (servidor), sin prefijo `NEXT_PUBLIC_`; criterio de búsqueda en el bundle; `.env.local` sigue ignorado. |
| Inyección de cabeceras o HTML vía nombre/mensaje | Nombre sin saltos de línea y correo en `text`, no `html`. |
| Los segmentos de Cache Components rompen el uso de `process.env`/acciones | Leer las guías de `node_modules/next/dist/docs/` antes; la acción solo se ejecuta bajo petición, la página es estática. |
| Resend caído o límite de cuota | Error genérico al usuario, detalle en `console.error`; el formulario conserva lo escrito para reintentar. |
| Clases del template en conflicto con `globals.css` (`.field`, `.btn.xl` ya existen) | Paso 5 compara antes de añadir; solo se agregan clases ausentes. |

---

## Qué **no** está en este spec

- Guardar mensajes en base de datos o panel de administración.
- Autorrespuesta al visitante y dominio propio verificado.
- Rate limit por IP o captcha.
- Correos HTML / React Email.
- Tests automatizados, SEO por página, internacionalización.
- Reescritura de estilos con Tailwind.

Cada uno, si llega, va en su propio spec.
