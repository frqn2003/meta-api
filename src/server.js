// ─────────────────────────────────────────────────────────────────────────────
// server.js
//
// Punto de entrada de la API. Este archivo es el único responsable de:
//   1. Cargar las variables de entorno desde .env (dotenv).
//   2. Crear la instancia de Fastify con logger habilitado.
//   3. Registrar plugins globales (CORS).
//   4. Declarar las rutas directamente (versión inicial).
//      → En una versión más avanzada, las rutas se moverán a src/routes/ y
//        se registrarán acá con fastify.register().
//   5. Arrancar el servidor en el puerto definido por PORT en .env.
//
// Lo que NO debe hacer este archivo:
//   - Lógica de negocio (eso va en src/services/).
//   - Llamadas a Meta Ads (eso va en src/clients/ o src/services/).
//   - Transformación de datos (eso va en src/mappers/).
//   - Conexión a base de datos (fuera del alcance de esta API).
// ─────────────────────────────────────────────────────────────────────────────

// Carga todas las variables definidas en .env como process.env.VARIABLE
import 'dotenv/config'

// Framework HTTP. Alternativa a Express, más rápido y con soporte nativo para async/await.
import Fastify from 'fastify'

// Plugin oficial de Fastify para habilitar CORS.
// Necesario si Sistemas u otros servicios consumen la API desde otro origen.
import cors from '@fastify/cors'

// Instancia principal de Fastify. logger:true activa logs automáticos por request.
const fastify = Fastify({
  logger: true
})

// Registra CORS con origin:true para aceptar cualquier origen.
// En producción se puede restringir a los dominios de Sistemas.
await fastify.register(cors, {
  origin: true
})

// ─── GET /health ─────────────────────────────────────────────────────────────
// Endpoint de control. Sirve para verificar que la API está activa.
// Sistemas o un monitor externo puede consultarlo periódicamente.
// No hace ninguna llamada a Meta Ads ni lógica interna.
fastify.get('/health', async () => {
  return {
    status: 'ok',
    service: 'metaads-api',
    timestamp: new Date().toISOString()
  }
})

// ─── POST /meta-ads/report ───────────────────────────────────────────────────
// Extrae y normaliza datos de Meta Ads para un rango de fechas específico.
// Body esperado: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', campaignIds?: [] }
// Devuelve el contrato JSON acordado con Sistemas.
// TODO: conectar con metaAds.service.js cuando esté implementado.
fastify.post('/meta-ads/report', async (request, reply) => {
  const { from, to, campaignIds } = request.body ?? {}

  // Validación básica: from y to son obligatorios para consultar Meta Ads.
  if (!from || !to) {
    return reply.code(400).send({
      status: 'error',
      message: 'from and to are required'
    })
  }

  // Respuesta stub. Cuando el servicio esté implementado, rows tendrá los datos reales.
  return {
    status: 'success',
    source: 'meta_ads',
    from,
    to,
    campaignIds: campaignIds ?? [],
    rowsCount: 0,
    rows: []
  }
})

// ─── POST /meta-ads/historical ───────────────────────────────────────────────
// Dispara la extracción histórica de Meta Ads para un rango amplio (ej: 2 años).
// Internamente dividirá el rango en ventanas mensuales para no saturar Meta.
// Body esperado: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', campaignIds?: [] }
// TODO: conectar con metaAds.service.js → extractHistorical().
fastify.post('/meta-ads/historical', async (request, reply) => {
  const { from, to, campaignIds } = request.body ?? {}

  if (!from || !to) {
    return reply.code(400).send({
      status: 'error',
      message: 'from and to are required'
    })
  }

  return {
    status: 'success',
    source: 'meta_ads',
    type: 'historical',
    from,
    to,
    campaignIds: campaignIds ?? [],
    rowsCount: 0,
    rows: []
  }
})

// ─── POST /meta-ads/daily ────────────────────────────────────────────────────
// Dispara la extracción diaria de Meta Ads.
// Por defecto consulta los últimos 7 días (lookbackDays) para cubrir atribución tardía.
// Body esperado: { date?: 'YYYY-MM-DD', lookbackDays?: number }
// Si no se envía date, toma el día actual.
// TODO: conectar con metaAds.service.js → extractDaily().
fastify.post('/meta-ads/daily', async (request) => {
  const { date, lookbackDays = 7 } = request.body ?? {}

  return {
    status: 'success',
    source: 'meta_ads',
    type: 'daily',
    date: date ?? new Date().toISOString().slice(0, 10),
    lookbackDays,
    rowsCount: 0,
    rows: []
  }
})

// ─── Arranque del servidor ────────────────────────────────────────────────────
// Lee el puerto desde .env (PORT). Si no está definido, usa 3000 como fallback.
// host '0.0.0.0' permite que el servidor sea accesible desde fuera del localhost,
// lo que es necesario en servidores o contenedores Docker.
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000

    await fastify.listen({
      port,
      host: '0.0.0.0'
    })

    fastify.log.info(`Server running on port ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()