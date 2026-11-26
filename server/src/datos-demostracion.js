const facultadDemostracion = "Entorno local de demostración";
const permiteDemostracion = () => process.env.NODE_ENV !== "production" && process.env.SIGEP_DEMOSTRACION === "1";
const programasVisibles = () => permiteDemostracion() ? {} : { NOT: { facultad: facultadDemostracion } };
function requisitosVisibles() {
  const oficiales = { NOT: [{ codigo: { startsWith: "DEMO-" } }, { versionNorm: "Demostración" }] };
  return permiteDemostracion() ? { OR: [oficiales, { programa: { facultad: facultadDemostracion } }] } : oficiales;
}

module.exports = { facultadDemostracion, permiteDemostracion, programasVisibles, requisitosVisibles };
