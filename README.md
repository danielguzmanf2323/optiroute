# OptiRoute

## Fuente de routing

El frontend usa el motor Demo de React por defecto, incluido cuando no existen variables de entorno. Para trabajar con FastAPI, crea un archivo `.env.local` en la raíz:

```dotenv
VITE_ROUTING_SOURCE=backend
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Reinicia Vite después de cambiar estas variables. Para volver al modo autónomo compatible con GitHub Pages, elimina `.env.local` o configura `VITE_ROUTING_SOURCE=demo`. Los archivos `*.local` están excluidos por `.gitignore`.

El backend de esta fase solo decide la ruta. Las respuestas del chat, los tokens y las métricas continúan identificados como simulaciones de demostración; no se invocan APIs reales de proveedores.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
