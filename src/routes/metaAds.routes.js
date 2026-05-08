// ─────────────────────────────────────────────────────────────────────────────
// routes/metaAds.routes.js
//
// Define las rutas de extracción de Meta Ads.
// Se registra en app.js con fastify.register(metaAdsRoutes, { prefix: '/meta-ads' }).
//
// Responsabilidades de este archivo:
//   - Declarar los handlers HTTP para cada endpoint.
//   - Validar el body de la request (campos requeridos, tipos).
//   - Llamar a metaAds.service.js para ejecutar la lógica.
//   - Devolver la respuesta al cliente en el formato del contrato de salida.
//   - Manejar errores y devolver códigos HTTP apropiados (400, 500).
//
// Rutas de este archivo:
//
//   POST /meta-ads/report
//     Body: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', campaignIds?: string[] }
//     → Llama a service.extractReport() y devuelve filas normalizadas.
//
//   POST /meta-ads/historical
//     Body: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', campaignIds?: string[] }
//     → Llama a service.extractHistorical() para rangos amplios por ventanas.
//
//   POST /meta-ads/daily
//     Body: { date?: 'YYYY-MM-DD', lookbackDays?: number }
//     → Llama a service.extractDaily() para la extracción recurrente.
//
//   GET /meta-ads/status  (opcional)
//     → Devuelve el estado de la última ejecución si la API mantiene estado en memoria.
//
// Lo que NO debe hacer este archivo:
//   - Lógica de paginación ni ventanas de fechas (eso va en el servicio).
//   - Transformación de campos (eso va en el mapper).
//   - Llamadas directas a Meta Ads Graph API.
// ─────────────────────────────────────────────────────────────────────────────
