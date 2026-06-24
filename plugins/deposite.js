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
            bank: 0
        };
    }
    if (economy[userNumber].bank === undefined) economy[userNumber].bank = 0;
    return economy[userNumber];
}

export default {
    name: 'deposit',
    alias: ['d', 'depositar'],
    
    async execute(sock, msg, options) {
        try {
            const { config, args, senderNumber, pushName, replyWithContext, senderJid } = options;
            
            if (!senderNumber) {
                return await replyWithContext('❌ No se pudo identificar tu número', [senderJid]);
            }
            
            let economy = loadEconomy();
            const user = initUserEconomy(economy, senderNumber, pushName);
            
            const amount = args[0]?.toLowerCase();
            
            if (!amount) {
                return await replyWithContext(
                    `🍭 Debes proporcionar una cantidad\n` +
                    `> ${config.prefix}depositar +cantidad\n` +
                    `> ${config.prefix}depositar all`,
                    [senderJid]
                );
            }
            
            let depositAmount = 0;
            
            if (amount === 'all') {
                if (user.coins === 0) {
                    return await replyWithContext(`❌ No tienes coins para depositar`, [senderJid]);
                }
                depositAmount = user.coins;
            } else {
                depositAmount = parseInt(amount);
                if (isNaN(depositAmount) || depositAmount <= 0) {
                    return await replyWithContext(`❌ Cantidad inválida. Usa un número positivo o "all"`, [senderJid]);
                }
            }
            
            if (user.coins < depositAmount) {
                return await replyWithContext(
                    `❌ No tienes suficientes coins\n\n` +
                    `💰 *Tienes:* ${user.coins} coins\n` +
                    `🏦 *Necesitas:* ${depositAmount} coins`,
                    [senderJid]
                );
            }
            
            user.coins -= depositAmount;
            user.bank = (user.bank || 0) + depositAmount;
            saveEconomy(economy);
            
            await replyWithContext(
                `🏦 *Depósito completado*\n\n` +
                `> 📥 *Cantidad:* ${depositAmount.toLocaleString()} coins\n` +
                `> 💰 *Coins restantes:* ${user.coins} coins\n` +
                `> 🏦 *Total en banco:* ${user.bank.toLocaleString()} coins`,
                [senderJid]
            );
            
        } catch (error) {
            console.error('❌ Error en deposit:', error);
            await options.replyWithContext(`❌ Error: ${error.message}`, [options.senderJid]);
        }
    }
};
