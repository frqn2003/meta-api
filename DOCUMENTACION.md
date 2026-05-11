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
