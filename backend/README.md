# OptiRoute API

Backend independiente para validar decisiones de routing con un catálogo y costos exclusivamente de demostración. No llama APIs de proveedores ni procesa el contenido de archivos.

## Preparación

Desde la carpeta `backend`:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Copia `.env.example` como `.env` si necesitas cambiar el entorno. No guardes claves reales en el repositorio.

## Ejecución

```powershell
uvicorn app.main:app --reload --port 8000
```

La API estará disponible en `http://localhost:8000` y Swagger en `http://localhost:8000/docs`.

## Endpoints

- `GET /health`: estado y versión del servicio.
- `POST /route`: valida requisitos y devuelve una decisión de routing demo.

Ejemplo:

```json
{
  "agent": "global",
  "mode": "auto",
  "prompt": "Analiza este documento",
  "input_type": "document",
  "required_capabilities": ["text", "documents"],
  "preferred_model": null
}
```

En modo `manual`, `preferred_model` es obligatorio. En modo `auto` debe ser `null`. Una elección manual inexistente, fuera del proveedor activo o incompatible devuelve HTTP 400. Si no existe ningún modelo compatible, la API devuelve HTTP 422.
