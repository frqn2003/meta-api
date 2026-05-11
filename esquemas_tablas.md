# Esquema y contrato de salida Meta Ads

Este documento describe el esquema esperado por Sistemas/Data Warehouse y el contrato de salida que debe entregar la API intermediaria.

La API no inserta datos en la tabla destino. Solo devuelve datos normalizados para que Sistemas realice la carga final.

### Esquema objetivo del Data Warehouse

La tabla existe del lado de Sistemas/Data Warehouse. La API debe entregar campos compatibles con ese esquema.

| Campo                                          |      Tipo esperado | Descripción                                                                                                                                      |
| ---------------------------------------------- | -----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Inicio_del_informe`                           |        `TIMESTAMP` | Fecha/hora inicial del período informado.                                                                                                        |
| `Fin_del_informe`                              |        `TIMESTAMP` | Fecha/hora final del período informado.                                                                                                          |
| `Nombre_de_la_campaña`                         |     `varchar(100)` | Nombre de la campaña.                                                                                                                            |
| `Entrega_de_la_campaña`                        |     `varchar(100)` | Estado o entrega de la campaña.                                                                                                                  |
| `Presupuesto_del_conjunto_de_anuncios`         |           `bigint` | Presupuesto configurado a nivel conjunto de anuncios.                                                                                            |
| `Tipo_de_presupuesto_del_conjunto_de_anuncios` |     `varchar(100)` | Tipo de presupuesto, por ejemplo diario o total.                                                                                                 |
| `Configuración_de_atribución`                  |     `varchar(100)` | Ventana/configuración de atribución.                                                                                                             |
| `Resultados`                                   |           `bigint` | Cantidad de resultados según objetivo de campaña.                                                                                                |
| `Indicador_de_resultado`                       |     `varchar(100)` | Tipo de resultado: leads, formularios enviados, tráfico, clientes potenciales u otros.                                                           |
| `Alcance`                                      |           `bigint` | Personas alcanzadas.                                                                                                                             |
| `Impresiones`                                  |           `bigint` | Cantidad de impresiones.                                                                                                                         |
| `Clics`                                        |          `integer` | Cantidad de clics.                                                                                                                               |
| `Interacion_con_la_pagina`                     |          `integer` | Interacciones con la página.                                                                                                                     |
| `Frecuencia`                                   |   `numeric (10,2)` | Frecuencia. Meta suele devolver este valor como decimal, por lo que se recomienda validar si Sistemas lo espera entero o decimal.                |
| `CTR_Todos`                                    | `double precision` | CTR de todos los clics.                                                                                                                          |
| `Coste_por_resultado`                          |   `numeric (12,2)` | Costo por resultado.                                                                                                                             |
| `Importe_gastado_ARS`                          |   `numeric (12,2)` | Importe gastado en pesos argentinos.                                                                                                             |
| `Inicio`                                       |        `TIMESTAMP` | Inicio de campaña o período operativo.                                                                                                           |
| `Fin`                                          |        `TIMESTAMP` | Fin de campaña o período operativo.                                                                                                              |
| `CPC_todos`                                    |   `numeric (12,2)` | Costo por clic.                                                                                                                                  |
| `CPM`                                          |   `numeric (12,2)` | Costo por mil impresiones. Meta suele devolver este valor como decimal, por lo que se recomienda validar si Sistemas lo espera entero o decimal. |

## Campos adicionales recomendados en el contrato

Aunque algunos campos no estén en la tabla final, se recomienda que la API los devuelva para facilitar deduplicación, trazabilidad y carga por parte de Sistemas.

| Campo             | Tipo sugerido | Motivo                                      |
| ----------------- | ------------: | ------------------------------------------- |
| `meta_account_id` |      `string` | Identificar la cuenta publicitaria.         |
| `campaign_id`     |      `string` | Evitar depender solo del nombre de campaña. |
| `date_start`      |        `date` | Clave natural de período.                   |
| `date_stop`       |        `date` | Clave natural de período.                   |
| `source`          |      `string` | Identificar origen, por ejemplo `meta_ads`. |
| `extracted_at`    |   `timestamp` | Auditoría de extracción desde la API.       |

Sistemas decide si usa estos campos, los guarda en tabla auxiliar o los descarta antes de cargar el Data Warehouse.

## Clave sugerida para Sistemas

La idempotencia final no corresponde a la API, pero la API debería devolver datos suficientes para que Sistemas pueda deduplicar.

Clave lógica recomendada:

```text
meta_account_id + campaign_id + Inicio_del_informe + Fin_del_informe + Indicador_de_resultado
```

Si no existe `campaign_id`, se puede usar:

```text
Nombre_de_la_campaña + Inicio_del_informe + Fin_del_informe + Indicador_de_resultado
```

La segunda opción es menos segura porque el nombre de campaña puede cambiar.

## Mapeo aproximado desde Meta Ads

| Contrato de salida                             | Fuente Meta Ads probable                                | Observación                                                 |
| ---------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| `Inicio_del_informe`                           | `date_start`                                            | Viene desde Insights.                                       |
| `Fin_del_informe`                              | `date_stop`                                             | Viene desde Insights.                                       |
| `Nombre_de_la_campaña`                         | `campaign_name`                                         | Viene desde Insights.                                       |
| `Entrega_de_la_campaña`                        | `effective_status` o estado de campaña                  | Puede requerir consultar Campaigns además de Insights.      |
| `Presupuesto_del_conjunto_de_anuncios`         | `daily_budget` o `lifetime_budget` de Ad Sets           | Puede requerir consultar Ad Sets.                           |
| `Tipo_de_presupuesto_del_conjunto_de_anuncios` | derivado de `daily_budget`/`lifetime_budget`            | No siempre viene como campo directo.                        |
| `Configuración_de_atribución`                  | `attribution_setting` o configuración de cuenta/campaña | Validar disponibilidad según versión de API.                |
| `Resultados`                                   | `actions`                                               | Depende del objetivo.                                       |
| `Indicador_de_resultado`                       | `action_type` seleccionado                              | Puede variar por campaña.                                   |
| `Alcance`                                      | `reach`                                                 | Viene desde Insights.                                       |
| `Impresiones`                                  | `impressions`                                           | Viene desde Insights.                                       |
| `Clics`                                        | `clicks`                                                | Viene desde Insights.                                       |
| `Interacion_con_la_pagina`                     | `actions` con action types de engagement                | Requiere regla de mapeo.                                    |
| `Frecuencia`                                   | `frequency`                                             | Meta devuelve decimal.                                      |
| `CTR_Todos`                                    | `ctr`                                                   | Viene desde Insights.                                       |
| `Coste_por_resultado`                          | `cost_per_action_type`                                  | Depende del `action_type`.                                  |
| `Importe_gastado_ARS`                          | `spend`                                                 | Validar moneda configurada en la cuenta.                    |
| `Inicio`                                       | `campaign.start_time` o `date_start`                    | Definir si representa campaña o informe.                    |
| `Fin`                                          | `campaign.stop_time` o `date_stop`                      | Definir si representa campaña o informe.                    |
| `CPC_todos`                                    | `cpc`                                                   | Viene desde Insights.                                       |
| `CPM`                                          | `cpm`                                                   | Meta devuelve decimal.                                      |
| `campaign_id`                                  | `campaign_id`                                           | Recomendado para Sistemas aunque no esté en tabla original. |
| `meta_account_id`                              | configuración de cuenta                                 | Recomendado para trazabilidad.                              |
| `extracted_at`                                 | generado por la API                                     | Fecha/hora en que la API generó el dato.                    |

## Ejemplo de contrato de salida

```json
{
  "status": "success",
  "source": "meta_ads",
  "from": "2024-01-01",
  "to": "2024-01-31",
  "rowsCount": 1,
  "rows": [
    {
      "meta_account_id": "act_123456789",
      "campaign_id": "987654321",
      "date_start": "2024-01-01",
      "date_stop": "2024-01-01",
      "Inicio_del_informe": "2024-01-01T00:00:00.000Z",
      "Fin_del_informe": "2024-01-01T23:59:59.000Z",
      "Nombre_de_la_campaña": "Campaña ejemplo",
      "Entrega_de_la_campaña": "ACTIVE",
      "Presupuesto_del_conjunto_de_anuncios": 100000,
      "Tipo_de_presupuesto_del_conjunto_de_anuncios": "daily_budget",
      "Configuración_de_atribución": "default",
      "Resultados": 10,
      "Indicador_de_resultado": "leads",
      "Alcance": 1000,
      "Impresiones": 2500,
      "Clics": 120,
      "Interacion_con_la_pagina": 0,
      "Frecuencia": 2,
      "CTR_Todos": 4.8,
      "Coste_por_resultado": 3500.05,
      "Importe_gastado_ARS": 35000.5,
      "Inicio": "2024-01-01T00:00:00.000Z",
      "Fin": "2024-01-31T23:59:59.000Z",
      "CPC_todos": 291.67,
      "CPM": 14000,
      "extracted_at": "2026-05-08T14:00:00.000Z"
    }
  ]
}
```

## Puntos a definir con Sistemas

- **Formato final:** confirmar si quieren JSON completo, paginado o por ventanas.
- **Campos adicionales:** confirmar si aceptan `campaign_id`, `meta_account_id`, `date_start`, `date_stop` y `extracted_at`.
- **Presupuesto con múltiples ad sets:** definir si se suma, se toma el mayor, se separa por ad set o se duplica por campaña.
- **Resultado principal:** definir prioridad de `action_type` por objetivo de campaña.
- **Moneda:** confirmar que la cuenta publicitaria está en ARS o si Sistemas hará conversión.
- **Zona horaria:** confirmar si las fechas deben entregarse en UTC o hora Argentina.
- **Granularidad:** confirmar si la API debe entregar una fila diaria por campaña o una fila por rango consultado.
- **Histórico:** confirmar si la extracción de dos años debe reconstruir datos día por día.
