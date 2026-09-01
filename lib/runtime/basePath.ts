// next/image no antepone el basePath a un src local al resolverlo internamente
// (limitación conocida de Next.js) -- los <Image src="/algo.png"> necesitan el
// prefijo a mano. Vacío en dev local (sin NEXT_BASE_PATH configurado).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
