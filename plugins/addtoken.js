import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CODES_FILE = path.join(__dirname, '..', 'databases', 'codes.json');

// Número del owner (solo este podrá usar el comando)
const OWNER_NUMBER = '5492644156919';

// Cargar códigos existentes
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

// Guardar códigos
function saveCodes(codes) {
    try {
        fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error guardando códigos:', error);
        return false;
    }
}

// Generar código aleatorio de 7 dígitos en mayúsculas
function generateCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Verificar si el código ya existe
function isCodeUnique(codes, newCode) {
    return !codes[newCode];
}

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

export default {
    name: 'addtoken',
    alias: ['crearcode', 'addcode'],
    
    async execute(sock, msg, options) {
        try {
            const { 
                config, 
                senderNumber, 
                replyWithContext,
                senderJid,
                args 
            } = options;
            
            // Verificar que sea el owner
            if (senderNumber !== OWNER_NUMBER) {
                return await replyWithContext(
                    '❌ *Solo el owner puede usar este comando*',
                    [senderJid]
                );
            }
            
            // Si no hay argumentos, mostrar ayuda
            if (!args || args.length === 0) {
                let helpText = `🎫 *CREAR CÓDIGO DE CANJE*\n\n`;
                helpText += `┌─〔 *📖 USO* 〕\n`;
                helpText += `│ ${config.prefix}addtoken\n`;
                helpText += `│ recurso1 / cantidad1\n`;
                helpText += `│ recurso2 / cantidad2\n`;
                helpText += `│ recurso3 / cantidad3\n\n`;
                
                helpText += `┌─〔 *📝 EJEMPLO* 〕\n`;
                helpText += `│ ${config.prefix}addtoken\n`;
                helpText += `│ oro / 50000\n`;
                helpText += `│ diamantes / 5000\n`;
                helpText += `│ agua / 1000\n`;
                helpText += `│ coins / 5000000\n\n`;
                
                helpText += `┌─〔 *💎 RECURSOS DISPONIBLES* 〕\n`;
                helpText += `│ 💰 coins\n`;
                helpText += `│ 🪙 oro\n`;
                helpText += `│ 💎 diamantes\n`;
                helpText += `│ 💚 esmeraldas\n`;
                helpText += `│ 🪨 piedras\n`;
                helpText += `│ 🔴 rubies\n`;
                helpText += `│ 🔵 zafiros\n`;
                helpText += `│ 🦴 fosiles\n`;
                helpText += `│ 🧱 arcilla\n`;
                helpText += `│ 🪨 carbon\n`;
                helpText += `│ ⛓️ hierro\n`;
                helpText += `│ 🥈 platino\n`;
                helpText += `│ 🥉 cobre\n`;
                helpText += `│ 🔮 cristal_magico\n`;
                helpText += `│ ✨ polvo_estelar\n`;
                helpText += `│ 💫 esencia\n`;
                helpText += `│ 🍶 agua\n`;
                helpText += `│ 🩹 vendas\n`;
                helpText += `│ 💊 pastillas\n`;
                helpText += `│ 🗺️ mapa\n`;
                helpText += `└───────────────`;
                
                return await replyWithContext(helpText, [senderJid]);
            }
            
            // Unir todos los argumentos y procesar línea por línea
            const fullText = args.join(' ');
            
            // Dividir por líneas (cuando hay saltos de línea en el mensaje)
            let lines = [];
            
            if (fullText.includes('\n')) {
                lines = fullText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            } else {
                // Si no hay saltos de línea, tratar de dividir por patrones "recurso / cantidad"
                const parts = fullText.split('/');
                lines = [];
                for (let i = 0; i < parts.length; i += 2) {
                    if (i + 1 < parts.length) {
                        const recurso = parts[i].trim();
                        const cantidad = parts[i + 1].trim().split(' ')[0];
                        lines.push(`${recurso} / ${cantidad}`);
                    }
                }
            }
            
            const rewards = {};
            
            // Procesar cada línea
            for (const line of lines) {
                // Buscar patrón "recurso / cantidad"
                const match = line.match(/([a-zA-Z_]+)\s*\/\s*(\d+)/);
                
                if (match) {
                    const recurso = match[1].toLowerCase().trim();
                    const cantidad = parseInt(match[2]);
                    
                    if (!isNaN(cantidad) && cantidad > 0) {
                        rewards[recurso] = cantidad;
                        console.log(`✅ Recurso agregado: ${recurso} = ${cantidad}`);
                    }
                } else {
                    console.log(`❌ Línea no válida: ${line}`);
                }
            }
            
            if (Object.keys(rewards).length === 0) {
                return await replyWithContext(
                    '❌ No se especificaron recompensas válidas\n' +
                    '> Ejemplo:\n' +
                    '.addtoken\n' +
                    'oro / 50000\n' +
                    'diamantes / 5000\n' +
                    'agua / 1000\n' +
                    'coins / 5000000',
                    [senderJid]
                );
            }
            
            // Cargar códigos existentes
            let codes = loadCodes();
            
            // Generar código único
            let code;
            do {
                code = generateCode();
            } while (!isCodeUnique(codes, code));
            
            // Agregar código con tiempo de expiración (4 horas)
            const expiresAt = Date.now() + (4 * 60 * 60 * 1000); // 4 horas
            
            codes[code] = {
                code: code,
                rewards: rewards,
                createdAt: Date.now(),
                expiresAt: expiresAt,
                usedBy: [] // Array para múltiples usos
            };
            
            saveCodes(codes);
            
            // Mostrar recompensas para el mensaje
            let rewardsText = '';
            for (const [recurso, cantidad] of Object.entries(rewards)) {
                const emoji = resourceEmojis[recurso] || '📦';
                rewardsText += `${emoji} *${recurso}:* ${cantidad.toLocaleString()}\n`;
            }
            
            // Calcular tiempo de expiración
            const expiryDate = new Date(expiresAt);
            const expiryTime = expiryDate.toLocaleString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
            });
            
            const successText = `✅ *CÓDIGO CREADO*\n\n` +
                `🎫 *Código:* \`${code}\`\n\n` +
                `🎁 *RECOMPENSAS*\n${rewardsText}\n` +
                `⏰ *Expira:* ${expiryTime} (4 horas)\n\n` +
                `📢 *Los usuarios pueden canjearlo con:*\n` +
                `> ${config.prefix}canjear ${code}`;
            
            await replyWithContext(successText, [senderJid]);
            
        } catch (error) {
            console.error('❌ Error en comando addtoken:', error);
            await options.replyWithContext(
                `❌ Error: ${error.message}`,
                [options.senderJid]
            );
        }
    }
};
