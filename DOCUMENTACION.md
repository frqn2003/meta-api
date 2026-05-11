# DOCUMENTACION DE LA API DE META ADS Y PLAN DE TAREAS

## Documentar preguntas abiertas: registrar dudas sobre moneda, zona horaria, resultados y presupuestos.

### Columna Resultados

El campo resultados cambia segun el objetivo de la campaña, puede tener valores como:

- Leads
- Formularios enviados
- Clics
- Tráfico
- Mensajes
- Clientes potenciales
- Conversiones
- Interacciones
- **Consultar con Rocio todas las posibles opciones para Indicador_de_resultado**

La tabla tiene dos dos campos para ellos, **Resultados** y **Indicador_de_resultado**. Por ejemplo podemos tener los siguientes casos:

- Resultados = 100
- Indicador_de_resultado = "Leads"

O tambien:

- Resultados = 9000
- Indicador_de_resultado = "clics"

### Recomendaciones

#### Campaña de Trafico

- **Capa media / superior del embudo**
- **KPI principal:** clics, CPC, CTR, sesiones

#### Campañas de clientes potenciales

- **Capa baja del embudo**
- **KPI principal:** leads, CPL, formularios enviados

#### Campañas de interacción

- **Capa superior / media**
- **KPI principal:** interacciones, alcance, frecuencia, costo por interacción

### Moneda de uso

Todos los valores traidos de la api de meta estaran en pesos argentinos (ARS).

### Zona horaria

Todos los valores traidos de la api de meta estaran en la zona horaria de argentina.

## Preparar ejemplos de campañas: preparar ejemplos reales de campaña.

**CONSULTAR CON ROCIO**

## Validar campos requeridos: comparar el esquema pedido contra el contrato de salida.

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

### Ejemplo de contrato de salida

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

### Campos adicionales recomendados en el contrato

Aunque algunos campos no estén en la tabla final, se recomienda que la API los devuelva para facilitar deduplicación, trazabilidad y carga por parte de Sistemas.

| Campo             | Tipo sugerido | Motivo                                      |
| ----------------- | ------------: | ------------------------------------------- |
| `meta_account_id` |      `string` | Identificar la cuenta publicitaria.         |
| `campaign_id`     |      `string` | Evitar depender solo del nombre de campaña. |
| `date_start`      |        `date` | Clave natural de período.                   |
| `date_stop`       |        `date` | Clave natural de período.                   |
| `source`          |      `string` | Identificar origen, por ejemplo `meta_ads`. |
| `extracted_at`    |   `timestamp` | Auditoría de extracción desde la API.       |

### Puntos a definir con Sistemas

- **Formato final:** confirmar si quieren JSON completo, paginado o por ventanas.
- **Campos adicionales:** confirmar si aceptan `campaign_id`, `meta_account_id`, `date_start`, `date_stop` y `extracted_at`.
- **Presupuesto con múltiples ad sets:** definir si se suma, se toma el mayor, se separa por ad set o se duplica por campaña.
- **Resultado principal:** definir prioridad de `action_type` por objetivo de campaña.
- **Moneda:** confirmar que la cuenta publicitaria está en ARS o si Sistemas hará conversión.
- **Zona horaria:** confirmar si las fechas deben entregarse en UTC o hora Argentina.
- **Granularidad:** confirmar si la API debe entregar una fila diaria por campaña o una fila por rango consultado.
- **Histórico:** confirmar si la extracción de dos años debe reconstruir datos día por día.
