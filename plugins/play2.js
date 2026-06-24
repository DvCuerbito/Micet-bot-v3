import axios from 'axios';

export default {
    name: 'play2',
    alias: ['ytmp4', 'playvid', 'video'],
    
    async execute(sock, msg, options) {
        try {
            const { args, senderJid } = options;
            const from = msg.key.remoteJid;
            const query = args.join(' ').trim();
            
            if (!query) {
                return await sock.sendMessage(from, {
                    text: `🍟 Tirá el nombre del video o link de YouTube\n\nEj: .play2 bad bunny monaco`
                }, { quoted: msg });
            }
            
            await sock.sendPresenceUpdate('composing', from);
            await sock.sendMessage(from, { react: { text: '🎬', key: msg.key } });
            
            let videoUrl = null;
            let videoData = null;
            
            // ============ MÉTODO 1: API Vreden ============
            try {
                console.log('🔍 Buscando con Vreden API...');
                const res = await axios.get(`https://api.vreden.my.id/api/ytmp4?query=${encodeURIComponent(query)}`);
                
                if (res.data?.result) {
                    videoData = res.data.result.metadata;
                    videoUrl = res.data.result.download.url;
                    console.log('✅ Vreden OK:', videoData.title);
                }
            } catch (e) {
                console.log('⚠️ Vreden falló:', e.message);
            }
            
            // ============ MÉTODO 2: API Ryzeen ============
            if (!videoUrl) {
                try {
                    console.log('🔍 Buscando con Ryzeen API...');
                    const res = await axios.get(`https://api.ryzeen.site/api/yt/play?query=${encodeURIComponent(query)}&type=video`);
                    
                    if (res.data?.result) {
                        videoData = {
                            title: res.data.result.title,
                            channel: res.data.result.channel,
                            thumbnail: res.data.result.thumbnail,
                            url: res.data.result.url,
                            duration: res.data.result.duration
                        };
                        videoUrl = res.data.result.video;
                        console.log('✅ Ryzeen OK:', videoData.title);
                    }
                } catch (e) {
                    console.log('⚠️ Ryzeen falló:', e.message);
                }
            }
            
            // ============ MÉTODO 3: API Siputzx ============
            if (!videoUrl) {
                try {
                    console.log('🔍 Buscando con Siputzx API...');
                    // Si es link directo
                    let url = query;
                    if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
                        // Buscar primero
                        const search = await axios.get(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`);
                        if (search.data?.data?.[0]) url = search.data.data[0].url;
                    }
                    
                    const res = await axios.get(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`);
                    
                    if (res.data?.data) {
                        videoData = {
                            title: res.data.data.title,
                            channel: res.data.data.author,
                            thumbnail: res.data.data.thumbnail,
                            url: url
                        };
                        videoUrl = res.data.data.dl;
                        console.log('✅ Siputzx OK:', videoData.title);
                    }
                } catch (e) {
                    console.log('⚠️ Siputzx falló:', e.message);
                }
            }
            
            if (!videoUrl || !videoData) {
                throw new Error('No se encontró el video en ninguna API');
            }
            
            // Descargar el video
            console.log('📥 Descargando video...');
            const videoRes = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 180000, // 3 min pa videos pesados
                headers: { 'User-Agent': 'Mozilla/5.0' },
                maxContentLength: 100 * 1024, // Max 100MB
                maxBodyLength: 100 * 1024
            });
            
            const videoBuffer = Buffer.from(videoRes.data);
            const sizeMB = (videoBuffer.length / 1024).toFixed(2);
            
            // WhatsApp no banca videos >16MB como mensaje directo
            if (videoBuffer.length > 16 * 1024 * 1024) {
                await sock.sendMessage(from, {
                    text: `⚠️ El video pesa ${sizeMB}MB y WhatsApp solo permite 16MB.\n\nDescargalo directo: ${videoUrl}`
                }, { quoted: msg });
                await sock.sendMessage(from, { react: { text: '⚠️', key: msg.key } });
                return;
            }
            
            // Caption
            const caption = `あ🏮 *Título* » ${videoData.title}\n` +
                          `あ🏮 *Canal* » ${videoData.channel || 'YouTube'}\n` +
                          `あ🏮 *Tamaño* » ${sizeMB} MB\n` +
                          `あ🏮 *Duración* » ${videoData.duration || 'N/A'}\n` +
                          `あ🏮 *Link* » ${videoData.url || query}`;
            
            // Enviar video
            await sock.sendMessage(from, {
                video: videoBuffer,
                mimetype: 'video/mp4',
                fileName: `${videoData.title.substring(0, 50)}.mp4`,
                caption: caption
            }, { quoted: msg });
            
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
            console.log(`✅ Video enviado: ${videoData.title} - ${sizeMB}MB`);
            
        } catch (error) {
            console.error('❌ Error:', error);
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            
            let errorMsg = error.message;
            if (error.code === 'ECONNABORTED') {
                errorMsg = 'El video tarda mucho en descargar. Probá con uno más corto';
            } else if (error.response?.status === 413) {
                errorMsg = 'El video es muy pesado +100MB';
            }
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ No se pudo descargar: ${errorMsg}`
            }, { quoted: msg });
        }
    }
};
