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
            items: {
                agua: 0,
                vendas: 0,
                pastillas: 0
            }
        };
    }
    return economy[userNumber];
}

function getRemainingTime(lastUsed, cooldownMs = 120000) {
    const now = Date.now();
    const timePassed = now - lastUsed;
    
    if (timePassed >= cooldownMs) return 0;
    
    const remaining = cooldownMs - timePassed;
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
}

export default {
    name: 'trabajar',
    alias: ['work', 'w'],
    
    async execute(sock, msg, options) {
        try {
            const { 
                config, 
                senderNumber, 
                pushName,
                replyWithContext,
                senderJid 
            } = options;
            
            const from = msg.key.remoteJid;
            
            if (!senderNumber) {
                return await replyWithContext(
                    '❌ No se pudo identificar tu número',
                    [senderJid]
                );
            }
            
            let economy = loadEconomy();
            const user = initUserEconomy(economy, senderNumber, pushName);
            
            if (user.health <= 10) {
                return await replyWithContext(
                    '⚠️ *Tu salud es muy baja para seguir trabajando* ⚠️\n> Usa *heal* para recuperarte',
                    [senderJid]
                );
            }
            
            // Verificar cooldown de 2 minutos
            const cooldownTime = 120000; // 2 minutos
            const now = Date.now();
            
            if (user.lastWork && (now - user.lastWork) < cooldownTime) {
                const remaining = getRemainingTime(user.lastWork, cooldownTime);
                return await replyWithContext(
                    `⏳ *Debes esperar ${remaining}* para volver a trabajar`,
                    [senderJid]
                );
            }
            
            // Actualizar tiempo de último trabajo
            user.lastWork = now;
            saveEconomy(economy);
            
            // Generar coins aleatorios
            const coinsGanados = Math.floor(Math.random() * 80) + 30; // 30-110 coins
            const healthLoss = Math.floor(Math.random() * 8) + 3; // 3-10
            
            user.coins += coinsGanados;
            user.health = Math.max(0, user.health - healthLoss);
            
            saveEconomy(economy);
            
            const rewardText = `💼 *TRABAJO*\n` +
                `🧭 Conseguiste un trabajo temporal\n\n` +
                `🎑 *RECOMPENSA*\n\n` +
                `💰 Coins » *${coinsGanados}*\n\n` +
                `❤️ Salud perdida » *-${healthLoss}*`;
            
            await replyWithContext(rewardText, [senderJid]);
            
        } catch (error) {
            console.error('❌ Error en comando trabajar:', error);
        }
    }
};
