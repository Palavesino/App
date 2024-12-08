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
app.use(express.json());
let contador = 1;

//-------------------------------------------------
let botQr = '';
const flowMenu = addKeyword(EVENTS.WELCOME)
  .addAnswer('ᴡ ᴇ ʟ ᴄ ᴏ ᴍ ᴇ  𝓣𝓸  𝓒𝓱𝓪𝓽𝓑𝓸𝓽 The New WORLD');

const main = async () => {
  const botName = `bot-${contador}`;
  botQr = `bot-${contador}.qr.png`;
  contador++;

  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowMenu]);
  const adapterProvider = createProvider(BaileysProvider, {
    name: botName,
  });

  return createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });
};

// Monitoreo del uso de memoria
// setInterval(() => {
//   const memoryUsage = process.memoryUsage();
//   console.log("Uso de memoria:");
//   console.log(`  RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`  Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`  Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
//   console.log(`  External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
// }, 10000); // Cada 10 segundos

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
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Inicia el intervalo
  const interval = setInterval(() => {
    const qrFileName = req.query.qrfile;
    const imagePath = path.join(__dirname, qrFileName);
    const fileExists = qrFileName === '' ? true : fs.existsSync(imagePath);

    // Enviar el estado del archivo
    res.write(`data: ${JSON.stringify({ fileExists: fileExists })}\n\n`);

    // Si el archivo no existe, detiene el intervalo
    if (!fileExists) {
      clearInterval(interval);
    }
  }, 5000);
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
  bot = null;

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
    // // Ruta al archivo .png en el directorio raíz
    // const filePath = path.join(__dirname, 'bot.qr.png');
    // // Verificar si el archivo existe
    // if (fs.existsSync(filePath)) {
    //   // Eliminar el archivo si existe
    //   fs.unlinkSync(filePath);
    //   console.log('Archivo image.png eliminado.');
    // }
    console.log("start bot");
    await main();

    res.status(200).json({
      message: 'Bot iniciado correctamente.',
      botQrName: botQr
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

app.get('/get-qr/:qrName', async (req, res) => {
  try {
    // Recupera el nombre del QR desde los parámetros de la URL
    const qrName = req.params.qrName;

    if (!qrName) {
      return res.status(400).json({ error: 'El nombre del QR es requerido.' });
    }

    console.log('Nombre del QR recibido:', qrName);

    // Ruta al archivo PNG generado
    const imagePath = path.join(__dirname, qrName);
    // Verifica si el archivo existe antes de procesarlo
    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('Archivo no encontrado:', imagePath);
        return res.status(404).json({ error: 'Archivo no encontrado.' });
      }

      // Si el archivo existe, conviértelo a base64
      const imageBase64 = convertToBase64(imagePath);

      // Responde con el QR en base64
      res.status(200).json({
        message: 'QR generado correctamente.',
        imageBase64: imageBase64,
      });
    });
  } catch (error) {
    console.error('Error al generar el QR:', error);
    res.status(500).json({ error: 'Ocurrió un error al generar el QR.' });
  }
});


// Arrancar el servidor de Express
app.listen(port, () => {
  console.log(`Servidor Express corriendo en http://localhost:${port}`);
});

