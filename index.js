// index.js - Versión con código de emparejamiento (más confiable)
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  fetchLatestBaileysVersion,
  makeInMemoryStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// Importar configuración y utilidades
const config = require('./config');
const logger = require('./utils/logger');
const helpers = require('./utils/helpers');

// TU NÚMERO DE WHATSAPP (sin el +)
const PHONE_NUMBER = '51980856444';

// Cargar todos los comandos dinámicamente
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.set(command.name, command);
  logger.info(`Comando cargado: ${command.name}`);
}

// Función principal para iniciar el bot
async function startBot() {
  // Configurar autenticación multi-archivo
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  
  // Obtener la versión más reciente de Baileys
  const { version } = await fetchLatestBaileysVersion();

  // Crear instancia del socket
  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    mobile: false,
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      keys: state.keys,
    },
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: false
  });

  // Guardar credenciales cuando cambien
  sock.ev.on('creds.update', saveCreds);

  // Variable para controlar si ya se pidió el código
  let pairingCodeRequested = false;

  // Manejar actualizaciones de conexión
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Si hay QR disponible, solicitar código de emparejamiento en su lugar
    if (qr && !pairingCodeRequested) {
      pairingCodeRequested = true;
      
      console.log('\n\n');
      logger.info('═══════════════════════════════════════════════════════════');
      logger.info('        🔥 GENERANDO CÓDIGO DE EMPAREJAMIENTO 🔥');
      logger.info('═══════════════════════════════════════════════════════════');
      console.log('\n');
      
      try {
        // Solicitar código de emparejamiento
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        
        console.log('\n');
        logger.success('═══════════════════════════════════════════════════════════');
        logger.success(`        🔢 CÓDIGO: ${code}`);
        logger.success('═══════════════════════════════════════════════════════════');
        console.log('\n');
        
        logger.info('📱 PASOS PARA VINCULAR EN WHATSAPP:');
        console.log('\n');
        logger.info(`1. Abre WhatsApp en tu celular (${PHONE_NUMBER})`);
        logger.info('2. Toca Menú (⋮) → Dispositivos vinculados');
        logger.info('3. Toca "Vincular con número de teléfono"');
        logger.info(`4. Ingresa este código: ${code}`);
        console.log('\n');
        logger.info('⏰ El código expira en 1 minuto');
        logger.info('💡 Si expira, reinicia el servicio en Railway');
        console.log('\n');
        logger.info('═══════════════════════════════════════════════════════════');
        console.log('\n\n');
        
      } catch (error) {
        logger.error('Error solicitando código de emparejamiento:', error.message);
      }
    }

    // Manejar estados de conexión
    if (connection === 'close') {
      const shouldReconnect = 
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      const errorMessage = lastDisconnect?.error?.message || 'Desconocido';
      logger.warn(`Conexión cerrada. Razón: ${errorMessage}`);
      
      if (shouldReconnect) {
        logger.info('Reconectando en 5 segundos...');
        pairingCodeRequested = false; // Resetear para pedir nuevo código
        setTimeout(() => startBot(), 5000);
      } else {
        logger.error('Sesión cerrada permanentemente.');
        logger.error('Elimina la carpeta auth_info_baileys y reinicia.');
      }
    } else if (connection === 'connecting') {
      logger.info('Conectando a WhatsApp...');
    } else if (connection === 'open') {
      console.log('\n\n');
      logger.success('═══════════════════════════════════════════════════════════');
      logger.success('   ✓✓✓ BOT CONECTADO EXITOSAMENTE ✓✓✓');
      logger.success('═══════════════════════════════════════════════════════════');
      console.log('\n');
      logger.info(`🤖 Bot: ${config.botName}`);
      logger.info(`👤 Número: ${PHONE_NUMBER}`);
      logger.info(`⚡ Prefijo: ${config.prefix}`);
      logger.info(`📦 Comandos: ${commands.size}`);
      console.log('\n');
      logger.success('🚀 El bot está listo para recibir mensajes!');
      logger.info('💬 Prueba enviando: !menu a cualquier chat');
      console.log('\n');
      logger.success('═══════════════════════════════════════════════════════════');
      console.log('\n\n');
    }
  });

  // Manejar mensajes entrantes
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    
    if (m.key.fromMe) return;
    if (!m.message) return;

    try {
      const isGroup = helpers.isGroup(m);
      const senderName = helpers.getSenderName(m);
      const chatId = m.key.remoteJid;

      logger.message(senderName, isGroup);

      let text = '';
      
      if (m.message.conversation) {
        text = m.message.conversation;
      } else if (m.message.extendedTextMessage) {
        text = m.message.extendedTextMessage.text;
      } else if (m.message.imageMessage && m.message.imageMessage.caption) {
        text = m.message.imageMessage.caption;
      } else if (m.message.videoMessage && m.message.videoMessage.caption) {
        text = m.message.videoMessage.caption;
      }

      const lowerText = text.toLowerCase().trim();

      // Respuestas automáticas
      for (const [trigger, response] of Object.entries(config.autoResponses)) {
        if (lowerText.includes(trigger)) {
          await sock.sendMessage(chatId, { text: response });
          return;
        }
      }

      // Procesar comandos
      if (text.startsWith(config.prefix)) {
        const parsed = helpers.parseCommand(text, config.prefix);
        
        if (!parsed) return;

        const { command, args } = parsed;

        logger.command(`${config.prefix}${command}`, senderName);

        if (commands.has(command)) {
          try {
            await commands.get(command).execute(sock, m, args);
          } catch (error) {
            logger.error(`Error ejecutando comando ${command}:`, error.message);
            
            await sock.sendMessage(chatId, { 
              text: '❌ Hubo un error al ejecutar este comando. Intenta de nuevo más tarde.' 
            });
          }
        } else {
          await sock.sendMessage(chatId, { 
            text: `❌ Comando *${config.prefix}${command}* no encontrado.\n\nEscribe *${config.prefix}menu* para ver los comandos disponibles.` 
          });
        }
      }
      
    } catch (error) {
      logger.error('Error procesando mensaje:', error.message);
    }
  });

  return sock;
}

// Manejo de errores
process.on('uncaughtException', (err) => {
  logger.error('Error no capturado:', err.message);
});

process.on('unhandledRejection', (err) => {
  logger.error('Promesa rechazada:', err.message);
});

// Iniciar el bot
console.clear();
console.log('\n\n');
logger.info('═══════════════════════════════════════════════════════════');
logger.info(`  ${config.botName}`);
logger.info('  Bot de WhatsApp con Baileys');
logger.info(`  Número: ${PHONE_NUMBER}`);
logger.info('═══════════════════════════════════════════════════════════');
console.log('\n');

startBot().catch((err) => {
  logger.error('Error fatal al iniciar el bot:', err.message);
  process.exit(1);
});
