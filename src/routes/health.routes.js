// ─────────────────────────────────────────────────────────────────────────────
// routes/health.routes.js
//
// Define las rutas de monitoreo y estado de la API.
// Se registra en app.js con fastify.register(healthRoutes, { prefix: '/' }).
//
// Rutas de este archivo:
//
//   GET /health
//     → Responde con { status: 'ok', service, timestamp }.
//     → No llama a ningún servicio ni a Meta Ads.
//     → Úsela para saber si la API está activa desde Sistemas o un monitor externo.
//
// Lo que NO debe hacer este archivo:
//   - Lógica de negocio.
//   - Llamadas a Meta Ads.
//   - Acceso a variables de entorno sensibles en la respuesta.
// ─────────────────────────────────────────────────────────────────────────────
