# 🤖 Gemini Proxy API

Un proxy serverless para la API de Google Gemini 3.0 Flash, diseñado para integrarse con bots de Discord a través de NotSoBot.

## ✨ Características

- **Modelo:** Gemini 3.0 Flash Preview (`gemini-3-flash-preview`)
- **Despliegue:** Vercel (Serverless Functions)
- **CORS habilitado:** Funciona desde cualquier origen
- **Métodos soportados:** GET y POST

## 🚀 API Endpoint

```
GET/POST https://tu-dominio.vercel.app/api?prompt=tu-pregunta
```

### Parámetros

| Parámetro | Tipo   | Descripción                     |
|-----------|--------|---------------------------------|
| `prompt`  | string | La pregunta o instrucción para la IA |

### Respuesta exitosa

```json
{
  "response": "La respuesta generada por Gemini..."
}
```

### Respuesta de error

```json
{
  "error": "Descripción del error",
  "detalle": "Información adicional"
}
```

## ⚙️ Configuración en Vercel

1. Importa este repositorio en [Vercel](https://vercel.com)
2. Configura la variable de entorno:
   - `GEMINI_API_KEY`: Tu clave de API de [Google AI Studio](https://aistudio.google.com/)
3. Despliega el proyecto

## 🎮 Uso en Discord (NotSoBot)

Crea el comando con el siguiente tag en tu servidor:

```
.tag create gemini {javascript:
const c=`{args:0}`.trim(),r=`{replycontent}`.trim();
if(!c&&!r){console.log("⚠️ Escribe una pregunta o responde a un mensaje.")}
else{fetch(`https://gemini-proxy-umber-two.vercel.app/api?prompt=${encodeURIComponent("responde de manera resumida: "+(r&&c?c+": "+r:r||c))}`)
.then(x=>x.json()).then(d=>console.log(d.response||d.error||"⚠️ Error en la respuesta."))
.catch(()=>console.log("❌ Error de conexión con el proxy."))}
}
```

### Ejemplos de uso:

| Comando | Descripción |
|---------|-------------|
| `.gemini ¿Cuál es la capital de Francia?` | Pregunta directa |
| `.gemini` (respondiendo a un mensaje) | Resume o responde sobre ese mensaje |
| `.gemini explica esto:` (respondiendo) | Explica el contenido del mensaje |

## 📁 Estructura del Proyecto

```
gemini-proxy/
├── api/
│   └── index.js      # Handler principal de la API
├── .env.example      # Ejemplo de variables de entorno
├── .gitignore
├── package.json
├── vercel.json       # Configuración de Vercel
└── README.md
```

## 📝 Licencia

MIT
