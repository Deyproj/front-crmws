/**
 * Franjas diagonales — motivo gráfico de marca tomado del sitio real de Dinamo Fitness
 * (acento visual cerca de títulos de sección/fotografía). Puramente decorativo
 * (`aria-hidden`), pensado para pantallas de baja densidad (login, headers de sección) —
 * no para la bandeja de conversaciones ni tablas. Agregado 2026-08-31 (rediseño de
 * personalidad). No conoce negocio ni features — ver guia_completa_sistema_diseno_frontend.md.
 */
import type { SVGProps } from 'react';

export function DiagonalStripes({
  color = 'var(--color-accent)',
  ...props
}: SVGProps<SVGSVGElement> & { color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 40"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <line x1="4" y1="40" x2="24" y2="0" stroke={color} strokeWidth="6" />
      <line x1="20" y1="40" x2="40" y2="0" stroke={color} strokeWidth="6" />
      <line x1="36" y1="40" x2="56" y2="0" stroke={color} strokeWidth="6" />
    </svg>
  );
}
