import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para normalizar números mexicanos (eliminar el 1 después del 52)
function normalizeMexicanNumber(phone) {
    if (!phone) return phone;
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    if (cleanPhone.startsWith('52') && cleanPhone.length === 13) {
        if (cleanPhone[2] === '1') {
            return cleanPhone.substring(0, 2) + cleanPhone.substring(3);
        }
    }
    return cleanPhone;
}

// Función para extraer número de phoneNumber
function extractNumberFromPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    return phoneNumber.split('@')[0];
}

// Función para obtener el nombre del bot desde su archivo de configuración
function getBotName(botNumber) {
    try {
        if (!botNumber) return null;
        
        const cleanNumber = botNumber.replace(/[^0-9]/g, '');
        console.log(`[BOTS] Buscando nombre para bot: ${cleanNumber}`);
        
        let searchNumber = cleanNumber;
        if (cleanNumber.startsWith('52') && cleanNumber.length === 13 && cleanNumber[2] === '1') {
            searchNumber = cleanNumber.substring(0, 2) + cleanNumber.substring(3);
            console.log(`[BOTS] Número normalizado para búsqueda: ${searchNumber}`);
        }
        
        let foundName = findBotNameInFolders(cleanNumber);
        if (foundName) return foundName;
        
        if (searchNumber !== cleanNumber) {
            foundName = findBotNameInFolders(searchNumber);
            if (foundName) return foundName;
        }
        
        const infoDir = path.join(process.cwd(), 'info');
        if (fs.existsSync(infoDir)) {
            const folders = fs.readdirSync(infoDir, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(folder => folder.name);
            
            for (const folder of folders) {
                const folderClean = folder.replace(/[^0-9]/g, '');
                const folderNormalized = normalizeMexicanNumber(folderClean);
                
                if (folderNormalized === normalizeMexicanNumber(cleanNumber) || 
                    folderNormalized === normalizeMexicanNumber(searchNumber)) {
                    
                    const configPath = path.join(infoDir, folder, 'config.js');
                    if (fs.existsSync(configPath)) {
                        const content = fs.readFileSync(configPath, 'utf8');
                        let match = content.match(/name:\s*['"]([^'"]+)['"]/);
                        if (match && match[1]) return match[1];
                        match = content.match(/"name"\s*:\s*["']([^"']+)["']/);
                        if (match && match[1]) return match[1];
                    }
                }
            }
        }
    } catch (error) {
        console.log(`⚠️ Error obteniendo nombre:`, error.message);
    }
    return null;
}

function findBotNameInFolders(searchNumber) {
    try {
        const possiblePaths = [
            path.join(process.cwd(), 'info', searchNumber, 'config.js'),
            path.join(process.cwd(), 'info', searchNumber, 'config.json'),
            path.join(process.cwd(), 'info', `config-${searchNumber}.js`),
            path.join(process.cwd(), 'info', `config-${searchNumber}.json`)
        ];
        
        for (const configPath of possiblePaths) {
            if (fs.existsSync(configPath)) {
                const fileContent = fs.readFileSync(configPath, 'utf8');
                let match = fileContent.match(/name:\s*['"]([^'"]+)['"]/);
                if (match && match[1]) return match[1];
                match = fileContent.match(/"name"\s*:\s*["']([^"']+)["']/);
                if (match && match[1]) return match[1];
                
                if (configPath.endsWith('.json')) {
                    try {
                        const jsonData = JSON.parse(fileContent);
                        if (jsonData.name) return jsonData.name;
                    } catch (e) {}
                }
            }
        }
    } catch (error) {}
    return null;
}

// Función para obtener el icono/banner del bot actual (mismo estilo que uptime)
function getBotIcon(sock) {
    try {
        let botNumber = '';
        if (sock.phoneNumber) {
            botNumber = sock.phoneNumber.replace(/[^0-9]/g, '');
        } else if (sock.user?.id) {
            botNumber = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
        }
        
        const normalizedBotNumber = normalizeMexicanNumber(botNumber);
        
        if (botNumber) {
            // Buscar icon.jpg (mismo que usa uptime)
            let botIconPath = path.join(process.cwd(), 'info', botNumber, 'icon.jpg');
            if (fs.existsSync(botIconPath)) {
                return fs.readFileSync(botIconPath);
            }
            
            if (normalizedBotNumber !== botNumber) {
                botIconPath = path.join(process.cwd(), 'info', normalizedBotNumber, 'icon.jpg');
                if (fs.existsSync(botIconPath)) {
                    return fs.readFileSync(botIconPath);
                }
            }
            
            const infoDir = path.join(process.cwd(), 'info');
            if (fs.existsSync(infoDir)) {
                const folders = fs.readdirSync(infoDir, { withFileTypes: true })
                    .filter(d => d.isDirectory())
                    .map(folder => folder.name);
                
                for (const folder of folders) {
                    const folderNormalized = normalizeMexicanNumber(folder);
                    if (folderNormalized === normalizedBotNumber) {
                        const altIconPath = path.join(infoDir, folder, 'icon.jpg');
                        if (fs.existsSync(altIconPath)) {
                            return fs.readFileSync(altIconPath);
                        }
                    }
                }
            }
        }
        
        // Icono general
        const generalIconPath = path.join(__dirname, '..', 'img', 'icon.jpg');
        if (fs.existsSync(generalIconPath)) {
            return fs.readFileSync(generalIconPath);
        }
    } catch (error) {}
    return null;
}

function compareMexicanNumbers(num1, num2) {
    if (!num1 || !num2) return false;
    return normalizeMexicanNumber(num1) === normalizeMexicanNumber(num2);
}

export default {
    name: 'bots',
    alias: ['sockets', 'listbots'],
    
    async execute(sock, msg, options) {
        try {
            const { config } = options;
            const from = msg.key.remoteJid;
            
            // Obtener el número del principal (index.js)
            let principalNumber = null;
            const tempAuthPath = path.join(process.cwd(), 'sessions', 'creds.json');
            
            if (fs.existsSync(tempAuthPath)) {
                try {
                    const creds = JSON.parse(fs.readFileSync(tempAuthPath, 'utf8'));
                    if (creds?.me?.id) {
                        const principalJid = creds.me.id.split(':')[0] + '@s.whatsapp.net';
                        principalNumber = extractNumberFromPhoneNumber(principalJid);
                        console.log(`[BOTS] Principal: ${principalNumber}`);
                    }
                } catch (error) {
                    console.error('[BOTS] Error leyendo creds.json:', error);
                }
            }

            // Obtener números de MAIN BOTS de Sessions/Main
            const mainNumbers = new Set();
            const mainsDir = path.join(process.cwd(), 'Sessions/Main');
            
            if (fs.existsSync(mainsDir)) {
                const mainFolders = fs.readdirSync(mainsDir, { withFileTypes: true })
                    .filter(d => d.isDirectory())
                    .map(folder => folder.name);
                
                for (const mainNumber of mainFolders) {
                    mainNumbers.add(mainNumber);
                    console.log(`[BOTS] Main bot: ${mainNumber}`);
                }
            }

            // Obtener números de SUB BOTS de Sessions/Subs
            const subNumbers = new Set();
            const subsDir = path.join(process.cwd(), 'Sessions/Subs');
            
            if (fs.existsSync(subsDir)) {
                const subFolders = fs.readdirSync(subsDir, { withFileTypes: true })
                    .filter(d => d.isDirectory())
                    .map(folder => folder.name);
                
                for (const subNumber of subFolders) {
                    subNumbers.add(subNumber);
                    console.log(`[BOTS] Sub bot: ${subNumber}`);
                }
            }

            // Obtener participantes del grupo
            let groupParticipants = [];
            let botsInGroup = {
                principal: [],
                mains: [],
                subs: []
            };
            
            if (from.endsWith('@g.us')) {
                try {
                    const groupMetadata = await sock.groupMetadata(from);
                    groupParticipants = groupMetadata.participants;
                    
                    for (const participant of groupParticipants) {
                        const participantPhoneNumber = participant.phoneNumber || participant.id;
                        const participantNumber = extractNumberFromPhoneNumber(participantPhoneNumber);
                        const participantJid = participant.id;
                        
                        if (!participantNumber) continue;
                        
                        if (principalNumber) {
                            if (compareMexicanNumbers(participantNumber, principalNumber)) {
                                const botName = getBotName(participantNumber) || 'Principal';
                                botsInGroup.principal.push({
                                    number: participantNumber,
                                    jid: participantJid,
                                    phoneNumber: participantPhoneNumber,
                                    name: botName
                                });
                                continue;
                            }
                        }
                        
                        let found = false;
                        for (const mainNum of mainNumbers) {
                            if (compareMexicanNumbers(participantNumber, mainNum)) {
                                const botName = getBotName(participantNumber) || 'Main';
                                botsInGroup.mains.push({
                                    number: participantNumber,
                                    jid: participantJid,
                                    phoneNumber: participantPhoneNumber,
                                    name: botName
                                });
                                found = true;
                                break;
                            }
                        }
                        if (found) continue;
                        
                        for (const subNum of subNumbers) {
                            if (compareMexicanNumbers(participantNumber, subNum)) {
                                const botName = getBotName(participantNumber) || 'Sub-Bot';
                                botsInGroup.subs.push({
                                    number: participantNumber,
                                    jid: participantJid,
                                    phoneNumber: participantPhoneNumber,
                                    name: botName
                                });
                                break;
                            }
                        }
                    }
                    
                } catch (error) {
                    console.error('[BOTS] Error obteniendo metadata:', error);
                }
            }
            
            const totalPrincipales = principalNumber ? 1 : 0;
            const totalMains = mainNumbers.size;
            const totalSubs = subNumbers.size;
            const totalPrincipalesYMains = totalPrincipales + totalMains;
            const totalGeneral = totalPrincipales + totalMains + totalSubs;
            const totalBotsEnGrupo = botsInGroup.principal.length + botsInGroup.mains.length + botsInGroup.subs.length;

            // Construir el texto (diseño original)
            let text = `╭──────· · ୨୧ · ·──────╮\n⭐⃝  *Lista de bots activos*\n╰──────· · ୨୧ · ·──────╯\n🌟〪֯ ׅ ֗〣 *Total Bots :: (${totalGeneral}) sesiones*\n\n.🌵 ⃘᜔ּ֦۪࠭᪲ׄຼ. *Principales :: ${totalPrincipalesYMains} sesiones*\n.🌵 ⃘᜔ּ֦۪࠭᪲ׄຼ. *Sub-Bots :: ${totalSubs} sesiones*\n\n`;

            if (from.endsWith('@g.us')) {
                text += `.🧃❀ꨫᤲꨭ𑪐ꨭ *En este grupo (${totalBotsEnGrupo})*\n\n`;
                
                for (const bot of botsInGroup.principal) {
                    text += `ꆬ֢ꆬ݄ *Owner ${bot.name}* » @${bot.number}\n`;
                }
                for (const bot of botsInGroup.mains) {
                    text += `ꆬ֢ꆬ݄ *Mod ${bot.name}* » @${bot.number}\n`;
                }
                for (const bot of botsInGroup.subs) {
                    text += `ꆬ֢ꆬ݄ *Sub ${bot.name}* » @${bot.number}\n`;
                }
                
                if (totalBotsEnGrupo === 0) {
                    text += `🍟 No hay bots en este grupo\n`;
                }
            }

            // Cargar icono del bot actual (mismo que uptime)
            const iconBuffer = getBotIcon(sock);

            // Preparar menciones
            const mentions = [
                ...botsInGroup.principal.map(b => b.phoneNumber),
                ...botsInGroup.mains.map(b => b.phoneNumber),
                ...botsInGroup.subs.map(b => b.phoneNumber)
            ];

            const messageData = {
                text: text,
                mentions: mentions,
                contextInfo: {
                    mentionedJid: mentions,
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.canalId || '120363403616345878@newsletter',
                        serverMessageId: 0,
                        newsletterName: config.canalNombre || '=͟͟͞♡ 𝗟𝗶𝗴𝗵𝘁 𝗠𝗼𝗼𝗻𝗹𝗶𝗴𝗵𝘁 =͟͟͞♡'
                    }
                }
            };

            // Añadir banner estilo uptime (exactamente igual al de uptime)
            if (iconBuffer) {
                messageData.contextInfo.externalAdReply = {
                    title: `⣠⣼⠟✿ᩧ✶ ׅ${config.name} ✿ᩧ▚`,
                    body: `Made with 😼 - MICET BOT STAFF`,
                    thumbnail: iconBuffer,
                    mediaType: 1,
                    showAdAttribution: false,
                    renderLargerThumbnail: false
                };
                console.log('✅ Banner estilo uptime añadido al mensaje');
            }

            await sock.sendMessage(from, messageData, { quoted: msg });
            
        } catch (error) {
            console.error('[BOTS ERROR]:', error);
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: '🌨️ *Error al obtener lista de bots*',
                contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true
                }
            }, { quoted: msg });
        }
    }
};
