"use client";

import { useActionState, useState } from "react";
import { enviarContacto } from "@/app/acerca/actions";
import { CONTACTO_LIMITES, type ContactoEstado } from "@/lib/contacto";

const INICIAL: ContactoEstado = { status: "idle" };
const VACIO = { name: "", email: "", msg: "" };

// El `key` reinicia useActionState (no tiene reset) al pulsar "ENVIAR OTRO MENSAJE".
export default function ContactForm() {
  const [intento, setIntento] = useState(0);
  return <Formulario key={intento} onReset={() => setIntento((n) => n + 1)} />;
}

function Formulario({ onReset }: { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(enviarContacto, INICIAL);
  const [form, setForm] = useState(VACIO);
  const [shake, setShake] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      e.preventDefault(); // no llega a la Server Action
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <form
      className={"contact-form" + (shake ? " shake" : "")}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
    >
      {state.status !== "ok" ? (
        <>
          <div className="field">
            <label htmlFor="cf-name">NOMBRE</label>
            <input
              id="cf-name"
              name="name"
              value={form.name}
              maxLength={CONTACTO_LIMITES.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="cf-email">CORREO ELECTRÓNICO</label>
            <input
              id="cf-email"
              name="email"
              type="email"
              value={form.email}
              maxLength={CONTACTO_LIMITES.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="cf-msg">MENSAJE</label>
            <textarea
              id="cf-msg"
              name="msg"
              rows={5}
              value={form.msg}
              maxLength={CONTACTO_LIMITES.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            ></textarea>
          </div>
          {/* Honeypot: los bots lo rellenan, las personas no lo ven */}
          <div className="hp" aria-hidden="true">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>
          {state.status === "error" && (
            <p className="form-error" role="alert">{state.message}</p>
          )}
          <button className="btn xl press" type="submit" disabled={pending} style={{ width: "100%" }}>
            {pending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS{state.name ? `, ${state.name.toUpperCase()}` : ""}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={onReset}>ENVIAR OTRO MENSAJE</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
