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

// Precios de compra (objeto → coins)
const buyPrices = {
    // Items de curación
    'agua': { price: 5, emoji: '🍶', name: 'Agua', type: 'item' },
    'vendas': { price: 20, emoji: '🩹', name: 'Vendas', type: 'item' },
    'pastillas': { price: 8, emoji: '💊', name: 'Pastillas', type: 'item' },
    
    // Minerales básicos
    'piedras': { price: 2, emoji: '🪨', name: 'Piedras', type: 'mineral' },
    'diamantes': { price: 15, emoji: '💎', name: 'Diamantes', type: 'mineral' },
    'esmeraldas': { price: 10, emoji: '💚', name: 'Esmeraldas', type: 'mineral' },
    'oro': { price: 12, emoji: '🪙', name: 'Oro', type: 'mineral' },
    
    // Minerales especiales
    'rubies': { price: 25, emoji: '🔴', name: 'Rubíes', type: 'mineral' },
    'zafiros': { price: 22, emoji: '🔵', name: 'Zafiros', type: 'mineral' },
    'fosiles': { price: 30, emoji: '🦴', name: 'Fósiles', type: 'mineral' },
    'arcilla': { price: 3, emoji: '🧱', name: 'Arcilla', type: 'mineral' },
    'carbon': { price: 4, emoji: '🪨', name: 'Carbón', type: 'mineral' },
    'hierro': { price: 6, emoji: '⛓️', name: 'Hierro', type: 'mineral' },
    'platino': { price: 18, emoji: '🥈', name: 'Platino', type: 'mineral' },
    'cobre': { price: 4, emoji: '🥉', name: 'Cobre', type: 'mineral' },
    
    // Minerales mágicos
    'cristal_magico': { price: 40, emoji: '🔮', name: 'Cristal Mágico', type: 'mineral' },
    'polvo_estelar': { price: 35, emoji: '✨', name: 'Polvo Estelar', type: 'mineral' },
    'esencia': { price: 45, emoji: '💫', name: 'Esencia', type: 'mineral' },
    
    // Items especiales
    'mapa': { price: 50, emoji: '🗺️', name: 'Mapa del Tesoro', type: 'item' },
    'pico': { price: 100, emoji: '⛏️', name: 'Mejora de Pico', type: 'mejora' },
    'pala': { price: 80, emoji: '🪣', name: 'Mejora de Pala', type: 'mejora' },
    'varita': { price: 200, emoji: '🪄', name: 'Varita Mágica', type: 'item' }
};

// Precios de venta (objeto → coins recibidos)
const sellPrices = {
    // Items de curación
    'agua': { price: 3, emoji: '🍶', name: 'Agua' },
    'vendas': { price: 10, emoji: '🩹', name: 'Vendas' },
    'pastillas': { price: 4, emoji: '💊', name: 'Pastillas' },
    
    // Minerales básicos
    'piedras': { price: 1, emoji: '🪨', name: 'Piedras' },
    'diamantes': { price: 10, emoji: '💎', name: 'Diamantes' },
    'esmeraldas': { price: 7, emoji: '💚', name: 'Esmeraldas' },
    'oro': { price: 8, emoji: '🪙', name: 'Oro' },
    
    // Minerales especiales
    'rubies': { price: 18, emoji: '🔴', name: 'Rubíes' },
    'zafiros': { price: 15, emoji: '🔵', name: 'Zafiros' },
    'fosiles': { price: 20, emoji: '🦴', name: 'Fósiles' },
    'arcilla': { price: 2, emoji: '🧱', name: 'Arcilla' },
    'carbon': { price: 3, emoji: '🪨', name: 'Carbón' },
    'hierro': { price: 4, emoji: '⛓️', name: 'Hierro' },
    'platino': { price: 12, emoji: '🥈', name: 'Platino' },
    'cobre': { price: 3, emoji: '🥉', name: 'Cobre' },
    
    // Minerales mágicos
    'cristal_magico': { price: 30, emoji: '🔮', name: 'Cristal Mágico' },
    'polvo_estelar': { price: 25, emoji: '✨', name: 'Polvo Estelar' },
    'esencia': { price: 35, emoji: '💫', name: 'Esencia' },
    
    // Items especiales
    'mapa': { price: 35, emoji: '🗺️', name: 'Mapa del Tesoro' },
    'varita': { price: 150, emoji: '🪄', name: 'Varita Mágica' }
};

