import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivos de bases de datos
const USERS_FILE = path.join(__dirname, '..', 'databases', 'users.json');
const LEVEL_FILE = path.join(__dirname, '..', 'databases', 'level.json');
const ECONOMY_FILE = path.join(__dirname, '..', 'databases', 'economy.json');
const WARNS_FILE = path.join(__dirname, '..', 'databases', 'warns.json');
const PACKS_FILE = path.join(__dirname, '..', 'databases', 'packs.json');
const PRIMARIOS_FILE = path.join(__dirname, '..', 'databases', 'primarios.json');

// Función para limpiar número
function cleanNumber(num) {
    if (!num) return '';
    return num.toString().replace(/[^0-9]/g, '');
}

// Función para cargar JSON
function loadJSON(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error cargando ${filePath}:`, error);
    }
    return {};
}

// Función para guardar JSON
function saveJSON(filePath, data) {
    try {
        const dbDir = path.dirname(filePath);
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error guardando ${filePath}:`, error);
        return false;
    }
}

// Función para transferir datos de un número a otro
function transferData(oldNumber, newNumber, data, targetKey) {
    if (data[oldNumber]) {
        data[newNumber] = data[oldNumber];
        // Actualizar el número dentro del objeto
        if (data[newNumber].number) data[newNumber].number = newNumber;
        delete data[oldNumber];
        console.log(`✅ Transferido ${targetKey}: ${oldNumber} -> ${newNumber}`);
        return true;
    }
    console.log(`⚠️ No se encontró ${targetKey} para ${oldNumber}`);
    return false;
}

// Función especial para transferir packs (estructura diferente)
function transferPacks(oldNumber, newNumber, packsDB) {
    if (packsDB[oldNumber]) {
        // Si el nuevo número ya tiene packs, fusionar
        if (packsDB[newNumber]) {
            // Fusionar los packs
            if (packsDB[oldNumber].packs && Array.isArray(packsDB[oldNumber].packs)) {
                if (!packsDB[newNumber].packs) packsDB[newNumber].packs = [];
                packsDB[newNumber].packs.push(...packsDB[oldNumber].packs);
            }
        } else {
            packsDB[newNumber] = packsDB[oldNumber];
            if (packsDB[newNumber].number) packsDB[newNumber].number = newNumber;
        }
        delete packsDB[oldNumber];
        console.log(`✅ Transferido packs: ${oldNumber} -> ${newNumber}`);
        return true;
    }
    console.log(`⚠️ No se encontraron packs para ${oldNumber}`);
    return false;
}

// Función especial para transferir primarios (buscar en todos los grupos)
function transferPrimarios(oldNumber, newNumber, primariosDB) {
    let transferred = false;
    for (const [groupId, primario] of Object.entries(primariosDB)) {
        if (primario.botPhone === oldNumber) {
            primariosDB[groupId].botPhone = newNumber;
            primariosDB[groupId].botNombre = primario.botNombre.replace(oldNumber, newNumber);
            primariosDB[groupId].botJid = `${newNumber}@s.whatsapp.net`;
            primariosDB[groupId].setBy = 'SISTEMA_TRANSFER';
            primariosDB[groupId].setAt = new Date().toLocaleString('es-ES');
            primariosDB[groupId].timestamp = Date.now();
            primariosDB[groupId].previousBot = oldNumber;
            transferred = true;
            console.log(`✅ Transferido primario en grupo ${groupId}: ${oldNumber} -> ${newNumber}`);
        }
    }
    if (!transferred) {
        console.log(`⚠️ No se encontraron primarios para ${oldNumber}`);
    }
    return transferred;
}

