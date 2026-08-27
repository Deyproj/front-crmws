# Guía Corporativa de Arquitectura Frontend (Next.js + Feature Slices)
## Clean Architecture + Hexagonal + Vertical Slice
### App Router

---

## Objetivo

Esta guía define una arquitectura **estricta, madura, profesional y sin ambigüedades** para proyectos frontend basados en **Next.js (App Router)**.

Es una guía **normativa**:
- Si una decisión no está alineada con estas reglas, **se considera incorrecta**.
- Las excepciones **deben documentarse explícitamente**.

El objetivo principal es que:

> **Si mañana cambias Next.js por otro framework, el código de negocio (features) sobreviva casi intacto.**

---

## 0) Principios fundamentales

1. **El framework no define el negocio**
   Next.js controla routing, render y lifecycle.
   El producto vive en `features/`.

2. **Arquitectura por feature (Vertical Slice)**
   No se organiza por tipo técnico (`hooks/`, `services/`, `api/`).
   Cada feature es un sistema completo y autónomo.

3. **La complejidad de la arquitectura es proporcional a la complejidad del dominio**
   No todos los features necesitan todas las capas.
   Añadir capas sin valor real es tan dañino como no tenerlas.

4. **Dependencias en una sola dirección**
   `presentation` → `application` → `domain` ← `infrastructure`.
   Esta regla aplica en todos los niveles.

5. **La única regla verdaderamente no negociable**
   > `presentation` **nunca** importa implementaciones concretas de `infrastructure`.
   El resto son herramientas que se aplican según el nivel de complejidad del feature.

---

## 1) Estructura oficial de carpetas

```txt
src/
  app/
    (routes)/
      login/
        page.tsx
      dashboard/
        page.tsx
    layout.tsx
    globals.css

  features/
    auth/
      domain/
      application/
      infrastructure/
      presentation/
    users/
      domain/
      application/
      infrastructure/
      presentation/

  components/
    ui/
    layout/

  lib/
    http/
    config/
    runtime/
    ai/
    utils/

  styles/
```

---

## 2) Significado innegociable de cada carpeta

### app/
Infraestructura de Next.js.

**Responsabilidades**
- Definir rutas
- Componer pantallas
- Orquestar Server Components

**Reglas**
- Puede importar desde `features/*/presentation`
- No contiene lógica de negocio
- No define validaciones ni reglas del dominio

---

### features/<feature>/
Cada feature es un **vertical slice completo**.

Contiene todo lo necesario para esa funcionalidad sin depender de otros features.

---

### components/
UI genérica y reutilizable.

**Reglas**
- No conoce el negocio
- No importa desde `features/`
- Solo UI y layout base

Ejemplos válidos:
- Button
- Input
- Modal
- Table
- Sidebar genérico

---

### lib/
Infraestructura transversal compartida.

```txt
lib/
 ├─ http/        # fetch, axios, interceptors
 ├─ config/      # env, feature flags
 ├─ runtime/     # cookies, headers, server-only helpers
 ├─ ai/          # SDKs, clientes, prompts base
 └─ utils/       # helpers puros
```

**Reglas duras**
- No React
- No hooks
- No lógica de negocio
- No conocimiento de features

---

## 3) Arquitectura interna de un feature

### 3.0 — Nivel de arquitectura: elige antes de implementar

La arquitectura completa (domain → application → infrastructure → presentation) **no es el punto de partida**. Es el destino de features complejos. Aplicarla a un CRUD simple añade 3-4 archivos de indirección sin valor.

**Criterio de decisión:**

```
¿El feature tiene reglas de negocio puras (sin HTTP/React)?
  └─ NO → No necesita domain/

¿Los use cases hacen algo más que delegar al repo?
  └─ NO → No necesita application/

¿Existe más de una implementación del repositorio?
  └─ NO → No necesita interface, usa la función/objeto directamente

¿El feature crecerá significativamente en operaciones o lógica?
  └─ NO → Usa el nivel mínimo que resuelva el problema hoy
```

---

#### Nivel 1 — Feature CRUD simple

Aplica cuando: solo hay operaciones de lectura/escritura sin lógica de negocio real.

```
features/trucks/
  api.ts              # funciones tipadas que llaman apiFetch
  index.ts            # re-exporta funciones públicas
  presentation/
    views/
```

```ts
// trucks/api.ts
export async function getTrucks(): Promise<Truck[]> {
    return apiFetch<Truck[]>('/trucks');
}
export async function addTruck(plate: string): Promise<Truck> {
    return apiFetch<Truck>('/trucks', { method: 'POST', body: JSON.stringify({ plate }) });
}
```

- `presentation` importa desde `index.ts` → la regla de dependencias se respeta.
- Sin interfaces, sin factories, sin singletons.

---

#### Nivel 2 — Feature con lógica real

Aplica cuando: los use cases orquestan (validan, combinan repos, disparan side effects).

```
features/trips/
  application/
    create-trip.ts    # valida fechas, verifica disponibilidad del camión
    get-active-trips.ts
  infrastructure/
    trips.api.ts
  presentation/
    views/
```

