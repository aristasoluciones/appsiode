# Prompt — Sesiones > Indicadores (UX Rediseño)

> **Stack:** Next.js 15 (App Router) · React 19 · TailwindCSS v4 · TypeScript estricto · @tanstack/react-query v5

---

## Instrucción inicial obligatoria

Antes de escribir cualquier línea de código, lee y sigue estrictamente las
instrucciones del skill ubicado en la ruta siguiente siode/.agents/skills/metronic-nextjs-react-ts-twcss/SKILL.md
Ese skill define las convenciones del proyecto: estructura de carpetas, patrones
de componentes, tipado, estilos y buenas prácticas. Todo lo que construyas
debe ser coherente con esas instrucciones.

---

## Contexto del dominio

Tablero de seguimiento de sesiones para consejos electorales.
Cada consejo acumula sesiones agrupadas en cuatro estados:

| Estado | Descripción |
|---|---|
| Programadas | Agendadas, aún no iniciadas |
| Con Demora | Retrasadas / vencidas |
| En Proceso | Actualmente en curso |
| Concluidas | Finalizadas |

La tabla resumen muestra un consejo por fila con el conteo por estado.

---

## Audiencia — Diseño inclusivo

Este panel será usado por personas de distintas edades, incluyendo adultos mayores
y usuarios con poca experiencia tecnológica. Además de seguir las instrucciones del skill,
aplicar siempre:

- **Tipografía:** usar exclusivamente la escala tipográfica definida en el skill referenciado.
  No definir tamaños de fuente propios. Dentro de esa escala, priorizar los tamaños más
  legibles para contenido de tabla y etiquetas de filtros.
- **Contraste:** cumplir WCAG AA en todos los textos sin excepción.
- **Objetivos táctiles:** mínimo 44 × 44 px en todos los elementos interactivos.
- **Etiquetas siempre visibles:** nunca íconos sin texto acompañante.
- **Lenguaje claro:** sin tecnicismos en mensajes, tooltips y estados vacíos.
- **Sin dependencia del color:** acompañar siempre con texto o ícono para indicar un estado.
- **Jerarquía visual clara:** título, filtros y tabla deben diferenciarse en peso tipográfico,
  no solo en tamaño.

---

## Criterios de diseño institucional

Esta aplicación pertenece a una institución formal. Respetar siempre:

- **Sin animaciones decorativas:** solo las estrictamente necesarias para comunicar
  un cambio de estado (carga, error, éxito). Nada más.
- **Sin sombras decorativas:** usar bordes sutiles para delimitar secciones.
  Aplicar sombras únicamente si el skill del proyecto las define explícitamente.
- **Paleta sobria:** seguir los tokens de color del skill. No agregar acentos externos.
- **Densidad moderada:** padding generoso en celdas para facilitar la lectura sin
  desperdiciar espacio.

---

## Reemplazo del patrón localStorage

En el proyecto origen ciertos datos de sesión (usuario logueado, proceso electoral,
tipo de consejo, listado de elecciones) se almacenaban en `localStorage` durante
el login y se leían en cualquier parte de la app con helpers como
`tools.sesion.get("USER")` y `tools.sesion.get("PROCESO")`.

En el proyecto destino **no usar `localStorage`**. Reemplazar ese patrón así:

### Datos de autenticación del usuario (quién es, qué consejo tiene)

- Estos datos vienen del token / cookie de sesión manejado por el servidor.
- En **Componentes Servidor** leerlos directamente desde las utilidades de
  autenticación que ya existan en el proyecto (helpers de `auth`, `cookies()`, etc.).
- En **Componentes Cliente** que los necesiten, recibirlos como prop desde el
  Componente Servidor padre. No hacer fetch adicional para obtenerlos.

### Datos de contexto del proceso electoral (`PROCESO`, `elecciones[]`)

Usar **TanStack Query** con una query dedicada, por ejemplo `useProcesoQuery()`,
con la siguiente configuración:

```
// Ejemplo conceptual — adaptar a las convenciones del skill
const { data: proceso } = useQuery({
  queryKey: ['proceso'],
  queryFn: fetchProcesoActual,
  staleTime: Infinity, // nunca se considera stale → no se re-fetcha automáticamente
  gcTime: Infinity,    // nunca se elimina del caché mientras la app esté montada
  refetchOnWindowFocus: false, // explícito: no re-fetchar al volver de otra pestaña
});
```

