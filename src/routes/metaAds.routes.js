export default async function metaAdsRoutes(fastify) {

    // GET /reporte?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&campaignId=id1,id2
    // Lectura de dahastas normalizados para un rango puntual.
    // Es GET porque no crea ni modifica nada — solo consulta y devuelve.
    fastify.get('/', async (request, reply) => {
        const { desde, hasta, campaignId } = request.query

        if (!desde || !hasta) {
            return reply.code(400).send({ status: 'error', message: 'desde y hasta son requeridos' })
        }

        const ids = campaignId ? campaignId.split(',') : []

        // TODO: return await extraerReport(desde, hasta, ids)
        return { status: 'success', source: 'meta_ads', desde, hasta, campaignId: ids, rowsCount: 0, rows: [] }
    })

    // POST /reporte/extraer/historico
    // Dispara la extracción de un rango amplio dividido en ventanas mensuales.
    // Es POST porque lanza un proceso con efechastas (puede ser coshastaso y no idempotente).
    // Body: { desde: 'YYYY-MM-DD', hasta: 'YYYY-MM-DD', campaignId?: string[] }
    fastify.post('/extraer/historico', async (request, reply) => {
        const { desde, hasta, campaignId } = request.body ?? {}

        if (!desde || !hasta) {
            return reply.code(400).send({ status: 'error', message: 'desde y hasta son requeridos' })
        }

        // TODO: return await extraer/historico(desde, hasta, campaignId ?? [])
        return { status: 'success', source: 'meta_ads', type: 'historico', desde, hasta, campaignId: campaignId ?? [], rowsCount: 0, rows: [] }
    })

    // POST /reporte/extraer/diario
    // Dispara la extracción diaria con lookback configurable para cubrir atribución tardía.
    // Body: { date?: 'YYYY-MM-DD', lookbackDays?: number }
    fastify.post('/extraer/diario', async (request) => {
        const { date, lookbackDays = 7 } = request.body ?? {}

        // TODO: return await extraerDiario(date, lookbackDays)
        return {
            status: 'success',
            source: 'meta_ads',
            type: 'diario',
            date: date ?? new Date().toISOString().slice(0, 10),
            lookbackDays,
            rowsCount: 0,
            rows: []
        }
    })
}