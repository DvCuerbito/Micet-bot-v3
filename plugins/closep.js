export default {
    name: 'close',
    alias: ['cerrar', 'cerrargrupo'],
    
    async execute(sock, msg, options) {
        try {
            const { config, usersDB, senderNumber, senderJid } = options;
            const from = msg.key.remoteJid;
            
            if (!from.endsWith('@g.us')) {
                return;
            }
            
            let groupMetadata;
            try {
                groupMetadata = await sock.groupMetadata(from);
            } catch (error) {
                return;
            }
            
            // Verificar si el usuario es admin del grupo
            const participant = groupMetadata.participants.find(p => {
                if (p.id === senderJid) return true;
                if (p.id.includes(senderNumber || '')) return true;
                if (senderJid && senderJid.includes('@lid')) {
                    const senderNum = senderJid.split('@')[0];
                    if (p.id.includes(senderNum)) return true;
                }
                return false;
            });
            
            const isGroupAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
            
            // Verificar si es owner del bot
            const isOwner = config.owner && config.owner.some(ownerNum => 
                ownerNum.replace(/\D/g, '') === (senderNumber || '').replace(/\D/g, '')
            );
            
            // Verificar si tiene rango en el bot
            const userData = usersDB[senderNumber];
            const userRank = userData?.rank;
            const hasBotRank = isOwner || (userRank && ['owner', 'c-owner', 'srmod', 'mod'].includes(userRank));
            
            if (!isGroupAdmin && !hasBotRank) {
                await sock.sendMessage(from, {
                    text: `🍁 Solo administradores del grupo pueden usar este comando`,
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
                await sock.groupSettingUpdate(from, 'announcement');
                
                console.log(`\x1b[1;33m🔒 Grupo ${from} cerrado por ${senderNumber}\x1b[0m`);
                
            } catch (error) {
                console.log(`\x1b[1;31m❌ Error en close: ${error.message}\x1b[0m`);
                
                if (error.message.includes('not authorized') || error.message.includes('admin')) {
                    await sock.sendMessage(from, {
                        text: `🥕 Debes ser administrador para usar este comando`,
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
                } else {
                    await sock.sendMessage(from, {
                        text: `🥪 *${config.name}* debe ser administrador del grupo`,
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
            
        } catch (error) {
            console.error('❌ Error en close:', error);
        }
    }
};
