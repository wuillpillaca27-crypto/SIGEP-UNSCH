"use client";

import { useEffect, useState } from "react";

type Language = "es" | "en";
type Contrast = "normal" | "light" | "high" | "mono";
type Alignment = "left" | "center" | "justify";

type Settings = {
  language: Language;
  fontSize: number;
  readableFont: boolean;
  lineSpacing: boolean;
  letterSpacing: boolean;
  largeCursor: boolean;
  alignment: Alignment;
  contrast: Contrast;
  highlightLinks: boolean;
  readingGuide: boolean;
  stopAnimations: boolean;
};

const storageKey = "sigep-accesibilidad";
const defaults: Settings = { language: "es", fontSize: 100, readableFont: false, lineSpacing: false, letterSpacing: false, largeCursor: false, alignment: "left", contrast: "normal", highlightLinks: false, readingGuide: false, stopAnimations: false };

const copy = {
  es: { title: "Ajustes de accesibilidad", close: "Cerrar ajustes", text: "Texto y visualización", fontSize: "Tamaño de fuente", decrease: "Reducir texto", increase: "Aumentar texto", readable: "Fuente legible", line: "Altura de línea", letters: "Espaciado de letras", cursor: "Cursor grande", alignment: "Alineación", left: "Izquierda", center: "Centrado", justify: "Justificado", colors: "Color y contraste", normal: "Normal", light: "Contraste claro", high: "Alto contraste", mono: "Monocromo", reading: "Orientación y lectura", links: "Resaltar enlaces", guide: "Línea de lectura", animations: "Detener animaciones", reset: "Restablecer configuraciones", trigger: "Abrir ajustes de accesibilidad", language: "Idioma" },
  en: { title: "Accessibility settings", close: "Close settings", text: "Text and display", fontSize: "Font size", decrease: "Decrease text", increase: "Increase text", readable: "Readable font", line: "Line height", letters: "Letter spacing", cursor: "Large cursor", alignment: "Alignment", left: "Left", center: "Centered", justify: "Justified", colors: "Color and contrast", normal: "Normal", light: "Light contrast", high: "High contrast", mono: "Monochrome", reading: "Reading tools", links: "Highlight links", guide: "Reading guide", animations: "Stop animations", reset: "Reset settings", trigger: "Open accessibility settings", language: "Language" },
};

function AccessibilityIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="4.3" r="2.2" /><path d="M4 8.5 12 6l8 2.5M12 8v12M8.4 20l3.6-5 3.6 5M7.2 11.5 4.8 17M16.8 11.5l2.4 5" /></svg>;
}

