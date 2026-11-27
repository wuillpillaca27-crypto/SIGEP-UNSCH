const facultadDemostracion = "Entorno local de demostración";
const facultadesDemostracion = [facultadDemostracion, "Entorno de demostración", "Entorno de demostraci?n"];
const marcaProgramaDemo = { facultad: { in: facultadesDemostracion } };
const permiteDemostracion = () => process.env.NODE_ENV !== "production" && process.env.SIGEP_DEMOSTRACION === "1";
const programasVisibles = () => permiteDemostracion() ? {} : { NOT: marcaProgramaDemo };
const usuariosVisibles = () => permiteDemostracion() ? {} : {
  NOT: [{ email: { endsWith: "@academico.demo.sigep.test" } }, { email: { endsWith: "@demo.sigep.test" } }, { email: "estudiante.integral@demo.test" }],
};
function requisitosVisibles() {
  const oficiales = { NOT: [{ codigo: { startsWith: "DEMO-" } }, { versionNorm: "Demostración" }] };
  return permiteDemostracion() ? { OR: [oficiales, { programa: marcaProgramaDemo }] } : oficiales;
}

module.exports = { facultadDemostracion, facultadesDemostracion, permiteDemostracion, programasVisibles, usuariosVisibles, requisitosVisibles };
