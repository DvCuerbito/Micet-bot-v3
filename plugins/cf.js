import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function saveEconomy(economy) {
    try {
        fs.writeFileSync(ECONOMY_FILE, JSON.stringify(economy, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error guardando economía:', error);
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
                oro: 0
            },
            health: 100,
            lastMine: 0,
            lastWork: 0,
            lastCrime: 0,
            lastAdventure: 0,
            lastClaim: 0,
            lastChest: 0,
            items: {
                agua: 0,
                vendas: 0,
                pastillas: 0
            }
        };
    }
    return economy[userNumber];
}

export default {
    name: 'cf',
    alias: ['caraocruz', 'coinflip'],
    
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
            
            // Verificar argumentos
            if (!args || args.length < 2) {
                return await replyWithContext(
                    `🎲 *CARA O CRUZ*\n\n` +
                    `> Uso: ${config.prefix}cf [cara/cruz] [cantidad]\n` +
                    `> Ejemplo: ${config.prefix}cf cara 100\n` +
                    `> Ejemplo: ${config.prefix}cf cruz 50\n\n` +
                    `> También puedes: ${config.prefix}cf 100 cara`,
                    [senderJid]
                );
            }
            
            let eleccion = '';
            let apuesta = 0;
            
            // Determinar formato (elección/cantidad o cantidad/elección)
            if (args[0].match(/^\d+$/)) {
                // Formato: cantidad elección
                apuesta = parseInt(args[0]);
                eleccion = args[1].toLowerCase();
            } else {
                // Formato: elección cantidad
                eleccion = args[0].toLowerCase();
                apuesta = parseInt(args[1]);
            }
            
            // Validar elección
            if (eleccion !== 'cara' && eleccion !== 'cruz') {
                return await replyWithContext(
                    '❌ Debes elegir *cara* o *cruz*',
                    [senderJid]
                );
            }
            
            // Validar apuesta
            if (isNaN(apuesta) || apuesta < 1) {
                return await replyWithContext(
                    '❌ La cantidad debe ser un número positivo',
                    [senderJid]
                );
            }
            
            let economy = loadEconomy();
            const user = initUserEconomy(economy, senderNumber, pushName);
            
            // Verificar si tiene suficientes coins
            if (user.coins < apuesta) {
                return await replyWithContext(
                    `❌ No tienes suficientes coins\n` +
                    `> Apostaste: *${apuesta}* coins\n` +
                    `> Tienes: *${user.coins}* coins`,
                    [senderJid]
                );
            }
            
            // Restar la apuesta
            user.coins -= apuesta;
            
            // Lanzar moneda
            const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
            const ganaste = eleccion === resultado;
            
            let mensaje = '';
            let coinsFinales = user.coins;
            
            if (ganaste) {
                const ganancia = apuesta * 2; // Recupera lo apostado + gana lo mismo
                user.coins += ganancia;
                coinsFinales = user.coins;
                
                mensaje = `🎲 *CARA O CRUZ*\n\n` +
                    `🪙 *Resultado:* ${resultado === 'cara' ? '🇨 Cara' : '🇽 Cruz'}\n` +
                    `🎯 *Tu elección:* ${eleccion === 'cara' ? '🇨 Cara' : '🇽 Cruz'}\n\n` +
                    `✅ *¡GANASTE!*\n\n` +
                    `💰 Apostaste: *${apuesta}* coins\n` +
                    `🎁 Ganaste: *${apuesta}* coins\n` +
                    `💎 Total: *${coinsFinales}* coins`;
            } else {
                coinsFinales = user.coins;
                
                mensaje = `🎲 *CARA O CRUZ*\n\n` +
                    `🪙 *Resultado:* ${resultado === 'cara' ? '🇨 Cara' : '🇽 Cruz'}\n` +
                    `🎯 *Tu elección:* ${eleccion === 'cara' ? '🇨 Cara' : '🇽 Cruz'}\n\n` +
                    `❌ *PERDISTE*\n\n` +
                    `💰 Apostaste: *${apuesta}* coins\n` +
                    `💔 Perdiste: *${apuesta}* coins\n` +
                    `💎 Total: *${coinsFinales}* coins`;
            }
            
            saveEconomy(economy);
            await replyWithContext(mensaje, [senderJid]);
            
        } catch (error) {
            console.error('❌ Error en comando cf:', error);
            await options.replyWithContext(
                `❌ Error: ${error.message}`,
                [options.senderJid]
            );
        }
    }
};