**Por qué esta combinación:**

| Propiedad | Valor | Efecto |
|---|---|---|
| `staleTime: Infinity` | La query nunca se marca como stale | No se re-fetcha en background ni al recuperar el foco |
| `gcTime: Infinity` | El caché nunca se elimina por garbage collection | El dato permanece disponible aunque ningún componente lo consuma por un rato |
| `refetchOnWindowFocus: false` | Sin re-fetch al volver de otra pestaña | Comportamiento explícito y predecible |

**Comportamiento por escenario:**

| Escenario | Resultado |
|---|---|
| Cambiar de pestaña del navegador y volver | ✅ Caché intacto — la app React sigue montada |
| Navegar entre páginas dentro de la app | ✅ Caché intacto — el `QueryClient` vive en el provider raíz |
| Recargar la página (F5) | ⟳ Caché se limpia → la query se re-ejecuta una vez al montar; la cookie de sesión autentica la petición automáticamente |
| Sesión expirada en servidor | 🔒 El servidor devuelve 401 → el interceptor global redirige a login |

> **Regla:** ningún dato de negocio se almacena en `localStorage`, `sessionStorage`
> ni cookies de cliente. El caché de TanStack Query es la única fuente de verdad
> en el lado cliente para datos que se leen frecuentemente sin cambiar.

---

## Estrategia de datos y filtrado con TanStack Query

### Regla general

> Filtrar en cliente desde el último dataset siempre que sea posible.
> Hacer fetch al servidor solo cuando cambia el scope completo del dato.

### Cuándo hacer fetch (useQuery con queryKey dinámico)

| Acción del usuario | Comportamiento |
|---|---|
| Seleccionar Tipo de Consejo | Cambia la `queryKey` → TanStack Query ejecuta el fetch automáticamente |
| Cambiar Selector de Sesión | Cambia la `queryKey` → TanStack Query ejecuta el fetch automáticamente |

Usar `debounce` de 300 ms sobre el cambio de `queryKey` para evitar fetches
duplicados por clics rápidos consecutivos.

TanStack Query maneja automáticamente los estados `isLoading`, `isFetching` y `isError`;
usar esos flags para mostrar el skeleton y el estado de error en lugar de `useState` manual.

Ejemplo conceptual de la query principal de la página:

```
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['sesiones', 'indicadores', tipoConsejo, sesionSeleccionada],
  queryFn: () => fetchIndicadores(tipoConsejo, sesionSeleccionada),
  staleTime: 30_000, // 30 s — ajustar según criterio del equipo
});
```

### Cuándo filtrar desde el último dataset (sin fetch)

| Acción del usuario | Comportamiento |
|---|---|
| Activar / desactivar chip de estado | Filtrado inmediato en cliente sobre `data` de la query |
| Escribir en el buscador | Filtrado en cliente con debounce de 200 ms sobre `data` de la query |

**Razón:** El dataset por Tipo Consejo + Sesión es acotado y ya está en el caché
de TanStack Query. Cambiar la `queryKey` en cada tecla o toggle generaría latencia
innecesaria, parpadeos de UI y carga injustificada en el servidor.

Los totales de los chips siempre reflejan el resultado **filtrado**, no el total
crudo del servidor.

---

## Estructura de componentes

> Seguir **estrictamente** las convenciones de estructura de carpetas, nomenclatura
> de archivos y organización de componentes definidas en el skill referenciado.
> No aplicar ninguna convención propia ni asumir un patrón que no esté explícito en el skill.

Los componentes necesarios para esta página son, en términos funcionales:

| Responsabilidad | Tipo |
|---|---|
| Página raíz con fetch inicial de datos | Componente Servidor |
| Contenedor cliente que gestiona el estado de todos los filtros | Componente Cliente |
| Grupo de botones para filtrar por tipo de consejo (radio, uno activo) | Componente Cliente |
| Cuatro chips toggleables con contadores de estado | Componente Cliente |
| Dropdown para seleccionar una sesión específica | Componente Cliente |
| Campo de búsqueda con debounce y botón para limpiar | Componente Cliente |
| Tabla con skeleton integrado y manejo de estados vacíos | Componente Cliente |
| Filas placeholder animadas para el estado de carga | Componente Presentacional |
| Estado vacío con variantes: sin datos, sin coincidencias, error | Componente Presentacional |
| Botones de exportación PDF / CSV con feedback en el propio botón | Componente Cliente |
| Aviso de filtros activos con botón "Restablecer todo" | Componente Presentacional |

