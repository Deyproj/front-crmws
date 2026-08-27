
# Guía Corporativa de Sistema de Diseño y Estilos Frontend
## Diseño escalable, mantenible y reutilizable para aplicaciones modernas

---

## Objetivo

Esta guía define una estructura profesional para manejar:

- estilos globales
- diseño visual
- componentes reutilizables
- temas
- tokens
- layouts
- responsive
- consistencia visual

El objetivo principal es:

> Construir interfaces visuales escalables sin depender de estilos aislados por componente o pantallas inconsistentes.

---

# 0) Principios fundamentales

## 1. El diseño es un sistema, no pantallas sueltas

Cada vista debe construirse usando reglas visuales compartidas.

---

## 2. La consistencia es más importante que la creatividad

Una app profesional:
- reutiliza
- unifica
- simplifica

---

## 3. Los estilos globales controlan la identidad visual

Colores, spacing, sombras y radios NO deben repetirse manualmente.

---

## 4. Los componentes UI son independientes del negocio

Los componentes visuales:
- no conocen features
- no conocen lógica de negocio
- solo representan UI reutilizable

---

## 5. El diseño debe escalar fácilmente

Cambiar:
- color principal
- dark mode
- tipografía
- spacing
- radios

Debe afectar toda la app desde un lugar central.

---

# 1) Estructura oficial recomendada

```txt
src/
  app/
    globals.css

  styles/
    tokens.css
    themes.css
    animations.css
    utilities.css

  components/
    ui/
      Button/
      Input/
      Card/
      Modal/
      Table/
      Badge/
      Select/
      Loader/
      Toast/

    layout/
      Sidebar/
      Navbar/
      PageContainer/
      PageHeader/

  features/
    auth/
    users/
    loans/
```

---

# 2) Significado de cada carpeta

## styles/

Contiene la identidad visual global del sistema.

### Responsabilidades

- variables globales
- temas
- animaciones
- utilidades visuales
- configuración visual compartida

---

## components/ui/

Componentes visuales reutilizables.

### Reglas

- NO conocen negocio
- NO conocen features
- NO hacen fetch
- NO contienen reglas de dominio

### Ejemplos válidos

- Button
- Input
- Card
- Modal
- Table
- Badge
- Select
- Tabs

---

## components/layout/

Componentes estructurales globales.

### Ejemplos

- Sidebar
- Navbar
- DashboardLayout
- PageHeader

---

## features/*

Contiene lógica y vistas del negocio.

Puede usar:
- components/ui
- components/layout
- styles

Pero NO debe redefinir estilos globales innecesariamente.

---

# 3) Tokens visuales

Los tokens son la base del sistema visual.

---

## tokens.css

```css
:root {

  /* COLORS */
  --color-primary: #2563eb;
  --color-success: #16a34a;
  --color-danger: #dc2626;
  --color-warning: #f59e0b;

  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;

  --text-primary: #0f172a;
  --text-secondary: #64748b;

  /* RADIUS */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* SPACING */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* SHADOWS */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
  --shadow-md: 0 4px 8px rgba(0,0,0,.08);

}
```

---

# 4) Sistema de temas

## themes.css

```css
[data-theme="dark"] {

  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-border: #334155;

  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;

}
```

---

# 5) globals.css

Archivo raíz del sistema visual.

## globals.css

```css
@import "./tokens.css";
@import "./themes.css";
@import "./animations.css";
@import "./utilities.css";

body {
  background: var(--color-bg);
  color: var(--text-primary);
  font-family: Inter, sans-serif;
}
```

---

# 6) Componentes reutilizables

## Regla principal

Un componente UI debe ser configurable mediante props.

## Ejemplo correcto

```jsx
<Button variant="primary" />
<Button variant="danger" />
<Button variant="outline" />
```

## Ejemplo incorrecto

```jsx
<BlueButton />
<GreenButton />
<DeleteLoanButton />
```

---

# 7) Diseño de botones

## Reglas

- padding consistente
- radios compartidos
- variantes claras
- hover uniforme
- focus accesible

## Ejemplo

```css
.btn {
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
}
```

---

# 8) Inputs y formularios

## Reglas

- alturas consistentes
- spacing uniforme
- labels claras
- errores visibles
- focus states

## Tamaños recomendados

| Elemento | Tamaño |
|---|---|
| Input height | 40px - 48px |
| Border radius | 8px - 12px |
| Padding | 12px - 16px |

---

# 9) Sistema de spacing

## Regla obligatoria

NO usar márgenes aleatorios.

## Escala oficial

```txt
4
8
12
16
24
32
48
64
```

---

# 10) Tipografía

## Fuentes recomendadas

- Inter
- Geist
- Manrope
- Poppins

## Jerarquía recomendada

| Uso | Tamaño |
|---|---|
| Caption | 12px |
| Secondary | 14px |
| Base | 16px |
| Title small | 18px |
| Title medium | 24px |
| Hero | 32px+ |

---

# 11) Sombras modernas

## Reglas

- suaves
- sutiles
- minimalistas

## Incorrecto

```css
box-shadow: 0 0 20px black;
```

## Correcto

```css
box-shadow: 0 4px 8px rgba(0,0,0,.08);
```

---

# 12) Responsive Design

## Reglas obligatorias

- mobile first
- evitar scroll horizontal
- tablas adaptables
- botones táctiles
- spacing reducido en móvil

---

# 13) Estados visuales

Toda pantalla debe contemplar:

- loading
- empty
- error
- success
- disabled

---

# 14) Diseño enterprise moderno

## Características

- neutros predominantes
- pocos colores fuertes
- mucho espacio visual
- tarjetas suaves
- bordes discretos
- información jerarquizada

## Distribución moderna

```txt
80% neutros
15% color principal
5% colores de estado
```

---

# 15) Reglas duras

## PROHIBIDO

- estilos inline masivos
- colores hardcodeados repetidos
- componentes duplicados
- múltiples sistemas de spacing
- redefinir botones por feature
- redefinir inputs por pantalla

---

# 16) Flujo profesional para rediseñar una app

## Orden correcto

```txt
1. Tokens globales
2. Temas
3. Layout global
4. Componentes UI reutilizables
5. Tablas y formularios
6. Pantallas
7. Responsive
8. Estados visuales
```

---

# 17) Recomendaciones para proyectos grandes

## Separar sistema visual y negocio

El diseño debe vivir fuera de los features.

Correcto:

```txt
components/ui/Button
```

Incorrecto:

```txt
features/users/components/UserButton
features/loans/components/LoanButton
```

---

## Centralizar estilos

Nunca repetir:

- colores
- radios
- spacing
- sombras
- tipografía

---

## Mantener consistencia

La aplicación debe sentirse como un único producto.

No como múltiples mini apps pegadas.

---

# 18) Recomendaciones modernas

## Librerías recomendadas

- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Framer Motion

---

## Estilo visual recomendado

- minimalista
- enterprise
- dark mode elegante
- cards suaves
- bordes discretos
- colores neutros

---

# 19) Regla final

> Si cambiar el color principal requiere modificar múltiples componentes manualmente, el sistema visual está mal diseñado.
