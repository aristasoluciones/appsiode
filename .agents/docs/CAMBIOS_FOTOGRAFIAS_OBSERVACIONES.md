# Sistema de Validación Automática de Bodegas y Observaciones Múltiples

## Fecha: 2026-05-27

## Resumen
Se implementó un sistema automático de cambio de estatus para bodegas basado en la completitud de fotografías y acuerdos por etapa. También se refactorizó el sistema de observaciones para soportar múltiples observaciones por fotografía con gestión de estado (Pendiente/Solventado).

---

## 🔄 Cambio Automático de Estatus

### Lógica Implementada

Las bodegas ahora cambian automáticamente de estatus según la completitud de sus documentos:

#### **En captura → Registrada**
- ✅ Se activa cuando se completan TODAS las fotografías requeridas de la etapa 'Registro'
- ✅ Se activa cuando se sube al menos UN acuerdo PDF
- ⚡ **Cambio automático** mediante triggers en base de datos

#### **Registrada → En captura**
- ❌ Se activa cuando se elimina alguna fotografía requerida
- ❌ Se activa cuando se elimina el último acuerdo
- ⚡ **Cambio automático** mediante triggers en base de datos

#### **Protección de Estados Superiores**
- 🔒 Si una bodega está en "Observada", "Validada", "Verificada" o "Informada"
- 🔒 NO retrocede a "En captura" al eliminar fotos o acuerdos
- ✅ Se mantiene la integridad del flujo de trabajo

---

## 📸 Sistema de Observaciones Múltiples

### Antes vs Ahora

| Aspecto | Sistema Anterior | Sistema Nuevo |
|---------|-----------------|---------------|
| Observaciones por foto | 1 única | Múltiples (ilimitadas) |
| Estado de observaciones | N/A | Pendiente / Solventado |
| Almacenamiento | En tabla `fotografias` | Tabla dedicada `fotografias_observaciones` |
| Historial | Se sobrescribía | Se mantiene completo |

### Tabla: `bodegas.fotografias_observaciones`

```sql
CREATE TABLE bodegas.fotografias_observaciones (
	id SERIAL PRIMARY KEY,
	id_fotografia INTEGER NOT NULL,
	observacion TEXT NOT NULL,
	observador_id INTEGER NOT NULL,
	observador_nombre TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pendiente' | 'Solventado'
	created_at TIMESTAMP,
	updated_at TIMESTAMP,
	deleted_at TIMESTAMP
);
```

---

## 🏗️ Cambios en Base de Datos

### 1. Tabla `fotografias_config`
**Campo agregado:**
- `etapa` TEXT NOT NULL DEFAULT 'Registro'
  - Define la etapa del proceso (ej: 'Registro', 'Verificación', 'Comprobación')
  - Se usa para validar completitud de fotografías por etapa

### 2. Tabla `fotografias`
**Campos eliminados:**
- ❌ `observacion` (movido a tabla dedicada)
- ❌ `observador_id` (movido a tabla dedicada)
- ❌ `observador_nombre` (movido a tabla dedicada)

### 3. Funciones de Validación

#### `bodegas.validar_fotografias_completas(_id_bodega, _etapa)`
- Verifica si una bodega tiene todas las fotos requeridas de una etapa
- Retorna: BOOLEAN

#### `bodegas.validar_acuerdo_completo(_id_bodega)`
- Verifica si una bodega tiene al menos un acuerdo PDF
- Retorna: BOOLEAN

#### `bodegas.validar_bodega_completa(_id_bodega)`
- Función principal que combina las validaciones anteriores
- Retorna: BOOLEAN (TRUE si está completa para pasar a Registrada)

#### `bodegas.actualizar_estatus_bodega(_id_bodega)`
- **Llamada desde las funciones de INSERT/UPDATE/DELETE**
- Valida completitud usando las funciones anteriores
- Cambia estatus entre "En captura" ↔ "Registrada" automáticamente
- Respeta estados superiores (Observada, Validada, etc.)
- **NO usa triggers** - se ejecuta directamente en las transacciones

### 4. Funciones con Actualización de Estatus Integrada

Las siguientes funciones ahora **llaman internamente** a `actualizar_estatus_bodega`:

#### Fotografías:
- `bodegas.fotografia_ins(...)` - Al insertar fotografía
- `bodegas.fotografia_del(...)` - Al eliminar fotografía (soft delete)

