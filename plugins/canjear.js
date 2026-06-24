import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECONOMY_FILE = path.join(__dirname, '..', 'databases', 'economy.json');
const CODES_FILE = path.join(__dirname, '..', 'databases', 'codes.json');

// Mapa de emojis para cada recurso
const resourceEmojis = {
    'coins': '💰',
    'oro': '🪙',
    'diamantes': '💎',
    'esmeraldas': '💚',
    'piedras': '🪨',
    'rubies': '🔴',
    'zafiros': '🔵',
    'fosiles': '🦴',
    'arcilla': '🧱',
    'carbon': '🪨',
    'hierro': '⛓️',
    'platino': '🥈',
    'cobre': '🥉',
    'cristal_magico': '🔮',
    'polvo_estelar': '✨',
    'esencia': '💫',
    'agua': '🍶',
    'vendas': '🩹',
    'pastillas': '💊',
    'mapa': '🗺️'
};

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

function saveEconomy(economy) {
    try {
        fs.writeFileSync(ECONOMY_FILE, JSON.stringify(economy, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error guardando economía:', error);
        return false;
    }
}

function loadCodes() {
    try {
        if (fs.existsSync(CODES_FILE)) {
            return JSON.parse(fs.readFileSync(CODES_FILE, 'utf8'));
        }
        return {};
    } catch (error) {
        console.error('Error cargando códigos:', error);
        return {};
    }
}

function saveCodes(codes) {
    try {
        fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error guardando códigos:', error);
        return false;
    }
}

function initUserEconomy(economy, userNumber, pushName) {
    if (!economy[userNumber]) {
        economy[userNumber] = {
            number: userNumber,
            name: pushName || 'Usuario',
            coins: 0,
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
            lastClaim: 0,
            lastChest: 0,
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
    return economy[userNumber];
}

export default {
    name: 'canjear',
    alias: ['redeem', 'usarcode'],
    
    async execute(sock, msg, options) {
        try {
            const { 
                config, 
                senderNumber, 
                pushName,
                replyWithContext,
                senderJid,
                args 
            } = options;
            
            if (!senderNumber) {
                return await replyWithContext(
                    '❌ No se pudo identificar tu número',
                    [senderJid]
                );
            }
            
            // Verificar que se proporcionó un código
            if (!args || args.length === 0) {
                return await replyWithContext(
                    `🎫 *CANJEAR CÓDIGO*\n\n` +
                    `> Uso: ${config.prefix}canjear +[código]\n` +
                    `> Ejemplo: ${config.prefix}canjear +ABCD123\n\n` +
                    `> El código debe tener 7 dígitos en mayúsculas`,
                    [senderJid]
                );
            }
            
            // Obtener código (puede venir con + o sin él)
            let code = args[0].toUpperCase();
            if (code.startsWith('+')) {
                code = code.substring(1);
            }
            
            // Validar formato (7 dígitos, solo mayúsculas y números)
            if (!/^[A-Z0-9]{7}$/.test(code)) {
                return await replyWithContext(
                    '⭐ *Código inválido*\n\n' +
                    '> El código debe tener exactamente 7 caracteres\n' +
                    '> Solo mayúsculas y números\n' +
                    '> Ejemplo: ABCD123',
                    [senderJid]
                );
            }
            
            // Cargar códigos
            let codes = loadCodes();
            
            // Verificar si el código existe
            if (!codes[code]) {
                return await replyWithContext(
                    '🎑 *Código no encontrado*\n\n' +
                    '> El código no existe o ya expiró',
                    [senderJid]
                );
            }
            
            const codeData = codes[code];
            
            // Verificar si el código expiró
            if (Date.now() > codeData.expiresAt) {
                // Eliminar código expirado
                delete codes[code];
                saveCodes(codes);
                
                return await replyWithContext(
                    '⭐ *Código invalido o expirado*\n> El código es invalido o ha expirado intenta con otro código',
                    [senderJid]
                );
            }
            
            // Verificar si el usuario ya canjeó este código
            if (codeData.usedBy && codeData.usedBy.includes(senderNumber)) {
                return await replyWithContext(
                    '⭐ *Ya canjeaste este código*\n\n' +
                    '> Cada código solo puede ser canjeado una vez por usuario',
                    [senderJid]
                );
            }
            
            // Cargar economía del usuario
            let economy = loadEconomy();
            const user = initUserEconomy(economy, senderNumber, pushName);
            
            // Aplicar recompensas
            let rewardsText = '';
            for (const [recurso, cantidad] of Object.entries(codeData.rewards)) {
                const emoji = resourceEmojis[recurso] || '📦';
                
                if (recurso === 'coins') {
                    user.coins += cantidad;
                    rewardsText += `${emoji} Coins: *+${cantidad.toLocaleString()}*\n`;
                } else if (['agua', 'vendas', 'pastillas', 'mapa'].includes(recurso)) {
                    if (!user.items[recurso]) user.items[recurso] = 0;
                    user.items[recurso] += cantidad;
                    rewardsText += `${emoji} ${recurso}: *+${cantidad.toLocaleString()}*\n`;
                } else {
                    if (!user.minerals[recurso]) user.minerals[recurso] = 0;
                    user.minerals[recurso] += cantidad;
                    rewardsText += `${emoji} ${recurso}: *+${cantidad.toLocaleString()}*\n`;
                }
            }
            
            // Registrar que el usuario canjeó el código
            if (!codeData.usedBy) {
                codeData.usedBy = [];
            }
            codeData.usedBy.push(senderNumber);
            
            // Guardar cambios
            saveEconomy(economy);
            saveCodes(codes);
            
            await replyWithContext(
                `⭐ \`CODIGO CANJEADO\`\n> *${pushName}* disfruta de tus recompensas ❤️\n\n🎑 *Código:* \`${code}\`\n\n` +
                `🎁 *RECOMPENSAS OBTENIDAS*\n${rewardsText}`,
                [senderJid]
            );
            
        } catch (error) {
            console.error('❌ Error en comando canjear:', error);
            await options.replyWithContext(
                `❌ Error: ${error.message}`,
                [options.senderJid]
            );
        }
    }
};
