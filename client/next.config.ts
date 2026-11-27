import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.SIGEP_DEMO_CLIENT === "1" ? { distDir: ".next-demo" } : {}),
  async rewrites() {
    const configurado = process.env.SIGEP_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
    const api = new URL(configurado);
    if (!["http:", "https:"].includes(api.protocol) || api.username || api.password || api.search || api.hash) {
      throw new Error("SIGEP_API_URL debe ser una URL HTTP(S) sin credenciales, consulta ni fragmento.");
    }
    // El servidor local escucha en IPv4 de forma predeterminada.
    if (api.hostname === "localhost") api.hostname = "127.0.0.1";
    const destino = api.href.replace(/\/$/, "");
    return [{ source: "/api/sigep/:path*", destination: `${destino}/:path*` }];
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
