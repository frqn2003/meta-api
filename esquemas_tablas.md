# Esquema Meta Ads

Este documento describe la tabla objetivo existente en el Data Warehouse y las consideraciones para mapear datos desde Meta Ads Marketing API.

## Tabla objetivo

La tabla ya existe en PostgreSQL/Data Warehouse y debe recibir datos de campañas de Meta Ads.

| Campo | Tipo | Descripción |
|---|---:|---|
| `Inicio_del_informe` | `TIMESTAMP` | Fecha/hora inicial del período informado. |
| `Fin_del_informe` | `TIMESTAMP` | Fecha/hora final del período informado. |
| `Nombre_de_la_campaña` | `nvarchar(100)` | Nombre de la campaña. |
| `Entrega_de_la_campaña` | `nvarchar(100)` | Estado o entrega de la campaña. |
| `Presupuesto_del_conjunto_de_anuncios` | `bigint` | Presupuesto configurado a nivel conjunto de anuncios. |
| `Tipo_de_presupuesto_del_conjunto_de_anuncios` | `nvarchar(100)` | Tipo de presupuesto, por ejemplo diario o total. |
| `Configuración_de_atribución` | `nvarchar(100)` | Ventana/configuración de atribución. |
| `Resultados` | `bigint` | Cantidad de resultados según objetivo de campaña. |
| `Indicador_de_resultado` | `nvarchar(100)` | Tipo de resultado: leads, formularios enviados, tráfico, clientes potenciales u otros. |
| `Alcance` | `bigint` | Personas alcanzadas. |
| `Impresiones` | `bigint` | Cantidad de impresiones. |
| `Clics` | `int` | Cantidad de clics. |
| `Interacion_con_la_pagina` | `int` | Interacciones con la página. |
| `Frecuencia` | `int` | Frecuencia. Meta suele devolver este valor como decimal, por lo que se recomienda validar si debe ser `float`. |
| `CTR_Todos` | `float` | CTR de todos los clics. |
| `Coste_por_resultado` | `float` | Costo por resultado. |
| `Importe_gastado_ARS` | `float` | Importe gastado en pesos argentinos. |
| `Inicio` | `TIMESTAMP` | Inicio de campaña o período operativo. |
| `Fin` | `TIMESTAMP` | Fin de campaña o período operativo. |
| `CPC_todos` | `float` | Costo por clic. |
| `CPM` | `int` | Costo por mil impresiones. Meta suele devolver este valor como decimal, por lo que se recomienda validar si debe ser `float`. |

## Campos técnicos recomendados

Si se puede modificar o complementar la tabla, se recomienda agregar campos técnicos para trazabilidad e idempotencia:

| Campo | Tipo sugerido | Motivo |
|---|---:|---|
| `meta_account_id` | `varchar(50)` | Identificar la cuenta publicitaria. |
| `campaign_id` | `varchar(50)` | Evitar depender solo del nombre de campaña. |
| `date_start` | `date` | Clave natural de período. |
| `date_stop` | `date` | Clave natural de período. |
| `ingested_at` | `timestamp` | Auditoría de carga. |
| `source_hash` | `varchar(64)` | Detectar cambios y evitar duplicados. |

Si la tabla no se puede modificar, estos datos pueden guardarse en una tabla auxiliar de control de ingestas.

## Clave de idempotencia recomendada

Para evitar duplicados, la ingesta debería hacer `UPSERT` usando una clave lógica.

Recomendación ideal:

```text
meta_account_id + campaign_id + Inicio_del_informe + Fin_del_informe + Indicador_de_resultado
```

Si no existe `campaign_id`, se puede usar:

```text
Nombre_de_la_campaña + Inicio_del_informe + Fin_del_informe + Indicador_de_resultado
```

La segunda opción es menos segura porque el nombre de campaña puede cambiar.

## Mapeo aproximado desde Meta Ads

| Tabla objetivo | Fuente Meta Ads probable | Observación |
|---|---|---|
| `Inicio_del_informe` | `date_start` | Viene desde Insights. |
| `Fin_del_informe` | `date_stop` | Viene desde Insights. |
| `Nombre_de_la_campaña` | `campaign_name` | Viene desde Insights. |
| `Entrega_de_la_campaña` | `effective_status` o estado de campaña | Puede requerir consultar Campaigns además de Insights. |
| `Presupuesto_del_conjunto_de_anuncios` | `daily_budget` o `lifetime_budget` de Ad Sets | Puede requerir consultar Ad Sets. |
| `Tipo_de_presupuesto_del_conjunto_de_anuncios` | derivado de `daily_budget`/`lifetime_budget` | No siempre viene como campo directo. |
| `Configuración_de_atribución` | `attribution_setting` o configuración de cuenta/campaña | Validar disponibilidad según versión de API. |
| `Resultados` | `actions` | Depende del objetivo. |
| `Indicador_de_resultado` | `action_type` seleccionado | Puede variar por campaña. |
| `Alcance` | `reach` | Viene desde Insights. |
| `Impresiones` | `impressions` | Viene desde Insights. |
| `Clics` | `clicks` | Viene desde Insights. |
| `Interacion_con_la_pagina` | `actions` con action types de engagement | Requiere regla de mapeo. |
| `Frecuencia` | `frequency` | Meta devuelve decimal. |
| `CTR_Todos` | `ctr` | Viene desde Insights. |
| `Coste_por_resultado` | `cost_per_action_type` | Depende del `action_type`. |
| `Importe_gastado_ARS` | `spend` | Validar moneda configurada en la cuenta. |
| `Inicio` | `campaign.start_time` o `date_start` | Definir si representa campaña o informe. |
| `Fin` | `campaign.stop_time` o `date_stop` | Definir si representa campaña o informe. |
| `CPC_todos` | `cpc` | Viene desde Insights. |
| `CPM` | `cpm` | Meta devuelve decimal. |

## Puntos a definir antes de cerrar el modelo

- **Presupuesto con múltiples ad sets:** definir si se suma, se toma el mayor, se separa por ad set o se duplica por campaña.
- **Resultado principal:** definir prioridad de `action_type` por objetivo de campaña.
- **Moneda:** confirmar que la cuenta publicitaria está en ARS o convertir valores.
- **Zona horaria:** confirmar si las fechas deben guardar hora local Argentina o UTC.
- **Granularidad:** confirmar si la tabla guarda una fila diaria por campaña o una fila por rango consultado.
- **Histórico:** confirmar si la ingesta de dos años debe reconstruir datos día por día.
