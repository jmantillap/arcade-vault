"use server";

import { Resend } from "resend";
import { validarContacto, type ContactoEstado } from "@/lib/contacto";

const ERROR_ENVIO: ContactoEstado = {
  status: "error",
  message: "NO SE PUDO ENVIAR. INTÉNTALO DE NUEVO MÁS TARDE.",
};

// FormData.get puede devolver un File; solo aceptamos texto.
const texto = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
};

export async function enviarContacto(
  _prev: ContactoEstado,
  formData: FormData,
): Promise<ContactoEstado> {
  // Honeypot: un bot rellena `website`; respondemos éxito sin enviar nada.
  if (texto(formData, "website")) return { status: "ok", name: "" };

  const name = texto(formData, "name").trim();
  const email = texto(formData, "email").trim();
  const msg = texto(formData, "msg").trim();

  const invalido = validarContacto({ name, email, msg });
  if (invalido) return { status: "error", message: invalido };

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    console.error("[contacto] Faltan RESEND_API_KEY, CONTACT_TO_EMAIL o CONTACT_FROM_EMAIL");
    return ERROR_ENVIO;
  }

  try {
    // Aquí se guardaría el mensaje en la base de datos (Supabase)
    const { error } = await new Resend(RESEND_API_KEY).emails.send({
      from: CONTACT_FROM_EMAIL,
      to: CONTACT_TO_EMAIL,
      replyTo: email,
      subject: `[ARCADE VAULT] Mensaje de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`,
    });
    if (error) {
      console.error("[contacto] Resend:", error);
      return ERROR_ENVIO;
    }
  } catch (e) {
    console.error("[contacto] Fallo de red o SDK:", e);
    return ERROR_ENVIO;
  }

  return { status: "ok", name };
}
