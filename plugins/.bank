import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECONOMY_FILE = path.join(__dirname, '..', 'databases', 'economy.json');

function loadEconomy() {
    try {
        if (fs.existsSync(ECONOMY_FILE)) {
            return JSON.parse(fs.readFileSync(ECONOMY_FILE, 'utf8'));
        }
        return {};
    } catch (error) {
        console.error('Error cargando economía:', error);
        return {};
    }
}

function formatLastTime(timestamp) {
    if (!timestamp || timestamp === 0) return 'Nunca';
    const date = new Date(timestamp);
    return date.toLocaleString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    if (typeof num === 'number') {
        return num.toLocaleString('es-MX', { useGrouping: true });
    }
    if (typeof num === 'string' && num.includes('e')) {
        const parsed = parseFloat(num);
        return parsed.toLocaleString('es-MX', { useGrouping: true });
    }
    return num.toString();
}

async function getProfilePicture(sock, jid) {
    try {
        const ppUrl = await sock.profilePictureUrl(jid, 'image');
        if (ppUrl) {
            const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
            return Buffer.from(response.data, 'binary');
        }
    } catch (error) {
        console.log('No se pudo obtener foto de perfil:', error.message);
    }
    return null;
}

export default {
    name: 'bank',
    alias: ['inventario', 'balance', 'bal'],
    
    async execute(sock, msg, options) {
        try {
            const { 
                config, 
                senderNumber, 
                pushName,
                replyWithContext,
                senderJid,
                usersDB 
            } = options;
            
            const from = msg.key.remoteJid;
            
            if (!senderNumber) {
                return await replyWithContext(
                    '❌ No se pudo identificar tu número',
                    [senderJid]
                );
            }
            
            const economy = loadEconomy();
            
            if (!economy[senderNumber]) {
                economy[senderNumber] = {
                    number: senderNumber,
                    name: pushName || 'Usuario',
                    coins: 0,
                    bank: 0,
                    minerals: {
                        piedras: 0,
                        diamantes: 0,
                        esmeraldas: 0,
                        oro: 0,
                        rubies: 0,
                        zafiros: 0,
                        fosiles: 0,
                        arcilla: 0,
                        carbon: 0,
                        hierro: 0,
                        platino: 0,
                        cobre: 0,
                        cristal_magico: 0,
                        polvo_estelar: 0,
                        esencia: 0
                    },
                    health: 100,
                    mana: 50,
                    lastMine: 0,
                    lastWork: 0,
                    lastCrime: 0,
                    lastAdventure: 0,
                    lastClaim: 0,
                    lastChest: 0,
                    lastHunt: 0,
                    lastFish: 0,
                    lastExcavar: 0,
                    lastTesoro: 0,
                    lastReciclar: 0,
                    lastMina2: 0,
                    lastMina3: 0,
                    items: {
                        agua: 0,
                        vendas: 0,
                        pastillas: 0,
                        pico: 1,
                        mapa: 0,
                        pala: 1,
                        varita: 0
                    }
                };
            }
            
            const user = economy[senderNumber];
            
            if (!user.minerals.rubies) user.minerals.rubies = 0;
            if (!user.minerals.zafiros) user.minerals.zafiros = 0;
            if (!user.minerals.fosiles) user.minerals.fosiles = 0;
            if (!user.minerals.arcilla) user.minerals.arcilla = 0;
            if (!user.minerals.carbon) user.minerals.carbon = 0;
            if (!user.minerals.hierro) user.minerals.hierro = 0;
            if (!user.minerals.platino) user.minerals.platino = 0;
            if (!user.minerals.cobre) user.minerals.cobre = 0;
            if (!user.minerals.cristal_magico) user.minerals.cristal_magico = 0;
            if (!user.minerals.polvo_estelar) user.minerals.polvo_estelar = 0;
            if (!user.minerals.esencia) user.minerals.esencia = 0;
            if (!user.items.pico) user.items.pico = 1;
            if (!user.items.mapa) user.items.mapa = 0;
            if (!user.items.pala) user.items.pala = 1;
            if (!user.items.varita) user.items.varita = 0;
            if (!user.mana) user.mana = 50;
            if (user.bank === undefined) user.bank = 0;
            
            // ==========================================
            // DETERMINAR USUARIO OBJETIVO
            // ==========================================
            let targetUser = user;
            let targetName = pushName;
            let targetNumber = senderNumber;
            let targetJid = senderJid;
            
            const mencionado = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
            
            let targetFound = false;
            
            if (mencionado) {
                const identificador = mencionado.split('@')[0];
                
                for (const [num, userData] of Object.entries(usersDB)) {
                    if (userData.lid === mencionado || userData.lid === identificador) {
                        targetNumber = num;
                        targetName = userData.pushName || "Usuario";
                        targetJid = mencionado;
                        targetFound = true;
                        break;
                    }
                }
                
                if (!targetFound && usersDB[identificador]) {
                    targetNumber = identificador;
                    targetName = usersDB[identificador]?.pushName || "Usuario";
                    targetJid = mencionado;
                    targetFound = true;
                }
                
                if (targetFound && economy[targetNumber]) {
                    targetUser = economy[targetNumber];
                } else if (targetFound) {
                    return await replyWithContext(
                        `❌ El usuario @${identificador} no tiene inventario aún`,
                        [mencionado]
                    );
                }
            }
            
            else if (quotedParticipant) {
                const identificador = quotedParticipant.split('@')[0];
                
                for (const [num, userData] of Object.entries(usersDB)) {
                    if (userData.lid === quotedParticipant || userData.lid === identificador) {
                        targetNumber = num;
                        targetName = userData.pushName || "Usuario";
                        targetJid = quotedParticipant;
                        targetFound = true;
                        break;
                    }
                }
                
                if (!targetFound && usersDB[identificador]) {
                    targetNumber = identificador;
                    targetName = usersDB[identificador]?.pushName || "Usuario";
                    targetJid = quotedParticipant;
                    targetFound = true;
                }
                
                if (targetFound && economy[targetNumber]) {
                    targetUser = economy[targetNumber];
                } else if (targetFound) {
                    return await replyWithContext(
                        `❌ El usuario no tiene inventario aún`,
                        [quotedParticipant]
                    );
                }
            }
            
            // Asegurar que el target tenga bank
            if (targetUser.bank === undefined) targetUser.bank = 0;
            
            // Obtener foto de perfil
            const profilePic = await getProfilePicture(sock, targetJid);
            
            // Obtener última actividad
            const lastActivity = Math.max(
                targetUser.lastMine || 0,
                targetUser.lastWork || 0,
                targetUser.lastCrime || 0,
                targetUser.lastAdventure || 0,
                targetUser.lastClaim || 0,
                targetUser.lastChest || 0,
                targetUser.lastHunt || 0,
                targetUser.lastFish || 0,
                targetUser.lastExcavar || 0,
                targetUser.lastTesoro || 0,
                targetUser.lastMina2 || 0,
                targetUser.lastMina3 || 0
            );
            
            const coins = formatNumber(targetUser.coins || 0);
            const bank = formatNumber(targetUser.bank || 0);
            const total = formatNumber((targetUser.coins || 0) + (targetUser.bank || 0));
            const mana = targetUser.mana || 50;
            
            const healthPercent = targetUser.health || 100;
            const healthBars = '❤️'.repeat(Math.floor(healthPercent / 10)) + '🖤'.repeat(10 - Math.floor(healthPercent / 10));
            const manaBars = '💜'.repeat(Math.floor(mana / 10)) + '🤍'.repeat(10 - Math.floor(mana / 10));
            
            // ==========================================
            // DISEÑO UNIFORME CON LETRAS BONITAS (AGREGANDO BANK)
            // ==========================================
            let bankText = `⋂۪࣫⌒᮫⃕͜⏜໋࣮݃⌣໋݃⢾۪ ᪈ִ̣᪲࣫🎑ּ⃨᷒𐑼ִ᪲ ۫⡷۫ ᮫꫶ִׁ࠭⌣ִ໋݃⏜⵿ׁ໋۟⌒۪⃔⋂᮫ׁ࠭\n\n`;
            
            // INFORMACIÓN PRINCIPAL
            bankText += `﹒̸̸ࣳ𝅄࣮࣪۫⃝̷̷⃙🍃 *Nombre* › ${targetName}\n`;
            bankText += `﹒̸̸ࣳ𝅄࣮࣪۫⃝̷̷⃙🍃 *Número* › ${targetNumber}\n`;
            bankText += `﹒̸̸ࣳ𝅄࣮࣪۫⃝̷̷⃙🍃 *Última vez* › ${formatLastTime(lastActivity)}\n`;
            bankText += `*-------------------*\n\n`;
            
            // ESTADÍSTICAS VITALES
            bankText += `⚕️ *Salud* › ${healthPercent}%\n`;
            bankText += `${healthBars}\n`;
            bankText += `🔮 *Mana* › ${mana}%\n`;
            bankText += `${manaBars}\n\n`;
            
            // MONEDAS Y BANCO (AGREGADO)
            bankText += `💰 *Coins* › ${coins}\n`;
            bankText += `🏦 *Banco* › ${bank}\n`;
            bankText += `📊 *Total* › ${total}\n\n`;
            
            // MINERALES BÁSICOS
            bankText += `🪨 *Minerales*\n`;
            bankText += `⋂۪࣫⌒᮫⃕͜⏜໋࣮݃⌣໋݃⢾۪ ᪈ִ̣᪲࣫🎑ּ⃨᷒𐑼ִ᪲ ۫⡷۫ ᮫꫶ִׁ࠭⌣ִ໋݃⏜⵿ׁ໋۟⌒۪⃔⋂᮫ׁ࠭\n`;
            bankText += `🪙 Oro » ${formatNumber(targetUser.minerals?.oro || 0)}\n`;
            bankText += `💎 Diamantes » ${formatNumber(targetUser.minerals?.diamantes || 0)}\n`;
            bankText += `💚 Esmeraldas » ${formatNumber(targetUser.minerals?.esmeraldas || 0)}\n`;
            bankText += `🪨 Piedras » ${formatNumber(targetUser.minerals?.piedras || 0)}\n`;
            bankText += `⋂۪࣫⌒᮫⃕͜⏜໋࣮݃⌣໋݃⢾۪ ᪈ִ̣᪲࣫🎑ּ⃨᷒𐑼ִ᪲ ۫⡷۫ ᮫꫶ִׁ࠭⌣ִ໋݃⏜⵿ׁ໋۟⌒۪⃔⋂᮫ׁ࠭\n\n`;
            
            // MINERALES ESPECIALES
            bankText += `💎 *Especiales*\n`;
            bankText += `⋂۪࣫⌒᮫⃕͜⏜໋࣮݃⌣໋݃⢾۪ ᪈ִ̣᪲࣫🎑ּ⃨᷒𐑼ִ᪲ ۫⡷۫ ᮫꫶ִׁ࠭⌣ִ໋݃⏜⵿ׁ໋۟⌒۪⃔⋂᮫ׁ࠭\n`;
            bankText += `🔴 Rubíes » ${formatNumber(targetUser.minerals?.rubies || 0)}\n`;
            bankText += `🔵 Zafiros » ${formatNumber(targetUser.minerals?.zafiros || 0)}\n`;
            bankText += `🦴 Fósiles » ${formatNumber(targetUser.minerals?.fosiles || 0)}\n`;
            bankText += `🧱 Arcilla » ${formatNumber(targetUser.minerals?.arcilla || 0)}\n`;
            bankText += `🪨 Carbón » ${formatNumber(targetUser.minerals?.carbon || 0)}\n`;
            bankText += `⛓️ Hierro » ${formatNumber(targetUser.minerals?.hierro || 0)}\n`;
            bankText += `🥈 Platino » ${formatNumber(targetUser.minerals?.platino || 0)}\n`;
            bankText += `🥉 Cobre » ${formatNumber(targetUser.minerals?.cobre || 0)}\n`;
            bankText += `⋂۪࣫⌒᮫⃕͜⏜໋࣮݃⌣໋݃⢾۪ ᪈ִ̣᪲࣫🎑ּ⃨᷒𐑼ִ᪲ ۫⡷۫ ᮫꫶ִׁ࠭⌣ִ໋݃⏜⵿ׁ໋۟⌒۪⃔⋂᮫ׁ࠭\n\n`;
            
            // MINERALES MÁGICOS
            bankText += `🔮 *Mágicos*\n`;
            bankText += `⋂۪࣫⌒᮫⃕͜⏜໋࣮݃⌣໋݃⢾۪ ᪈ִ̣᪲࣫🎑ּ⃨᷒𐑼ִ᪲ ۫⡷۫ ᮫꫶ִׁ࠭⌣ִ໋݃⏜⵿ׁ໋۟⌒۪⃔⋂᮫ׁ࠭\n`;
            bankText += `🔮 Cristal » ${formatNumber(targetUser.minerals?.cristal_magico || 0)}\n`;
            bankText += `✨ Polvo » ${formatNumber(targetUser.minerals?.polvo_estelar || 0)}\n`;
            bankText += `💫 Esencia » ${formatNumber(targetUser.minerals?.esencia || 0)}\n`;
            bankText += `⋂۪࣫⌒᮫⃕͜⏜໋࣮݃⌣໋݃⢾۪ ᪈ִ̣᪲࣫🎑ּ⃨᷒𐑼ִ᪲ ۫⡷۫ ᮫꫶ִׁ࠭⌣ִ໋݃⏜⵿ׁ໋۟⌒۪⃔⋂᮫ׁ࠭\n\n`;
            
            // ITEMS
            bankText += `🎒 *Items*\n`;
            bankText += `⋂۪࣫⌒᮫⃕͜⏜໋࣮݃⌣໋݃⢾۪ ᪈ִ̣᪲࣫🎑ּ⃨᷒𐑼ִ᪲ ۫⡷۫ ᮫꫶ִׁ࠭⌣ִ໋݃⏜⵿ׁ໋۟⌒۪⃔⋂᮫ׁ࠭\n`;
            bankText += `🍶 Agua » ${formatNumber(targetUser.items?.agua || 0)}\n`;
            bankText += `🩹 Vendas » ${formatNumber(targetUser.items?.vendas || 0)}\n`;
            bankText += `💊 Pastillas » ${formatNumber(targetUser.items?.pastillas || 0)}\n`;
            bankText += `🗺️ Mapas » ${formatNumber(targetUser.items?.mapa || 0)}\n`;
            bankText += `⛏️ Pico » Nv ${targetUser.items?.pico || 1}\n`;
            bankText += `🪏 Pala » Nv ${targetUser.items?.pala || 1}\n`;
            bankText += `🪄 Varita » ${formatNumber(targetUser.items?.varita || 0)}\n`;
            bankText += `⋂۪࣫⌒᮫⃕͜⏜໋࣮݃⌣໋݃⢾۪ ᪈ִ̣᪲࣫🎑ּ⃨᷒𐑼ִ᪲ ۫⡷۫ ᮫꫶ִׁ࠭⌣ִ໋݃⏜⵿ׁ໋۟⌒۪⃔⋂᮫ׁ࠭\n\n`;
            
            bankText += `*© 2026 - Moonlight Staff*`;
            
            const mentions = targetJid ? [targetJid] : [senderJid];
            
            // Preparar mensaje con imagen y texto juntos
            const messageData = {
                text: bankText,
                mentions: mentions,
                contextInfo: {
                    mentionedJid: mentions,
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.canalId || '',
                        serverMessageId: 0,
                        newsletterName: config.canalNombre || ''
                    }
                }
            };
            
            // Si hay foto de perfil, enviarla como imagen con el texto en caption
            if (profilePic) {
                await sock.sendMessage(from, {
                    image: profilePic,
                    caption: bankText,
                    mentions: mentions,
                    contextInfo: {
                        mentionedJid: mentions,
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
                // Solo enviar el texto
                await sock.sendMessage(from, messageData, { quoted: msg });
            }
            
        } catch (error) {
            console.error('❌ Error en comando bank:', error);
            await options.replyWithContext(
                `❌ Error: ${error.message}`,
                [options.senderJid]
            );
        }
    }
};
