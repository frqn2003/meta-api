# Cómo crear la API desde cero

Esta guía explica la base conceptual para construir una API de ingesta Meta Ads con Node.js, Fastify y PostgreSQL.

## 1. Objetivo de la API

La API debe encargarse de:

- Conectarse a Meta Ads Marketing API.
- Pedir métricas por campaña.
- Normalizar los datos recibidos.
- Resolver campos dinámicos como `Resultados`.
- Insertar o actualizar la tabla existente en el Data Warehouse.
- Ejecutar ingestas históricas y diarias.
- Exponer endpoints para disparar o monitorear procesos.

## 2. Dependencias necesarias

En este proyecto ya están instaladas:

```bash
npm install fastify @fastify/cors pg axios dotenv node-cron
```

Para desarrollo local suele ser útil tener `nodemon`.

```bash
npm install --save-dev nodemon
```

El `package.json` actual ya tiene:

```json
{
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}
```

## 3. Responsabilidades principales

Aunque no es obligatorio crear toda la estructura de entrada, conceptualmente conviene separar responsabilidades:

| Responsabilidad | Qué hace |
|---|---|
| Servidor Fastify | Levanta la API y registra rutas. |
| Configuración | Lee variables de entorno. |
| Cliente Meta Ads | Consume endpoints de Meta con `axios`. |
| Servicio de ingesta | Orquesta rangos, paginación, retries y normalización. |
| Mapper | Convierte respuesta de Meta al esquema del Data Warehouse. |
| Repositorio PostgreSQL | Ejecuta inserts/upserts con `pg`. |
| Job diario | Ejecuta la ingesta automática con `node-cron`. |

## 4. Variables de entorno

Nunca conviene guardar tokens o credenciales dentro del código.

Variables mínimas:

```env
PORT=3000
DATABASE_URL=postgres://usuario:password@host:5432/base
META_ACCESS_TOKEN=token_de_meta
META_AD_ACCOUNT_ID=act_XXXXXXXXXXXX
META_API_VERSION=v21.0
META_INGEST_TIMEZONE=America/Argentina/Buenos_Aires
```

Variables útiles adicionales:

```env
META_HISTORICAL_START_DATE=2024-01-01
META_HISTORICAL_END_DATE=2026-01-01
META_DAILY_CRON=0 6 * * *
META_REQUEST_LIMIT=500
```

## 5. Endpoints iniciales recomendados

### `GET /health`

Sirve para validar que la API esté activa.

Respuesta esperada:

```json
{
  "status": "ok"
}
```

### `POST /ingest/meta/historical`

Ejecuta una ingesta histórica.

Body sugerido:

```json
{
  "from": "2024-01-01",
  "to": "2026-01-01",
  "campaignIds": ["123", "456"]
}
```

Si `campaignIds` no se envía, puede traer todas las campañas de la cuenta.

### `POST /ingest/meta/daily`

Ejecuta manualmente la ingesta diaria.

Body sugerido:

```json
{
  "date": "2026-05-08"
}
```

Si `date` no se envía, debería tomar ayer o el día actual según la regla de negocio.

### `GET /ingest/meta/status`

Consulta el estado de la última ingesta si se registra en una tabla de control.

## 6. Consumo de Meta Ads

Para métricas de campañas se suele consumir el endpoint de Insights:

```text
GET /{ad_account_id}/insights
```

Parámetros habituales:

```text
level=campaign
time_increment=1
time_range={"since":"2024-01-01","until":"2024-01-31"}
fields=campaign_id,campaign_name,date_start,date_stop,reach,impressions,clicks,ctr,cpc,cpm,spend,frequency,actions,cost_per_action_type
```

Puntos importantes:

- `time_increment=1` devuelve datos diarios.
- `level=campaign` agrupa por campaña.
- Para datos de presupuesto de ad sets puede ser necesario consultar también `/adsets`.
- Para estado de campaña puede ser necesario consultar también `/campaigns`.
- La API de Meta pagina respuestas; hay que recorrer `paging.next`.