#### Acuerdos:
- `bodegas.acuerdo_ins(...)` - Al insertar acuerdo
- `bodegas.acuerdo_del(...)` - Al eliminar acuerdo (soft delete)

**Flujo interno de cada función:**
```sql
1. Realizar operación (INSERT/UPDATE/DELETE)
2. PERFORM bodegas.actualizar_estatus_bodega(_id_bodega)
3. Retornar resultado
```

---

#### Gestión de observaciones:
- `bodegas.fotografia_observacion_ins()` - Agregar observación
- `bodegas.fotografia_observacion_solventar()` - Marcar como solventada
- `bodegas.fotografia_observacion_del()` - Eliminar observación (soft delete)

#### Cambio de estatus a Observada:
- `bodegas.bodega_enviar_observaciones(_id_bodega)`
  - Valida que haya observaciones pendientes
  - Valida que la bodega esté en Registrada o superior
  - Cambia estatus a "Observada"

### 6. Función `fotografias_get` Actualizada

Ahora incluye:
- Array de observaciones por fotografía
- Información de configuración (categoria, momento, etapa)
- Todas las observaciones con su estado (Pendiente/Solventado)

---

## 🎯 Nuevos Endpoints API

### Observaciones de Fotografías

#### **Agregar Observación**
```http
POST /api/bodegas/{id}/fotografias/{idFotografia}/observaciones
Content-Type: application/json

{
	"observacion": "La fotografía está desenfocada"
}
```

**Respuesta:**
```json
{
	"status": 200,
	"message": "Observación agregada exitosamente.",
	"data": {
		"id": 5
	}
}
```

#### **Solventar Observación**
```http
POST /api/bodegas/observaciones/{idObservacion}/solventar
```

**Respuesta:**
```json
{
	"status": 200,
	"message": "Observación marcada como solventada.",
	"data": null
}
```

#### **Eliminar Observación**
```http
DELETE /api/bodegas/observaciones/{idObservacion}
```

#### **Enviar Observaciones (Cambiar bodega a Observada)**
```http
POST /api/bodegas/{id}/enviar-observaciones
```

**Respuesta:**
```json
{
	"status": 200,
	"message": "Observaciones enviadas. La bodega ha sido marcada como Observada.",
	"data": {
		"status": "Observada"
	}
}
```

**Validaciones:**
- ❌ Error 400 si la bodega está en "En captura"
- ❌ Error 400 si no hay observaciones pendientes
- ✅ Cambia a "Observada" solo si hay observaciones pendientes

---

## 📊 Estructura de Respuesta Actualizada

### GET `/api/bodegas/{id}/fotografias`

```json
{
	"status": 200,
	"message": "OK",
	"data": [
		{
			"id": 1,
			"id_bodega": 4,
			"id_config": 1,
			"componente": "Acondicionamiento",
			"etapa": "Antes",
			"tipo": "Registro",
			"ruta_archivo": "BE4/CAT1/foto.jpg",
			"url": "https://storage.blob.core.windows.net/...",
			"status_foto": "Pendiente",
			"created_at": "2026-05-27T10:00:00",
			"observaciones": [
				{
					"id": 1,
					"observacion": "La fotografía está desenfocada",
					"observador_id": 5,
					"observador_nombre": "Juan Pérez",
					"status": "Pendiente",
					"created_at": "2026-05-27T10:30:00",
					"updated_at": "2026-05-27T10:30:00"
				},
				{
					"id": 2,
					"observacion": "Falta iluminación",
					"observador_id": 5,
					"observador_nombre": "Juan Pérez",
					"status": "Solventado",
					"created_at": "2026-05-27T11:00:00",
					"updated_at": "2026-05-27T12:00:00"
				}
			]
		}
	]
}
```

---

## 🔧 Cambios en Código C#

### Modelos Creados

#### `ModelFotografiaConfig`
```csharp
public class ModelFotografiaConfig
{
	public int Id { get; set; }
	public string Categoria { get; set; }
	public string Momento { get; set; }
	public string Etapa { get; set; } = "Registro";
	public int MaxFotos { get; set; }
	public string? Descripcion { get; set; }
}
```

#### `ModelFotografiaObservacion`
```csharp
public class ModelFotografiaObservacion
{
	public int Id { get; set; }
	public int IdFotografia { get; set; }
	public string Observacion { get; set; }
	public int ObservadorId { get; set; }
	public string ObservadorNombre { get; set; }
	public string Status { get; set; } = "Pendiente";
}
```

