const { createServer } = require("node:http");

const portal = "http://127.0.0.1:3000";
const alias = createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ error: "Abre el portal local en el puerto 3000 para iniciar sesión o guardar cambios." }));
  }

  let anterior;
  try { anterior = new URL(req.url, portal); }
  catch { res.writeHead(400); return res.end(); }
  const destino = new URL(portal);
  destino.pathname = anterior.pathname;
  destino.search = anterior.search;
  res.writeHead(302, { Location: destino.href });
  return res.end();
});

alias.listen(3001, "127.0.0.1", () => {
  console.log("Acceso local heredado 3001 → portal SIGEP en 3000.");
});
