import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function downloadFile(url, outputPath) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
            'User-Agent': 'TelegramBot (like TwitterBot)'
        }
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

export default {
    name: 'facebook',
    alias: ['fb', 'fbdl'],

    async execute(sock, msg, options) {
        try {
            const { args, config } = options;
            const from = msg.key.remoteJid;

            if (!args.length) {
                return await sock.sendMessage(from, {
                    text: '⚠️ Debes proporcionar un enlace de Facebook.\n\nEjemplo: .facebook https://www.facebook.com/share/v/17G62zi96v/',
                    contextInfo: {
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        }
                    }
                }, { quoted: msg });
            }

            const link = args[0];
            
            if (!link.includes('facebook.com') && !link.includes('fb.com')) {
                return await sock.sendMessage(from, {
                    text: '❌ El enlace proporcionado no es de Facebook.',
                    contextInfo: {
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        }
                    }
                }, { quoted: msg });
            }

            await sock.sendMessage(from, {
                text: '⏳ Descargando video de Facebook...',
                contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.canalId || '',
                        serverMessageId: 0,
                        newsletterName: config.canalNombre || ''
                    }
                }
            }, { quoted: msg });

            const apiUrl = `https://api.delirius.store/download/facebook?url=${encodeURIComponent(link)}`;
            const response = await axios.get(apiUrl);

            if (!response.data.status) {
                throw new Error('Error al obtener el video');
            }

            const videoList = response.data.list || [];
            if (videoList.length === 0) {
                throw new Error('No se encontraron videos para descargar');
            }

            const video = videoList[videoList.length - 1];
            const videoUrl = video.url;

            const tempDir = path.join(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const fileName = `facebook_${Date.now()}.mp4`;
            const filePath = path.join(tempDir, fileName);

            await downloadFile(videoUrl, filePath);

            if (!fs.existsSync(filePath)) {
                throw new Error('Error al descargar el video');
            }

            await sock.sendMessage(from, {
                video: fs.readFileSync(filePath),
                mimetype: 'video/mp4',
                contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.canalId || '',
                        serverMessageId: 0,
                        newsletterName: config.canalNombre || ''
                    }
                }
            }, { quoted: msg });

            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                console.error('Error eliminando archivo temporal:', error);
            }

            console.log(`📹 Comando facebook ejecutado - ${link}`);

        } catch (error) {
            console.error('❌ Error en comando facebook:', error);

            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Error al descargar el video: ${error.message}`,
                    contextInfo: {
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: options.config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: options.config.canalNombre || ''
                        }
                    }
                }, { quoted: msg });
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    }
};
