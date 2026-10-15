export const CONTACTO_LIMITES = { name: 80, email: 254, msg: 2000 } as const;

export type ContactoCampos = { name: string; email: string; msg: string };

export type ContactoEstado =
  | { status: "idle" }
  | { status: "ok"; name: string } // name = nombre recortado, para "GRACIAS, {NAME}"
  | { status: "error"; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Devuelve el mensaje de error en español, o null si es válido.
export function validarContacto(c: ContactoCampos): string | null {
  const name = c.name.trim();
  const email = c.email.trim();
  const msg = c.msg.trim();

  if (!name || !email || !msg) return "COMPLETA TODOS LOS CAMPOS.";
  if (/[\r\n]/.test(name)) return "EL NOMBRE NO PUEDE TENER SALTOS DE LÍNEA.";
  if (!EMAIL_RE.test(email)) return "CORREO ELECTRÓNICO NO VÁLIDO.";
  if (name.length > CONTACTO_LIMITES.name) return `NOMBRE DEMASIADO LARGO (MÁX. ${CONTACTO_LIMITES.name}).`;
  if (email.length > CONTACTO_LIMITES.email) return `CORREO DEMASIADO LARGO (MÁX. ${CONTACTO_LIMITES.email}).`;
  if (msg.length > CONTACTO_LIMITES.msg) return `MENSAJE DEMASIADO LARGO (MÁX. ${CONTACTO_LIMITES.msg}).`;
  return null;
}
