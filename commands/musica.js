// commands/musica.js - Comando con vista previa de YouTube + Audio
const axios = require('axios');
const logger = require('../utils/logger');

module.exports = {
  name: 'music',
  description: 'Busca música/video en YouTube y manda el audio',

  async execute(sock, message, args) {
    try {
      if (args.length === 0) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: `❌ Por favor especifica el nombre de la canción o video.\n\nEjemplo: *!musica despacito*`
        });
      }

      const query = args.join(' ');
      
      await sock.sendMessage(message.key.remoteJid, {
        text: `🔍 Buscando: *${query}*... Esto puede tomar unos segundos...`
      });

      // 1. BUSCAR USANDO TU API KEY DE YOUTUBE
      const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return await sock.sendMessage(message.key.remoteJid, {
          text: `❌ Falta configurar YOUTUBE_API_KEY en Railway`
        });
      }

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(query)}&key=${apiKey}`;
      
      let response;
      try {
        response = await axios.get(searchUrl);
      } catch (e) {
        logger.error(`Error con YouTube API: ${e.message}`);
        return await sock.sendMessage(message.key.remoteJid, {
          text: `❌ Error con YouTube API: ${e.response?.data?.error?.message || e.message}`
        });
      }

      const video = response.data.items[0];
      if (!video) {
        return await sock.sendMessage(message.key.remoteJid, { text: `❌ No encontré nada para: ${query}` });
      }

      const videoId = video.id.videoId;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const title = video.snippet.title;
      const channel = video.snippet.channelTitle;
      const thumbnail = video.snippet.thumbnails.high.url;

      // 2. MANDAR VISTA PREVIA
      await sock.sendMessage(message.key.remoteJid, {
        image: { url: thumbnail },
        caption: `🎵 *${title}*\n📺 Canal: ${channel}\n🔗 ${videoUrl}\n\n⬇️ Descargando audio...`
      });

      // 3. DESCARGAR AUDIO - API NUEVA QUE SI FUNCIONA
      try {
        // Intento 1
        let dlApi = `https://api.vreden.my.id/api/ytmp3?url=${videoUrl}`;
        let dlRes = await axios.get(dlApi);
        
        let audioUrl = dlRes.data?.result?.download || dlRes.data?.result?.url || dlRes.data?.data?.url;

        // Intento 2 si falla el 1
        if (!audioUrl) {
          let dlApi2 = `https://api.dorratz.com/v2/yt-mp3?url=${videoUrl}`;
          let dlRes2 = await axios.get(dlApi2);
          audioUrl = dlRes2.data?.data?.url;
        }

        if (!audioUrl) throw new Error('No se pudo obtener link de descarga');

        await sock.sendMessage(message.key.remoteJid, {
          audio: { url: audioUrl },
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`
        }, { quoted: message });

      } catch (e) {
        logger.error(`Error descargando: ${e.message}`);
        await sock.sendMessage(message.key.remoteJid, {
          text: `✅ Encontré: *${title}*\n${videoUrl}\n\n⚠️ No pude mandar el audio automático (error de descarga: ${e.message}).\n\nPrueba con el link directo.`
        });
      }

    } catch (err) {
      logger.error(err);
      await sock.sendMessage(message.key.remoteJid, { text: `❌ Error: ${err.message}` });
    }
  }
};
