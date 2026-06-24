import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempFolder = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true });

function getTempFilePath(extension) {
    return path.join(tempFolder, `chazam_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`);
}

async function uploadFile(fileBuffer) {
    const tempPath = getTempFilePath('audio');
    fs.writeFileSync(tempPath, fileBuffer);
    
    try {
        const form = new FormData();
        form.append('files[]', fs.createReadStream(tempPath));
        
        const res = await fetch('https://uguu.se/upload.php', {
            method: 'post',
            headers: form.getHeaders(),
            body: form
        });
        
        const result = await res.json();
        return result;
    } finally {
        try { fs.unlinkSync(tempPath); } catch (e) {}
    }
}

export default {
    name: 'chazam',
    alias: ['shazam'],
    
    async execute(sock, msg, options) {
        try {
            const { config, usersDB, senderNumber, senderJid, pushName, replyWithContext } = options;
            const from = msg.key.remoteJid;
            
            // Verificar registro
            if (usersDB && senderNumber && !usersDB[senderNumber]) {
                await sock.sendMessage(from, { 
                    text: `🍒 Debes estar registrado.\n> Uso: ${config.prefix}reg nombre`,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
                return;
            }
            
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo;
            const quotedMessage = quotedMsg?.quotedMessage;
            
            if (!quotedMessage) {
                await sock.sendMessage(from, { 
                    text: `🌵 Responde a un *Audio/Video*`,
                    contextInfo: {
                        mentionedJid: [senderJid],
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
                return;
            }
            
            let mediaBuffer = null;
            let mediaType = null;
            
            // Verificar si es audio
            if (quotedMessage.audioMessage) {
                mediaType = 'audio';
                const audioMsg = quotedMessage.audioMessage;
                
                const quotedMsgObj = {
                    key: {
                        remoteJid: from,
                        id: quotedMsg.stanzaId,
                        participant: quotedMsg.participant || from,
                        fromMe: false
                    },
                    message: {
                        audioMessage: audioMsg
                    }
                };
                
                mediaBuffer = await downloadMediaMessage(
                    quotedMsgObj,
                    'buffer',
                    {},
                    {
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
            }
            // Verificar si es video
            else if (quotedMessage.videoMessage) {
                mediaType = 'video';
                const videoMsg = quotedMessage.videoMessage;
                
                const quotedMsgObj = {
                    key: {
                        remoteJid: from,
                        id: quotedMsg.stanzaId,
                        participant: quotedMsg.participant || from,
                        fromMe: false
                    },
                    message: {
                        videoMessage: videoMsg
                    }
                };
                
                mediaBuffer = await downloadMediaMessage(
                    quotedMsgObj,
                    'buffer',
                    {},
                    {
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
            }
            else {
                await sock.sendMessage(from, { 
                    text: `🌵 Responde a un *Audio/Video*`,
                    contextInfo: {
                        mentionedJid: [senderJid],
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
                return;
            }
            
            if (!mediaBuffer || mediaBuffer.length === 0) {
                throw new Error('No se pudo descargar el archivo');
            }
            
            try {
                await sock.sendMessage(from, { react: { text: '🎵', key: msg.key } });
            } catch (e) {}
            
            // Subir archivo
            const upload = await uploadFile(mediaBuffer);
            
            if (!upload || !upload.files || !upload.files[0] || !upload.files[0].url) {
                throw new Error('Error al subir el archivo');
            }
            
            // Llamar a la API de Shazam
            const shp = await fetch(`https://apis-starlights-team.koyeb.app/starlight/shazam?url=${upload.files[0].url}`, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            const json = await shp.json();
            
            if (json.error) {
                throw new Error('No se pudo reconocer la canción');
            }
            
            const app = {
                title: json.data?.title || json.title || 'Desconocido',
                artist: json.data?.artist || json.artist || 'Desconocido',
                type: json.data?.type || json.type || 'Desconocido',
                url: json.data?.url || json.url || 'No disponible',
                avatar: json.data?.avatar || json.avatar || 'No disponible',
                gender: json.data?.gender || json.gender || 'No disponible',
                thumbnail: json.data?.thumbnail || json.thumbnail || 'No disponible'
            };
            
            const txt = `*\`-• C H A Z A M - M U S I C •-\`*\n\n` +
                `𓈒㌡۪𝆬🍟᱙ׅ֗ *Nombre:* ${app.title}\n` +
                `𓈒㌡۪𝆬🍫᱙ׅ֗ *Artista:* ${app.artist}\n` +
                `𓈒㌡۪𝆬🫔᱙ׅ֗ *Género:* ${app.gender}\n` +
                `𓈒㌡۪𝆬🥪᱙ׅ֗ *Tipo:* ${app.type}\n` +
                `𓈒㌡۪𝆬🥮᱙ׅ֗ *Link:* ${app.url}\n` +
                `𓈒㌡۪𝆬🍩᱙ׅ֗ *Avatar:* ${app.avatar}\n` +
                `𓈒㌡۪𝆬🥙᱙ׅ֗ *Thumbnail:* ${app.thumbnail}`;
            
            await sock.sendMessage(from, {
                text: txt,
                contextInfo: {
                    mentionedJid: [senderJid],
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
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
            } catch (e) {}
            
            console.log(`✅ Chazam usado por ${pushName || senderNumber}`);
            
        } catch (error) {
            console.error('❌ Error en chazam:', error);
            
            try {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            } catch (e) {}
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Error: ${error.message}`,
                contextInfo: {
                    mentionedJid: [options.senderJid],
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: options.config?.canalId || '',
                        serverMessageId: 0,
                        newsletterName: options.config?.canalNombre || ''
                    }
                }
            }, { quoted: msg });
        }
    }
};
