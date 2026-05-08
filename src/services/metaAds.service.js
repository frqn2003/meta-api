// ─────────────────────────────────────────────────────────────────────────────
// services/metaAds.service.js
//
// Capa de servicio. Contiene la lógica de negocio principal de la API.
// Es el orquestador entre las rutas (routes/) y el cliente de Meta Ads (clients/).
//
// Responsabilidades de este archivo:
//   - Recibir los parámetros validados desde las rutas.
//   - Calcular ventanas de fechas para la extracción histórica (ej: dividir 2 años en meses).
//   - Llamar al cliente de Meta Ads (metaAds.client.js) para obtener datos crudos.
//   - Manejar la paginación: seguir paging.next hasta agotar resultados.
//   - Implementar reintentos ante errores transitorios (rate limit, timeout).
//   - Llamar al mapper (metaAds.mapper.js) para normalizar cada fila.
//   - Acumular y devolver el resultado final al handler de la ruta.
//   - Registrar logs de inicio, fin, filas leídas y errores por ventana.
//
// Funciones esperadas (a implementar):
//
//   extractReport(from, to, campaignIds)
//     → Extrae datos para un rango puntual. Llama a Meta Ads y normaliza.
//
//   extractHistorical(from, to, campaignIds)
//     → Divide el rango en ventanas mensuales y llama a extractReport por cada una.
//
//   extractDaily(date, lookbackDays)
//     → Calcula el rango desde (date - lookbackDays) hasta date y llama a extractReport.
//
// Lo que NO debe hacer este archivo:
//   - Construir respuestas HTTP (eso lo hace la ruta con reply).
//   - Conectarse directamente a Meta Ads Graph API (eso lo hace metaAds.client.js).
//   - Transformar campos uno a uno (eso lo hace metaAds.mapper.js).
// ─────────────────────────────────────────────────────────────────────────────
