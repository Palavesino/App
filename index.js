const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { createBot, createProvider, createFlow, EVENTS, addKeyword } = require('@bot-whatsapp/bot');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const optionMesage = require('./enum/optionEnum');
const typeMesage = require('./enum/TypeMessage');

const port = process.env.PORT || 3000;
const clave = process.env.SECRET_KEY || ''
const app = express();
app.use(cors());
app.use(express.json());
let contadorBot = 1;
let listMessages = []
//-------------------------------------------------
let botQr = '';
// Variables globales para manejar datos de flujo y control de navegación
let messageList = [];
let contador = 0;
let flowCounter = 0;


// Define un flujo de finalización que restablece contadores y datos de flujo
const flujoFin = addKeyword(EVENTS.ACTION)
  .addAction(async (_, { endFlow, state }) => {
    // Reinicia contadores y lista de mensajes
    contador = 0;
    flowCounter = 0;
    messageList = [];
    await state.update({ showMessage: false });
    return await endFlow();
  });

// Define un subflujo que maneja mensajes y navegación entre flujos
const subFlujos = addKeyword(EVENTS.ACTION)
  .addAction(async (_, { flowDynamic, state, gotoFlow }) => {
    // Obtiene el mensaje actual del estado
    let message = state.get('message');
    if (message !== null) {
      // Personaliza el mensaje si contiene una referencia al nombre del usuario
      let body = message.typeMessage === typeMesage.SHOWNAME
        ?
        message.body.replace(/\b(name|nombre)\b/gi, state.get('name'))

        : message.body;
      await flowDynamic(body);
      if (message.option !== optionMesage.READ) {
        // Configura si se debe mostrar el mensaje adicional de navegación
        const showMessage = message.option !== optionMesage.CAPTURE
          ? state.get('showMessage')
          : false;
        const subFlowsMessage = showMessage
          ? (contador === 0 ? `0) Volver al Menú` : `0) Volver al Anterior`)
          : null;

        if (subFlowsMessage) {
          await flowDynamic(subFlowsMessage);
        }

        return;
      }
    }
    // Verifica si es el último flujo y redirige al flujo de finalización si es necesario
    if (flowCounter === (listMessages.length - 1)) {
      return gotoFlow(flujoFin);
    } else {
      flowCounter++;
    }
    return await gotoFlow(flowWelcome);
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, fallBack, gotoFlow, state }) => {
    // Captura la entrada del usuario y actualiza el estado según la respuesta
    let message = state.get('message');
    // Salida si el usuario dice "chau" o "adios"
    if (ctx.body.toString().toLowerCase() === 'chau' || ctx.body.toString().toLowerCase() === 'adios') {
      await flowDynamic("¡Gracias por comunicarte con @DanielBot!, ¡Que tengas un excelente día! 🌟")
      return gotoFlow(flujoFin);
    }
    // Verifica si el mensaje actual requiere capturar un nombre
    //typeMessage
    if (message.typeMessage !== null) {
      if (message.typeMessage === typeMesage.NAME) {
        await state.update({
          name: ctx.body.toString()
        });
      } else if (message.typeMessage === typeMesage.NUMBER) {
        // Verifica si el usuario ingresó un número válido
        if (isNaN(ctx.body.trim())) {
          return await fallBack('Por favor, selecciona una opción válida.');
        }
      }
    }
    // Captura la selección del usuario y navega al subflujo correspondiente
    if (
      message.option !== optionMesage.MENU ||
      (!message.childMessages || message.childMessages.length === 0) && parseInt(ctx.body.trim()) !== 0
    ) {
      // Resetea la navegación si la opción no tiene submensajes
      await state.update({ message: null, showMessage: false });
      messageList = [];
      contador = 0;
      return await gotoFlow(subFlujos);
    }
    // Verifica el índice de selección del usuario y navega al subflujo correspondiente
    const index = parseInt(ctx.body.trim()) - 1;
    if (!isNaN(index) && index >= 0 && index < message.childMessages.length) {
      messageList[contador] = message;
      contador++;
      await state.update({
        message: message.childMessages[index],
        showMessage: true
      });
      await gotoFlow(subFlujos);
    } else if (index === -1 && contador !== 0) {
      // Navega al mensaje anterior si es la opción seleccionada
      const previousMessage = messageList[(contador - 1)];
      await state.update({ message: previousMessage })
      contador--;
      if (contador === 0) {
        await state.update({ showMessage: false })
      }
      await gotoFlow(subFlujos);
    } else {
      // Si la selección no es válida, muestra un mensaje de error
      return await fallBack('Por favor, selecciona una opción válida.');
    }

  });
;

// Define el flujo de bienvenida que inicia el proceso de flujos
const flowWelcome = addKeyword(EVENTS.WELCOME)
  .addAction(async (_, { gotoFlow, state }) => {
    // Actualiza el estado con el primer mensaje del flujo actual
    await state.update({
      message: listMessages.length !== 0
        ? listMessages[flowCounter]
        : null
    });
    return await gotoFlow(subFlujos);
  });
// ----------------------------------------------------------------
const main = async () => {
  const botName = `bot-${contadorBot}`;
  botQr = `bot-${contadorBot}.qr.png`;
  contadorBot++;
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([subFlujos, flowWelcome, flujoFin]);
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
        <title>NodeJs y Express en RENDER</title>
      </head>
      <body>
        <h1>Soy un proyecto Back end en RENDER</h1>
      </body>
    </html>
  `;
  res.send(htmlResponse);
});
app.get('/events', (req, res) => {
  const { key, qrfile } = req.query; // Extraemos la clave y el nombre del archivo de los parámetros

  // Validar la clave
  if (key !== clave) {
    return res.status(401).json({ error: 'Clave inválida o no proporcionada.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Inicia el intervalo
  const interval = setInterval(() => {
    const imagePath = path.join(__dirname, qrfile);
    const fileExists = qrfile === '' ? true : fs.existsSync(imagePath);

    // Enviar el estado del archivo
    res.write(`data: ${JSON.stringify({ fileExists: fileExists })}\n\n`);

    // Si el archivo no existe, detiene el intervalo
    if (!fileExists) {
      clearInterval(interval);
    }
  }, 5000);
});

app.post('/start-bot', async (req, res) => {
  try {
    const { key, messages } = req.body;

    // Verificar si la clave es válida
    if (!key || key !== clave) {
      return res.status(401).json({ error: 'Clave inválida o ausente.' });
    }

    // Verificar que messages sea un array
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'El campo "messages" debe ser una lista.' });
    }

    // Asignar los mensajes a la lista
    listMessages = messages;

    console.log("Start bot con mensajes:", listMessages);
    await main();

    res.status(200).json({
      message: 'Bot iniciado correctamente.',
      botQrName: botQr
    });
  } catch (error) {
    console.error(error);
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




app.get('/get-qr/:qrName', async (req, res) => {
  try {
    // Recuperar la clave desde la cabecera
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== clave) {
      return res.status(401).json({ error: 'Clave inválida o ausente.' });
    }

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

