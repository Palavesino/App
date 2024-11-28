const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { createBot, createProvider, createFlow, EVENTS, addKeyword } = require('@bot-whatsapp/bot');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

const port = process.env.PORT || 3000;
const app = express();
app.use(cors());

app.use((req, res, next) => {
  res.cookie('__vercel_live_token', 'your-token-value', {
    sameSite: 'None',  // Para cookies en contextos cross-origin
    secure: true,      // Asegura que la cookie solo se envíe a través de HTTPS
    httpOnly: true,    // Hace que la cookie no sea accesible via JavaScript
  });
  next();
});

let chatbot
const flowMenu = addKeyword(EVENTS.WELCOME)
  .addAnswer('ᴡ ᴇ ʟ ᴄ ᴏ ᴍ ᴇ  𝓣𝓸  𝓒𝓱𝓪𝓽𝓑𝓸𝓽 The New WORLD');

const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowMenu]);
  const adapterProvider = createProvider(BaileysProvider);

  chatbot = createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });
};

app.get("/", (req, res) => {
  const htmlResponse = `
    <html>
      <head>
        <title>NodeJs y Express en Vercel</title>
      </head>
      <body>
        <h1>Soy un proyecto Back end en vercel</h1>
      </body>
    </html>
  `;
  res.send(htmlResponse);
});

app.get("/endBot", (req, res) => {
  const htmlResponse = `
    <html>
      <head>
        <title>CHATBOT END</title>
      </head>
      <body>
        <h1>CHATBOT END</h1>
      </body>
    </html>
  `;
  chatbot = null;

  res.send(htmlResponse);
});
app.get("/test", (req, res) => {
  const htmlResponse = `
    <html>
      <head>
        <title>TEST PATH</title>
      </head>
      <body>
        <h1>DALE BOT DALE</h1>
      </body>
    </html>
  `;
  res.send(htmlResponse);
});

app.get('/start-bot', async (req, res) => {
  try {
    console.log("start bot");
    await main();

    res.status(200).json({
      message: 'Bot iniciado correctamente.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al iniciar el bot.' });
  }
});

// Función para convertir un archivo en base64
const convertToBase64 = (filePath) => {
    try {
        const file = fs.readFileSync(filePath);  // Lee el archivo de forma síncrona
        return file.toString('base64');  // Convierte a Base64
    } catch (error) {
        console.error("Error al leer el archivo:", error);
        throw error;
    }
};


// app.get('/get-qr', async (req, res) => {
//   try {
//     console.log("Generando qr");
//     const imagePath = path.join(process.cwd(), 'bot.qr.png');
//     const image = fs.createReadStream(imagePath);
//     res.setHeader('Content-Type', 'image/png');
//     res.setHeader('Content-Disposition', 'attachment; filename="bot.qr.png"');
//     image.pipe(res);
//   } catch (error) {
//     res.status(500).json({ error: 'Ocurrió un error al iniciar el bot.' });
//   }
// });

app.get('/get-qr', async (req, res) => {
  try {
    console.log("Generando qr");
    // Ruta al archivo PNG generado
    const imagePath = path.join(process.cwd(), 'bot.qr.png');

    // Convierte la imagen a base64
    const imageBase64 = convertToBase64(imagePath);

    // Devuelve la imagen en base64 y un mensaje
    res.status(200).json({
        message: 'qr generado correctamente.',
        imageBase64: imageBase64,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ocurrió un error al iniciar el bot.' });
  }
});
// Arrancar el servidor de Express
app.listen(port, () => {
  console.log(`Servidor Express corriendo en http://localhost:${port}`);
});

