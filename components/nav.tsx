"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useSession();

  const isActive = (name: "inicio" | "biblioteca" | "salon" | "acceso") => {
    if (name === "inicio") return pathname === "/";
    if (name === "salon") return pathname.startsWith("/salon");
    if (name === "acceso") return pathname.startsWith("/acceso");
    return (
      pathname.startsWith("/biblioteca") ||
      pathname.startsWith("/juego") ||
      pathname.startsWith("/jugar")
    );
  };
  const cls = (name: "inicio" | "biblioteca" | "salon" | "acceso") =>
    isActive(name) ? "active" : "";
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/" className="logo">
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/" className={cls("inicio")}>Inicio</Link>
          <Link href="/biblioteca" className={cls("biblioteca")}>Biblioteca</Link>
          <Link href="/salon" className={cls("salon")}>Salón de la Fama</Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={signOut}>{user.name} ▾</button>
        ) : (
          <Link href="/acceso" className="btn auth-btn">Iniciar Sesión</Link>
        )}
        <button className="btn ghost hamburger" onClick={() => setOpen(true)} aria-label="Menú">≡</button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>MENÚ</div>
        <Link href="/" className={cls("inicio")} onClick={close}>Inicio</Link>
        <Link href="/biblioteca" className={cls("biblioteca")} onClick={close}>Biblioteca</Link>
        <Link href="/salon" className={cls("salon")} onClick={close}>Salón de la Fama</Link>
        <Link href="/acceso" className={cls("acceso")} onClick={close}>{user ? "Cuenta" : "Iniciar Sesión"}</Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>CRÉDITOS · 03</div>
      </aside>
    </>
  );
}
