# utils/

Carpeta de utilidades reutilizables. Contiene funciones puras sin dependencias de negocio.

## Archivos sugeridos

### `dateWindows.js`
Genera un array de ventanas de fechas a partir de un rango amplio.
- `generateMonthlyWindows(from, to)` → `[{ from, to }, ...]`
- `generateWeeklyWindows(from, to)` → `[{ from, to }, ...]`
- Usado por `metaAds.service.js` para dividir el histórico de 2 años.

### `retry.js`
Implementa lógica de reintento con espera exponencial.
- `withRetry(fn, maxRetries, delayMs)` → ejecuta `fn`, si falla espera y reintenta.
- Usado por el cliente de Meta Ads ante rate limits o timeouts temporales.

### `logger.js` *(opcional)*
Wrapper sobre el logger de Fastify o pino para agregar contexto estático
(nombre del job, cuenta publicitaria, versión).
