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

// Tipos de cofres
const chestTypes = [
    {
        name: "🎁 *COFRE DE MADERA*",
        emoji: "🪵",
        rarity: "común",
        probability: 0.5, // 50%
        rewards: {
            coins: [30, 80],
            minerals: {
                piedras: [10, 30],
                oro: [1, 4]
            },
            items: {
                agua: [1, 2]
            }
        }
    },
    {
        name: "⚱️ *COFRE DE BRONCE*",
        emoji: "🏺",
        rarity: "poco común",
        probability: 0.3, // 30%
        rewards: {
            coins: [60, 150],
            minerals: {
                diamantes: [1, 3],
                esmeraldas: [2, 5],
                oro: [3, 7]
            },
            items: {
                vendas: [1, 2]
            }
        }
    },
    {
        name: "🏆 *COFRE DE PLATA*",
        emoji: "🥈",
        rarity: "raro",
        probability: 0.15, // 15%
        rewards: {
            coins: [120, 250],
            minerals: {
                diamantes: [3, 6],
                esmeraldas: [4, 8],
                oro: [6, 12]
            },
            items: {
                pastillas: [1, 2],
                agua: [2, 3]
            }
        }
    },
    {
        name: "👑 *COFRE DE ORO*",
        emoji: "🥇",
        rarity: "épico",
        probability: 0.04, // 4%
        rewards: {
            coins: [250, 500],
            minerals: {
                diamantes: [5, 10],
                esmeraldas: [8, 15],
                oro: [10, 20]
            },
            items: {
                pastillas: [2, 4],
                vendas: [2, 3],
                agua: [3, 5]
            }
        }
    },
    {
        name: "💎 *COFRE MÍTICO*",
        emoji: "🌟",
        rarity: "legendario",
        probability: 0.01, // 1%
        rewards: {
            coins: [500, 1000],
            minerals: {
                diamantes: [10, 20],
                esmeraldas: [15, 25],
                oro: [20, 35]
            },
            items: {
                pastillas: [3, 6],
                vendas: [3, 5],
                agua: [4, 7]
            },
            special: "¡Salud +20!"
        }
    }
];

// Obtener el próximo reset (12:00 PM en Oslo) - mismo que claim
function getNextOsloReset() {
    const now = new Date();
    const osloTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
    
    const todayReset = new Date(osloTime);
    todayReset.setHours(12, 0, 0, 0);
    
    if (osloTime > todayReset) {
        todayReset.setDate(todayReset.getDate() + 1);
    }
    
    return todayReset.getTime();
}

function formatRemainingTime(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

// Seleccionar cofre basado en probabilidades
function selectChest() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const chest of chestTypes) {
        cumulative += chest.probability;
        if (rand < cumulative) {
            return chest;
        }
    }
    
    return chestTypes[0]; // Fallback a cofre de madera
}

