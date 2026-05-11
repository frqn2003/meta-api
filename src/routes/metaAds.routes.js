// ─────────────────────────────────────────────────────────────────────────────
// routes/metaAds.routes.js
//
// Rutas RESTful del recurso /insights.
// Registrado en server.js con prefix '/insights'.
//
//   GET  /insights              → Consulta puntual de datos por rango de fechas.
//   POST /insights/extract/historical → Dispara extracción histórica (rango amplio).
//   POST /insights/extract/daily      → Dispara extracción diaria con lookback.
//
// TODO: reemplazar los stubs por llamadas a metaAds.service.js.
// ─────────────────────────────────────────────────────────────────────────────

export default async function metaAdsRoutes(fastify) {

    // GET /insights?from=YYYY-MM-DD&to=YYYY-MM-DD&campaignIds=id1,id2
    // Lectura de datos normalizados para un rango puntual.
    // Es GET porque no crea ni modifica nada — solo consulta y devuelve.
    fastify.get('/', async (request, reply) => {
        const { from, to, campaignIds } = request.query

        if (!from || !to) {
            return reply.code(400).send({ status: 'error', message: 'from and to are required' })
        }

        const ids = campaignIds ? campaignIds.split(',') : []

        // TODO: return await extractReport(from, to, ids)
        return { status: 'success', source: 'meta_ads', from, to, campaignIds: ids, rowsCount: 0, rows: [] }
    })

    // POST /insights/extract/historical
    // Dispara la extracción de un rango amplio dividido en ventanas mensuales.
    // Es POST porque lanza un proceso con efectos (puede ser costoso y no idempotente).
    // Body: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', campaignIds?: string[] }
    fastify.post('/extract/historical', async (request, reply) => {
        const { from, to, campaignIds } = request.body ?? {}

        if (!from || !to) {
            return reply.code(400).send({ status: 'error', message: 'from and to are required' })
        }

        // TODO: return await extractHistorical(from, to, campaignIds ?? [])
        return { status: 'success', source: 'meta_ads', type: 'historical', from, to, campaignIds: campaignIds ?? [], rowsCount: 0, rows: [] }
    })

    // POST /insights/extract/daily
    // Dispara la extracción diaria con lookback configurable para cubrir atribución tardía.
    // Body: { date?: 'YYYY-MM-DD', lookbackDays?: number }
    fastify.post('/extract/daily', async (request) => {
        const { date, lookbackDays = 7 } = request.body ?? {}

        // TODO: return await extractDaily(date, lookbackDays)
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
}