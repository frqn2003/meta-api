import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import healthRoutes from './routes/health.routes.js'
import metaAdsRoutes from './routes/metaAds.routes.js'

const fastify = Fastify({ logger: true })

await fastify.register(cors, { origin: true })
await fastify.register(healthRoutes)
await fastify.register(metaAdsRoutes, { prefix: '/reporte' })

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000

    await fastify.listen({
      port,
      host: '0.0.0.0'
    })

    fastify.log.info(`Servidor corriendo en el puerto ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()