### Interfaces y Servicios

#### `IBodegaService` - Métodos eliminados:
- ❌ `ObservarFotografia()`
- ❌ `ValidarFotografia()`

#### `IBodegaService` - Métodos agregados:
- ✅ `AgregarObservacionFotografia()`
- ✅ `SolventarObservacionFotografia()`
- ✅ `EliminarObservacionFotografia()`
- ✅ `EnviarObservacionesBodega()`

---

## 🎭 Flujo de Trabajo Completo

### 1. Captura de Bodega
```
Estado inicial: "En captura"
↓
Usuario sube fotografías (algunas)
↓
Estado: "En captura" (aún incompleto)
↓
Usuario sube todas las fotografías requeridas + PDF de acuerdo
↓
⚡ Trigger automático detecta completitud
↓
Estado: "Registrada" ✅
```

### 2. Validación con Observaciones
```
Estado: "Registrada"
↓
Validador revisa fotografías
↓
Validador agrega observaciones: POST /fotografias/{id}/observaciones
↓
Validador hace clic en "Enviar Observaciones": POST /{id}/enviar-observaciones
↓
Estado: "Observada" ⚠️
```

### 3. Solventación de Observaciones
```
Estado: "Observada"
↓
Usuario capturista corrige y sube nuevas fotos
↓
Validador marca observaciones como solventadas: POST /observaciones/{id}/solventar
↓
(Proceso continúa al siguiente estado: Validada, Verificada, etc.)
```

---

## ⚠️ Notas Importantes

### Reinicio de Aplicación Requerido
- 🔄 Los cambios requieren reiniciar la aplicación (no Hot Reload compatible)
- 📝 Los cambios en interfaces provocan errores ENC0020 y ENC0023

### Estados y su Comportamiento

| Estado | Cambio Automático | Al Eliminar Fotos/Acuerdos |
|--------|-------------------|----------------------------|
| En captura | ✅ Sí (→ Registrada si completa) | N/A |
| Registrada | ✅ Sí (→ En captura si incompleta) | ⬅️ Regresa a En captura |
| Observada | ❌ No | 🔒 No cambia |
| Validada | ❌ No | 🔒 No cambia |
| Verificada | ❌ No | 🔒 No cambia |
| Informada | ❌ No | 🔒 No cambia |

### Validación de Completitud

Una bodega está **completa para Registro** cuando:
1. ✅ Tiene TODAS las fotografías requeridas de etapa 'Registro'
2. ✅ Tiene AL MENOS UN acuerdo PDF
3. ⚡ El cambio es automático (no requiere acción del usuario)

---

## 📋 Checklist de Implementación

- ✅ Campo `etapa` agregado a `fotografias_config`
- ✅ Tabla `fotografias_observaciones` creada
- ✅ Campos de observación eliminados de `fotografias`
- ✅ Funciones de validación de completitud implementadas
- ✅ Función `actualizar_estatus_bodega` implementada
- ✅ **Triggers eliminados** - Lógica movida a las funciones
- ✅ Funciones `fotografia_ins`, `fotografia_del` actualizadas con llamada a actualización
- ✅ Funciones `acuerdo_ins`, `acuerdo_del` actualizadas con llamada a actualización
- ✅ Función `fotografias_get` actualizada con observaciones
- ✅ Funciones antiguas eliminadas (`fotografia_observar`, `fotografia_validar`)
- ✅ Funciones de gestión de observaciones creadas
- ✅ Función de envío de observaciones implementada
- ✅ Modelos C# creados (`ModelFotografiaConfig`, `ModelFotografiaObservacion`)
- ✅ Servicios actualizados (`IBodegaService`, `BodegaService`)
- ✅ Endpoints API implementados
- ✅ Endpoints obsoletos eliminados
- ✅ Documentación completa

---

## 🚀 Próximos Pasos

1. **Reiniciar la aplicación** para aplicar los cambios
2. **Probar el flujo completo** de captura → registro → observación → solventación
3. **Actualizar el frontend** para usar los nuevos endpoints de observaciones
4. **Actualizar Swagger/OpenAPI** con la nueva estructura de endpoints
5. **Capacitar a usuarios** sobre el nuevo sistema de observaciones múltiples

---

## 📞 Soporte

Para dudas o problemas con el nuevo sistema:
- Revisar esta documentación
- Verificar logs de triggers en PostgreSQL
- Validar que la etapa esté correctamente configurada en `fotografias_config`
