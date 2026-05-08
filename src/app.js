// ─────────────────────────────────────────────────────────────────────────────
// app.js
//
// Archivo opcional de configuración de la instancia Fastify separada del arranque.
// Si el proyecto crece, conviene separar la creación y configuración de Fastify
// (app.js) del arranque del servidor (server.js).
//
// Responsabilidades de este archivo:
//   - Crear y exportar la instancia de Fastify.
//   - Registrar plugins globales: CORS, autenticación, rate limiting, etc.
//   - Registrar todos los grupos de rutas con fastify.register().
//   - NO arrancar el servidor (eso lo hace server.js con fastify.listen()).
//
// Ejemplo de uso:
//
//   import buildApp from './app.js'
//   const fastify = await buildApp()
//   await fastify.listen({ port: 3000, host: '0.0.0.0' })
//
// Ventaja: permite importar la instancia en tests sin arrancar el servidor real.
// ─────────────────────────────────────────────────────────────────────────────
