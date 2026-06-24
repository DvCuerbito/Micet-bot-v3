import { startSubBot } from '../lib/startSubBot.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Almacén para cooldowns, códigos pendientes y vínculos exitosos
const cooldowns = new Map();
const pendingCodes = new Map();
const successfulLinks = new Map();

// Límite máximo de sub-bots
const MAX_SUB_BOTS = 20;

// Función para contar sub-bots existentes en Sessions/Subs
function countExistingSubBots() {
    try {
        const subsDir = path.join(process.cwd(), 'Sessions', 'Subs');
        
        if (!fs.existsSync(subsDir)) {
            return 0;
        }
        
        const subFolders = fs.readdirSync(subsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .length;
        
        return subFolders;
    } catch (error) {
        console.error('Error contando sub-bots:', error);
        return 0;
    }
}

// Función para buscar imagen code.jpg
function findImage() {
  const possiblePaths = [
    'img/code.jpg',
    './img/code.jpg',
    '../img/code.jpg',
    '../../img/code.jpg',
    './src/img/code.jpg',
    '../src/img/code.jpg'
  ];
  
  for (const imagePath of possiblePaths) {
    try {
      if (fs.existsSync(imagePath)) {
        return fs.readFileSync(imagePath);
      }
    } catch (error) {
      // Continuar con la siguiente ruta
    }
  }
  return null;
}

// Función para obtener el JID del usuario (para menciones)
function getUserJid(msg) {
  if (msg.key?.participantAlt) {
    return msg.key.participantAlt;
  } else if (msg.key?.participant) {
    const participant = msg.key.participant;
    if (participant.includes('@s.whatsapp.net') || participant.includes('@lid')) {
      return participant;
    }
  }
  if (!msg.key.remoteJid.endsWith('@g.us')) {
    return msg.key.remoteJid;
  }
  return null;
}

// Función para obtener el número real del usuario
function getUserPhoneNumber(msg) {
  if (msg.key?.participantAlt) {
    return msg.key.participantAlt.split('@')[0];
  }
  if (!msg.key.remoteJid.endsWith('@g.us')) {
    const jid = msg.key.remoteJid;
    if (jid.includes('@s.whatsapp.net')) {
      return jid.split('@')[0];
    }
  }
  return null;
}

export default {
    name: 'code',
    alias: ['jadibot'],
    
    async execute(sock, msg, options) {
        try {
            const { config } = options;
            const from = msg.key.remoteJid;
            
            // VERIFICAR LÍMITE DE SUB-BOTS
            const currentSubBots = countExistingSubBots();
            
            if (currentSubBots >= MAX_SUB_BOTS) {
                return await sock.sendMessage(from, {
                    text: '😅 *ᥒ᥆ sᥱ һᥲᥒ ᥱᥒᥴ᥆ᥒ𝗍rᥲძ᥆ ᥱs⍴ᥲᥴі᥆s ⍴ᥲrᥲ ᥒᥙᥱ᥎᥆s sᥙᑲ-ᑲ᥆𝗍s*\n> *іᥒ𝗍ᥱᥒ𝗍ᥲ ძᥱ ᥒᥙᥱ᥎᥆ ᥱᥒ ᥙᥒ᥆s mіᥒᥙ𝗍᥆s*'
                }, { quoted: msg });
            }
            
            // Obtener el número real del usuario automáticamente
            let phone = getUserPhoneNumber(msg);
            
            if (!phone) {
                return await sock.sendMessage(from, {
                    text: '🌠 *proporciona el número que vinculará*\n> Ejemplo: .code 5219992042946'
                }, { quoted: msg });
            }
            
            // Limpiar el número (eliminar cualquier carácter no numérico)
            phone = phone.replace(/\D/g, '');
            
            // Obtener JID del usuario para mención
            const userJid = getUserJid(msg);
            
            const userKey = `${from}-${msg.key?.participant || msg.key?.remoteJid}`;
            
            // Verificar cooldown
            const now = Date.now();
            const cooldownTime = 2 * 60 * 1000; // 2 minutos en milisegundos
            
            if (cooldowns.has(userKey)) {
                const expirationTime = cooldowns.get(userKey) + cooldownTime;
                if (now < expirationTime) {
                    const timeLeft = Math.ceil((expirationTime - now) / 1000);
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    const timeText = `${minutes > 0 ? `${minutes} min ` : ''}${seconds} seg`;
                    
                    return await sock.sendMessage(from, {
                        text: `🍟 *esperar* ${timeText} *para volver a solicitar un codigo*`
                    }, { quoted: msg });
                }
            }
            
            // Validar número (entre 8 y 15 dígitos, solo números)
            if (!phone || phone.length < 8 || phone.length > 15) {
                return await sock.sendMessage(from, {
                    text: '🥶 *no se pudo obtener un número válido*\n> Proporciona el número manualmente: .code 5219992042946'
                }, { quoted: msg });
            }
            
            // Verificar si ya hay un código pendiente para este número
            if (pendingCodes.has(phone)) {
                const pendingData = pendingCodes.get(phone);
                if (now < pendingData.expiresAt) {
                    return await sock.sendMessage(from, {
                        text: '😑 *ya hay un codigo pendiente para este numero*\n\nespera a que el codigo actual expire o se vincule'
                    }, { quoted: msg });
                }
            }
            
            // Registrar cooldown
            cooldowns.set(userKey, now);
            
            // Limpiar cooldown antiguo después de 2 minutos
            setTimeout(() => {
                cooldowns.delete(userKey);
            }, cooldownTime);
            
            // Guardar referencia al mensaje original para responder después
            const originalMessage = msg;
            
            try {
                // Registrar código pendiente con tiempo de expiración (60 segundos)
                pendingCodes.set(phone, {
                    chatId: from,
                    userKey: userKey,
                    expiresAt: now + (60 * 1000),
                    timestamp: now,
                    originalMessage: originalMessage,
                    userJid: userJid
                });
                
                // Configurar timeout para expiración automática
                const expirationTimeout = setTimeout(async () => {
                    if (pendingCodes.has(phone) && !successfulLinks.has(phone)) {
                        pendingCodes.delete(phone);
                        
                        try {
                            await sock.sendMessage(from, {
                                text:  ' ⫿😑 ּ〬炙֒ *ƚꪱᧉ𝗆𝗉ᦅ dᧉ ᥎ꪱ𝗇c𝗎𝗅αcꪱó𝗇 αgᦅƚαdᦅ*\n> *ꪱ𝗇ƚᧉ𝗇ƚα 𝗇𝗎ᧉ᥎α𝗆ᧉ𝗇ƚᧉ ᧉ𝗇 𝟤 𝗆ꪱ𝗇𝗎ƚᦅ𝗌*'
                            }, { quoted: originalMessage });
                        } catch (error) {
                            console.error('Error enviando mensaje de expiración:', error);
                        }
                    }
                }, 60 * 1000);
                
                // Enviar el mensaje de instrucciones primero
                const instructionsMessage = await sock.sendMessage(from, {
                    text: `         𝑺 𝑬 𝑹 - 𝑩 𝑶 𝑻\n⋰〭ᩫ😼  *𝗌ꪱg𝗎ᧉ ᧉ𝗌ƚᦅ𝗌 𝗉α𝗌ᦅ𝗌 𝗉αꭇα cᦅ𝗇ᧉcƚαꭇ 𝗎𝗇 𝗌𝗎b-bᦅƚ*\n\nꘓ᜔໋۪🥪 • *𝗆á𝗌 αȷ𝗎𝗌ƚᧉ𝗌 › dꪱ𝗌𝗉ᦅ𝗌ꪱƚꪱ᥎ᦅ𝗌 ᥎ꪱ𝗇c𝗎𝗅αdᦅ𝗌 › ᥎ꪱ𝗇c𝗎𝗅αꭇ 𝗎𝗇 dꪱ𝗌𝗉ᦅ𝗌ꪱƚꪱ᥎ᦅ › ᥎ꪱ𝗇c𝗎𝗅αꭇ 𝗎𝗌α𝗇dᦅ 𝗇ú𝗆ᧉꭇᦅ dᧉ ƚᧉ𝗅é𝖿ᦅ𝗇ᦅ*\n\n> ⚠︎ *𝗇ᦅ ᧉ𝗌 ꭇᧉcᦅ𝗆ᧉ𝗇dαb𝗅ᧉ cᦅ𝗇ᧉcƚαꭇ 𝗎𝗇 𝗌𝗎b-bᦅƚ ᧉ𝗇 c𝗎ᧉ𝗇ƚα𝗌 𝗉ꭇꪱ𝗇cꪱ𝗉α𝗅ᧉ𝗌*`                }, { quoted: originalMessage });
                
                // Usar el startSubBot con callbacks
                await startSubBot({
                    m: originalMessage,
                    client: sock,
                    phone: phone,
                    chatId: from,
                    caption: '',
                    joinGroup: true,
                    onSuccess: async (connectedNumber) => {
                        clearTimeout(expirationTimeout);
                        pendingCodes.delete(phone);
                        successfulLinks.set(phone, {
                            timestamp: now,
                            chatId: from
                        });
                        
                        setTimeout(async () => {
                            try {
                                await sock.sendMessage(from, { delete: instructionsMessage.key });
                            } catch {}
                        }, 60_000);
                        
                        if (originalMessage && originalMessage.key && originalMessage.key.remoteJid !== 'auto-reconnect@system') {
                            try {
                                const targetUserJid = userJid || originalMessage.key?.participant || originalMessage.key?.remoteJid;
                                
                                let successMessage = '';
                                if (targetUserJid) {
                                    successMessage = `٠ׄ🍟  ִ❝ ۫ ۪ 𝑣𝑖𝑛𝑐𝑢𝑙𝑎𝑐𝑖𝑜́𝑛 𝑒𝑥𝑖𝑡𝑜𝑠𝑎  ᜒ⩨ִ  ֗ ❞〪 ׄ 🍟\n\n> ֗  ִᯙ  〫 ̣۫🧃᪲ ּ̥ *𝗎𝗌ᧉꭇ* › @${phone}\n> ֗  ִᯙ  〫 ̣۫🧃᪲ ּ̥ *𝗇𝗎𝗆ᧉꭇᦅ* › ${connectedNumber || phone}\n\n*︶ׅ◌𓈒𝆬⏝𖦹ׅ۟๑ׄ╰〪۪݊╯〫ׄ𓈒︶۟╰〪۪݊*\n> *ᧉdꪱƚα ƚ𝗎 bᦅƚ α ƚ𝗎 g𝗎𝗌ƚᦅ 𝗎𝗌α𝗇dᦅ:*\n\n> ۪〫ᨀ𑂺᮫๋  *${config.prefix}setbanner*\n> ۪〫ᨀ𑂺᮫๋  *${config.prefix}seticon*\n> ۪〫ᨀ𑂺᮫๋  *${config.prefix}setname*\n> ۪〫ᨀ𑂺᮫๋  *${config.prefix} setchannel*\n> ۪〫ᨀ𑂺᮫๋  *${config.prefix} setchannelid*`;
                                } else {
                                    successMessage = `😼 Se ha vinculado un nuevo Sub-Bot.\n> Número: ${connectedNumber || phone}\n> Usa .infobot para ver la información del sub-bot`;
                                }
                                
                                await sock.sendMessage(from, {
                                    text: successMessage,
                                    mentions: targetUserJid ? [targetUserJid] : []
                                }, { quoted: originalMessage });
                            } catch (error) {
                                console.error('Error enviando mensaje de éxito:', error);
                            }
                        } else {
                            console.log(`✅ Sub-bot ${connectedNumber || phone} reconectado automaticamente`);
                        }
                    },
                    onError: (error) => {
                        clearTimeout(expirationTimeout);
                        pendingCodes.delete(phone);
                        
                        setTimeout(async () => {
                            try {
                                await sock.sendMessage(from, { delete: instructionsMessage.key });
                            } catch {}
                        }, 1000);
                        
                        console.error('Error en startSubBot:', error.message || error);
                    }
                });
                
            } catch (error) {
                console.error('[ERROR SUBBOT]:', error);
                pendingCodes.delete(phone);
            }
            
        } catch (error) {
            console.error('❌ Error en code:', error);
        }
    }
};
