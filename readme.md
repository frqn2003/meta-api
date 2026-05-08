# Meta Ads API

API Node.js con Fastify para ingestar datos de Meta Ads hacia un Data Warehouse en PostgreSQL.

## Objetivo

El objetivo de este proyecto es consumir automáticamente datos de campañas de Meta Ads, normalizarlos y cargarlos en una tabla existente del Data Warehouse.

La API debe contemplar dos modos principales:

- **Ingesta histórica:** carga inicial de aproximadamente dos años de información.
- **Ingesta diaria:** proceso automático para mantener la tabla actualizada.

## Stack usado

El proyecto ya tiene instaladas las dependencias principales:

- **Fastify:** servidor HTTP.
- **pg:** conexión a PostgreSQL.
- **axios:** consumo de la API de Meta.
- **dotenv:** configuración por variables de entorno.
- **node-cron:** ejecución automática de tareas programadas.
- **@fastify/cors:** configuración de CORS si la API se consume desde otros servicios.

## Scripts disponibles

```bash
npm run dev
npm start
```

## Documentación del proyecto

- [`API_DESDE_CERO.md`](./API_DESDE_CERO.md): explicación conceptual para crear la API desde cero.
- [`INGESTA_META_ADS.md`](./INGESTA_META_ADS.md): flujo recomendado de ingesta histórica y diaria.
- [`esquemas_tablas.md`](./esquemas_tablas.md): esquema de datos, mapeo y consideraciones para PostgreSQL/Data Warehouse.

## Flujo general

```text
Meta Ads Marketing API
        ↓
Servicio de extracción
        ↓
Mapeo y normalización
        ↓
Validación de datos
        ↓
UPSERT en PostgreSQL/Data Warehouse
        ↓
Logs y respuesta de la API
```

## Endpoints recomendados

La API puede arrancar con endpoints simples:

- **GET `/health`:** validar que el servidor esté vivo.
- **POST `/ingest/meta/historical`:** ejecutar ingesta histórica por rango de fechas.
- **POST `/ingest/meta/daily`:** ejecutar ingesta diaria manualmente.
- **GET `/ingest/meta/status`:** consultar último estado de ejecución si se registra en base de datos.

## Variables de entorno recomendadas

```env
PORT=3000
DATABASE_URL=postgres://usuario:password@host:5432/base
META_ACCESS_TOKEN=token_de_meta
META_AD_ACCOUNT_ID=act_XXXXXXXXXXXX
META_API_VERSION=v21.0
META_INGEST_TIMEZONE=America/Argentina/Buenos_Aires
```

## Consideraciones importantes

- **Token de Meta:** aunque el token dure varios años, no debe hardcodearse en el código.
- **Idempotencia:** la ingesta diaria debe poder correrse más de una vez sin duplicar datos.
- **Rangos históricos:** para dos años de datos conviene partir la consulta en ventanas mensuales o semanales.
- **Resultados dinámicos:** el campo `Resultados` puede depender del objetivo de campaña y venir desde distintos `action_type`.
- **Presupuesto de conjunto de anuncios:** si la ingesta es por campaña, hay que definir cómo agregar presupuestos cuando una campaña tiene varios conjuntos de anuncios.
- **Trazabilidad:** conviene guardar fecha de ingesta, cuenta publicitaria, campaña ID y estado de ejecución aunque no estén en el esquema original.
