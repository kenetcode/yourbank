# Webhook de ingesta de productos — YourBank

Este endpoint permite insertar productos financieros directamente en Postgres desde un flujo externo (n8n + Firecrawl), sin pasar por el pipeline interno de scraping del backend.

## Endpoint

```
POST /api/v1/admin/ingest/webhook
```

- **Base URL local:** `http://localhost:8000`
- **Auth:** header `X-Ingest-Api-Key` (API key compartida, NO es JWT de usuario)
- **Content-Type:** `application/json`

### Headers requeridos

| Header | Valor |
|---|---|
| `Content-Type` | `application/json` |
| `X-Ingest-Api-Key` | La key secreta configurada en `INGEST_WEBHOOK_API_KEY` (pídesela a quien administra el backend) |

### Códigos de respuesta

| Código | Significa |
|---|---|
| `200` | Insertado o actualizado correctamente |
| `401` | Falta el header o la key es incorrecta |
| `422` | El JSON no cumple el formato requerido (revisa el detalle del error, dice qué campo falló) |
| `503` | El servidor no tiene la key configurada (avisar al admin del backend) |

## Formato del body (JSON)

```json
{
  "bank_slug": "banco-cuscatlan",
  "source_url": "https://www.bancocuscatlan.com/tarjetaya",
  "product": {
    "nombre_producto": "Tarjeta YA MultiPuntos Plus",
    "banco": "Banco Cuscatlán",
    "tipo_producto": "credit_card",
    "anualidad": 0,
    "tasa_interes": 39.9,
    "requisitos": [
      "DUI vigente",
      "Ingresos desde $400"
    ],
    "beneficios": [
      "Sin membresía",
      "2 MultiPuntos por cada $1"
    ],
    "promociones": [
      {
        "comercio": "Cinemark",
        "descuento_pct": 50,
        "tipo_tarjeta": "credit_card",
        "vigencia": "2026-12-31",
        "descripcion": "Descuento en entradas"
      }
    ]
  },
  "raw": {
    "cualquier": "cosa opcional, se guarda tal cual como referencia"
  }
}
```

### Campos de nivel raíz

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `bank_slug` | string | Sí | Debe ser un slug ya configurado en `banks.yaml` del backend (hoy: `banco-cuscatlan`, `banco-agricola`). Pregunta al admin si necesitas un banco nuevo. |
| `source_url` | string | Sí | URL exacta de la página que se scrapeó. Se usa para identificar el producto — si vuelves a enviar la misma URL, se **actualiza** el producto en vez de duplicarlo. |
| `product` | object | Sí | Los datos del producto, ver tabla siguiente. |
| `raw` | object | No | El JSON crudo completo de Firecrawl, si quieres guardarlo como respaldo. No se usa para nada más. |

### Campos de `product`

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `nombre_producto` | string | Sí | Nombre comercial del producto |
| `banco` | string | Sí | Nombre del banco (texto libre, ej. "Banco Cuscatlán") |
| `tipo_producto` | string | Sí | Uno de: `credit_card`, `debit_card`, `loan`, `savings`, `insurance` |
| `anualidad` | number \| null | No | Costo anual en USD. `0` si es gratis, `null` si no aplica (ej. préstamos) |
| `tasa_interes` | number \| null | No | Tasa de interés anual en % |
| `requisitos` | array de strings | No | Default: `[]` |
| `beneficios` | array de strings | No | Default: `[]` |
| `promociones` | array de objetos | No | Default: `[]`. Cada promoción: `comercio`, `descuento_pct`, `tipo_tarjeta`, `vigencia`, `descripcion` (todos opcionales) |

**Importante:** `tipo_producto` solo acepta esos 5 valores exactos (en minúscula, con guion bajo). Cualquier otro valor da error 422.

## Cómo lo consume el equipo (esto ya funciona, verificado)

- El producto queda visible en `GET /api/v1/products/`
- Lo usa automáticamente el asesor IA en `/api/v1/advisor/match` y `/api/v1/advisor/chat`
- No hay pasos manuales adicionales — insertar vía este webhook es equivalente a que el producto ya esté "publicado"

## Configuración del flujo en n8n

### 1. Nodo HTTP Request

