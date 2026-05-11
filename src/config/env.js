// ─────────────────────────────────────────────────────────────────────────────
// config/env.js
//
// Módulo centralizado de configuración. Lee y valida las variables de entorno
// una sola vez y las exporta como un objeto tipado para que el resto del código
// las consuma sin llamar a process.env directamente.
//
// Responsabilidades de este archivo:
//   - Leer process.env luego de que dotenv haya cargado el .env.
//   - Validar que las variables obligatorias estén presentes.
//   - Lanzar un error claro si falta alguna variable crítica (fail fast).
//   - Exportar un objeto de configuración limpio y centralizado.
//
// Variables esperadas en .env (en la raíz del proyecto, no dentro de src/):
//
//   PORT                     → Puerto del servidor. Default: 3000.
//   META_ACCESS_TOKEN        → Token de acceso a Meta Ads Marketing API. Obligatorio.
//   META_AD_ACCOUNT_ID       → ID de la cuenta publicitaria (act_XXXXX). Obligatorio.
//   META_API_VERSION         → Versión de la Graph API (ej: v21.0). Obligatorio.
//   META_INGEST_TIMEZONE     → Zona horaria para fechas (ej: America/Argentina/Buenos_Aires).
//   META_DAILY_CRON          → Expresión cron para la tarea diaria (ej: 0 6 * * *).
//   META_REQUEST_LIMIT       → Límite de resultados por página en Meta Ads. Default: 500.
//
// Ejemplo de uso:
//
//   import config from '../config/env.js'
//   const token = config.META_ACCESS_TOKEN
//
// Lo que NO debe hacer este archivo:
//   - Lógica de negocio.
//   - Llamadas a Meta Ads.
//   - Importar otros módulos del proyecto.
// ─────────────────────────────────────────────────────────────────────────────

function readEnv() {
    const config = {
        PORT: process.env.PORT || 3000,
        META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
        META_AD_ACCOUNT_ID: process.env.META_AD_ACCOUNT_ID,
        META_API_VERSION: process.env.META_API_VERSION,
        META_INGEST_TIMEZONE: process.env.META_INGEST_TIMEZONE || 'America/Argentina/Buenos_Aires',
        META_DAILY_CRON: process.env.META_DAILY_CRON || '0 6 * * *',
        META_REQUEST_LIMIT: process.env.META_REQUEST_LIMIT || 500
    }
    
    // Validar variables obligatorias
    const required = ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID', 'META_API_VERSION']
    const missing = required.filter(key => !config[key])
    
    if (missing.length > 0) {
        throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`)
    }
    
    return config
}

export default readEnv()