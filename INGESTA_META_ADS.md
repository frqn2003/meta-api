# Extracción Meta Ads

Este documento describe cómo debería funcionar la extracción automática desde Meta Ads hacia la API intermediaria.

La API no carga directamente datos en PostgreSQL/Data Warehouse. Su responsabilidad es obtener datos desde Meta Ads, normalizarlos y entregarlos a Sistemas mediante un contrato JSON estable.

## Tipos de extracción

La API debe soportar dos tipos de consulta:

- **Histórica:** obtención inicial de aproximadamente dos años.
- **Diaria:** obtención recurrente de datos recientes para que Sistemas mantenga actualizado el Data Warehouse.

## Extracción histórica

### Objetivo

Traer la información pasada de campañas de Meta Ads y devolverla normalizada para que Sistemas realice la carga final.

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
   3. Mapear filas al contrato de salida.
   4. Acumular filas normalizadas.
   5. Registrar resultado de la ventana en logs o respuesta.
4. Devolver JSON final o lotes por ventana para Sistemas.
```

## Extracción diaria

### Objetivo

Devolver datos actualizados para que Sistemas mantenga el Data Warehouse al día.

### Estrategia recomendada

Aunque parezca suficiente cargar solo ayer, Meta puede actualizar métricas por atribución después de varios días.

Por eso se recomienda:

```text
cada día → consultar últimos 3 a 7 días
```

Ejemplo:

```text
Fecha actual: 2026-05-08
Rango a consultar: 2026-05-01 → 2026-05-07
```

Sistemas decide cómo insertar, actualizar o deduplicar esos datos en el Data Warehouse.

## Automatización con cron

Con `node-cron`, la API puede programar una consulta diaria.

Ejemplo de horario recomendado:

```text
06:00 America/Argentina/Buenos_Aires
```

Variable sugerida:

```env
META_DAILY_CRON=0 6 * * *
```

Si Sistemas prefiere orquestar la ejecución desde afuera, el cron interno puede omitirse y dejar solo endpoints manuales.

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

Algunos campos del contrato no siempre salen directamente desde Insights.

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
- Si se debe devolver el presupuesto total, diario o ambos.

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

La API debe seguir `paging.next` hasta que no exista más.

## Rate limits y reintentos

La API debe estar preparada para:

- Reintentar errores temporales.
- Esperar entre reintentos.
- Cortar la extracción si el error es de permisos o token inválido.
- Registrar qué ventana falló para poder reintentar.

Errores típicos:

- Token vencido.
- Falta de permisos.
- Cuenta publicitaria sin acceso.
- Rate limit.
- Campo no soportado por versión de API.
- Timeout por rango demasiado amplio.

## Idempotencia

La idempotencia final de la carga corresponde a Sistemas/Data Warehouse.

La API debe ayudar devolviendo campos estables que permitan deduplicar:

Clave ideal:

```text
meta_account_id + campaign_id + date_start + date_stop + indicador_resultado
```

Aunque la tabla final no use todos esos campos, es recomendable incluirlos en el contrato de salida para facilitar la carga del lado de Sistemas.

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
- `frequency` → número decimal o entero según decisión de negocio.

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

- Devolver `Resultados = 0`.
- Devolver `Indicador_de_resultado = objetivo_desconocido` o el primer action type disponible.
- Registrar el caso para revisar la regla.

## Validaciones previas a producción

Antes de automatizar:

- Probar con una campaña conocida.
- Comparar contra exportación manual de Meta Ads.
- Validar moneda ARS.
- Validar zona horaria.
- Validar que `Resultados` coincida con lo que ve negocio.
- Validar que el JSON respete el contrato acordado con Sistemas.
- Validar que la respuesta sea consumible para rangos grandes.

## Monitoreo recomendado

Como la API no escribe en base, el monitoreo inicial puede resolverse con logs y respuestas de resumen.

Resumen sugerido:

| Campo | Descripción |
|---|---|
| `job_name` | Nombre del proceso. |
| `source` | Fuente, por ejemplo `meta_ads`. |
| `from_date` | Inicio del rango. |
| `to_date` | Fin del rango. |
| `status` | `success`, `partial_success`, `failed`. |
| `rows_read` | Filas leídas desde Meta. |
| `rows_returned` | Filas devueltas a Sistemas. |
| `windows_processed` | Ventanas procesadas. |
| `errors` | Errores por ventana si existieron. |
| `started_at` | Fecha/hora de inicio. |
| `finished_at` | Fecha/hora de fin. |

## Orden recomendado de construcción

1. Probar token y cuenta publicitaria contra Meta.
2. Consumir Insights para un día y una campaña.
3. Mapear la respuesta al contrato de salida.
4. Devolver JSON normalizado desde un endpoint.
5. Implementar paginación.
6. Implementar histórico por ventanas.
7. Implementar extracción diaria manual.
8. Definir con Sistemas si necesitan paginación, lotes o respuesta completa.
9. Automatizar con cron si corresponde.
10. Documentar contrato final de consumo.
