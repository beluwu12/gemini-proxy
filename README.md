# 🤖 Gemini Proxy API

Proxy serverless para **Gemini 3 Flash Preview** (`gemini-3-flash-preview`), optimizado para bots de Discord vía NotSoBot.

## ✨ Características

- **Modelo:** `gemini-3-flash-preview`
- **System Instructions:** Soporte opcional vía parámetro `system`
- **Mejores prácticas Gemini 3:** Prompts concisos, respuestas directas
- **CORS habilitado**

## 🚀 Endpoint

```
GET/POST https://tu-dominio.vercel.app/api?prompt=pregunta&system=instrucción
```

| Parámetro | Tipo   | Requerido | Descripción |
|-----------|--------|-----------|-------------|
| `prompt`  | string | ✅        | Tu pregunta |
| `system`  | string | ❌        | Instrucción de sistema opcional |

### Respuesta

```json
{ "response": "Respuesta de Gemini..." }
```

## ⚙️ Setup en Vercel

1. Importa el repo en [Vercel](https://vercel.com)
2. Agrega variable: `GEMINI_API_KEY` = tu clave de [AI Studio](https://aistudio.google.com/)
3. Deploy

## 🎮 Comando NotSoBot

```
.tag create gemini {javascript:
const c=`{args:0}`.trim(),r=`{replycontent}`.trim();
if(!c&&!r){console.log("⚠️ Escribe una pregunta.")}
else{fetch(`https://gemini-proxy-umber-two.vercel.app/api?prompt=${encodeURIComponent(r&&c?c+": "+r:r||c)}`)
.then(x=>x.json()).then(d=>console.log(d.response||d.error||"⚠️ Error."))
.catch(()=>console.log("❌ Error de conexión."))}
}
```

## 📁 Estructura

```
gemini-proxy/
├── api/index.js    # Handler principal
├── vercel.json     # Config Vercel
└── package.json
```

## � Mejores Prácticas Gemini 3

- **Instrucciones precisas:** Usa prompts directos y concisos
- **Menos verbosidad:** El modelo da respuestas directas por defecto
- **Contexto primero:** Coloca datos/contexto antes de la pregunta
