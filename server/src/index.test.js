const { spawn, spawnSync } = require("node:child_process");
const { once } = require("node:events");
const { resolve } = require("node:path");

jest.setTimeout(10000);

const entrypoint = resolve(__dirname, "index.js");
const serverDirectory = resolve(__dirname, "..");

function ambiente(databaseUrl) {
  return {
    ...process.env,
    DATABASE_URL: databaseUrl,
    PORT: "0",
    HOST: "127.0.0.1",
  };
}

describe("inicio del servidor PostgreSQL", () => {
  test.each(["", "file:./grados.sqlite", "libsql://example.invalid/db"]) (
    "rechaza antes de escuchar una URL ausente o no PostgreSQL: %s",
    (databaseUrl) => {
      const resultado = spawnSync(process.execPath, [entrypoint], {
        cwd: serverDirectory,
        env: ambiente(databaseUrl),
        encoding: "utf8",
        timeout: 5000,
      });

      expect(resultado.status).toBe(1);
      expect(resultado.stderr).toContain("DATABASE_URL debe usar el esquema postgresql://");
      expect(resultado.stdout).not.toContain("API SIGEP disponible");
    },
  );

  test("inicia el listener con una URL PostgreSQL válida", async () => {
    const child = spawn(process.execPath, [entrypoint], {
      cwd: serverDirectory,
      env: ambiente("postgresql://127.0.0.1:5432/sigep"),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });

    const listo = new Promise((resolveReady, reject) => {
      const timeout = setTimeout(() => reject(new Error(`El servidor no inició: ${stderr}`)), 5000);
      child.stdout.on("data", (chunk) => {
        if (stdout.includes("API SIGEP disponible en el puerto 0")) {
          clearTimeout(timeout);
          resolveReady();
        }
      });
      child.once("error", (error) => { clearTimeout(timeout); reject(error); });
      child.once("exit", (codigo) => {
        if (!stdout.includes("API SIGEP disponible en el puerto 0")) {
          clearTimeout(timeout);
          reject(new Error(`El proceso terminó antes de escuchar (${codigo}): ${stderr}`));
        }
      });
    });

    try {
      await listo;
      expect(stdout).toContain("API SIGEP disponible en el puerto 0");
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill();
      if (child.exitCode === null && child.signalCode === null) await once(child, "exit");
    }
  });
});