export default {
    name: 'transfer',
    alias: [],
    
    async execute(sock, msg, options) {
        try {
            const { config, args, senderNumber, pushName, replyWithContext } = options;
            const from = msg.key.remoteJid;
            
            const OWNER_ID = '5219992042946';
            const cleanSenderNumber = cleanNumber(senderNumber);
            
            // Verificar que sea el owner
            if (cleanSenderNumber !== OWNER_ID) {
                await replyWithContext(
                    `๑ֵ݊🍀 ᥱᥣ ᥴ᥆mᥲᥒძ᥆ \`${config.prefix}transfer\` ᥒ᥆ ᥱ᥊іs𝗍ᥱ.\n> ೯۪🎑̶ֵ ᥙsᥲ ${config.prefix}help`,
                    []
                );
                return;
            }
            
            // Unir todos los argumentos
            const fullText = args.join(' ');
            const separatorIndex = fullText.indexOf(' / ');
            
            if (separatorIndex === -1) {
                await replyWithContext(
                    `🌸 *Uso correcto:*\n\n> ${config.prefix}transfer +número antiguo / +número nuevo\n\n*Ejemplo:*\n${config.prefix}transfer +5219992042946 / +5219988776655`,
                    []
                );
                return;
            }
            
            // Extraer números
            let oldNumberRaw = fullText.substring(0, separatorIndex).trim();
            let newNumberRaw = fullText.substring(separatorIndex + 3).trim();
            
            // Limpiar números (solo dígitos)
            let oldNumber = cleanNumber(oldNumberRaw);
            let newNumber = cleanNumber(newNumberRaw);
            
            if (!oldNumber || oldNumber.length < 10) {
                await replyWithContext(
                    `❌ *Número antiguo inválido*\n\n> Debe tener al menos 10 dígitos.`,
                    []
                );
                return;
            }
            
            if (!newNumber || newNumber.length < 10) {
                await replyWithContext(
                    `❌ *Número nuevo inválido*\n\n> Debe tener al menos 10 dígitos.`,
                    []
                );
                return;
            }
            
            if (oldNumber === newNumber) {
                await replyWithContext(
                    `❌ *Los números son iguales*\n\n> No puedes transferir datos al mismo número.`,
                    []
                );
                return;
            }
            
            // Reacción de carga
            try {
                await sock.sendMessage(from, { react: { text: '🔄', key: msg.key } });
            } catch (e) {}
            
            await replyWithContext(
                `📦 *Iniciando transferencia de datos...*\n\n🔸 *Origen:* ${oldNumber}\n🔹 *Destino:* ${newNumber}\n\n> Esto puede tomar unos segundos.`,
                []
            );
            
            // Cargar todas las bases de datos
            let usersDB = loadJSON(USERS_FILE);
            let levelDB = loadJSON(LEVEL_FILE);
            let economyDB = loadJSON(ECONOMY_FILE);
            let warnsDB = loadJSON(WARNS_FILE);
            let packsDB = loadJSON(PACKS_FILE);
            let primariosDB = loadJSON(PRIMARIOS_FILE);
            
            let transfers = {
                users: false,
                level: false,
                economy: false,
                warns: false,
                packs: false,
                primarios: false
            };
            
            // Transferir users.json
            if (usersDB[oldNumber]) {
                transfers.users = transferData(oldNumber, newNumber, usersDB, 'users.json');
            } else {
                console.log(`⚠️ No se encontró usuario ${oldNumber} en users.json`);
            }
            
            // Transferir level.json
            if (levelDB[oldNumber]) {
                transfers.level = transferData(oldNumber, newNumber, levelDB, 'level.json');
            } else {
                console.log(`⚠️ No se encontró nivel para ${oldNumber} en level.json`);
            }
            
            // Transferir economy.json
            if (economyDB[oldNumber]) {
                transfers.economy = transferData(oldNumber, newNumber, economyDB, 'economy.json');
            } else {
                console.log(`⚠️ No se encontró economía para ${oldNumber} en economy.json`);
            }
            
            // Transferir warns.json (estructura diferente: warnsDB[groupId][userNumber])
            let warnsTransferred = false;
            for (const [groupId, groupWarns] of Object.entries(warnsDB)) {
                if (groupWarns[oldNumber]) {
                    groupWarns[newNumber] = groupWarns[oldNumber];
                    delete groupWarns[oldNumber];
                    warnsTransferred = true;
                    console.log(`✅ Transferido warns en grupo ${groupId}: ${oldNumber} -> ${newNumber}`);
                }
            }
            transfers.warns = warnsTransferred;
            if (!warnsTransferred) console.log(`⚠️ No se encontraron warns para ${oldNumber}`);
            
            // Transferir packs.json (estructura especial)
            transfers.packs = transferPacks(oldNumber, newNumber, packsDB);
            
            // Transferir primarios.json (buscar en todos los grupos)
            transfers.primarios = transferPrimarios(oldNumber, newNumber, primariosDB);
            
            // Guardar todas las bases de datos
            saveJSON(USERS_FILE, usersDB);
            saveJSON(LEVEL_FILE, levelDB);
            saveJSON(ECONOMY_FILE, economyDB);
            saveJSON(WARNS_FILE, warnsDB);
            saveJSON(PACKS_FILE, packsDB);
            saveJSON(PRIMARIOS_FILE, primariosDB);
            
            // Contar cuántas transferencias se realizaron
            const successCount = Object.values(transfers).filter(v => v === true).length;
            const totalCount = Object.keys(transfers).length;
            
            // Construir mensaje de resultado
            let resultMessage = `✅ *Transferencia completada*\n\n`;
            resultMessage += `📤 *Origen:* ${oldNumber}\n`;
            resultMessage += `📥 *Destino:* ${newNumber}\n\n`;
            resultMessage += `📊 *Datos transferidos:*\n`;
            resultMessage += `  ${transfers.users ? '✅' : '❌'} users.json\n`;
            resultMessage += `  ${transfers.level ? '✅' : '❌'} level.json\n`;
            resultMessage += `  ${transfers.economy ? '✅' : '❌'} economy.json\n`;
            resultMessage += `  ${transfers.warns ? '✅' : '❌'} warns.json\n`;
            resultMessage += `  ${transfers.packs ? '✅' : '❌'} packs.json\n`;
            resultMessage += `  ${transfers.primarios ? '✅' : '❌'} primarios.json\n\n`;
            resultMessage += `📦 *Total:* ${successCount}/${totalCount} archivos transferidos`;
            
            await replyWithContext(resultMessage, []);
            
            try {
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
            } catch (e) {}
            
            console.log(`✅ Transferencia completada por OWNER ${pushName || senderNumber}: ${oldNumber} -> ${newNumber} (${successCount}/${totalCount})`);
            
        } catch (error) {
            console.error('❌ Error en transfer:', error);
            
            try {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            } catch (e) {}
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Error: ${error.message}`,
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
