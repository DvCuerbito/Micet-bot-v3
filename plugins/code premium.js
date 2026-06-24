import { mainBot } from '../lib/mainBot.js'

// Almacén para cooldowns
const cooldowns = new Map();

// Lista de rangos permitidos (owners y mods)
const ALLOWED_RANKS = ['owner', 'c-owner', 'srmod', 'mod'];

// 🔥 FUNCIÓN PARA OBTENER EL NÚMERO REAL (sea LID o JID) 🔥
function getRealPhoneNumber(usersDB, jid) {
    if (!jid || !usersDB) return null;
    
    // Extraer el identificador (lo que está antes del @)
    const identificador = jid.split('@')[0];
    
    // CASO 1: Buscar en usersDB por LID
    for (const [num, data] of Object.entries(usersDB)) {
        if (data.lid === jid || data.lid === identificador) {
            console.log(`✅ LID encontrado! Número real: ${num}`);
            return num;
        }
    }
    
    // CASO 2: Buscar en usersDB por JID
    for (const [num, data] of Object.entries(usersDB)) {
        if (data.jid === jid || data.jid === identificador) {
            console.log(`✅ JID encontrado! Número real: ${num}`);
            return num;
        }
    }
    
    // CASO 3: Si ya es un número de teléfono (solo dígitos)
    if (/^[\d]+$/.test(identificador) && identificador.length > 8) {
        // Verificar si existe en usersDB
        if (usersDB[identificador]) {
            return identificador;
        }
        return identificador; // Asumir que es el número
    }
    
    // Si no se encuentra, devolver null
    return null;
}

// Función para obtener el JID del usuario (para menciones)
function getUserJid(msg, sender) {
    // Intentar obtener el JID del participante (número real)
    if (msg.key?.participantAlt) {
        return msg.key.participantAlt; // Ya viene con @s.whatsapp.net
    } else if (msg.key?.participant) {
        const participant = msg.key.participant;
        if (participant.includes('@s.whatsapp.net') || participant.includes('@lid')) {
            return participant;
        }
    }
    // Si no, usar el sender que ya tenemos
    return sender;
}

