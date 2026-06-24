import fs from 'fs';
import path from 'path';

const ALLOWED_RANKS = ['owner', 'c-owner', 'srmod', 'mod', 'trialmod', 'trial', 'helper', 'applicant'];

function extractNumberFromJid(jid) {
    if (!jid) return null;
    return jid.split('@')[0].replace(/\D/g, '');
}

function getRealPhoneNumber(usersDB, jid) {
    if (!jid || !usersDB) return null;
    
    const identificador = jid.split('@')[0];
    
    for (const [num, data] of Object.entries(usersDB)) {
        if (data.lid === jid || data.lid === identificador) {
            return num;
        }
    }
    
    for (const [num, data] of Object.entries(usersDB)) {
        if (data.jid === jid || data.jid === identificador) {
            return num;
        }
    }
    
    if (/^[\d]+$/.test(identificador) && identificador.length > 8) {
        if (usersDB[identificador]) {
            return identificador;
        }
        return identificador;
    }
    
    return null;
}

export default {
    name: 'delmod',
    alias: [],
    
    async execute(sock, msg, options) {
        try {
            const { config, usersDB, senderNumber, senderJid, args } = options;
            const from = msg.key.remoteJid;
            
            const isOwner = config.owner && config.owner.some(ownerNum => 
                ownerNum.replace(/\D/g, '') === (senderNumber || '').replace(/\D/g, '')
            );
            
            if (!isOwner) {
                await sock.sendMessage(from, {
                    text: `๑ֵ݊🍀 ᥱᥣ ᥴ᥆mᥲᥒძ᥆ \`${config.prefix}delmod\` ᥒ᥆ ᥱ᥊іs𝗍ᥱ.\n> ೯۪🎑̶ֵ ᥙsᥲ ${config.prefix}help ⍴ᥲrᥲ ᥎ᥱr mіs ᥴ᥆mᥲᥒძ᥆s`,
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
            
            let targetIdentifier = null;
            let targetMentionJid = null;
            let targetNumber = null;
            
            if (args && args.length > 0 && /^\d+$/.test(args[0])) {
                targetNumber = args[0];
                targetMentionJid = `${targetNumber}@s.whatsapp.net`;
                console.log(`✅ Usuario por número: ${targetNumber}`);
            }
            else {
                let mentionedJids = [];
                if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                    mentionedJids = msg.message.extendedTextMessage.contextInfo.mentionedJid;
                }
                
                const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
                
                if (mentionedJids && mentionedJids.length > 0) {
                    targetIdentifier = mentionedJids[0];
                    targetMentionJid = targetIdentifier;
                    targetNumber = getRealPhoneNumber(usersDB, targetIdentifier);
                    console.log(`✅ Usuario por mención: ${targetIdentifier} -> Número real: ${targetNumber}`);
                }
                else if (quotedParticipant) {
                    targetIdentifier = quotedParticipant;
                    targetMentionJid = targetIdentifier;
                    targetNumber = getRealPhoneNumber(usersDB, targetIdentifier);
                    console.log(`✅ Usuario por respuesta: ${targetIdentifier} -> Número real: ${targetNumber}`);
                }
            }
            
            if (!targetNumber) {
                await sock.sendMessage(from, {
                    text: `🐈 *Debes responder, mencionar o proporcionar un número*\n> Ejemplo: ${config.prefix}delmod 5219992042946`,
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
            
            console.log(`🎯 Número objetivo: ${targetNumber}, JID: ${targetMentionJid}`);
            
            if (!usersDB[targetNumber]) {
                await sock.sendMessage(from, {
                    text: `♡ El usuario ${targetNumber} no está registrado en ${config.name}`,
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
            
            if (!usersDB[targetNumber].rank) {
                const mentionJid = usersDB[targetNumber].jid || 
                                  (usersDB[targetNumber].lid ? `${usersDB[targetNumber].lid}@lid` : `${targetNumber}@s.whatsapp.net`);
                
                await sock.sendMessage(from, {
                    text: `🎍 @${targetNumber} *No tiene ningún rango asignado*`,
                    mentions: [mentionJid],
                    contextInfo: {
                        mentionedJid: [mentionJid],
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
            
            const oldRank = usersDB[targetNumber].rank;
            
            delete usersDB[targetNumber].rank;
            delete usersDB[targetNumber].rankAssignedAt;
            delete usersDB[targetNumber].rankAssignedBy;
            
            const usersDBPath = path.join(process.cwd(), 'databases', 'users.json');
            fs.writeFileSync(usersDBPath, JSON.stringify(usersDB, null, 2));
            
            const mentionJid = usersDB[targetNumber].jid || 
                              (usersDB[targetNumber].lid ? `${usersDB[targetNumber].lid}@lid` : `${targetNumber}@s.whatsapp.net`);
            
            await sock.sendMessage(from, {
                text: `🍃 @${targetNumber} *Se le ha quitado el rango* *${oldRank}*`,
                mentions: [mentionJid],
                contextInfo: {
                    mentionedJid: [mentionJid],
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
            console.error('Error en delmod:', error);
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Error al quitar rango: ${error.message}`,
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
        }
    }
};
