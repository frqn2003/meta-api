# Plan de tareas para construir la API Meta Ads

Este documento organiza las tareas necesarias para construir la API intermediaria de Meta Ads con Node.js y Fastify, dividiendo el trabajo para un equipo de 2 personas.

## Objetivo general

Construir una API que permita:

- Consumir datos desde Meta Ads Marketing API.
- Extraer información histórica de dos años.
- Ejecutar una extracción diaria automática o manual.
- Transformar los datos al contrato de salida acordado con Sistemas.
- Devolver JSON normalizado listo para que Sistemas cargue el Data Warehouse.
- Mantener trazabilidad de ejecuciones, errores y datos devueltos.

## Roles del equipo

## Persona A: perfil técnico avanzado

Responsable de las tareas de mayor complejidad.

Debe encargarse principalmente de:

- Arquitectura general.
- Integración con Meta Ads.
- Diseño de extracción histórica y diaria.
- Manejo de paginación, errores y reintentos.
- Diseño del contrato de salida para Sistemas.
- Validaciones técnicas contra Meta Ads y el JSON normalizado.
- Automatización con cron.

## Persona B: perfil técnico inicial/intermedio

Responsable de tareas más guiadas y de soporte.

Debe encargarse principalmente de:

- Documentación técnica y funcional.
- Configuración inicial.
- Endpoints simples.
- Validaciones básicas.
- Mappers simples.
- Pruebas manuales.
- Comparación de resultados contra exportaciones de Meta.
- Registro de casos borde y errores encontrados.

## Fase 1: entendimiento y definición

### Objetivo

Alinear qué datos se van a traer, cómo se van a entregar a Sistemas y qué reglas de negocio se van a aplicar.

### Tareas Persona A

- **Validar permisos de Meta Ads:** confirmar que el token tenga acceso a la cuenta publicitaria y permisos como `ads_read`.
- **Definir endpoints de Meta necesarios:** confirmar uso de Insights, Campaigns y Ad Sets.
- **Definir granularidad:** decidir si la API devolverá una fila diaria por campaña o una fila por rango.
- **Definir campos para deduplicación:** devolver datos suficientes para que Sistemas resuelva idempotencia.
- **Definir estrategia de histórico:** decidir ventanas mensuales, semanales o diarias.

### Tareas Persona B

- **Relevar esquema esperado:** documentar columnas y tipos que Sistemas espera recibir.
- **Validar campos requeridos:** comparar el esquema pedido contra el contrato de salida.
- **Documentar preguntas abiertas:** registrar dudas sobre moneda, zona horaria, resultados y presupuestos.
- **Preparar ejemplos de campañas:** identificar campañas reales para pruebas.
- **Crear checklist funcional:** armar una lista para validar resultados contra Meta Ads Manager.

### Entregables

- **Definición de campos:** esquema confirmado.
- **Definición de flujo:** histórico y diario documentados.
- **Listado de dudas resueltas o pendientes.**

## Fase 2: configuración base del proyecto

### Objetivo

Dejar lista la base mínima de la API.

### Tareas Persona A

- **Crear configuración centralizada:** lectura de variables de entorno.
- **Definir manejo global de errores:** respuestas consistentes en Fastify.
- **Definir estructura lógica del código:** rutas, servicios, cliente Meta, mappers y jobs.

### Tareas Persona B

- **Crear archivo `.env.example`:** documentar variables necesarias sin credenciales reales.
- **Crear endpoint `/health`:** endpoint simple para validar que la API está viva.
- **Actualizar README si hace falta:** documentar cómo correr el proyecto localmente.
- **Probar scripts:** validar `npm run dev` y `npm start`.

### Entregables

- **API levantando localmente.**
- **Endpoint `/health` funcionando.**
- **Variables de entorno documentadas.**

## Fase 3: cliente Meta Ads

### Objetivo

Crear una capa reutilizable para consumir Meta Ads Marketing API.

### Tareas Persona A

- **Implementar cliente Meta Ads:** crear funciones para llamar a Graph API con `axios`.
- **Implementar Insights por campaña:** consultar `/{ad_account_id}/insights` con `level=campaign`.
- **Implementar paginación:** recorrer `paging.next` hasta completar resultados.
- **Implementar manejo de errores Meta:** diferenciar token inválido, permisos, rate limit y errores temporales.
- **Implementar retries básicos:** reintentar errores transitorios con espera.

### Tareas Persona B

- **Documentar campos usados de Meta:** listar cada campo solicitado y su destino en el contrato de salida.
- **Probar una consulta chica:** ejecutar consulta para un día y una campaña.
- **Guardar ejemplo de respuesta:** crear un ejemplo sanitizado para usar como referencia.
- **Comparar contra Ads Manager:** validar que impresiones, clicks y gasto coincidan.

