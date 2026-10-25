"use client";
import { useEffect, useRef } from "react";

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
}

export default function Modal({ abierto, titulo, onCerrar, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (abierto) dialog.showModal();
    else         dialog.close();
  }, [abierto]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      onClose={onCerrar}
    >
      <div className="modal-header">
        <h2 id="modal-titulo" className="modal-titulo serif">{titulo}</h2>
        <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