export default {
    name: 'cofre',
    alias: ['chest', 'caja', 'tesoro'],
    
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
            
            // Verificar si ya abrió un cofre hoy
            if (user.lastChest && user.lastChest >= nextReset - 86400000) {
                const timeUntilReset = nextReset - now;
                const formattedTime = formatRemainingTime(timeUntilReset);
                
                return await replyWithContext(
                    `⏳ *Ya abriste un cofre hoy*\n\n` +
                    `> Próximo cofre: *${formattedTime}*\n`,
                    [senderJid]
                );
            }
            
            // Seleccionar cofre aleatorio
            const chest = selectChest();
            
            // Aplicar recompensas
            const rewards = chest.rewards;
            
            // Coins
            const coinsGanados = Math.floor(Math.random() * (rewards.coins[1] - rewards.coins[0] + 1)) + rewards.coins[0];
            user.coins += coinsGanados;
            
            // Minerales
            if (rewards.minerals) {
                if (rewards.minerals.piedras) {
                    const piedras = Math.floor(Math.random() * (rewards.minerals.piedras[1] - rewards.minerals.piedras[0] + 1)) + rewards.minerals.piedras[0];
                    user.minerals.piedras += piedras;
                }
                if (rewards.minerals.diamantes) {
                    const diamantes = Math.floor(Math.random() * (rewards.minerals.diamantes[1] - rewards.minerals.diamantes[0] + 1)) + rewards.minerals.diamantes[0];
                    user.minerals.diamantes += diamantes;
                }
                if (rewards.minerals.esmeraldas) {
                    const esmeraldas = Math.floor(Math.random() * (rewards.minerals.esmeraldas[1] - rewards.minerals.esmeraldas[0] + 1)) + rewards.minerals.esmeraldas[0];
                    user.minerals.esmeraldas += esmeraldas;
                }
                if (rewards.minerals.oro) {
                    const oro = Math.floor(Math.random() * (rewards.minerals.oro[1] - rewards.minerals.oro[0] + 1)) + rewards.minerals.oro[0];
                    user.minerals.oro += oro;
                }
            }
            
            // Items
            if (rewards.items) {
                if (rewards.items.agua) {
                    const agua = Math.floor(Math.random() * (rewards.items.agua[1] - rewards.items.agua[0] + 1)) + rewards.items.agua[0];
                    user.items.agua += agua;
                }
                if (rewards.items.vendas) {
                    const vendas = Math.floor(Math.random() * (rewards.items.vendas[1] - rewards.items.vendas[0] + 1)) + rewards.items.vendas[0];
                    user.items.vendas += vendas;
                }
                if (rewards.items.pastillas) {
                    const pastillas = Math.floor(Math.random() * (rewards.items.pastillas[1] - rewards.items.pastillas[0] + 1)) + rewards.items.pastillas[0];
                    user.items.pastillas += pastillas;
                }
            }
            
            // Bonus especial para cofre mítico
            let specialText = '';
            if (chest.rarity === 'legendario') {
                user.health = Math.min(100, user.health + 20);
                specialText = '\n✨ *¡Bonus Legendario!* +20 Salud';
            }
            
            // Guardar timestamp
            user.lastChest = now;
            
            saveEconomy(economy);
            
            // Construir mensaje de recompensas
            let rewardsText = '';
            
            rewardsText += `💰 Coins » *+${coinsGanados}*\n`;
            
            if (rewards.minerals) {
                if (rewards.minerals.piedras) {
                    const piedras = Math.floor(Math.random() * (rewards.minerals.piedras[1] - rewards.minerals.piedras[0] + 1)) + rewards.minerals.piedras[0];
                    rewardsText += `🪨 Piedras » *+${piedras}*\n`;
                }
                if (rewards.minerals.diamantes) {
                    const diamantes = Math.floor(Math.random() * (rewards.minerals.diamantes[1] - rewards.minerals.diamantes[0] + 1)) + rewards.minerals.diamantes[0];
                    rewardsText += `💎 Diamantes » *+${diamantes}*\n`;
                }
                if (rewards.minerals.esmeraldas) {
                    const esmeraldas = Math.floor(Math.random() * (rewards.minerals.esmeraldas[1] - rewards.minerals.esmeraldas[0] + 1)) + rewards.minerals.esmeraldas[0];
                    rewardsText += `💚 Esmeraldas » *+${esmeraldas}*\n`;
                }
                if (rewards.minerals.oro) {
                    const oro = Math.floor(Math.random() * (rewards.minerals.oro[1] - rewards.minerals.oro[0] + 1)) + rewards.minerals.oro[0];
                    rewardsText += `🪙 Oro » *+${oro}*\n`;
                }
            }
            
            if (rewards.items) {
                if (rewards.items.agua) {
                    const agua = Math.floor(Math.random() * (rewards.items.agua[1] - rewards.items.agua[0] + 1)) + rewards.items.agua[0];
                    rewardsText += `🍶 Agua » *+${agua}*\n`;
                }
                if (rewards.items.vendas) {
                    const vendas = Math.floor(Math.random() * (rewards.items.vendas[1] - rewards.items.vendas[0] + 1)) + rewards.items.vendas[0];
                    rewardsText += `🩹 Vendas » *+${vendas}*\n`;
                }
                if (rewards.items.pastillas) {
                    const pastillas = Math.floor(Math.random() * (rewards.items.pastillas[1] - rewards.items.pastillas[0] + 1)) + rewards.items.pastillas[0];
                    rewardsText += `💊 Pastillas » *+${pastillas}*\n`;
                }
            }
            
            // Formatear hora de Oslo
            const osloTime = new Date().toLocaleString('es-ES', { 
                timeZone: 'Europe/Oslo',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const chestText = `${chest.name} ${chest.emoji}\n` +
                `✨ *Rareza:* ${chest.rarity.toUpperCase()}\n` +
                `📍 ${osloTime}\n\n` +
                `🎑 *CONTENIDO*\n\n` +
                rewardsText +
                specialText +
                `\n\n> Vuelve mañana`;
            
            await replyWithContext(chestText, [senderJid]);
            
        } catch (error) {
            console.error('❌ Error en comando cofre:', error);
        }
    }
};
