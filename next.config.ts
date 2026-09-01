import type { NextConfig } from "next";

const basePath = process.env.NEXT_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath,
  // next/image no antepone el basePath a un src local ("/logo.png") al resolverlo
  // internamente -- hay que hacerlo a mano (ver lib/runtime/basePath.ts). Se expone
  // aqui como NEXT_PUBLIC_* porque el valor debe quedar inlineado en el bundle del
  // cliente en build time, no leerse en runtime del proceso servidor.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
