# Arquitectura de Dashboards Interactivos para Aplicaciones Web
## Inspirada en Power BI, Tableau y Looker

**Versión:** 1.0  
**Objetivo:** Definir una arquitectura reutilizable para implementar dashboards interactivos en aplicaciones web modernas, permitiendo que todos los componentes visuales trabajen de manera sincronizada mediante un sistema de filtros globales.

---

# Introducción

Las herramientas de Business Intelligence como Power BI, Tableau o Looker proporcionan una experiencia muy intuitiva donde cualquier gráfico puede actuar como filtro del resto del tablero.

Por ejemplo:

- Se hace clic sobre un cobrador.
- Todos los indicadores cambian.
- Las tablas muestran únicamente la información relacionada.
- Los demás gráficos se actualizan automáticamente.

Aunque visualmente parece que los gráficos están conectados entre sí, realmente ninguno conoce la existencia del otro.

Todos simplemente reaccionan a un **estado global compartido**.

Este documento describe cómo implementar esa misma filosofía en cualquier aplicación desarrollada con React, Next.js, Vue, Angular o cualquier otro framework moderno.

---

# Filosofía

La regla principal es sencilla:

> **Los componentes nunca deben comunicarse directamente entre sí.**

En lugar de eso:

```
Componente

↓

Actualiza Estado Global

↓

Todos los componentes reaccionan
```

Esto permite construir aplicaciones altamente escalables.

---

# Problema del enfoque tradicional

Muchos desarrolladores implementan algo como esto:

```
Gráfico A

↓

actualiza

↓

Gráfico B

↓

actualiza

↓

Gráfico C

↓

actualiza

↓

Tabla
```

Problemas:

- Alto acoplamiento.
- Difícil mantenimiento.
- Mucho código repetido.
- Imposible escalar cuando existen muchos gráficos.
- Cada nuevo componente obliga a modificar los existentes.

Es una arquitectura que funciona únicamente en proyectos pequeños.

---

# Arquitectura recomendada

Todos los componentes dependen únicamente del Dashboard.

```
Dashboard

│

├── Estado Global
│
├── KPIs
├── Tarjetas
├── Tabla
├── Mapa
├── Timeline
├── Gráfico de barras
├── Gráfico circular
├── Heatmap
├── Calendario
└── Indicadores
```

Cada componente:

- Lee filtros.
- Consulta datos.
- Se actualiza automáticamente.

Nunca consulta otro componente.

---

# Estado Global

El Dashboard mantiene un objeto central de filtros.

Ejemplo:

```json
{
    "empresa": 5,
    "cliente": null,
    "cobrador": 12,
    "zona": "Centro",
    "fechaInicio": "2026-06-01",
    "fechaFin": "2026-06-30",
    "estado": "Pendiente"
}
```

Ese objeto representa el contexto actual del tablero.

Todo gira alrededor de él.

---

# Flujo de funcionamiento

## Paso 1

El usuario hace clic sobre un gráfico.

```
Cobrador

Carlos
```

---

## Paso 2

El gráfico genera un evento.

```
CLICK

↓

setFilter()
```

---

## Paso 3

Se actualiza el estado global.

```
filters = {

    cobrador:3

}
```

---

## Paso 4

Todos los componentes detectan el cambio.

```
KPIs

↓

Tabla

↓

Gráfico Mora

↓

Clientes

↓

Caja

↓

Ingresos
```

---

## Paso 5

Cada componente consulta nuevamente sus datos.

Todo queda sincronizado.

---

# Principio de Independencia

Cada componente debe ser completamente independiente.

Debe responder únicamente a tres preguntas:

## ¿Qué datos necesito?

Ejemplo:

```
Cobros
```

---

## ¿Qué filtros acepto?

Ejemplo:

```
fecha

empresa

cliente

cobrador
```

---

## ¿Qué evento emito?

Ejemplo:

```
click

hover

doble click

selección múltiple
```

Nada más.

---

# Cross Filtering

Es el mecanismo utilizado por Power BI.

Todos los componentes pueden actuar como filtro.

Ejemplo:

```
Cliente

↓

Filtra

↓

Préstamos

↓

Filtra

↓

Cobros

↓

Filtra

↓

Caja
```

No existen jerarquías.

Cualquier componente puede modificar el contexto del Dashboard.

---

# Filtros acumulativos

Los filtros pueden combinarse.

Ejemplo:

Primer clic

```
Carlos
```

Segundo clic

```
Junio
```

Tercer clic

```
Zona Norte
```

El estado queda:

```json
{
    "cobrador":3,
    "mes":6,
    "zona":"Norte"
}
```

Todo el Dashboard responde exactamente a esa combinación.

---

# Drill Down

Permite navegar hacia mayor nivel de detalle.

Ejemplo temporal

```
2026

↓

Junio

↓

Semana

↓

Día

↓

Hora
```

Ejemplo geográfico

```
País

↓

Departamento

↓

Ciudad

↓

Barrio

↓

Cliente
```

Ejemplo empresarial

```
Empresa

↓

Sucursal

↓

Cobrador

↓

Cliente

↓

Préstamo
```

Cada nivel simplemente actualiza el filtro global.

---

# Drill Through

Mientras el Drill Down profundiza sobre un mismo gráfico, el Drill Through permite abrir otra vista relacionada.

Ejemplo:

```
Cobradores

↓

Carlos

↓

Detalle de clientes

↓

Detalle del préstamo

↓

Historial de pagos
```

Muy útil para sistemas administrativos.

---

# Consulta de Datos

Existen dos enfoques.

---