Nombrar cada archivo y carpeta **exactamente como lo indique el skill**.
Conectar datos y tipos a lo que el proyecto ya expone. **No inventar endpoints ni modelos propios.**

---

## Estado de carga — Skeleton

Mostrar skeleton en la carga inicial y en cada re-fetch (Tipo Consejo o Sesión).
**Nunca usar un spinner genérico** — reemplazar el contenido 1 a 1 para evitar saltos
de layout.

| Elemento | Skeleton |
|---|---|
| Pastillas Tipo Consejo | 3 pastillas de ancho variado (`w-20`, `w-28`, `w-24`), `animate-pulse`, `bg-gray-200` |
| Chips de estado | 4 chips del mismo tamaño que los reales, `animate-pulse` |
| Selector de sesión | Barra redondeada de ancho completo, `animate-pulse` |
| Filas de tabla | 8 filas (ver detalle abajo) |

**Detalle de filas skeleton:**

- Clave: barra centrada de 40 px
- Consejo: barra principal de 180 px + barra secundaria de 90 px debajo
- Conteos (×5): bloque centrado de 32 × 24 px
- Acción: barra de 90 px alineada a la derecha

Las filas skeleton llevan `aria-hidden="true"` para no interferir con lectores de pantalla.

**Transición:** `opacity-0 → opacity-100` en 150 ms al reemplazar skeleton por contenido real.
Sin ningún otro efecto.

---

## Estados vacíos

### 1. `SinDatos` — el servidor devolvió cero filas

- Ícono SVG simple (calendario vacío o bandeja sin contenido).
- Título: **"Sin resultados"**
- Descripción: **"No hay consejos con sesiones para los filtros seleccionados."**
- Botón CTA: **"Limpiar filtros"**
  → Restablece Tipo Consejo al primero, Sesión a "Todas" y todos los chips activos.

### 2. `BusquedaVacia` — hay filas pero el buscador no encontró coincidencias

- Mensaje inline debajo del buscador:
  **"Sin coincidencias para «{término}»"**
- Botón de texto con ícono ×: **"Limpiar búsqueda"**

### 3. `ErrorCarga` — el fetch falló o devolvió un error

- Tarjeta con borde rojo suave e ícono de alerta.
- Mensaje: **"No se pudo cargar la información."**
- Botón: **"Reintentar"** — repite el último fetch.

---

## Tabla — mejoras visuales

Mantener la misma estructura de 8 columnas del original. Agregar:

### Badges de color en celdas de conteo

| Estado | Color |
|---|---|
| Programadas | Azul |
| Con Demora | Naranja |
| En Proceso | Amarillo / ámbar |
| Concluidas | Verde |

- Mostrar `—` (guión largo) en lugar de `0` cuando el conteo es cero.
  Reduce el ruido visual y facilita la lectura rápida.

### Mini barra de distribución (celda Total)

- Barra horizontal de 4 segmentos proporcional al conteo de cada estado.
- Alto: 4 px, `rounded-full`, debajo del número.
- Mismos colores que los badges.
- Si el total es 0, no mostrar la barra.

### Interacción de fila

- Hover: `hover:bg-gray-50`, `transition-colors duration-150`. Sin sombras en hover.

### Enlace "Ver detalle"

- Botón fantasma con **etiqueta de texto + ícono de flecha**.
- En móvil mantener la etiqueta visible — no colapsar a solo ícono
  (considerando la audiencia de distintas edades).

### Diseño responsivo

**Móvil (`< md`):** cada fila se convierte en tarjeta con borde suave.

- Encabezado: Clave + nombre del Consejo en texto grande.
- Cuerpo: 4 bloques de conteo en cuadrícula 2 × 2 con etiqueta + número.
- Pie: total + botón "Ver detalle" de ancho completo.

**Escritorio:** tabla estándar.

---

## Chips de estado — diseño visual

Reemplazar el `form-switch` por chips toggleables estilizados.

```
[ 🔵 Programadas  12 ]   [ 🟠 Con Demora  3 ]   [ 🟡 En Proceso  5 ]   [ 🟢 Concluidas  40 ]
```

- Pastilla `rounded-full`, `border-2`, ícono de color + etiqueta de texto + contador.
- **Activo:** fondo de color suave + borde de color + texto oscuro legible.
- **Inactivo:** fondo blanco + borde gris + texto apagado.
- El contador actualiza de forma inmediata sin animación.
- `role="checkbox"` + `aria-checked` para accesibilidad.
- Tamaño mínimo de toque: 44 × 44 px.

