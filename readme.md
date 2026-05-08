# Meta Ads API

API Node.js con Fastify que actúa como intermediario entre Meta Ads Marketing API y el equipo de Sistemas/Data Warehouse.

## Objetivo

El objetivo de este proyecto es consumir datos de campañas de Meta Ads, normalizarlos y exponerlos mediante un contrato de salida estable para que Sistemas realice la carga final en el Data Warehouse.

Esta API no debe conectarse directamente al Data Warehouse ni ejecutar inserciones, actualizaciones, `UPSERT` o transacciones sobre la tabla destino.

La API debe contemplar dos modos principales:

- **Consulta histórica:** obtención de aproximadamente dos años de información.
- **Consulta diaria:** obtención automática o manual de datos recientes para que Sistemas mantenga la tabla actualizada.

## Stack usado

El proyecto ya tiene instaladas las dependencias principales:

- **Fastify:** servidor HTTP.
- **axios:** consumo de la API de Meta.
- **dotenv:** configuración por variables de entorno.
- **node-cron:** ejecución automática de consultas programadas si se decide automatizar desde esta API.
- **@fastify/cors:** configuración de CORS si la API se consume desde otros servicios.

La dependencia `pg` puede estar instalada, pero no forma parte del alcance actual si Sistemas se encarga de la conexión al Data Warehouse.

## Scripts disponibles

```bash
npm run dev
npm start
```

## Documentación del proyecto

- [`API_DESDE_CERO.md`](./API_DESDE_CERO.md): explicación conceptual para crear la API intermediaria desde cero.
- [`INGESTA_META_ADS.md`](./INGESTA_META_ADS.md): flujo recomendado de extracción histórica y diaria.
- [`esquemas_tablas.md`](./esquemas_tablas.md): esquema esperado, mapeo y contrato de salida para Sistemas.
- [`PLAN_TAREAS_API.md`](./PLAN_TAREAS_API.md): tareas para construir la API divididas entre dos personas.

## Flujo general

```text
Meta Ads Marketing API
        ↓
API Fastify intermediaria
        ↓
Extracción, paginación y normalización
        ↓
Contrato JSON estable
        ↓
Sistemas
        ↓
Data Warehouse
```

## Endpoints recomendados

La API puede arrancar con endpoints simples:

- **GET `/health`:** validar que el servidor esté vivo.
- **POST `/meta-ads/report`:** obtener datos normalizados por rango de fechas.
- **POST `/meta-ads/historical`:** obtener datos históricos por ventanas.
- **POST `/meta-ads/daily`:** obtener datos diarios o últimos días reprocesables.
- **GET `/meta-ads/status`:** consultar estado interno de última ejecución en memoria/logs si aplica.

## Variables de entorno recomendadas

```env
PORT=3000
META_ACCESS_TOKEN=token_de_meta
META_AD_ACCOUNT_ID=act_XXXXXXXXXXXX
META_API_VERSION=v21.0
META_INGEST_TIMEZONE=America/Argentina/Buenos_Aires
META_DAILY_CRON=0 6 * * *
META_REQUEST_LIMIT=500
```

No se incluye `DATABASE_URL` porque la API no se conecta al Data Warehouse en esta arquitectura.

## Consideraciones importantes

- **Token de Meta:** aunque el token dure varios años, no debe hardcodearse en el código.
- **Contrato de salida:** Sistemas necesita un JSON estable, versionado y documentado.
- **Rangos históricos:** para dos años de datos conviene partir la consulta en ventanas mensuales o semanales.
- **Resultados dinámicos:** el campo `Resultados` puede depender del objetivo de campaña y venir desde distintos `action_type`.
- **Presupuesto de conjunto de anuncios:** si la extracción es por campaña, hay que definir cómo agregar presupuestos cuando una campaña tiene varios conjuntos de anuncios.
- **Idempotencia final:** queda del lado de Sistemas/Data Warehouse.
- **Trazabilidad:** la API puede devolver metadatos de extracción, pero la persistencia final del control queda del lado de Sistemas.