### Entregables

- **Cliente Meta funcional.**
- **Consulta de Insights validada.**
- **Paginación soportada.**
- **Errores principales identificados.**

## Fase 4: mapper y normalización

### Objetivo

Transformar los datos recibidos desde Meta al formato acordado con Sistemas.

### Tareas Persona A

- **Diseñar mapper principal:** transformar respuesta de Insights al contrato de salida.
- **Resolver campo `Resultados`:** implementar regla de prioridad por `action_type`.
- **Resolver `Coste_por_resultado`:** mapear desde `cost_per_action_type` según el resultado elegido.
- **Definir comportamiento ante datos faltantes:** nulos, ceros o valores por defecto.
- **Validar tipos numéricos:** evitar errores por strings, decimales o valores vacíos.

### Tareas Persona B

- **Mapear campos directos:** `reach`, `impressions`, `clicks`, `spend`, `ctr`, `cpc`, `cpm`, `frequency`.
- **Crear tabla de equivalencias:** documentar campo origen Meta y campo destino.
- **Probar casos simples:** campañas con clicks, gasto e impresiones.
- **Registrar casos raros:** campañas sin resultados, sin gasto o sin acciones.

### Entregables

- **Mapper funcional.**
- **Regla inicial de resultados definida.**
- **Campos numéricos normalizados.**
- **Casos borde documentados.**

## Fase 5: contrato de salida para Sistemas

### Objetivo

Definir y validar el JSON que Sistemas va a consumir para cargar el Data Warehouse.

### Tareas Persona A

- **Definir contrato JSON:** estructura de respuesta, metadatos y array de filas.
- **Definir campos técnicos devueltos:** `campaign_id`, `meta_account_id`, `date_start`, `date_stop`, `source` y `extracted_at`.
- **Definir estrategia para rangos grandes:** respuesta completa, paginada o por ventanas.
- **Definir formato de errores:** errores globales y errores parciales por ventana.
- **Validar contrato con Sistemas:** confirmar que pueden consumir la respuesta.

### Tareas Persona B

- **Crear ejemplos de respuesta:** casos exitosos, sin datos y con error.
- **Validar tipos del JSON:** números, fechas, strings y nulos.
- **Documentar equivalencias:** campo Meta, campo del contrato y observaciones.
- **Validar con muestras:** comparar valores devueltos contra Meta Ads Manager.

### Entregables

- **Contrato de salida documentado.**
- **Ejemplos JSON disponibles.**
- **Campos técnicos para Sistemas definidos.**
- **Formato de errores acordado.**

## Fase 6: endpoints de extracción manual

### Objetivo

Permitir ejecutar extracciones desde HTTP para pruebas y operación manual.

### Tareas Persona A

- **Crear endpoint de reporte:** `POST /meta-ads/report`.
- **Crear endpoint histórico:** `POST /meta-ads/historical`.
- **Crear endpoint diario:** `POST /meta-ads/daily`.
- **Validar rangos de fechas:** evitar rangos inválidos o demasiado grandes.
- **Devolver resumen de ejecución:** filas leídas, filas devueltas, ventanas procesadas y errores.
- **Evitar ejecuciones simultáneas peligrosas:** prevenir dos extracciones del mismo tipo al mismo tiempo.

### Tareas Persona B

- **Crear colección de pruebas:** documentar ejemplos de requests.
- **Probar endpoint diario:** validar con rango corto.
- **Probar endpoint histórico acotado:** validar un mes antes de ejecutar dos años.
- **Documentar respuestas esperadas:** casos exitosos y casos con error.

### Entregables

- **Endpoint diario funcional.**
- **Endpoint histórico funcional.**
- **Endpoint de reporte funcional.**
- **Requests de prueba documentados.**
- **Resumen de ejecución claro.**

## Fase 7: extracción histórica de dos años

### Objetivo

Ejecutar la extracción inicial completa sin saturar Meta ni devolver respuestas inmanejables.

### Tareas Persona A

- **Implementar partición de rango:** dividir dos años en ventanas mensuales o semanales.
- **Implementar reanudación:** poder repetir solo una ventana fallida.
- **Controlar rate limits:** agregar pausas o retries si Meta limita la API.
- **Registrar progreso:** informar qué ventanas se procesaron correctamente.
- **Ejecutar histórico completo:** correr la extracción total una vez validado el flujo.

### Tareas Persona B

- **Monitorear ejecución:** registrar tiempos, ventanas procesadas y errores.
- **Validar muestras:** comparar campañas seleccionadas contra Meta Ads Manager.
- **Revisar consistencia:** controlar conteos por campaña y fecha en el JSON devuelto.
- **Documentar incidencias:** anotar campañas o fechas con diferencias.