---

## Barra de filtros activos (`ActiveFiltersBar`)

Si hay algún filtro aplicado diferente al estado inicial, mostrar debajo del área
de filtros un aviso discreto:

> **Filtros activos** · [Restablecer todo]

- Botón "Restablecer todo" devuelve todos los filtros a su valor por defecto.
- Este aviso ayuda a usuarios mayores a entender por qué ven menos datos de lo esperado.
- Desaparece automáticamente cuando todos los filtros están en su estado inicial.

---

## Botones de exportación

- Botón con ícono **y** etiqueta de texto (no solo ícono).
- Al hacer clic: deshabilitar botón + mostrar indicador de carga dentro del propio botón.
  Sin modales ni overlays.
- Al finalizar: mostrar notificación usando el sistema que ya exista en el proyecto.
  - Éxito: **"Archivo generado correctamente"**
  - Error: **"Error al generar el archivo. Intente de nuevo."**

---

## Accesibilidad

Para el marcado accesible de cada componente, seguir **exactamente** los patrones
que el skill define para la creación de páginas y componentes. No agregar atributos
`aria-*`, roles ni estructuras semánticas que no estén contempladas en esas guías.

Además de lo que defina el skill, respetar siempre estas dos reglas de diseño inclusivo
que no dependen del marcado:

- **Sin dependencia del color:** cada estado debe comunicarse también con texto o ícono,
  nunca solo con color.
- **Filas skeleton:** incluir `aria-hidden="true"` para que los lectores de pantalla
  las omitan durante la carga.

---

## Animaciones — regla estricta

| Permitido | Prohibido |
|---|---|
| `animate-pulse` en skeletons | Animaciones de entrada escalonadas por fila |
| `transition-colors duration-150` en hover y chips | Contadores animados |
| Fade de `opacity` en 150 ms (skeleton → contenido) | Efectos de escala, bounce, rotación |
| — | Cualquier efecto decorativo |

Respetar `prefers-reduced-motion`: si el usuario tiene activada esta preferencia
del sistema, desactivar **todas** las transiciones.

---

## Restricciones técnicas

- TailwindCSS v4 — solo clases utilitarias. Sin CSS personalizado salvo que el skill
  lo requiera explícitamente.
- TypeScript en modo estricto.
- Sin librerías de UI adicionales — construir cada componente desde cero con Tailwind
  siguiendo los patrones del skill.
- **`@tanstack/react-query` v5** ya está disponible en el proyecto; usarlo para todo
  el fetching de datos del lado cliente. No usar `fetch` directo dentro de `useEffect`.
- Sin librerías de estado global adicionales ni de animación (framer-motion u otras).
- No usar `localStorage`, `sessionStorage` ni cookies de cliente para datos de negocio.
- Seguir estrictamente los patrones del skill para Componentes Servidor vs. Cliente,
  fetching, manejo de errores y estructura de archivos.

---

## Resumen de decisiones clave

| Tema | Decisión | Razón |
|---|---|---|
| Búsqueda (buscador) | Filtrado local sobre caché de TanStack Query, debounce 200 ms | Dataset ya en memoria; fetch sería derroche |
| Chips de estado | Filtrado local inmediato sobre caché de TanStack Query | Misma razón |
| Tipo Consejo / Sesión | Cambio de `queryKey` con debounce 300 ms | TanStack Query re-fetcha automáticamente al cambiar la key |
| Estado de carga | `isLoading` / `isFetching` de TanStack Query | Fuente de verdad única; no duplicar con `useState` |
| Estado de error | `isError` + botón "Reintentar" llama `refetch()` | Patrón nativo de TanStack Query |
| Datos de sesión (USER, PROCESO) | `useQuery` con `staleTime: Infinity` + `gcTime: Infinity` + `refetchOnWindowFocus: false` | Sobrevive cambio de pestañas y navegación interna; se renueva solo en recarga o logout |
| Animaciones | Solo las mínimas funcionales | Institución formal + audiencia diversa |
| Sombras | Sin sombras decorativas | Diseño limpio e institucional |
| Íconos | Siempre con etiqueta de texto | Audiencia de distintas edades |
| Nombres de archivos | PascalCase en componentes | Convención del proyecto |
