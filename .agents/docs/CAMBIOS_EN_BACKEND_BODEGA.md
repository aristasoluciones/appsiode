
# Cambios en Módulo de Bodegas

## Fecha: 2026-05-27

## Resumen
Se actualizó la estructura de los endpoints de bodegas para soportar el nuevo campo `tipo` que distingue entre bodegas de "Oficina Central" (OC) y "Consejo" (C).

---

## Cambios en la API (C#)

### 1. Endpoint: `GET /api/bodegas/dashboard`

**Parámetros Actualizados:**
- ✅ **tipo** (obligatorio): `"OC"` (Oficina Central) o `"C"` (Consejo)
- ✅ **tipoConsejo** (opcional): `"M"` o `"D"` - **Obligatorio cuando tipo='C'**

**Validaciones Agregadas:**
- Valida que `tipo` sea enviado
- Valida que `tipoConsejo` sea enviado cuando `tipo='C'`
- Retorna `400 Bad Request` con mensaje descriptivo si falta algún parámetro

**Comportamiento:**
- **Cuando tipo='OC'**: Retorna progreso general de todas las bodegas de Oficina Central
- **Cuando tipo='C'**: Retorna progreso general + desglose por cada consejo del catálogo (M o D)

---

### 2. Endpoint: `GET /api/bodegas/lista`

**Parámetros Actualizados:**
- ✅ **tipo** (obligatorio): `"OC"` (Oficina Central) o `"C"` (Consejo)
- ✅ **tipoConsejo** (opcional): `"M"` o `"D"` - **Obligatorio cuando tipo='C'**
- ✅ **idConsejo** (opcional): ID del consejo específico (default: 0 = todos)

**Validaciones Agregadas:**
- Valida que `tipo` sea enviado
- Valida que `tipoConsejo` sea enviado cuando `tipo='C'`
- Valida acceso del usuario cuando `idConsejo > 0`
- Retorna `400 Bad Request` o `403 Forbidden` según corresponda

**Comportamiento:**
- **Cuando tipo='OC'**: Lista todas las bodegas de Oficina Central
- **Cuando tipo='C' y idConsejo=0**: Lista todas las bodegas del tipo de consejo (M o D)
- **Cuando tipo='C' y idConsejo>0**: Lista las bodegas de ese consejo específico (si el usuario tiene acceso)

---

## Cambios en la Base de Datos (PostgreSQL)

### 1. Función: `bodegas.dashboard_get`

**Nueva Firma:**
```sql
bodegas.dashboard_get(
	_id_proceso INTEGER,
	_tipo VARCHAR,
	_tipo_consejo VARCHAR DEFAULT NULL
)
```

**Lógica Implementada:**
- **Tipo='OC'**: 
  - Cuenta todas las bodegas con `tipo='Oficina Central'`
  - No agrupa por consejo
  - Retorna array `consejos` vacío

- **Tipo='C'**: 
  - Cuenta bodegas con `tipo='Consejo'` y `tipo_consejo=_tipo_consejo`
  - Agrupa por `id_consejo` usando el catálogo completo
  - Retorna estadísticas por cada consejo (incluso sin bodegas registradas)
  - Une con `cat.procesos_consejos` para obtener todos los consejos activos

**Estructura del JSON retornado:**
```json
{
	"status": 200,
	"message": "OK",
	"data": {
		"progreso": {
		   "total": 4,
		   "captura": 3,
		   "registrada": 0,
		   "observada": 0,
		   "validada": 0,
		   "verificada": 0,
		   "informada": 0
		},
		"consejos": [
			{
				"tipo_consejo": "D",
				"id_consejo": 1,
				"nombre_consejo": "TUXTLA GUTIÉRREZ",
				"total": 4,
				"captura": 3,
				"registrada": 0,
				"observada": 0,
				"validada": 0,
				"verificada": 0,
				"informada": 0
			}
		]
	}
}
```

---

### 2. Función: `bodegas.bodegas_get`

**Nueva Firma:**
```sql
bodegas.bodegas_get(
	_id_proceso INTEGER,
	_tipo VARCHAR,
	_tipo_consejo VARCHAR DEFAULT NULL,
	_id_consejo INTEGER DEFAULT 0
)
```

**Lógica Implementada:**
- **Tipo='OC'**: 
  - Filtra por `tipo='Oficina Central'`
  - No usa `tipo_consejo` ni `id_consejo`
  - `nombre_consejo` es NULL

- **Tipo='C'**: 
  - Filtra por `tipo='Consejo'` y `tipo_consejo=_tipo_consejo`
  - Si `id_consejo>0`, filtra por ese consejo específico
  - Si `id_consejo=0`, retorna todas las bodegas del tipo de consejo
  - Une con `cat.procesos_consejos` para obtener `nombre_consejo`

---

## Archivos Modificados

### C# (Backend)
1. ✅ `Controllers/BodegasController.cs`
   - Actualizado `ObtenerDashboard` con validaciones
   - Actualizado `ObtenerBodegas` con validaciones y control de acceso

2. ✅ `Interfaces/IBodegaService.cs`
   - Actualizada firma de `ObtenerDashboard(int, string, string?)`
   - Actualizada firma de `ObtenerBodegas(int, string, string?, int)`

3. ✅ `Services/BodegaService.cs`
   - Actualizada implementación de `ObtenerDashboard` con nuevos parámetros
   - Actualizada implementación de `ObtenerBodegas` con nuevos parámetros

### PostgreSQL (Database)
1. ✅ Función `bodegas.dashboard_get` - Recreada con nueva lógica
2. ✅ Función `bodegas.bodegas_get` - Recreada con nueva lógica
3. ✅ Funciones antiguas eliminadas

---

## Notas de Status Soportados

Los siguientes status son reconocidos en el sistema:
- `En captura`
- `Registrada`
- `Observada`
- `Validada`
- `Verificada`
- `Informada`

---

## Ejemplos de Uso

### Dashboard - Oficina Central
```
GET /api/bodegas/dashboard?tipo=OC
```

### Dashboard - Consejos Distritales
```
GET /api/bodegas/dashboard?tipo=C&tipoConsejo=D
```

### Dashboard - Consejos Municipales
```
GET /api/bodegas/dashboard?tipo=C&tipoConsejo=M
```

### Lista - Todas las bodegas de Oficina Central
```
GET /api/bodegas/lista?tipo=OC
```

### Lista - Todas las bodegas de Consejos Distritales
```
GET /api/bodegas/lista?tipo=C&tipoConsejo=D
```

### Lista - Bodegas de un Consejo Distrital específico
```
GET /api/bodegas/lista?tipo=C&tipoConsejo=D&idConsejo=1
```

---

## Pruebas Realizadas

✅ Compilación exitosa del proyecto
✅ Funciones de base de datos actualizadas correctamente
✅ Eliminación de funciones antiguas

---

## Pendientes / Recomendaciones

⚠️ **Se recomienda probar los endpoints con datos reales** para verificar:
1. Que las consultas retornen los datos esperados
2. Que las validaciones funcionen correctamente
3. Que el control de acceso por consejo funcione adecuadamente
4. Que el dashboard muestre correctamente todos los consejos del catálogo

⚠️ **Actualizar documentación del API** (Swagger/OpenAPI) con los nuevos parámetros

⚠️ **Notificar al equipo de Frontend** sobre los cambios en los endpoints