export default {
    name: 'codepremium',
    alias: [],
    
    async execute(sock, msg, options) {
        try {
            const { config, usersDB, sender, args, pushName, senderNumber } = options;
            const from = msg.key.remoteJid;
            const phone = args[0];
            
            // 🔥 OBTENER EL NÚMERO REAL DEL USUARIO QUE EJECUTA EL COMANDO 🔥
            const userRealNumber = getRealPhoneNumber(usersDB, sender) || senderNumber;
            
            console.log('🔍 Comando codemod:');
            console.log('  Sender original:', sender);
            console.log('  Número real:', userRealNumber);
            
            // Crear clave de cooldown con el número real
            const userKey = `${from}-${userRealNumber}`;
            
            // Obtener JID del usuario para mención
            const userJid = getUserJid(msg, sender);
            
            // Verificar si el usuario tiene permisos (owner o mod)
            const userData = usersDB[userRealNumber];
            const userRank = userData?.rank;
            const isAllowed = userRank && ALLOWED_RANKS.includes(userRank);
            
            // Verificar si es owner por número
            const isOwner = userRealNumber === "189202503315478" || 
                           (config.owner && config.owner.includes(userRealNumber));
            
            console.log('  Rango:', userRank);
            console.log('  IsAllowed:', isAllowed);
            console.log('  IsOwner:', isOwner);
            
            if (!isOwner && !isAllowed) {
                return await sock.sendMessage(from, {
                    text: `๑ֵ݊🍀 ᥱᥣ ᥴ᥆mᥲᥒძ᥆ \`${config.prefix}codemod\` ᥒ᥆ ᥱ᥊іs𝗍ᥱ.\n> ೯۪🎑̶ֵ ᥙsᥲ ${config.prefix}help ⍴ᥲrᥲ ᥎ᥱr mіs ᥴ᥆mᥲᥒძ᥆s`,
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
            
            // Verificar cooldown
            const now = Date.now();
            const cooldownTime = 2 * 60 * 1000; // 2 minutos
            
            if (cooldowns.has(userKey)) {
                const expirationTime = cooldowns.get(userKey) + cooldownTime;
                if (now < expirationTime) {
                    const timeLeft = Math.ceil((expirationTime - now) / 1000);
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    const timeText = `${minutes > 0 ? `${minutes} min ` : ''}${seconds} seg`;
                    
                    return await sock.sendMessage(from, {
                        text: `🍓 *Esperar* ${timeText} *para volver a solicitar un codigo*`,
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
            }
            
            if (!phone) {
                return await sock.sendMessage(from, {
                    text: `🌴 *Debes proporcionar el numero que vinculara*`,
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
            
            // Validar número (entre 8 y 15 dígitos, solo números)
            if (!/^\d{8,15}$/.test(phone)) {
                return await sock.sendMessage(from, {
                    text: '❤ *El numero proporcionado no es valido*',
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
            
            // Verificar si ya existe un main bot con este número
            if (global.mainBots?.some(bot => {
                if (!bot.userId) return false;
                let botNumber = bot.userId.split('@')[0];
                if (botNumber.includes(':')) {
                    botNumber = botNumber.split(':')[0];
                }
                return botNumber.includes(phone);
            })) {
                return await sock.sendMessage(from, {
                    text: '💮 *El numero proporcionado ya tiene un main bot vinculado*',
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
            
            // Verificar si ya existe como sub-bot
            if (global.conns?.some(conn => {
                if (!conn.userId) return false;
                let connNumber = conn.userId.split('@')[0];
                if (connNumber.includes(':')) {
                    connNumber = connNumber.split(':')[0];
                }
                return connNumber.includes(phone);
            })) {
                return await sock.sendMessage(from, {
                    text: '💮 *El numero proporcionado ya esta en uso (sub-bot)*',
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
            
            // Registrar cooldown
            cooldowns.set(userKey, now);
            
            // Limpiar cooldown antiguo después de 2 minutos
            setTimeout(() => {
                cooldowns.delete(userKey);
            }, cooldownTime);
            
            // Enviar mensaje de confirmación
            await sock.sendMessage(from, {
                text: `♻️ *Generando codigo para main bot* ${phone}`,
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
                // Enviar el mensaje de instrucciones
                let instructionsMessage = null;
                try {
                    instructionsMessage = await sock.sendMessage(from, {
                        text: `♡ *Vincula un main bot*\n\n❀ *Mas ajustes* » *Dispositivos vinculados* » *Vincular un dispositivo* » *Vincular con numero de telefono*\n\n> *Este codigo expira en 60 segundos*`,
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
                } catch (error) {
                    console.error('Error enviando instrucciones:', error);
                }
                
                // Usar mainBot con callbacks
                await mainBot({
                    m: msg,
                    client: sock,
                    phone: phone,
                    chatId: from,
                    joinGroup: true,
                    onSuccess: async (connectedNumber) => {
                        console.log(`✅ Main bot conectado: ${connectedNumber}`);
                        
                        // Eliminar mensaje de instrucciones después de 2 segundos
                        setTimeout(async () => {
                            if (instructionsMessage && instructionsMessage.key) {
                                try {
                                    await sock.sendMessage(from, { 
                                        delete: instructionsMessage.key 
                                    });
                                    console.log(`🗑️ Instrucciones eliminadas para ${phone}`);
                                } catch (error) {
                                    console.error('Error eliminando instrucciones:', error);
                                }
                            }
                        }, 2000);
                        
                        // Enviar mensaje de éxito con mención al usuario
                        try {
                            // Extraer el número del usuario para mostrarlo
                            let userPhone = userRealNumber;
                            
                            // Crear mensaje con mención
                            let successMessage = '';
                            if (userJid) {
                                // Si tenemos JID, hacemos mención
                                successMessage = `🌟 @${userPhone} *Ha vinculado un nuevo main-bot*\n\n` +
                                      `🌾 *Número del bot:* ${connectedNumber || phone}\n` +
                                      `📱 *Tipo:* Main Bot (Bot Principal)\n` +
                                      `⚡ *Prefijo:* . (punto)\n\n` +
                                      `> *El main bot se reconectara automaticamente al reiniciar el bot*`;
                            } else {
                                // Si no tenemos JID, mostramos el número
                                successMessage = `🌟 *Se ha vinculado un nuevo main bot*\n\n` +
                                      `🌾 *Usuario que vinculó:* ${userPhone}\n` +
                                      `🌾 *Número del bot:* ${connectedNumber || phone}\n` +
                                      `📱 *Tipo:* Main Bot (Bot Principal)\n` +
                                      `⚡ *Prefijo:* . (punto)\n\n` +
                                      `> *El main bot se reconectara automaticamente al reiniciar el bot*`;
                            }
                            
                            await sock.sendMessage(from, {
                                text: successMessage,
                                mentions: userJid ? [userJid] : [],
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
                        } catch (error) {
                            console.error('Error enviando mensaje de éxito:', error);
                        }
                    },
                    onError: (error) => {
                        console.error(`❌ Error en mainBot ${phone}:`, error.message || error);
                        
                        // Eliminar mensaje de instrucciones si hay error
                        setTimeout(async () => {
                            if (instructionsMessage && instructionsMessage.key) {
                                try {
                                    await sock.sendMessage(from, { 
                                        delete: instructionsMessage.key 
                                    });
                                } catch (deleteError) {
                                    // Ignorar errores de eliminación
                                }
                            }
                        }, 1000);
                    }
                });
                
            } catch (error) {
                console.error('[ERROR MAINBOT]:', error);
            }
            
        } catch (error) {
            console.error('Error en codemod:', error);
        }
    }
};
