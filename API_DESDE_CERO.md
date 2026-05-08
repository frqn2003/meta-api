# Cómo crear la API intermediaria desde cero

Esta guía explica la base conceptual para construir una API intermediaria con Node.js y Fastify que consume Meta Ads, normaliza datos y entrega un JSON listo para que Sistemas lo cargue en el Data Warehouse.

## 1. Objetivo de la API

La API debe encargarse de:

- Conectarse a Meta Ads Marketing API.
- Pedir métricas por campaña.
- Normalizar los datos recibidos.
- Resolver campos dinámicos como `Resultados`.
- Ejecutar consultas históricas y diarias.
- Exponer endpoints para disparar o monitorear procesos.
- Devolver un contrato de salida estable para Sistemas.

La API no debe encargarse de:

- Conectarse al Data Warehouse.
- Insertar o actualizar datos.
- Ejecutar `UPSERT`.
- Crear tablas.
- Definir claves únicas o constraints.
- Resolver la idempotencia final de la carga.

## 2. Dependencias necesarias

Para el alcance actual se necesitan:

```bash
npm install fastify @fastify/cors axios dotenv node-cron
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
| Servicio de extracción | Orquesta rangos, paginación, retries y normalización. |
| Mapper | Convierte respuesta de Meta al contrato de salida acordado. |
| Contrato de salida | Define el JSON que consume Sistemas. |
| Job diario | Ejecuta la extracción automática con `node-cron`. |

## Arquitectura general

```text
Cliente interno / Sistemas / Cron
        ↓
Fastify API
        ↓
Routes
        ↓
Servicio de extracción
        ↓
Cliente Meta Ads
        ↓
Mapper / Normalizador
        ↓
Respuesta JSON
        ↓
Sistemas
        ↓
Data Warehouse
```

## 4. Variables de entorno

Nunca conviene guardar tokens o credenciales dentro del código.

Variables mínimas:

```env
PORT=3000
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

No se requiere `DATABASE_URL` para esta arquitectura.

## 5. Endpoints iniciales recomendados

### `GET /health`

Sirve para validar que la API esté activa.

Respuesta esperada:

```json
{
  "status": "ok"
}
```

### `POST /meta-ads/report`

Devuelve datos normalizados para un rango de fechas.

Body sugerido:

```json
{
  "from": "2024-01-01",
  "to": "2024-01-31",
  "campaignIds": ["123", "456"]
}
```

Respuesta sugerida:

```json
{
  "status": "success",
  "source": "meta_ads",
  "from": "2024-01-01",
  "to": "2024-01-31",
  "rowsCount": 1,
  "rows": [
    {
      "Inicio_del_informe": "2024-01-01",
      "Fin_del_informe": "2024-01-01",
      "Nombre_de_la_campaña": "Campaña ejemplo",
      "Resultados": 10,
      "Indicador_de_resultado": "leads",
      "Alcance": 1000,
      "Impresiones": 2500,
      "Clics": 120,
      "Importe_gastado_ARS": 35000.5
    }
  ]
}
```

### `POST /meta-ads/historical`

Ejecuta una extracción histórica.

Body sugerido:

```json
{
  "from": "2024-01-01",
  "to": "2026-01-01",
  "campaignIds": ["123", "456"]
}
```

Si `campaignIds` no se envía, puede traer todas las campañas de la cuenta.

### `POST /meta-ads/daily`

Ejecuta manualmente la extracción diaria.

Body sugerido:

```json
{
  "date": "2026-05-08",
  "lookbackDays": 7
}
```

Si `date` no se envía, debería tomar ayer o el día actual según la regla de negocio.

### `GET /meta-ads/status`

Consulta estado interno de última ejecución si la API mantiene información en memoria o logs.

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

## 8. Extracción histórica

Para dos años de histórico no conviene pedir todo en una sola consulta.

Recomendación:

- Dividir el rango en meses.
- Consultar Meta por cada mes.
- Procesar paginación completa.
- Devolver lotes o respuesta resumida para Sistemas.
- Registrar inicio, fin, cantidad de filas, errores y duración en logs.

Ejemplo de ventanas:

```text
2024-01-01 → 2024-01-31
2024-02-01 → 2024-02-29
2024-03-01 → 2024-03-31
```

## 9. Extracción diaria

La extracción diaria puede ejecutarse con `node-cron` o manualmente por endpoint.

Recomendación:

- Ejecutarla temprano por la mañana.
- Consultar el día anterior.
- Opcionalmente reprocesar los últimos 3 a 7 días porque Meta puede recalcular métricas.
- Entregar siempre el mismo contrato de salida para que Sistemas decida cómo procesar los datos en el Data Warehouse.

Ejemplo de estrategia:

```text
Todos los días 06:00:
  consultar desde hoy - 7 días hasta ayer
```

Esto reduce problemas por atribución tardía.

## 10. Contrato con Sistemas

El punto más importante de esta arquitectura es acordar el contrato entre la API y Sistemas.

Debe definirse:

- **Endpoint que Sistemas va a consumir.**
- **Formato del request.**
- **Formato exacto del response.**
- **Nombres de campos.**
- **Tipos esperados.**
- **Comportamiento ante errores.**
- **Tamaño máximo de respuesta o paginación interna.**
- **Si Sistemas prefiere recibir todo junto, por ventanas o por páginas.**

## 11. Primeros pasos recomendados

Orden sugerido de implementación:

1. Crear configuración con variables de entorno.
2. Levantar Fastify con `/health`.
3. Crear cliente de Meta Ads con `axios`.
4. Probar endpoint de Insights para un rango corto.
5. Crear mapper del response al contrato de salida.
6. Crear endpoint `/meta-ads/report`.
7. Implementar paginación de Meta.
8. Crear endpoint manual de extracción diaria.
9. Crear endpoint manual de extracción histórica.
10. Agregar `node-cron` si la API debe automatizar la consulta diaria.
11. Documentar contrato final para Sistemas.

## 12. Riesgos principales

- **Token vencido o sin permisos:** validar permisos `ads_read` y acceso a la cuenta publicitaria.
- **Rate limits:** dividir extracción y aplicar reintentos con espera.
- **Campos no disponibles:** algunas columnas exportadas por Ads Manager no existen igual en la API.
- **Resultados variables:** las campañas pueden optimizar a objetivos distintos.
- **Respuesta muy grande:** el histórico de dos años puede requerir paginación o ventanas.
- **Cambios de nombre:** no depender solo de `Nombre_de_la_campaña`.
- **Atribución tardía:** reprocesar últimos días en la consulta diaria.

## 13. Decisiones pendientes

Antes de cerrar código productivo conviene confirmar:

- Endpoint final que va a consumir Sistemas.
- Si Sistemas quiere respuesta completa, por páginas o por ventanas.
- Si se debe incluir `campaign_id` aunque no esté en la tabla original.
- Zona horaria esperada.
- Regla exacta para `Resultados`.
- Qué hacer cuando una campaña tiene varios conjuntos de anuncios.
- Si los datos se entregan día por día o por rango.
