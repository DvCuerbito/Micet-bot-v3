import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'play',
    alias: ['ytaudio', 'song'],
    
    async execute(sock, msg, options) {
        try {
            const { config, args, senderJid } = options;
            const from = msg.key.remoteJid;
            const query = args.join(' ').trim();
            
            if (!query) {
                return await sock.sendMessage(from, {
                    text: `🧃 Tirá el nombre de la canción o link de YouTube`
                }, { quoted: msg });
            }
            
            await sock.sendPresenceUpdate('composing', from);
            await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
            
            const tempDir = path.join(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            // ============ MÉTODO 1: API Vreden ============
            let audioUrl = null;
            let videoData = null;
            
            try {
                console.log('🔍 Buscando con Vreden API...');
                const searchRes = await axios.get(`https://api.vreden.my.id/api/ytplaymp3?query=${encodeURIComponent(query)}`);
                
                if (searchRes.data?.result) {
                    videoData = searchRes.data.result.metadata;
                    audioUrl = searchRes.data.result.download.url;
                    console.log('✅ Vreden OK:', videoData.title);
                }
            } catch (e) {
                console.log('⚠️ Vreden falló:', e.message);
            }
            
            // ============ MÉTODO 2: API Ryzeen ============
            if (!audioUrl) {
                try {
                    console.log('🔍 Buscando con Ryzeen API...');
                    const searchRes = await axios.get(`https://api.ryzeen.site/api/yt/play?query=${encodeURIComponent(query)}`);
                    
                    if (searchRes.data?.result) {
                        videoData = {
                            title: searchRes.data.result.title,
                            channel: searchRes.data.result.channel,
                            thumbnail: searchRes.data.result.thumbnail,
                            url: searchRes.data.result.url
                        };
                        audioUrl = searchRes.data.result.audio;
                        console.log('✅ Ryzeen OK:', videoData.title);
                    }
                } catch (e) {
                    console.log('⚠️ Ryzeen falló:', e.message);
                }
            }
            
            // ============ MÉTODO 3: API Siputzx ============
            if (!audioUrl) {
                try {
                    console.log('🔍 Buscando con Siputzx API...');
                    const searchRes = await axios.get(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(query)}`);
                    
                    if (searchRes.data?.data) {
                        videoData = {
                            title: searchRes.data.data.title,
                            channel: searchRes.data.data.author,
                            thumbnail: searchRes.data.data.thumbnail,
                            url: query
                        };
                        audioUrl = searchRes.data.data.dl;
                        console.log('✅ Siputzx OK:', videoData.title);
                    }
                } catch (e) {
                    console.log('⚠️ Siputzx falló:', e.message);
                }
            }
            
            if (!audioUrl || !videoData) {
                throw new Error('No se encontró la canción en ninguna API');
            }
            
            // Descargar el audio
            console.log('📥 Descargando audio...');
            const audioRes = await axios.get(audioUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            const audioBuffer = Buffer.from(audioRes.data);
            const sizeMB = (audioBuffer.length / 1024 / 1024).toFixed(2);
            
            // Descargar miniatura
            let thumbnailBuffer = null;
            if (videoData.thumbnail) {
                try {
                    const thumbRes = await axios.get(videoData.thumbnail, {
                        responseType: 'arraybuffer',
                        timeout: 10000
                    });
                    thumbnailBuffer = Buffer.from(thumbRes.data);
                } catch (e) {}
            }
            
            // Caption
            const caption = `あ🏮 *Título* » ${videoData.title}\n` +
                          `あ🏮 *Canal* » ${videoData.channel || 'YouTube'}\n` +
                          `あ🏮 *Tamaño* » ${sizeMB} MB\n` +
                          `あ🏮 *Link* » ${videoData.url || query}`;
            
            // Enviar imagen + info
            if (thumbnailBuffer) {
                await sock.sendMessage(from, {
                    image: thumbnailBuffer,
                    caption: caption
                }, { quoted: msg });
            }
            
            // Enviar audio
            await sock.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${videoData.title.substring(0, 50)}.mp3`
            }, { quoted: msg });
            
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
            console.log(`✅ Enviado: ${videoData.title}`);
            
        } catch (error) {
            console.error('❌ Error:', error);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ No se pudo descargar: ${error.message}`
            }, { quoted: msg });
        }
    }
};
