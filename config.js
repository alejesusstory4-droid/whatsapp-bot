// config.js - Configuración del bot
module.exports = {
  // Prefijo de comandos
  prefix: '!',
  
  // Nombre del bot
  botName: '🤖 Bot Premium',
  
  // Propietario del bot (tu número de WhatsApp)
  owner: '51980856444@s.whatsapp.net',
  ownerNumber: '51980856444',
  
  // ========================================
  // 🎵 YOUTUBE API CONFIGURATION
  // ========================================
  // Consigue tu API key en: https://console.cloud.google.com/apis/credentials
  // 1. Crea un proyecto
  // 2. Habilita "YouTube Data API v3"
  // 3. Crea credenciales (API Key)
  // 4. Copia la key y pégala abajo (o en variable de entorno YOUTUBE_API_KEY)
  youtubeApiKey: process.env.YOUTUBE_API_KEY || 'TU_API_KEY_AQUI',
  
  // Límite de descargas de música por día (plan gratuito: 100/mes)
  musicDownloadLimit: 100,
  
  // ========================================
  // 📱 MENU SYSTEM
  // ========================================
  menuPages: 14, // Total de páginas del menú
  commandsPerPage: 15, // Comandos promedio por página
  
  // ========================================
  // 👑 VIP SYSTEM
  // ========================================
  vipUsers: [], // Números de usuarios VIP (se carga desde database)
  vipFeatures: ['musicDownload', 'advancedCommands', 'noLimits'],
  
  // Mensajes automáticos
  autoResponses: {
    'hola bot': '¡Hola! 👋 Escribe !menu para ver mis comandos',
    'buenos dias': '¡Buenos días! ☀️ ¿En qué puedo ayudarte?',
    'buenas tardes': '¡Buenas tardes! 🌅',
    'buenas noches': '¡Buenas noches! 🌙'
  },
  
  // APIs
  apis: {
    meme: 'https://meme-api.com/gimme',
    tts: 'https://api.streamelements.com/kappa/v2/speech',
    youtube: 'https://www.googleapis.com/youtube/v3',
    cobalt: 'https://api.cobalt.tools/api/json'
  },
  
  // Listas para comandos aleatorios
  frases: [
    'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
    'No cuentes los días, haz que los días cuenten.',
    'La vida es 10% lo que te pasa y 90% cómo reaccionas a ello.',
    'El único modo de hacer un gran trabajo es amar lo que haces.',
    'Si puedes soñarlo, puedes hacerlo.',
    'La mejor forma de predecir el futuro es crearlo.',
    'No esperes oportunidades, créalas.',
    'El fracaso es solo la oportunidad de comenzar de nuevo de forma más inteligente.'
  ],
  
  verdades: [
    '¿Cuál es tu mayor miedo?',
    '¿Has mentido alguna vez a tu mejor amigo?',
    '¿Cuál es tu secreto más vergonzoso?',
    '¿A quién admiras en secreto?',
    '¿Qué es lo más raro que has hecho cuando estás solo?',
    '¿Has roto algo y culpado a otra persona?',
    '¿Cuál es tu peor hábito?',
    '¿Has espiado a alguien por redes sociales?'
  ],
  
  retos: [
    'Envía un audio cantando tu canción favorita',
    'Cambia tu foto de perfil por la que elija el grupo',
    'Escribe un mensaje de amor a la última persona con la que hablaste',
    'Haz 20 flexiones y envía el video',
    'No uses emojis durante 24 horas',
    'Cambia tu estado de WhatsApp a algo gracioso que elija el grupo',
    'Envía un meme de ti mismo',
    'No hables en el grupo durante 1 hora'
  ]
};