| Campo | Valor |
|---|---|
| Method | `POST` |
| URL | `http://<host-del-backend>:8000/api/v1/admin/ingest/webhook` |
| Authentication | Ninguna nativa de n8n; se usa un header manual (ver abajo) |
| Body Content Type | JSON |
| Body | El JSON con la forma de arriba (`bank_slug`, `source_url`, `product`, `raw`) |

### 2. Header de autenticación

Opción recomendada: crear una **credencial de tipo "Header Auth"** en n8n:
- Name: `X-Ingest-Api-Key`
- Value: la key secreta (pídela al admin del backend, no la subas a ningún repo)

Asigna esa credencial al nodo HTTP Request. Alternativa más simple (menos segura): agregar el header manualmente en la pestaña "Headers" del nodo.

### 3. Transformar el JSON de Firecrawl al formato del webhook

El JSON que devuelve el agente de Firecrawl trae los datos del producto **dentro de `data`**, junto con `success`, `id`, `status`. Hay que envolverlo antes de mandarlo. Agrega un nodo **Code** (o **Set**) entre Firecrawl y el HTTP Request:

```javascript
// Nodo Code en n8n, lenguaje JavaScript
return [{
  json: {
    bank_slug: "banco-cuscatlan",              // ajústalo según el banco que estás procesando
    source_url: $json.metadata?.sourceURL 
      ?? $('NodoQueTeníaLaURL').item.json.url,  // la URL original scrapeada
    product: $json.data,                        // aquí viven los campos del producto
    raw: $json                                  // opcional, el archivo completo
  }
}];
```

**Nota clave:** el JSON crudo de Firecrawl normalmente NO trae la URL de origen dentro de `data`. Tienes que pasarla desde el nodo anterior del flujo (el que decidió qué URL scrapear) usando una expresión de n8n, por ejemplo `{{ $('Nombre del nodo anterior').item.json.url }}`.

### 4. Probar el flujo antes de automatizarlo

Ejecuta el nodo HTTP Request manualmente en n8n con un item de prueba y confirma:
- Respuesta `200` con `"action": "created"` (primera vez) o `"action": "updated"` (si repites la misma URL)
- El producto aparece en `GET http://<host-del-backend>:8000/api/v1/products/`

### 5. Ejemplo equivalente en curl (para probar fuera de n8n)

```bash
curl -i -X POST http://localhost:8000/api/v1/admin/ingest/webhook \
  -H 'Content-Type: application/json' \
  -H 'X-Ingest-Api-Key: TU_KEY_AQUI' \
  -d '{
    "bank_slug": "banco-cuscatlan",
    "source_url": "https://www.bancocuscatlan.com/tarjetaya",
    "product": {
      "nombre_producto": "Tarjeta YA MultiPuntos Plus",
      "banco": "Banco Cuscatlán",
      "tipo_producto": "credit_card",
      "anualidad": 0,
      "tasa_interes": 39.9,
      "requisitos": ["DUI vigente", "Ingresos desde $400"],
      "beneficios": ["Sin membresía", "2 MultiPuntos por cada $1"],
      "promociones": [
        {"comercio": "Cinemark", "descuento_pct": 50, "tipo_tarjeta": "credit_card", "vigencia": "2026-12-31", "descripcion": "Descuento en entradas"}
      ]
    }
  }'
```

## Idempotencia

Reenviar el mismo `source_url` para el mismo `bank_slug` **no crea duplicados** — actualiza el producto existente (`"action": "updated"`). Esto es seguro para correr el flujo de n8n en un cron periódico.

## Preguntas frecuentes

**¿Qué pasa si el `bank_slug` no existe?**
Se crea automáticamente un banco nuevo usando el campo `banco` de `product` como nombre y el dominio extraído de `source_url`. Aun así, es mejor confirmar el slug correcto con el admin del backend para mantener consistencia con `banks.yaml`.

**¿Puedo mandar varios productos en un solo POST?**
No, el endpoint procesa un producto por request. Si tienes varios, haz un loop en n8n (nodo "Split In Batches" o iterar sobre un array) y un POST por cada uno.

**¿Dónde se guarda el `raw`?**
Si lo envías, se guarda como archivo JSON local en el servidor del backend (para referencia/depuración). No afecta lo que ve el asesor ni el listado de productos.