// Intercambios (trade) entre objetos
const trades = [
    // Básicos
    { from: 'diamantes', fromAmount: 1, to: 'oro', toAmount: 3, emoji: '💎→🪙', desc: '1 Diamante → 3 Oro' },
    { from: 'oro', fromAmount: 5, to: 'diamantes', toAmount: 1, emoji: '🪙→💎', desc: '5 Oro → 1 Diamante' },
    { from: 'diamantes', fromAmount: 2, to: 'esmeraldas', toAmount: 5, emoji: '💎→💚', desc: '2 Diamantes → 5 Esmeraldas' },
    { from: 'esmeraldas', fromAmount: 5, to: 'diamantes', toAmount: 2, emoji: '💚→💎', desc: '5 Esmeraldas → 2 Diamantes' },
    
    // Especiales
    { from: 'rubies', fromAmount: 2, to: 'diamantes', toAmount: 3, emoji: '🔴→💎', desc: '2 Rubíes → 3 Diamantes' },
    { from: 'zafiros', fromAmount: 3, to: 'esmeraldas', toAmount: 5, emoji: '🔵→💚', desc: '3 Zafiros → 5 Esmeraldas' },
    { from: 'fosiles', fromAmount: 1, to: 'platino', toAmount: 5, emoji: '🦴→🥈', desc: '1 Fósil → 5 Platino' },
    { from: 'hierro', fromAmount: 10, to: 'oro', toAmount: 2, emoji: '⛓️→🪙', desc: '10 Hierro → 2 Oro' },
    { from: 'platino', fromAmount: 5, to: 'diamantes', toAmount: 2, emoji: '🥈→💎', desc: '5 Platino → 2 Diamantes' },
    
    // Mágicos
    { from: 'cristal_magico', fromAmount: 2, to: 'diamantes', toAmount: 5, emoji: '🔮→💎', desc: '2 Cristales Mágicos → 5 Diamantes' },
    { from: 'polvo_estelar', fromAmount: 5, to: 'esencia', toAmount: 1, emoji: '✨→💫', desc: '5 Polvo Estelar → 1 Esencia' },
    { from: 'esencia', fromAmount: 1, to: 'cristal_magico', toAmount: 3, emoji: '💫→🔮', desc: '1 Esencia → 3 Cristales Mágicos' },
    
    // Items
    { from: 'mapa', fromAmount: 1, to: 'diamantes', toAmount: 8, emoji: '🗺️→💎', desc: '1 Mapa → 8 Diamantes' },
    { from: 'diamantes', fromAmount: 10, to: 'mapa', toAmount: 1, emoji: '💎→🗺️', desc: '10 Diamantes → 1 Mapa' }
];

// Función para mostrar lista de objetos disponibles
function getObjectsList() {
    let listText = `📦 *OBJETOS DISPONIBLES*\n\n`;
    
    listText += `┌─〔 *💊 CURACIÓN* 〕\n`;
    listText += `│ 🍶 agua\n`;
    listText += `│ 🩹 vendas\n`;
    listText += `│ 💊 pastillas\n`;
    listText += `└───────────────\n\n`;
    
    listText += `┌─〔 *🪨 MINERALES BÁSICOS* 〕\n`;
    listText += `│ 🪨 piedras\n`;
    listText += `│ 💎 diamantes\n`;
    listText += `│ 💚 esmeraldas\n`;
    listText += `│ 🪙 oro\n`;
    listText += `└───────────────\n\n`;
    
    listText += `┌─〔 *💎 MINERALES ESPECIALES* 〕\n`;
    listText += `│ 🔴 rubies\n`;
    listText += `│ 🔵 zafiros\n`;
    listText += `│ 🦴 fosiles\n`;
    listText += `│ 🧱 arcilla\n`;
    listText += `│ 🪨 carbon\n`;
    listText += `│ ⛓️ hierro\n`;
    listText += `│ 🥈 platino\n`;
    listText += `│ 🥉 cobre\n`;
    listText += `└───────────────\n\n`;
    
    listText += `┌─〔 *🔮 MINERALES MÁGICOS* 〕\n`;
    listText += `│ 🔮 cristal_magico\n`;
    listText += `│ ✨ polvo_estelar\n`;
    listText += `│ 💫 esencia\n`;
    listText += `└───────────────\n\n`;
    
    listText += `┌─〔 *🎁 ITEMS ESPECIALES* 〕\n`;
    listText += `│ 🗺️ mapa\n`;
    listText += `│ ⛏️ pico (mejora)\n`;
    listText += `│ 🪣 pala (mejora)\n`;
    listText += `│ 🪄 varita\n`;
    listText += `└───────────────`;
    
    return listText;
}