export default function AccesibilidadWidget() {
  const [open, setOpen] = useState(false);
  const [guideY, setGuideY] = useState(240);
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") return defaults;
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) ?? "{}") }; } catch { return defaults; }
  });
  const t = copy[settings.language];

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = settings.fontSize === 100 ? "" : `${settings.fontSize}%`;
    root.classList.toggle("a11y-readable-font", settings.readableFont);
    root.classList.toggle("a11y-line-spacing", settings.lineSpacing);
    root.classList.toggle("a11y-letter-spacing", settings.letterSpacing);
    root.classList.toggle("a11y-large-cursor", settings.largeCursor);
    root.classList.toggle("a11y-highlight-links", settings.highlightLinks);
    root.classList.toggle("a11y-reduce-motion", settings.stopAnimations);
    root.classList.toggle("a11y-contrast-light", settings.contrast === "light");
    root.classList.toggle("a11y-contrast-high", settings.contrast === "high");
    root.classList.toggle("a11y-monochrome", settings.contrast === "mono");
    root.classList.toggle("a11y-align-center", settings.alignment === "center");
    root.classList.toggle("a11y-align-justify", settings.alignment === "justify");
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!settings.readingGuide) return;
    const moveGuide = (event: PointerEvent) => setGuideY(event.clientY);
    window.addEventListener("pointermove", moveGuide, { passive: true });
    return () => window.removeEventListener("pointermove", moveGuide);
  }, [settings.readingGuide]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) { setSettings((current) => ({ ...current, [key]: value })); }
  function reset() { setSettings(defaults); }

  return <>
    {settings.readingGuide && <div className="reading-guide" style={{ top: guideY }} aria-hidden="true" />}
    <button type="button" className="accessibility-trigger" onClick={() => setOpen(true)} aria-label={t.trigger} title={t.trigger}><AccessibilityIcon /><span>{settings.language === "es" ? "Accesibilidad" : "Accessibility"}</span></button>
    <div className={`accessibility-backdrop ${open ? "is-open" : ""}`} onClick={() => setOpen(false)} />
    <aside className={`accessibility-panel ${open ? "is-open" : ""}`} aria-label={t.title} aria-hidden={!open}>
      <div className="accessibility-panel-header"><div><div className="accessibility-kicker">SIGEP · UNSCH</div><h2>{t.title}</h2></div><button type="button" className="accessibility-close" onClick={() => setOpen(false)} aria-label={t.close}>×</button></div>
      <div className="accessibility-panel-body">
        <div className="accessibility-language"><span>{t.language}</span><div role="group" aria-label={t.language}><button type="button" className={settings.language === "es" ? "active" : ""} onClick={() => update("language", "es")}>ES</button><button type="button" className={settings.language === "en" ? "active" : ""} onClick={() => update("language", "en")}>EN</button></div></div>
        <section className="accessibility-group"><h3>{t.text}</h3><div className="font-size-control"><span>{t.fontSize}</span><div><button type="button" onClick={() => update("fontSize", Math.max(85, settings.fontSize - 10))} aria-label={t.decrease}>−</button><output aria-live="polite">{settings.fontSize}%</output><button type="button" onClick={() => update("fontSize", Math.min(130, settings.fontSize + 10))} aria-label={t.increase}>+</button></div></div><Toggle label={t.readable} active={settings.readableFont} onClick={() => update("readableFont", !settings.readableFont)} /><Toggle label={t.line} active={settings.lineSpacing} onClick={() => update("lineSpacing", !settings.lineSpacing)} /><Toggle label={t.letters} active={settings.letterSpacing} onClick={() => update("letterSpacing", !settings.letterSpacing)} /><Toggle label={t.cursor} active={settings.largeCursor} onClick={() => update("largeCursor", !settings.largeCursor)} /><div className="accessibility-option-label">{t.alignment}</div><div className="accessibility-options three"><Option label={t.left} active={settings.alignment === "left"} onClick={() => update("alignment", "left")} /><Option label={t.center} active={settings.alignment === "center"} onClick={() => update("alignment", "center")} /><Option label={t.justify} active={settings.alignment === "justify"} onClick={() => update("alignment", "justify")} /></div></section>
        <section className="accessibility-group"><h3>{t.colors}</h3><div className="accessibility-options two"><Option label={t.normal} active={settings.contrast === "normal"} onClick={() => update("contrast", "normal")} /><Option label={t.light} active={settings.contrast === "light"} onClick={() => update("contrast", "light")} /><Option label={t.high} active={settings.contrast === "high"} onClick={() => update("contrast", "high")} /><Option label={t.mono} active={settings.contrast === "mono"} onClick={() => update("contrast", "mono")} /></div></section>
        <section className="accessibility-group"><h3>{t.reading}</h3><Toggle label={t.links} active={settings.highlightLinks} onClick={() => update("highlightLinks", !settings.highlightLinks)} /><Toggle label={t.guide} active={settings.readingGuide} onClick={() => update("readingGuide", !settings.readingGuide)} /><Toggle label={t.animations} active={settings.stopAnimations} onClick={() => update("stopAnimations", !settings.stopAnimations)} /></section>
      </div>
      <div className="accessibility-panel-footer"><button type="button" className="accessibility-reset" onClick={reset}>{t.reset}</button></div>
    </aside>
  </>;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" className={`accessibility-toggle ${active ? "active" : ""}`} onClick={onClick}><span>{label}</span><i aria-hidden="true" /></button>;
}

function Option({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" className={`accessibility-option ${active ? "active" : ""}`} onClick={onClick}>{label}</button>;
}
