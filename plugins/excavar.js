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
                oro: 0,
                rubies: 0,
                zafiros: 0,
                fosiles: 0
            },
            health: 100,
            lastMine: 0,
            lastWork: 0,
            lastCrime: 0,
            lastAdventure: 0,
            lastClaim: 0,
            lastChest: 0,
            lastHunt: 0,
            lastFish: 0,
            lastExcavar: 0,
            lastTesoro: 0,
            lastReciclar: 0,
            lastMina2: 0,
            lastMina3: 0,
            items: {
                agua: 0,
                vendas: 0,
                pastillas: 0,
                pico: 1,
                mapa: 0
            }
        };
    }
    return economy[userNumber];
}

function getRemainingTime(lastUsed, cooldownMs = 180000) { // 3 minutos
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

// Capas de excavación
const layers = [
    {
        name: "🌱 Capa Superficial",
        depth: "0-2 metros",
        probability: 0.50,
        healthCost: [3, 8],
        finds: [
            { type: 'piedras', amount: [5, 15], emoji: '🪨', name: 'Piedras' },
            { type: 'arcilla', amount: [2, 8], emoji: '🧱', name: 'Arcilla', special: true },
            { type: 'raices', amount: [1, 5], emoji: '🌿', name: 'Raices', special: true }
        ]
    },
    {
        name: "🪨 Capa Media",
        depth: "3-10 metros",
        probability: 0.30,
        healthCost: [6, 14],
        finds: [
            { type: 'carbon', amount: [3, 10], emoji: '🪨', name: 'Carbón', special: true },
            { type: 'hierro', amount: [2, 7], emoji: '⛓️', name: 'Hierro', special: true },
            { type: 'oro', amount: [1, 4], emoji: '🪙', name: 'Oro' }
        ]
    },
    {
        name: "💎 Capa Profunda",
        depth: "11-30 metros",
        probability: 0.15,
        healthCost: [10, 20],
        finds: [
            { type: 'diamantes', amount: [1, 3], emoji: '💎', name: 'Diamantes' },
            { type: 'esmeraldas', amount: [2, 5], emoji: '💚', name: 'Esmeraldas' },
            { type: 'rubies', amount: [1, 2], emoji: '🔴', name: 'Rubíes' }
        ]
    },
    {
        name: "🦴 Capa Fósil",
        depth: "31-50 metros",
        probability: 0.05,
        healthCost: [15, 25],
        finds: [
            { type: 'fosiles', amount: [1, 3], emoji: '🦴', name: 'Fósiles' },
            { type: 'diamantes', amount: [2, 5], emoji: '💎', name: 'Diamantes' },
            { type: 'tesoro', amount: [1, 1], emoji: '🏺', name: 'Artefacto antiguo', special: true }
        ]
    }
];

export default {
    name: 'excavar',
    alias: ['dig', 'excavacion'],
    
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
            
            // Verificar salud
            if (user.health < 15) {
                return await replyWithContext(
                    '⚠️ *Estás muy débil para excavar*\n' +
                    '> Necesitas al menos 15 de salud',
                    [senderJid]
                );
            }
            
            // Verificar cooldown
            const cooldownTime = 180000; // 3 minutos
            const now = Date.now();
            
            if (user.lastExcavar && (now - user.lastExcavar) < cooldownTime) {
                const remaining = getRemainingTime(user.lastExcavar, cooldownTime);
                return await replyWithContext(
                    `⏳ *Debes esperar ${remaining}* para volver a excavar`,
                    [senderJid]
                );
            }
            
            user.lastExcavar = now;
            
            // Seleccionar capa
            const rand = Math.random();
            let selectedLayer;
            let cumulative = 0;
            
            for (const layer of layers) {
                cumulative += layer.probability;
                if (rand < cumulative) {
                    selectedLayer = layer;
                    break;
                }
            }
            
            if (!selectedLayer) selectedLayer = layers[0];
            
            // Calcular salud perdida
            const saludPerdida = Math.floor(Math.random() * (selectedLayer.healthCost[1] - selectedLayer.healthCost[0] + 1)) + selectedLayer.healthCost[0];
            user.health = Math.max(0, user.health - saludPerdida);
            
            // Generar hallazgos
            let findsText = '';
            let totalValue = 0;
            
            for (const find of selectedLayer.finds) {
                if (Math.random() < 0.7) { // 70% de encontrar cada recurso
                    const cantidad = Math.floor(Math.random() * (find.amount[1] - find.amount[0] + 1)) + find.amount[0];
                    
                    if (find.type === 'piedras') user.minerals.piedras += cantidad;
                    else if (find.type === 'diamantes') user.minerals.diamantes += cantidad;
                    else if (find.type === 'esmeraldas') user.minerals.esmeraldas += cantidad;
                    else if (find.type === 'oro') user.minerals.oro += cantidad;
                    else if (find.type === 'rubies') user.minerals.rubies += cantidad;
                    else if (find.type === 'fosiles') user.minerals.fosiles += cantidad;
                    else if (find.type === 'arcilla') {
                        if (!user.minerals.arcilla) user.minerals.arcilla = 0;
                        user.minerals.arcilla += cantidad;
                    } else if (find.type === 'carbon') {
                        if (!user.minerals.carbon) user.minerals.carbon = 0;
                        user.minerals.carbon += cantidad;
                    } else if (find.type === 'hierro') {
                        if (!user.minerals.hierro) user.minerals.hierro = 0;
                        user.minerals.hierro += cantidad;
                    }
                    
                    findsText += `> ${find.emoji} *${find.name}:* +${cantidad}\n`;
                    totalValue += cantidad * (find.type === 'diamantes' ? 15 : find.type === 'esmeraldas' ? 10 : find.type === 'oro' ? 12 : 1);
                }
            }
            
            // Bonus por pico mejorado
            if (user.items.pico > 1) {
                const bonus = Math.floor(totalValue * 0.1 * user.items.pico);
                user.coins += bonus;
                findsText += `\n⛏️ *Bonus por pico nivel ${user.items.pico}:* +${bonus} coins`;
            }
            
            saveEconomy(economy);
            
            const excavarText = `⛏️ *EXCAVACIÓN*\n\n` +
                `📍 *${selectedLayer.name}*\n` +
                `📏 *Profundidad:* ${selectedLayer.depth}\n\n` +
                `🎑 *HALLAZGOS*\n\n` +
                findsText +
                `\n❤️ *Salud perdida:* -${saludPerdida}`;
            
            await replyWithContext(excavarText, [senderJid]);
            
        } catch (error) {
            console.error('❌ Error en comando excavar:', error);
        }
    }
};
