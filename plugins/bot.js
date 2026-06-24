import { getGroupConfig, updateGroupConfig } from '../lib/groupConfig.js';

async function isUserAdmin(sock, groupId, userId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participant = groupMetadata.participants.find(p => p.id === userId);
        return participant?.admin === 'admin' || participant?.admin === 'superadmin';
    } catch {
        return false;
    }
}

export default {
    name: 'bot',
    alias: [],
    
    async execute(sock, msg, options) {
        try {
            const { config, senderNumber, senderJid, args, pushName } = options;
            const from = msg.key.remoteJid;
            
            console.log(`🤖 Comando bot ejecutado por: ${senderNumber}`);

            if (!from.endsWith('@g.us')) {
                return await sock.sendMessage(from, {
                    text: `🍟 Este comando solo puede usarse en grupos`,
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

            // Verificar si es admin del grupo
            const isAdmin = await isUserAdmin(sock, from, senderJid);
            
            // Verificar si es owner del bot
            const isOwner = config.owner && config.owner.some(ownerNum => 
                ownerNum.replace(/\D/g, '') === (senderNumber || '').replace(/\D/g, '')
            );
            
            if (!isAdmin && !isOwner) {
                return await sock.sendMessage(from, {
                    text: `🌺 Debes ser administrador para usar este comando`,
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
            }

            const action = args[0]?.toLowerCase();
            
            if (!action || (action !== 'on' && action !== 'off')) {
                return await sock.sendMessage(from, {
                    text: `🏮 Debes proporcionar on o off\n\nEjemplo: ${config.prefix}bot on`,
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
            }

            // Obtener configuración actual del grupo desde el JSON centralizado
            const groupConfig = getGroupConfig(from);
            const currentState = groupConfig.botEnabled;

            if (action === 'on' && currentState) {
                return await sock.sendMessage(from, {
                    text: `🌹 El bot ya estaba activado`,
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
            }

            if (action === 'off' && !currentState) {
                return await sock.sendMessage(from, {
                    text: `🌹 El bot ya estaba desactivado`,
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
            }

            // Actualizar configuración en el JSON centralizado
            updateGroupConfig(from, { botEnabled: action === 'on' });

            const mensaje = action === 'on' 
                ? `🌹 Se ha activado el bot` 
                : `🌹 Se ha desactivado el bot`;

            await sock.sendMessage(from, {
                text: mensaje,
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

            console.log(`✅ Bot ${action} en ${from} por ${senderNumber}`);

        } catch (error) {
            console.error('❌ Error en bot:', error);
            
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `🍟 Error al ejecutar el comando: ${error.message}`,
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
            } catch (e) {}
        }
    }
};