### Entregables

- **Histórico de dos años extraído.**
- **Reporte de extracción histórica.**
- **Diferencias detectadas y documentadas.**
- **Ventanas fallidas reprocesadas.**

## Fase 8: extracción diaria automática

### Objetivo

Automatizar la obtención diaria de datos para que Sistemas pueda mantener actualizado el Data Warehouse.

### Tareas Persona A

- **Crear job con `node-cron`:** ejecutar diariamente en horario definido.
- **Reprocesar últimos días:** consultar últimos 3 a 7 días para cubrir atribución tardía.
- **Integrar logging:** registrar inicio, fin y errores del job.
- **Manejar fallos:** evitar que un error detenga definitivamente el proceso.
- **Definir configuración por env:** horario y ventana de reproceso configurables.

### Tareas Persona B

- **Documentar horario de ejecución:** indicar zona horaria y frecuencia.
- **Probar ejecución manual:** simular el job sin esperar al cron real.
- **Validar respuesta diaria:** verificar que el JSON devuelva el rango esperado.
- **Crear checklist operativo:** qué revisar cada mañana o ante fallas.

### Entregables

- **Cron diario funcionando.**
- **Reproceso de últimos días implementado.**
- **Checklist operativo documentado.**
- **Logs de ejecución disponibles.**

## Fase 9: validación final y puesta en producción

### Objetivo

Dejar la API lista para uso estable.

### Tareas Persona A

- **Revisar seguridad:** confirmar que no haya tokens hardcodeados.
- **Revisar performance:** validar tiempos de carga y uso de memoria.
- **Revisar manejo de errores:** asegurar respuestas claras y logs útiles.
- **Preparar despliegue:** definir cómo se ejecutará la API en servidor.
- **Definir monitoreo:** logs, alertas o resumen de ejecución.

### Tareas Persona B

- **Actualizar documentación:** README, endpoints, variables y operación diaria.
- **Preparar guía de uso:** cómo correr histórico, diario y healthcheck.
- **Validar datos finales:** comparar muestras contra Meta Ads Manager.
- **Armar listado de pendientes:** mejoras futuras y limitaciones conocidas.

### Entregables

- **API lista para producción.**
- **Documentación operativa completa.**
- **Validación funcional realizada.**
- **Pendientes registrados.**

## Distribución resumida por dificultad

| Área | Persona A - dificultad alta | Persona B - dificultad menor |
|---|---|---|
| Arquitectura | Diseño de capas y flujo | Documentar decisiones |
| Meta Ads | Cliente, paginación, errores, retries | Pruebas simples y comparación manual |
| Datos | Contrato de salida, paginación y metadatos técnicos | Validación de JSON y conteos |
| Mapper | Resultados dinámicos y costos | Campos directos y casos simples |
| Histórico | Ventanas, reanudación y rate limits | Monitoreo y reporte de ejecución |
| Diario | Cron, reproceso y resiliencia | Checklist y validación manual |
| Producción | Seguridad, performance y despliegue | Documentación y guía de uso |

## Orden recomendado de trabajo

1. Definir reglas de negocio y contrato de salida.
2. Levantar API base con `/health`.
3. Probar token y consulta Meta Ads.
4. Crear mapper.
5. Definir respuesta JSON con Sistemas.
6. Crear endpoint de reporte.
7. Crear endpoint de extracción diaria manual.
8. Crear endpoint de extracción histórica manual.
9. Ejecutar histórico por ventanas.
10. Automatizar diaria con cron si corresponde.
11. Validar, documentar y preparar producción.

## Riesgos a controlar

- **Token inválido o sin permisos:** puede bloquear toda la extracción.
- **Rate limits de Meta:** pueden interrumpir histórico si se consulta demasiado rápido.
- **Duplicados:** Sistemas debe resolverlos, pero la API debe devolver campos estables para deduplicar.
- **Campo `Resultados`:** cambia según objetivo de campaña.
- **Presupuesto por ad set:** puede ser ambiguo si hay varios ad sets por campaña.
- **Métricas tardías:** Meta puede actualizar datos días después.
- **Diferencias con Ads Manager:** pueden aparecer por atribución, zona horaria o configuración de columnas.

## Criterio de finalización

La API puede considerarse terminada cuando:

- El histórico de dos años se extrae correctamente.
- La extracción diaria corre automáticamente o queda disponible por endpoint.
- El contrato de salida permite que Sistemas resuelva idempotencia y carga final.
- Los datos principales coinciden con Meta Ads Manager en muestras representativas.
- Los errores quedan registrados.
- La documentación explica cómo operar y mantener el proceso.
