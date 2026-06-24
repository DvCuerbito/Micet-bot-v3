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

// Obtener el próximo reset (12:00 PM en Oslo)
function getNextOsloReset() {
    const now = new Date();
    
    // Crear fecha para Oslo (UTC+1 o UTC+2 dependiendo del horario de verano)
    const osloTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
    
    // Crear fecha para hoy a las 12:00 PM en Oslo
    const todayReset = new Date(osloTime);
    todayReset.setHours(12, 0, 0, 0);
    
    // Si ya pasaron las 12:00 PM hoy, el próximo reset es mañana
    if (osloTime > todayReset) {
        todayReset.setDate(todayReset.getDate() + 1);
    }
    
    return todayReset.getTime();
}

// Formatear tiempo restante
function formatRemainingTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

export default {
    name: 'claim',
    alias: ['daily', 'recompensa'],
    
    async execute(sock, msg, options) {
        try {
            const { 
                config, 
                senderNumber, 
                pushName,
                replyWithContext,
                senderJid 
            } = options;
            
            if (!senderNumber) {
                return await replyWithContext(
                    '❌ No se pudo identificar tu número',
                    [senderJid]
                );
            }
            
            let economy = loadEconomy();
            const user = initUserEconomy(economy, senderNumber, pushName);
            
            const now = Date.now();
            const nextReset = getNextOsloReset();
            
            // Verificar si ya reclamó hoy
            if (user.lastClaim && user.lastClaim >= nextReset - 86400000) {
                const timeUntilReset = nextReset - now;
                const formattedTime = formatRemainingTime(timeUntilReset);
                
                return await replyWithContext(
                    `⏳ *Ya reclamaste tu recompensa diaria*\n\n` +
                    `> Próxima recompensa: *${formattedTime}*\n`,
                    [senderJid]
                );
            }
            
            // Generar recompensa diaria
            const coinsBase = 200;
            const randomBonus = Math.floor(Math.random() * 150); // 0-150 bonus
            
            const diamantesBase = 5;
            const esmeraldasBase = 8;
            const oroBase = 10;
            
            const totalCoins = coinsBase + randomBonus;
            
            // Aplicar recompensas
            user.coins += totalCoins;
            user.minerals.diamantes += diamantesBase;
            user.minerals.esmeraldas += esmeraldasBase;
            user.minerals.oro += oroBase;
            user.items.agua += 2;
            user.items.vendas += 1;
            
            // Guardar timestamp del claim
            user.lastClaim = now;
            
            saveEconomy(economy);
            
            // Formatear hora de Oslo
            const osloTime = new Date().toLocaleString('es-ES', { 
                timeZone: 'Europe/Oslo',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const claimText = `🎑 *RECOMPENSA DIARIA*\n\n` +
                `📍 ${osloTime}\n\n` +
                `💰 Coins » *+${totalCoins}* (${coinsBase} base + ${randomBonus} bonus)\n` +
                `💎 Diamantes » *+${diamantesBase}*\n` +
                `💚 Esmeraldas » *+${esmeraldasBase}*\n` +
                `🪙 Oro » *+${oroBase}*\n` +
                `🍶 Agua » *+2*\n` +
                `🩹 Vendas » *+1*\n\n` +
                `> Vuelve mañana`;
            
            await replyWithContext(claimText, [senderJid]);
            
        } catch (error) {
            console.error('❌ Error en comando claim:', error);
        }
    }
};