export default {
    name: 'buy',
    alias: ['comprar', 'vender', 'trade', 'cambiar'],
    
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
            
            // Si no hay argumentos, mostrar ayuda completa
            if (!args || args.length === 0) {
                let helpText = `💰 *COMANDOS BUY*\n\n`;
                
                helpText += `┌─〔 *📖 USO* 〕\n`;
                helpText += `│ ${config.prefix}buy [objeto] / [cantidad]  (comprar)\n`;
                helpText += `│ ${config.prefix}buy sell [objeto] / [cantidad]  (vender)\n`;
                helpText += `│ ${config.prefix}buy trade [objeto1] / [objeto2]  (intercambiar)\n`;
                helpText += `│ ${config.prefix}buy list  (ver objetos disponibles)\n`;
                helpText += `│ ${config.prefix}buy prices  (ver precios)\n`;
                helpText += `└───────────────\n\n`;
                
                helpText += `┌─〔 *📝 EJEMPLOS* 〕\n`;
                helpText += `│ ${config.prefix}buy diamantes / 5\n`;
                helpText += `│ ${config.prefix}buy sell oro / 3\n`;
                helpText += `│ ${config.prefix}buy trade diamantes / oro\n`;
                helpText += `└───────────────`;
                
                return await replyWithContext(helpText, [senderJid]);
            }
            
            let economy = loadEconomy();
            const user = initUserEconomy(economy, senderNumber, pushName);
            
            const command = args[0].toLowerCase();
            
            // ==========================================
            // CASO ESPECIAL: LISTA DE OBJETOS
            // ==========================================
            if (command === 'list' || command === 'lista') {
                return await replyWithContext(getObjectsList(), [senderJid]);
            }
            
            // ==========================================
            // CASO ESPECIAL: VER PRECIOS
            // ==========================================
            if (command === 'prices' || command === 'precios') {
                let pricesText = `💰 *PRECIOS*\n\n`;
                
                pricesText += `┌─〔 *🛒 COMPRAR* 〕\n`;
                for (const [item, data] of Object.entries(buyPrices)) {
                    pricesText += `│ ${data.emoji} ${data.name}: ${data.price} Coins\n`;
                }
                pricesText += `└───────────────\n\n`;
                
                pricesText += `┌─〔 *💰 VENDER* 〕\n`;
                for (const [item, data] of Object.entries(sellPrices)) {
                    pricesText += `│ ${data.emoji} ${data.name}: ${data.price} Coins\n`;
                }
                pricesText += `└───────────────`;
                
                return await replyWithContext(pricesText, [senderJid]);
            }
            
            // ==========================================
            // CASO 1: VENDER (buy sell objeto / cantidad)
            // ==========================================
            if (command === 'sell' || command === 'vender') {
                if (args.length < 2) {
                    return await replyWithContext(
                        '❌ Uso: buy sell [objeto] / [cantidad]\n' +
                        'Ej: buy sell diamantes / 2',
                        [senderJid]
                    );
                }
                
                const input = args.slice(1).join(' ').split('/').map(s => s.trim().toLowerCase());
                const objeto = input[0];
                const cantidad = input[1] ? parseInt(input[1]) : 1;
                
                if (!sellPrices[objeto]) {
                    return await replyWithContext(
                        '❌ No puedes vender ese objeto\n' +
                        '> Usa *buy list* para ver objetos disponibles',
                        [senderJid]
                    );
                }
                
                if (isNaN(cantidad) || cantidad < 1) {
                    return await replyWithContext(
                        '❌ Cantidad no válida',
                        [senderJid]
                    );
                }
                
                // Verificar si tiene el objeto
                let tieneObjeto = false;
                if (objeto === 'agua' || objeto === 'vendas' || objeto === 'pastillas' || 
                    objeto === 'mapa' || objeto === 'varita') {
                    tieneObjeto = (user.items[objeto] || 0) >= cantidad;
                } else if (objeto === 'pico' || objeto === 'pala') {
                    tieneObjeto = (user.items[objeto] || 1) > cantidad;
                } else {
                    tieneObjeto = (user.minerals[objeto] || 0) >= cantidad;
                }
                
                if (!tieneObjeto) {
                    return await replyWithContext(
                        `❌ No tienes *${cantidad}* ${sellPrices[objeto].emoji} ${sellPrices[objeto].name}`,
                        [senderJid]
                    );
                }
                
                // Quitar objeto
                if (objeto === 'agua' || objeto === 'vendas' || objeto === 'pastillas' || 
                    objeto === 'mapa' || objeto === 'varita') {
                    user.items[objeto] -= cantidad;
                } else if (objeto === 'pico' || objeto === 'pala') {
                    user.items[objeto] -= cantidad;
                } else {
                    user.minerals[objeto] -= cantidad;
                }
                
                // Dar coins
                const coinsRecibidos = sellPrices[objeto].price * cantidad;
                user.coins += coinsRecibidos;
                
                saveEconomy(economy);
                
                return await replyWithContext(
                    `💰 *VENTA EXITOSA*\n\n` +
                    `> Vendiste: ${sellPrices[objeto].emoji} *${cantidad}* ${sellPrices[objeto].name}\n` +
                    `> Recibiste: *${coinsRecibidos}* coins\n` +
                    `> Total: *${user.coins}* coins`,
                    [senderJid]
                );
            }
            
            // ==========================================
            // CASO 2: INTERCAMBIAR (buy trade objeto1 / objeto2)
            // ==========================================
            else if (command === 'trade' || command === 'cambiar') {
                if (args.length < 2) {
                    return await replyWithContext(
                        '❌ Uso: buy trade [objeto1] / [objeto2]\n' +
                        'Ej: buy trade diamantes / oro\n\n' +
                        '📋 *INTERCAMBIOS DISPONIBLES:*\n' +
                        trades.map(t => `• ${t.emoji} ${t.desc}`).join('\n'),
                        [senderJid]
                    );
                }
                
                const input = args.slice(1).join(' ').split('/').map(s => s.trim().toLowerCase());
                const fromObj = input[0];
                const toObj = input[1];
                
                const trade = trades.find(t => t.from === fromObj && t.to === toObj);
                
                if (!trade) {
                    return await replyWithContext(
                        '❌ Intercambio no disponible\n' +
                        '> Usa *buy list* para ver objetos disponibles',
                        [senderJid]
                    );
                }
                
                // Verificar si tiene suficientes
                let tieneFrom = false;
                if (['agua', 'vendas', 'pastillas', 'mapa', 'varita'].includes(fromObj)) {
                    tieneFrom = (user.items[fromObj] || 0) >= trade.fromAmount;
                } else {
                    tieneFrom = (user.minerals[fromObj] || 0) >= trade.fromAmount;
                }
                
                if (!tieneFrom) {
                    return await replyWithContext(
                        `❌ No tienes *${trade.fromAmount}* ${trade.emoji.split('→')[0]} ${fromObj}\n` +
                        `> Tienes: ${user.minerals[fromObj] || user.items[fromObj] || 0}`,
                        [senderJid]
                    );
                }
                
                // Quitar objeto origen
                if (['agua', 'vendas', 'pastillas', 'mapa', 'varita'].includes(fromObj)) {
                    user.items[fromObj] -= trade.fromAmount;
                } else {
                    user.minerals[fromObj] -= trade.fromAmount;
                }
                
                // Dar objeto destino
                if (['agua', 'vendas', 'pastillas', 'mapa', 'varita'].includes(toObj)) {
                    user.items[toObj] += trade.toAmount;
                } else {
                    user.minerals[toObj] += trade.toAmount;
                }
                
                saveEconomy(economy);
                
                return await replyWithContext(
                    `🔄 *INTERCAMBIO EXITOSO*\n\n` +
                    `> ${trade.emoji} ${trade.desc}\n\n` +
                    `> Ahora tienes: *${user.minerals[toObj] || user.items[toObj] || 0}* ${toObj}`,
                    [senderJid]
                );
            }
            
            // ==========================================
            // CASO 3: COMPRAR (buy objeto / cantidad)
            // ==========================================
            else {
                const input = args.join(' ').split('/').map(s => s.trim().toLowerCase());
                const objeto = input[0];
                const cantidad = input[1] ? parseInt(input[1]) : 1;
                
                if (!buyPrices[objeto]) {
                    return await replyWithContext(
                        '❌ No puedes comprar ese objeto\n' +
                        '> Usa *buy list* para ver objetos disponibles',
                        [senderJid]
                    );
                }
                
                if (isNaN(cantidad) || cantidad < 1) {
                    return await replyWithContext(
                        '❌ Cantidad no válida',
                        [senderJid]
                    );
                }
                
                const item = buyPrices[objeto];
                const totalCost = item.price * cantidad;
                
                if (user.coins < totalCost) {
                    return await replyWithContext(
                        `❌ No tienes suficientes coins\n` +
                        `> Necesitas: *${totalCost}* coins\n` +
                        `> Tienes: *${user.coins}* coins`,
                        [senderJid]
                    );
                }
                
                user.coins -= totalCost;
                
                if (item.type === 'item' || item.type === 'mejora') {
                    if (!user.items[objeto]) user.items[objeto] = 0;
                    user.items[objeto] += cantidad;
                } else {
                    if (!user.minerals[objeto]) user.minerals[objeto] = 0;
                    user.minerals[objeto] += cantidad;
                }
                
                saveEconomy(economy);
                
   
