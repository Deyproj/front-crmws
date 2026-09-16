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
  // Configuración y Reportes no tienen pantalla propia en la raíz, solo secciones (ver
  // components/layout/SectionLayout.tsx). Se redirige acá y no con redirect() en un page.tsx: dentro
  // del layout con AppShell ese redirect llega como 200 con la instrucción embebida en el stream, no
  // como un 307 real. Next antepone el basePath solo en source y destination.
  async redirects() {
    return [
      { source: "/settings", destination: "/settings/whatsapp", permanent: false },
      { source: "/reports", destination: "/reports/usage", permanent: false },
    ];
  },
};

export default nextConfig;
