import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para cargar users.json
function loadUsersDB() {
    try {
        const usersFile = path.join(__dirname, '..', 'databases', 'users.json');
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error cargando users.json:', error);
    }
    return {};
}

export default {
    name: 'blush',
    
    async execute(sock, msg, options) {
        try {
            const { args, config, pushName, sender } = options;
            const from = msg.key.remoteJid;
            const user = msg.key.participant || from;
            
            // Usuario que ejecuta el comando
            let targetUser1 = user;
            let targetUser2 = null;
            
            // Nombre del usuario que ejecuta el comando
            let userName1 = pushName || user.split('@')[0];
            let userName2 = null;
            
            // Verificar si hay mensaje citado
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
            
            // Verificar si hay menciones en el texto
            let mentionedUsers = [];
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                mentionedUsers = msg.message.extendedTextMessage.contextInfo.mentionedJid;
            }
            
            // Caso 1: Hay mención con @
            if (mentionedUsers && mentionedUsers.length > 0) {
                targetUser2 = mentionedUsers[0];
                
                try {
                    const usersDB = loadUsersDB();
                    if (usersDB[targetUser2] && usersDB[targetUser2].pushName) {
                        userName2 = usersDB[targetUser2].pushName;
                    } else {
                        userName2 = targetUser2.split('@')[0];
                    }
                } catch (error) {
                    userName2 = targetUser2.split('@')[0];
                }
            }
            // Caso 2: Hay mensaje citado
            else if (quotedParticipant) {
                targetUser2 = quotedParticipant;
                
                try {
                    const usersDB = loadUsersDB();
                    if (usersDB[targetUser2] && usersDB[targetUser2].pushName) {
                        userName2 = usersDB[targetUser2].pushName;
                    } else {
                        userName2 = targetUser2.split('@')[0];
                    }
                } catch (error) {
                    userName2 = targetUser2.split('@')[0];
                }
            }
            
            // Si no hay usuario 2, usar el mismo usuario 1
            if (!userName2) {
                userName2 = userName1;
            }

            // Cargar categorías
            const categoriesFile = path.join(__dirname, '..', 'databases', 'categories.json');
            let categories = {};
            
            if (fs.existsSync(categoriesFile)) {
                try {
                    categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
                } catch (e) {
                    console.log('Error parsing categories.json:', e);
                }
            }

            const categoryName = 'blush';
            if (!categories[categoryName] || !categories[categoryName].videos?.length) {
                await sock.sendMessage(from, {
                    text: '❖ No hay GIFs disponibles en la categoría *blush*',
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

            const category = categories[categoryName];
            const randomIndex = Math.floor(Math.random() * category.videos.length);
            const videoInfo = category.videos[randomIndex];
            
            // Cargar descripciones
            const descFile = path.join(__dirname, '..', 'databases', 'gif_descriptions.json');
            let descriptions = {};
            let descriptionText = `${userName1} se sonroja por ${userName2}`;
            
            if (fs.existsSync(descFile)) {
                try {
                    descriptions = JSON.parse(fs.readFileSync(descFile, 'utf8'));
                    
                    if (descriptions[categoryName]?.length > 0) {
                        const randomDescIndex = Math.floor(Math.random() * descriptions[categoryName].length);
                        const selectedDesc = descriptions[categoryName][randomDescIndex].text;
                        
                        descriptionText = selectedDesc
                            .replace(/\{user\}/g, userName1)
                            .replace(/\{user1\}/g, userName1)
                            .replace(/\{user2\}/g, userName2);
                    }
                } catch (e) {
                    console.log('Error parsing descriptions:', e);
                }
            }

            const videosDir = path.join(__dirname, '..', 'videos');
            const gifPath = path.join(videosDir, categoryName, videoInfo.filename);

            if (!fs.existsSync(gifPath)) {
                await sock.sendMessage(from, {
                    text: '❖ Error: El archivo GIF no existe.',
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

            const gifBuffer = fs.readFileSync(gifPath);

            try {
                await sock.sendMessage(from, {
                    video: gifBuffer,
                    caption: descriptionText,
                    gifPlayback: true,
                    mimetype: 'video/mp4',
                    fileName: `${categoryName}.gif`,
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
            } catch (error1) {
                console.log('❌ Error enviando como video, intentando como imagen:', error1);
                try {
                    await sock.sendMessage(from, {
                        image: gifBuffer,
                        caption: descriptionText,
                        mimetype: 'image/gif',
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
                } catch (error2) {
                    await sock.sendMessage(from, {
                        text: `${descriptionText}\n\n❖ No se pudo enviar el GIF`,
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
                }
            }

        } catch (error) {
            console.log(`❌ Error en comando blush:`, error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❖ Error al ejecutar el comando: ${error.message}`,
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
