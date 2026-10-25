"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  {
    group: null,
    links: [{ href: "/admin", label: "Panel principal" }],
  },
  {
    group: "GESTIÓN ACADÉMICA",
    links: [
      { href: "/admin/estudiantes", label: "Estudiantes" },
      { href: "/admin/programas", label: "Programas académicos" },
      { href: "/admin/expedientes", label: "Expedientes" },
      { href: "/admin/grados-titulos", label: "Grados y títulos" },
      { href: "/admin/segundas-especialidades", label: "Segundas especialidades" },
      { href: "/admin/diplomados", label: "Diplomados de posgrado" },
      { href: "/admin/certificacion-modulos", label: "Certificación por módulos" },
    ],
  },
  {
    group: "VALIDACIÓN Y DOCUMENTOS",
    links: [
      { href: "/admin/validacion-requisitos", label: "Validación de requisitos" },
      { href: "/admin/documentos", label: "Documentos y diplomas" },
      { href: "/admin/verificacion-qr", label: "Verificación QR" },
      { href: "/admin/exportacion-sunedu", label: "Exportación SUNEDU" },
    ],
  },
  {
    group: "SISTEMA",
    links: [
      { href: "/admin/reportes", label: "Reportes y estadísticas" },
      { href: "/admin/auditoria", label: "Auditoría del sistema" },
      { href: "/admin/usuarios", label: "Usuarios y permisos" },
      { href: "/admin/configuracion", label: "Configuración" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="side">
      <div className="side-head">
        <Image src="/escudo-unsch.png" alt="Escudo UNSCH" width={40} height={52} />
        <div>
          <div className="side-title serif">SIGEP</div>
          <div className="side-sub">Posgrado de Posgrado</div>
        </div>
      </div>

      {menu.map((section, i) => (
        <div key={i}>
          {section.group && (
            <div className="side-group">{section.group}</div>
          )}
          {section.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`side-link${pathname === link.href ? " on" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
