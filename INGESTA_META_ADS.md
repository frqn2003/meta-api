# Ingesta Meta Ads

Este documento describe cómo debería funcionar la ingesta automática desde Meta Ads hacia PostgreSQL/Data Warehouse.

## Tipos de ingesta

La API debe soportar dos tipos de carga:

- **Histórica:** carga inicial de aproximadamente dos años.
- **Diaria:** carga automática recurrente para mantener los datos al día.

## Ingesta histórica

### Objetivo

Traer la información pasada de campañas de Meta Ads y poblar la tabla existente.

### Rango inicial

El rango sugerido es:

```text
desde = hoy - 2 años
hasta = ayer
```

También debería poder ejecutarse con fechas manuales para reintentos.

### Estrategia recomendada

No consultar dos años en una sola llamada.

Usar ventanas:

- Mensuales para la primera versión.
- Semanales si Meta devuelve errores de volumen o timeout.
- Diarias solo si el volumen es muy alto.

Flujo:

```text
1. Recibir fecha desde/hasta.
2. Dividir el rango en ventanas.
3. Por cada ventana:
   1. Consultar Insights en Meta.
   2. Recorrer paginación completa.
   3. Mapear filas al esquema destino.
   4. Ejecutar upsert en PostgreSQL.
   5. Registrar resultado de la ventana.
4. Devolver resumen final.
```

## Ingesta diaria

### Objetivo

Mantener actualizados los datos sin intervención manual.

### Estrategia recomendada

Aunque parezca suficiente cargar solo ayer, Meta puede actualizar métricas por atribución después de varios días.

Por eso se recomienda:

```text
cada día → reprocesar últimos 3 a 7 días
```

Ejemplo:

```text
Fecha actual: 2026-05-08
Rango a ingestar: 2026-05-01 → 2026-05-07
```

Esto exige que la carga sea idempotente.

## Automatización con cron

Con `node-cron`, la API puede programar una tarea diaria.

Ejemplo de horario recomendado:

```text
06:00 America/Argentina/Buenos_Aires
```

Variable sugerida:

```env
META_DAILY_CRON=0 6 * * *
```

## Endpoint de Meta recomendado

Para métricas:

```text
GET https://graph.facebook.com/{version}/{ad_account_id}/insights
```

Parámetros base:

```text
level=campaign
time_increment=1
limit=500
time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}
fields=campaign_id,campaign_name,date_start,date_stop,reach,impressions,clicks,ctr,cpc,cpm,spend,frequency,actions,cost_per_action_type
access_token={META_ACCESS_TOKEN}
```

## Datos que pueden requerir llamadas adicionales

Algunos campos de la tabla no siempre salen directamente desde Insights.

### Estado o entrega de campaña

Puede requerir consultar:

```text
GET /{campaign_id}?fields=id,name,status,effective_status,start_time,stop_time
```

### Presupuesto de conjunto de anuncios

Puede requerir consultar:

```text
GET /{campaign_id}/adsets?fields=id,name,daily_budget,lifetime_budget,status,effective_status
```

Decisión necesaria:

- Si hay varios conjuntos de anuncios por campaña, definir cómo agregarlos.
- Si se debe guardar el presupuesto total, diario o ambos.

## Paginación

Meta puede devolver:

```json
{
  "data": [],
  "paging": {
    "next": "https://graph.facebook.com/..."
  }
}
```

La ingesta debe seguir `paging.next` hasta que no exista más.

## Rate limits y reintentos

La API debe estar preparada para:

- Reintentar errores temporales.
- Esperar entre reintentos.
- Cortar la ingesta si el error es de permisos o token inválido.
- Registrar qué ventana falló para poder reanudar.

Errores típicos:

- Token vencido.
- Falta de permisos.
- Cuenta publicitaria sin acceso.
- Rate limit.
- Campo no soportado por versión de API.
- Timeout por rango demasiado amplio.

## Idempotencia

La ingesta debe poder ejecutarse varias veces para el mismo rango sin duplicar filas.

Para eso:

- Usar `UPSERT`.
- Definir clave única.
- Reprocesar últimos días en la carga diaria.

Clave ideal:

```text
meta_account_id + campaign_id + date_start + date_stop + indicador_resultado
```

Si la tabla no tiene esos campos, se recomienda una tabla auxiliar o una clave alternativa menos robusta.

## Normalización de datos

Meta devuelve muchos valores como strings aunque sean números.

La API debe convertir:

- `reach` → número entero.
- `impressions` → número entero.
- `clicks` → número entero.
- `spend` → número decimal.
- `ctr` → número decimal.
- `cpc` → número decimal.
- `cpm` → número decimal.
- `frequency` → número decimal o entero según decisión de tabla.

## Manejo de Resultados

El campo `Resultados` cambia según objetivo de campaña.

Se recomienda definir una lista de prioridad inicial:

| Prioridad | `action_type` Meta | Indicador sugerido |
|---:|---|---|
| 1 | `lead` | `leads` |
| 2 | `leadgen_grouped` | `formularios_enviados` |
| 3 | `onsite_conversion.lead_grouped` | `clientes_potenciales` |
| 4 | `offsite_conversion.fb_pixel_lead` | `clientes_potenciales` |
| 5 | `link_click` | `trafico` |
| 6 | `landing_page_view` | `trafico` |

Si no aparece ningún `action_type` conocido:

- Guardar `Resultados = 0`.
- Guardar `Indicador_de_resultado = objetivo_desconocido` o el primer action type disponible.
- Registrar el caso para revisar la regla.

## Validaciones previas a producción

Antes de automatizar:

- Probar con una campaña conocida.
- Comparar contra exportación manual de Meta Ads.
- Validar moneda ARS.
- Validar zona horaria.
- Validar que `Resultados` coincida con lo que ve negocio.
- Validar duplicados.
- Validar que la ingesta diaria actualice datos ya existentes.

## Monitoreo recomendado

Si se puede crear una tabla auxiliar, registrar:

| Campo | Descripción |
|---|---|
| `job_name` | Nombre del proceso. |
| `from_date` | Inicio del rango. |
| `to_date` | Fin del rango. |
| `status` | `running`, `success`, `failed`. |
| `rows_read` | Filas leídas desde Meta. |
| `rows_written` | Filas insertadas/actualizadas. |
| `error_message` | Error si falló. |
| `started_at` | Fecha/hora de inicio. |
| `finished_at` | Fecha/hora de fin. |

## Orden recomendado de construcción

1. Probar token y cuenta publicitaria contra Meta.
2. Consumir Insights para un día y una campaña.
3. Mapear la respuesta al esquema.
4. Insertar una fila de prueba en PostgreSQL.
5. Convertir insert en upsert.
6. Implementar paginación.
7. Implementar histórico por ventanas.
8. Implementar ingesta diaria manual.
9. Automatizar con cron.
10. Agregar registro de ejecuciones.
