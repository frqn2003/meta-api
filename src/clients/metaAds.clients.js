// src/clients/metaAds.client.js

import axios from 'axios'
import config from '../config/env.js'

//  ① URL base construida con versión y cuenta desde env.js
const BASE_URL = `https://graph.facebook.com/${config.META_API_VERSION}/${config.META_AD_ACCOUNT_ID}/insights`

// ② Los campos que pedimos a Meta (los que necesita el mapper después)
const campos = [
    'campaign_id',
    'campaign_name',
    'impressions',
    'clicks',
    'spend',
    'reach',
    'actions',              // ← acá viene Resultados (array dinámico)
    'cost_per_action_type', // ← acá viene Costo por resultado
].join(',')

// ③ Función principal: extrae todas las filas de un rango, manejando paginación
export async function getInsights(desde, hasta) {
    try {
        const rows = []

        // Primera request
        let response = await axios.get(BASE_URL, {
            params: {
                access_token: config.META_ACCESS_TOKEN,
                time_range: JSON.stringify({ since: desde, until: hasta }),
                level: 'campaign',
                fields: campos,
                limit: config.META_REQUEST_LIMIT,
            }
        })

        // ④ Loop de paginación: mientras haya paging.next, seguimos pidiendo
        while (true) {
            rows.push(...response.data.data)       // acumular filas de esta página

            if (!response.data.paging?.next) break // si no hay más páginas, salir

            response = await axios.get(response.data.paging.next) // siguiente página
        }

        return rows  // array plano con TODAS las filas
    }
    catch (error) {
        console.error('Error al obtener insights de Meta Ads:', error.message)
        console.error('Error de código:', error.code)
        throw error
    }

}