## Enfoque 1 (Recomendado)

Cada componente consulta su propio endpoint.

```
Dashboard

↓

KPIs

GET /dashboard/kpis

↓

Tabla

GET /dashboard/prestamos

↓

Cobros

GET /dashboard/cobros

↓

Clientes

GET /dashboard/clientes
```

Todos reciben exactamente los mismos filtros.

Ventajas:

- Muy escalable.
- Fácil cache.
- Mejor mantenimiento.
- Componentes independientes.

Es el enfoque recomendado para proyectos medianos y grandes.

---

## Enfoque 2

Un único endpoint devuelve toda la información.

```
GET /dashboard
```

Respuesta

```json
{
    "kpis": {},
    "clientes": {},
    "cobros": {},
    "mora": {},
    "ranking": {}
}
```

Adecuado para dashboards pequeños.

---

# Dashboard Engine

En proyectos grandes es recomendable construir un motor reutilizable.

```
Dashboard Engine

│

├── Estado Global
├── Gestor de Filtros
├── Event Bus
├── Query Manager
├── Cache
├── Cross Filtering
├── Drill Down
├── Drill Through
├── Exportaciones
├── Sincronización URL
├── Favoritos
├── Permisos
└── Persistencia
```

Luego cualquier Dashboard únicamente configura qué componentes utilizar.

---

# Event Bus

Todos los componentes emiten eventos.

Ejemplo:

```
GRAPH_CLICK

GRAPH_HOVER

FILTER_CHANGED

DATE_CHANGED

REFRESH

EXPORT

CLEAR_FILTERS
```

El Dashboard escucha todos los eventos.

---

# Persistencia de filtros

Es recomendable guardar el estado.

Opciones:

- LocalStorage
- SessionStorage
- URL
- Base de datos

Ejemplo:

```
dashboard

?

empresa=5

&mes=6

&zona=norte
```

Permite compartir enlaces con exactamente la misma vista.

---

# Cache Inteligente

Cuando varios componentes consultan la misma información, puede utilizarse cache.

Beneficios:

- Menor carga al servidor.
- Mayor velocidad.
- Mejor experiencia de usuario.

Herramientas recomendadas:

- TanStack Query
- SWR
- React Query

---

# Lazy Loading

No todos los componentes deben cargarse inmediatamente.

Ejemplo:

```
Dashboard

↓

KPIs

↓

Gráficos principales

↓

Componentes secundarios

↓

Detalle

↓

Historial
```

Reduce considerablemente el tiempo inicial de carga.

---

# Skeleton Loading

Mientras llegan los datos es recomendable mostrar placeholders.

Nunca dejar espacios vacíos.

Mejora la percepción de rendimiento.

---

# Arquitectura React Recomendada

```
DashboardProvider

│

└── DashboardContext

        │

        ├── Filters

        ├── Events

        ├── Queries

        ├── Cache

        └── Actions
```

Cada componente utiliza un Hook.

```
useDashboard()
```

Sin conocer el resto de componentes.

---

# Organización sugerida

```
dashboard

│

├── components

├── charts

├── widgets

├── hooks

├── context

├── providers

├── services

├── api

├── filters

├── models

├── utils

├── events

└── engine
```

Esta estructura facilita la reutilización en múltiples proyectos.

---

# Casos de uso

## CRM

- Clientes
- Ventas
- Embudo comercial
- Conversión

---

## ERP

- Compras
- Inventario
- Producción
- Facturación

---

## Gestión de préstamos

- Cobradores
- Clientes
- Cobros
- Mora
- Caja
- Rentabilidad
- Intereses
- Recuperación

---

## Recursos Humanos

- Asistencia
- Horas extras
- Ausentismo
- Producción
- Auditorías

---

## Manufactura

- Producción
- Calidad
- Paradas
- Mantenimiento
- Inventarios

---

## POS

- Ventas
- Productos
- Categorías
- Caja
- Utilidades

---

# Beneficios

- Arquitectura desacoplada.
- Muy escalable.
- Fácil mantenimiento.
- Componentes reutilizables.
- Menor cantidad de código.
- Mayor rendimiento.
- Mejor experiencia de usuario.
- Compatible con cualquier framework moderno.
- Permite agregar nuevos gráficos sin modificar los existentes.
- Facilita pruebas unitarias e integración continua.

---

# Tecnologías recomendadas

## Frontend

- React
- Next.js
- TypeScript

---

## Estado Global

- Zustand (recomendado)
- React Context
- Redux Toolkit (proyectos muy grandes)

---

## Consultas

- TanStack Query
- SWR

---

## Gráficos

- Recharts
- Apache ECharts
- Nivo
- Chart.js (proyectos sencillos)

---

## Backend

- Spring Boot
- Node.js
- .NET
- Laravel

---

# Conclusión

El verdadero valor de un dashboard interactivo no está en los gráficos, sino en la arquitectura que coordina su comportamiento.

Adoptar un modelo basado en un **Estado Global**, **componentes desacoplados**, **Cross Filtering**, **Drill Down** y un **Dashboard Engine reutilizable** permite construir aplicaciones analíticas con una experiencia comparable a herramientas de Business Intelligence como Power BI, pero integradas directamente en sistemas de gestión.

Este enfoque no solo mejora la experiencia del usuario, sino que también reduce el esfuerzo de mantenimiento y facilita la evolución del producto a medida que crecen los requerimientos. Puede reutilizarse en CRMs, ERPs, sistemas POS, plataformas de gestión de préstamos, manufactura, recursos humanos y prácticamente cualquier aplicación que requiera visualización y análisis interactivo de datos.