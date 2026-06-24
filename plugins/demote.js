export default {
    name: 'demote',
    alias: ['quitaradmin', 'quitarpoder'],
    
    async execute(sock, msg, options) {
        try {
            const { config, usersDB, senderNumber, senderJid, args, pushName, saveUsersDB } = options;
            const from = msg.key.remoteJid;
            
            // Verificar si es chat de grupo
            if (!from.endsWith('@g.us')) {
                return;
            }
            
            // Obtener info del grupo
            let groupMetadata;
            try {
                groupMetadata = await sock.groupMetadata(from);
            } catch (error) {
                return;
            }
            
            // Verificar si el usuario es admin del grupo
            const isGroupAdmin = groupMetadata.participants.find(p => {
                if (p.id === senderJid) return true;
                if (p.id.includes(senderNumber || '')) return true;
                if (senderJid && senderJid.includes('@lid')) {
                    const senderNum = senderJid.split('@')[0];
                    if (p.id.includes(senderNum)) return true;
                }
                return false;
            })?.admin;
            
            // Verificar si es owner del bot
            const isOwner = config.owner && config.owner.some(ownerNum => 
                ownerNum.replace(/\D/g, '') === (senderNumber || '').replace(/\D/g, '')
            );
            
            // Verificar si tiene rango en el bot
            const userData = usersDB[senderNumber];
            const userRank = userData?.rank;
            const hasBotRank = isOwner || (userRank && ['owner', 'c-owner', 'srmod', 'mod'].includes(userRank));
            
            // Verificar permisos
            if (!isGroupAdmin && !hasBotRank) {
                await sock.sendMessage(from, {
                    text: `🌺 *Este comando solo puede ser usado por administradores del grupo*`,
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
                return;
            }
            
            // 🔥 FUNCIÓN PARA OBTENER EL NÚMERO REAL (sea LID o JID) 🔥
            const getRealPhoneNumber = (jid) => {
                if (!jid) return null;
                
                const identificador = jid.split('@')[0];
                
                // Buscar en usersDB por LID
                for (const [num, data] of Object.entries(usersDB)) {
                    if (data.lid === jid || data.lid === identificador) {
                        return num;
                    }
                }
                
                // Buscar en usersDB por JID
                for (const [num, data] of Object.entries(usersDB)) {
                    if (data.jid === jid || data.jid === identificador) {
                        return num;
                    }
                }
                
                // Si ya es un número de teléfono
                if (/^[\d]+$/.test(identificador) && identificador.length > 8) {
                    return identificador;
                }
                
                return null;
            };
            
            // Obtener usuario objetivo
            let targetUserJid = null;
            let targetUserNumber = null;
            
            // 1. Verificar mención
            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetUserJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
                targetUserNumber = getRealPhoneNumber(targetUserJid);
                console.log(`✅ Usuario mencionado: ${targetUserJid} -> Número: ${targetUserNumber}`);
            }
            // 2. Verificar respuesta
            else if (msg.message?.extendedTextMessage?.contextInfo?.stanzaId) {
                const quotedMsg = msg.message.extendedTextMessage.contextInfo;
                if (quotedMsg.participant) {
                    targetUserJid = quotedMsg.participant;
                    targetUserNumber = getRealPhoneNumber(targetUserJid);
                    console.log(`✅ Usuario por respuesta: ${targetUserJid} -> Número: ${targetUserNumber}`);
                }
            }
            // 3. Verificar si hay número en args
            else if (args && args.length > 0) {
                const possibleNumber = args[0].replace(/[^0-9]/g, '');
                if (possibleNumber && possibleNumber.length > 8) {
                    targetUserNumber = possibleNumber;
                    // Buscar el JID en el grupo
                    const found = groupMetadata.participants.find(p => 
                        p.id.includes(possibleNumber) || 
                        p.id.split('@')[0] === possibleNumber
                    );
                    if (found) targetUserJid = found.id;
                }
            }
            
            if (!targetUserJid || !targetUserNumber) {
                await sock.sendMessage(from, {
                    text: `🏮 *Debes responder, mencionar o escribir el número del usuario*\n> Ejemplo: ${config.prefix}demote @usuario\n> Ejemplo: ${config.prefix}demote 5219992042946`,
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
                return;
            }
            
            // Verificar si el usuario objetivo está en el grupo
            const targetParticipant = groupMetadata.participants.find(p => {
                const pNumber = getRealPhoneNumber(p.id);
                return pNumber === targetUserNumber || p.id === targetUserJid;
            });
            
            if (!targetParticipant) {
                await sock.sendMessage(from, {
                    text: `🌺 El usuario no está en el grupo`,
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
                return;
            }
            
            // Verificar si no es admin
            if (!targetParticipant.admin) {
                await sock.sendMessage(from, {
                    text: `🌹 @${targetUserNumber} *no es administrador del grupo*`,
                    mentions: [targetParticipant.id],
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
                return;
            }
            
            // Verificar que no se esté intentando degradar al bot
            const botNumber = sock.user.id.split('@')[0].replace(/[^0-9]/g, '');
            if (targetUserNumber === botNumber) {
                await sock.sendMessage(from, {
                    text: `🌺 No puedes degradar al bot`,
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
                return;
            }
            
            try {
                // Degradar a usuario
                await sock.groupParticipantsUpdate(
                    from,
                    [targetParticipant.id],
                    "demote"
                );
                
                await sock.sendMessage(from, {
                    text: `🌺 @${targetUserNumber} *ha sido degradado de administrador del grupo*`,
                    mentions: [targetParticipant.id],
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
                console.error('Error en demote:', error);
                await sock.sendMessage(from, {
                    text: `🌺 ${config.name} *debe ser administrador del grupo*`,
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
            
        } catch (error) {
            console.error('❌ Error en demote:', error);
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🍟 Error al degradar usuario: ${error.message}`,
                    contextInfo: {
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: options.config?.canalId || '',
                            serverMessageId: 0,
                            newsletterName: options.config?.canalNombre || ''
                        }
                    }
                }, { quoted: msg });
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    }
};
