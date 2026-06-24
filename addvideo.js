import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lista de rangos permitidos para agregar videos
const ALLOWED_RANKS = ['owner', 'c-owner', 'srmod', 'mod', 'trialmod', 'trial', 'helper', 'applicant'];

export default {
    name: 'addvideo',
    alias: ['agregarvideo', 'addvid'],
    
    async execute(sock, msg, options) {
        try {
            const { args, config, pushName, senderNumber, senderJid, usersDB } = options;
            const from = msg.key.remoteJid;
            
            // Verificar si el usuario tiene permisos
            const userData = usersDB[senderNumber];
            const userRank = userData?.rank;
            const isAllowed = userRank && ALLOWED_RANKS.includes(userRank);
            
            const isOwner = config.owner && config.owner.some(ownerNum => 
                ownerNum.replace(/\D/g, '') === (senderNumber || '').replace(/\D/g, '')
            );
            
            if (!isOwner && !isAllowed) {
                await sock.sendMessage(from, {
                    text: `🍟 el comando \`${config.prefix}addvideo\` no Existe.\n> ⚡Usa ${config.prefix}help`,
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

            const categoryName = args[0]?.toLowerCase();
            if (!categoryName) {
                await sock.sendMessage(from, {
                    text: '☆ Debes proporcionar una categoría.\n> ✐ Ej: .addvideo love',
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
            if (!quotedMsg?.quotedMessage) {
                await sock.sendMessage(from, {
                    text: '✧ Debes responder a un gif o video.',
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

            const quotedMessage = quotedMsg.quotedMessage;
            const videoMessage = quotedMessage.videoMessage;
            
            if (!videoMessage) {
                await sock.sendMessage(from, {
                    text: '✧ Debes responder a un gif o video.',
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

            const isGif = videoMessage.gifPlayback || false;
            
            // Reacción de carga
            await sock.sendMessage(from, {
                react: { text: '📥', key: msg.key }
            });

            // Verificar/Crear carpeta de categorías
            const categoriesFile = path.join(__dirname, '..', 'databases', 'categories.json');
            let categories = {};
            
            if (fs.existsSync(categoriesFile)) {
                try {
                    categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
                } catch (e) {
                    console.log('Error parsing categories.json:', e);
                }
            }

            if (!categories[categoryName]) {
                await sock.sendMessage(from, {
                    text: `❖ La categoría *${categoryName}* no existe.\n> Usa .listcategories para ver las categorías disponibles.`,
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

            // Crear un objeto de mensaje completo para downloadMediaMessage
            const quotedMsgObj = {
                key: {
                    remoteJid: from,
                    id: quotedMsg.stanzaId,
                    participant: quotedMsg.participant || from,
                    fromMe: false
                },
                message: {
                    videoMessage: videoMessage
                }
            };
            
            // Mostrar que está descargando
            await sock.sendMessage(from, {
                react: { text: '🔄', key: msg.key }
            });
            
            const mediaBuffer = await downloadMediaMessage(
                quotedMsgObj,
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            if (!mediaBuffer || mediaBuffer.length === 0) {
                throw new Error('No se pudo descargar el video');
            }

            // Verificar tamaño máximo (20MB)
            const maxSize = 20 * 1024 * 1024;
            if (mediaBuffer.length > maxSize) {
                throw new Error(`El video es demasiado grande (${(mediaBuffer.length / 1024 / 1024).toFixed(2)}MB)\n> Máx: 20MB`);
            }

            const timestamp = Date.now();
            const fileExtension = isGif ? 'gif' : 'mp4';
            const filename = `${categoryName}_${timestamp}.${fileExtension}`;
            const videosDir = path.join(__dirname, '..', 'videos');
            const categoryDir = path.join(videosDir, categoryName);
            const filePath = path.join(categoryDir, filename);

            // Crear carpetas si no existen
            if (!fs.existsSync(videosDir)) {
                fs.mkdirSync(videosDir, { recursive: true });
            }
            if (!fs.existsSync(categoryDir)) {
                fs.mkdirSync(categoryDir, { recursive: true });
            }

            // Guardar el video
            fs.writeFileSync(filePath, mediaBuffer);
            
            // Verificar que se guardó correctamente
            if (!fs.existsSync(filePath)) {
                throw new Error('No se pudo guardar el archivo');
            }

            const videoInfo = {
                filename: filename,
                addedBy: senderJid,
                addedByNumber: senderNumber,
                addedByName: pushName || senderNumber,
                addedByRank: userRank || (isOwner ? 'owner' : 'unknown'),
                addedAt: new Date().toLocaleString(),
                addedTimestamp: Date.now(),
                size: mediaBuffer.length,
                type: isGif ? 'gif' : 'video',
                duration: videoMessage.seconds || 0
            };

            if (!categories[categoryName].videos) {
                categories[categoryName].videos = [];
            }
            
            categories[categoryName].videos.push(videoInfo);
            categories[categoryName].videoCount = categories[categoryName].videos.length;
            categories[categoryName].lastUpdated = new Date().toLocaleString();

            fs.writeFileSync(categoriesFile, JSON.stringify(categories, null, 2));

            // Reacción de éxito
            await sock.sendMessage(from, {
                react: { text: '✅', key: msg.key }
            });

            await sock.sendMessage(from, {
                text: `✰ *Video agregado con éxito*\n\n📁 *Categoría:* ${categoryName}\n🎬 *Tipo:* ${isGif ? 'GIF' : 'Video'}\n📏 *Tamaño:* ${(mediaBuffer.length / 1024 / 1024).toFixed(2)}MB\n⏱️ *Duración:* ${videoMessage.seconds || 0}s\n👤 *Agregado por:* ${pushName || senderNumber}\n📅 *Fecha:* ${new Date().toLocaleString()}\n\n📂 *Total en categoría:* ${categories[categoryName].videoCount}`,
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

            console.log(`✅ Video agregado a ${categoryName} por ${senderNumber} (${mediaBuffer.length} bytes)`);

        } catch (error) {
            console.error('Error en comando addvideo:', error);
            
            // Reacción de error
            try {
                await sock.sendMessage(msg.key.remoteJid, { 
                    react: { text: '❌', key: msg.key }
                });
            } catch (e) {}
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❖ *Error:* ${error.message}`,
                contextInfo: {
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: options.config?.canalId || '',
                        serverMessageId: 0,
                        newsletterName: options.config?.canalNombre || ''
                    },
                    forwardingScore: 9999999,
                    isForwarded: true
                }
            }, { quoted: msg });
        }
    }
};