## 7. Manejo del campo Resultados

`Resultados` no es un campo fijo universal.

Meta suele devolver métricas dentro de arrays como:

```json
{
  "actions": [
    { "action_type": "lead", "value": "10" },
    { "action_type": "link_click", "value": "50" }
  ]
}
```

La API debe definir una regla de negocio para elegir el resultado principal.

Ejemplo de prioridad inicial:

1. `lead`
2. `onsite_conversion.lead_grouped`
3. `offsite_conversion.fb_pixel_lead`
4. `leadgen_grouped`
5. `link_click`
6. `landing_page_view`

El `Indicador_de_resultado` debería guardar el `action_type` elegido o una etiqueta normalizada.

## 8. Ingesta histórica

Para dos años de histórico no conviene pedir todo en una sola consulta.

Recomendación:

- Dividir el rango en meses.
- Consultar Meta por cada mes.
- Procesar paginación completa.
- Hacer upsert por lote.
- Registrar inicio, fin, cantidad de filas, errores y duración.

Ejemplo de ventanas:

```text
2024-01-01 → 2024-01-31
2024-02-01 → 2024-02-29
2024-03-01 → 2024-03-31
```

## 9. Ingesta diaria

La ingesta diaria puede ejecutarse con `node-cron`.

Recomendación:

- Ejecutarla temprano por la mañana.
- Ingestar el día anterior.
- Opcionalmente reprocesar los últimos 3 a 7 días porque Meta puede recalcular métricas.
- Usar `UPSERT`, no `INSERT` simple.

Ejemplo de estrategia:

```text
Todos los días 06:00:
  ingestar desde hoy - 7 días hasta ayer
```

Esto reduce problemas por atribución tardía.

## 10. PostgreSQL

La API debería usar un pool de conexiones con `pg`.

Aspectos importantes:

- Usar queries parametrizadas.
- No concatenar valores del usuario en SQL.
- Manejar transacciones para lotes grandes.
- Usar `ON CONFLICT DO UPDATE` si existe una clave única.
- Registrar errores sin exponer tokens.

## 11. Primeros pasos recomendados

Orden sugerido de implementación:

1. Crear configuración con variables de entorno.
2. Levantar Fastify con `/health`.
3. Crear conexión a PostgreSQL.
4. Probar consulta simple al Data Warehouse.
5. Crear cliente de Meta Ads con `axios`.
6. Probar endpoint de Insights para un rango corto.
7. Crear mapper del response al esquema de tabla.
8. Implementar upsert.
9. Crear endpoint manual de ingesta diaria.
10. Crear endpoint manual de ingesta histórica.
11. Agregar `node-cron` para automatizar la diaria.
12. Agregar logging y tabla de control si es posible.

## 12. Riesgos principales

- **Token vencido o sin permisos:** validar permisos `ads_read` y acceso a la cuenta publicitaria.
- **Rate limits:** dividir ingesta y aplicar reintentos con espera.
- **Campos no disponibles:** algunas columnas exportadas por Ads Manager no existen igual en la API.
- **Resultados variables:** las campañas pueden optimizar a objetivos distintos.
- **Duplicados:** evitar inserts sin clave única.
- **Cambios de nombre:** no depender solo de `Nombre_de_la_campaña`.
- **Atribución tardía:** reprocesar últimos días en la ingesta diaria.

## 13. Decisiones pendientes

Antes de cerrar código productivo conviene confirmar:

- Nombre exacto de la tabla destino.
- Si se puede agregar `campaign_id`.
- Si se puede agregar tabla de control de ingestas.
- Zona horaria esperada.
- Regla exacta para `Resultados`.
- Qué hacer cuando una campaña tiene varios conjuntos de anuncios.
- Si los datos se guardan día por día o por rango.
