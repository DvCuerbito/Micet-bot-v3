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
    name: 'crimen',
    alias: ['crime', 'robar'],
    
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
            
            // Verificar salud
            if (user.health <= 15) {
                return await replyWithContext(
                    '⚠️ *Tu salud es muy baja para cometer un crimen* ⚠️\n> Usa *heal* para recuperarte',
                    [senderJid]
                );
            }
            
            // Verificar cooldown de 2 minutos
            const cooldownTime = 120000; // 2 minutos
            const now = Date.now();
            
            if (user.lastCrime && (now - user.lastCrime) < cooldownTime) {
                const remaining = getRemainingTime(user.lastCrime, cooldownTime);
                return await replyWithContext(
                    `⏳ *Debes esperar ${remaining}* para volver a delinquir`,
                    [senderJid]
                );
            }
            
            // Actualizar tiempo de último crimen
            user.lastCrime = now;
            saveEconomy(economy);
            
            // Determinar resultado del crimen (70% éxito, 30% fracaso)
            const success = Math.random() < 0.7; // 70% probabilidad de éxito
            
            let resultText = '';
            let coinsChange = 0;
            let healthChange = 0;
            
            if (success) {
                // Éxito: gana muchos coins
                coinsChange = Math.floor(Math.random() * 150) + 100; // 100-250 coins
                healthChange = Math.floor(Math.random() * 15) + 10; // 10-25 salud perdida
                
                user.coins += coinsChange;
                user.health = Math.max(0, user.health - healthChange);
                
                resultText = `🔫 *CRIMEN EXITOSO*\n` +
                    `🧭 Lograste cometer el crimen sin ser atrapado\n\n` +
                    `🎑 *RECOMPENSA*\n\n` +
                    `💰 Coins obtenidos » *+${coinsChange}*\n\n` +
                    `❤️ Salud perdida » *-${healthChange}*`;
                
            } else {
                // Fracaso: pierde coins y mucha salud
                coinsChange = Math.floor(Math.random() * 50) + 30; // 30-80 coins perdidos
                healthChange = Math.floor(Math.random() * 25) + 15; // 15-40 salud perdida
                
                // Asegurar que no quede en negativo
                coinsChange = Math.min(coinsChange, user.coins);
                user.coins -= coinsChange;
                user.health = Math.max(0, user.health - healthChange);
                
                // Posibilidad de perder recursos (20%)
                let lostItems = '';
                if (Math.random() < 0.2) { // 20% de perder items
                    if (user.items.agua > 0) {
                        const aguaPerdida = Math.floor(Math.random() * 3) + 1;
                        user.items.agua = Math.max(0, user.items.agua - aguaPerdida);
                        lostItems += `\n🍶 Agua perdida » *-${aguaPerdida}*`;
                    }
                    if (user.items.vendas > 0) {
                        const vendasPerdidas = Math.floor(Math.random() * 2) + 1;
                        user.items.vendas = Math.max(0, user.items.vendas - vendasPerdidas);
                        lostItems += `\n🩹 Vendas perdidas » *-${vendasPerdidas}*`;
                    }
                }
                
                resultText = `🚔 *CRIMEN FALLIDO*\n` +
                    `🧭 Te atraparon cometiendo el crimen\n\n` +
                    `🎑 *PÉRDIDAS*\n\n` +
                    `💰 Coins perdidos » *-${coinsChange}*` +
                    lostItems +
                    `\n\n❤️ Salud perdida » *-${healthChange}*`;
            }
            
            saveEconomy(economy);
            
            await replyWithContext(resultText, [senderJid]);
            
        } catch (error) {
            console.error('❌ Error en comando crimen:', error);
        }
    }
};
