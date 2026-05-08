// ─────────────────────────────────────────────────────────────────────────────
// mappers/metaAds.mapper.js
//
// Capa de transformación. Convierte una fila cruda de la respuesta de Meta Ads
// al formato del contrato de salida acordado con Sistemas.
//
// Responsabilidades de este archivo:
//   - Recibir un objeto raw de Meta Ads Insights (tal como viene de la API).
//   - Mapear cada campo al nombre y tipo esperado por el contrato de salida.
//   - Convertir strings numéricos a números (Meta devuelve todo como string).
//   - Resolver el campo dinámico Resultados: recorrer el array actions[] y
//     aplicar la regla de prioridad por action_type para elegir el resultado principal.
//   - Resolver Coste_por_resultado desde cost_per_action_type[] usando el mismo action_type.
//   - Agregar campos técnicos: meta_account_id, campaign_id, date_start, date_stop,
//     source, extracted_at.
//   - Devolver null o un objeto con valores por defecto si la fila está incompleta.
//
// Función esperada (a implementar):
//
//   mapInsightRow(rawRow, metaAccountId)
//     → Recibe una fila cruda de Insights y devuelve el objeto del contrato de salida.
//
// Regla de prioridad para Resultados (action_type):
//   1. lead
//   2. leadgen_grouped
//   3. onsite_conversion.lead_grouped
//   4. offsite_conversion.fb_pixel_lead
//   5. link_click
//   6. landing_page_view
//
// Lo que NO debe hacer este archivo:
//   - Llamar a Meta Ads API.
//   - Manejar paginación ni reintentos.
//   - Tomar decisiones de negocio sobre rangos o ventanas.
// ─────────────────────────────────────────────────────────────────────────────