- Use cases justificados porque **hacen algo** más que delegar.
- Interface de repositorio opcional: solo si hay múltiples implementaciones o mocks para tests.

---

#### Nivel 3 — Feature con dominio rico

Aplica cuando: existen invariants, Value Objects, o reglas que viven independientes de cualquier framework.

```
features/auth/
  domain/
    entities/
    value-objects/    # Email, Password con validación propia
  application/
    use-cases/
  infrastructure/
    auth.api.ts
    token.storage.ts
  presentation/
    views/
    hooks/
```

Full Clean Architecture justificada. El dominio puede testearse sin HTTP ni React.

---

### 3.1 — Arquitectura hexagonal (aplica desde Nivel 2)

```txt
presentation  →  application  →  domain
                     ↓
                ports / interfaces
                     ↑
               infrastructure
```

---

## 3.2 domain/ — Núcleo del negocio (Nivel 3)

**Contiene**
- Entidades ricas
- Value Objects
- Reglas puras
- Invariants
- Tipos de dominio

**Reglas**
- No React
- No HTTP
- No DTOs de infraestructura ni UI

Ejemplo:
```ts
export class Email {
  constructor(private readonly value: string) {
    if (!value.includes("@")) {
      throw new Error("Invalid email");
    }
  }
}
```

---

## 3.3 application/ — Casos de uso (Nivel 2+)

**Contiene**
- Use cases con lógica real de orquestación
- Interfaces (ports) cuando hay múltiples implementaciones

> Un use case que solo llama `repo.getX()` sin hacer nada más **no justifica** esta capa. Coloca la llamada directamente en `api.ts` (Nivel 1).

Ejemplo válido (orquesta):
```ts
export async function createTrip(
  tripsRepo: TripsRepository,
  trucksRepo: TrucksRepository,
  data: CreateTripInput
) {
  const truck = await trucksRepo.getById(data.truckId);
  if (!truck.isAvailable()) throw new Error("Camión no disponible");
  return tripsRepo.create(data);
}
```

---

## 3.4 infrastructure/ — Implementación técnica

**Contiene**
- Adapters HTTP
- Repositorios
- Integraciones externas
- Storage

**Reglas**
- Implementa interfaces del application/domain
- Puede usar `lib/`

---

## 3.5 presentation/ — UI y estado de pantalla

**Contiene**
- Views
- Componentes del feature
- Hooks de UI

**Regla crítica (aplica en todos los niveles)**
> `presentation` **NO importa implementaciones concretas de infrastructure**.

En Nivel 1: se comunica a través del `index.ts` del feature.
En Nivel 2+: se comunica a través de casos de uso.

---

## 4) Reglas duras de dependencias

### PROHIBIDO

1. `presentation → infrastructure`
2. `domain → React / Next / HTTP`
3. `components → features`
4. `features → app`

---

## 5) Uso correcto de Server Components (RSC)

- `app/` puede ser Server Component
- No contiene reglas de negocio

Flujo válido:
```txt
app (RSC)
  ↓
application
  ↓
domain
  ↑
infrastructure/server
```

---

## 6) Fetching de datos

### UI reactiva
- TanStack Query en `presentation/hooks`
- HTTP en `infrastructure`

### Server-first
- Funciones server-only en `infrastructure/server`

---

## 7) Convenciones obligatorias

- Carpetas: kebab-case
- Componentes: PascalCase.tsx
- Hooks: useXyz.ts
- Casos de uso: verbos claros (`loginUser.ts`)

---

## 8) Anti-patterns prohibidos

- `services/` global
- `lib/hooks`
- `lib/types` de negocio
- `components/LoginForm.tsx`
- `presentation` importando adapters HTTP

---

## 9) Checklist para PRs

**Para cualquier nivel:**
- [ ] `app/` solo compone, no contiene lógica de negocio
- [ ] `presentation` no importa nada de `infrastructure` directamente
- [ ] El feature es autónomo (no depende de otros features)
- [ ] Imports legales según las reglas de dependencias

**Solo si el feature usa Nivel 2 o 3:**
- [ ] Los use cases hacen algo real (no son wrappers vacíos)
- [ ] Las interfaces de repositorio tienen más de una implementación o justificación documentada

**Si se eligió Nivel 1:**
- [ ] El `api.ts` del feature no filtra directamente hacia `presentation` (pasa por `index.ts`)

---

## 10) Cuándo subir de nivel

Un feature puede comenzar en Nivel 1 y subir cuando:

- Aparece lógica de negocio que no es responsabilidad de la vista (Nivel 1 → 2)
- Se necesitan mocks para tests o múltiples fuentes de datos (Nivel 1/2 → interface de repo)
- Las reglas del dominio son independientes del framework (Nivel 2 → 3)

**No se sube de nivel por anticipación.** Se sube cuando el problema real lo justifica.

---

## Regla final

> **Si un archivo de `presentation` importa algo concreto de `infrastructure`, la arquitectura está rota.**

Esta es la única regla sin excepción.
El nivel de capas internas es una decisión de ingeniería proporcional al problema.
