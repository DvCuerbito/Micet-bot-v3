import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ECONOMY_FILE = path.join(__dirname, '..', 'databases', 'economy.json');
const MERCHANT_FILE = path.join(__dirname, '..', 'databases', 'merchant.json');

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

function loadMerchant() {
    try {
        if (fs.existsSync(MERCHANT_FILE)) {
            return JSON.parse(fs.readFileSync(MERCHANT_FILE, 'utf8'));
        }
        return { lastRestock: 0, offers: [] };
    } catch (error) {
        console.error('Error cargando comerciante:', error);
        return { lastRestock: 0, offers: [] };
    }
}

function saveMerchant(merchant) {
    try {
        fs.writeFileSync(MERCHANT_FILE, JSON.stringify(merchant, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error guardando comerciante:', error);
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

// OFERTAS DE COMPRA
const buyOffers = [
    { id: 1, item: 'Agua', price: 5, emoji: '🍶', resource: 'agua', type: 'item' },
    { id: 2, item: 'Vendas', price: 20, emoji: '🩹', resource: 'vendas', type: 'item' },
    { id: 3, item: 'Pastillas', price: 8, emoji: '💊', resource: 'pastillas', type: 'item' },
    { id: 4, item: 'Piedras', price: 2, emoji: '🪨', resource: 'piedras', type: 'mineral' },
    { id: 5, item: 'Diamantes', price: 15, emoji: '💎', resource: 'diamantes', type: 'mineral' },
    { id: 6, item: 'Esmeraldas', price: 10, emoji: '💚', resource: 'esmeraldas', type: 'mineral' },
    { id: 7, item: 'Oro', price: 12, emoji: '🪙', resource: 'oro', type: 'mineral' },
    { id: 8, item: 'Rubíes', price: 25, emoji: '🔴', resource: 'rubies', type: 'mineral' },
    { id: 9, item: 'Zafiros', price: 22, emoji: '🔵', resource: 'zafiros', type: 'mineral' },
    { id: 10, item: 'Fósiles', price: 30, emoji: '🦴', resource: 'fosiles', type: 'mineral' },
    { id: 11, item: 'Arcilla', price: 3, emoji: '🧱', resource: 'arcilla', type: 'mineral' },
    { id: 12, item: 'Hierro', price: 6, emoji: '⛓️', resource: 'hierro', type: 'mineral' },
    { id: 13, item: 'Platino', price: 18, emoji: '🥈', resource: 'platino', type: 'mineral' },
    { id: 14, item: 'Cobre', price: 4, emoji: '🥉', resource: 'cobre', type: 'mineral' },
    { id: 15, item: 'Cristal Mágico', price: 40, emoji: '🔮', resource: 'cristal_magico', type: 'mineral' },
    { id: 16, item: 'Polvo Estelar', price: 35, emoji: '✨', resource: 'polvo_estelar', type: 'mineral' },
    { id: 17, item: 'Esencia', price: 45, emoji: '💫', resource: 'esencia', type: 'mineral' },
    { id: 18, item: 'Mapa del Tesoro', price: 50, emoji: '🗺️', resource: 'mapa', type: 'item' },
    { id: 19, item: 'Mejora de Pico', price: 100, emoji: '⛏️', resource: 'pico', type: 'mejora' },
    { id: 20, item: 'Mejora de Pala', price: 80, emoji: '🪣', resource: 'pala', type: 'mejora' },
    { id: 21, item: 'Varita Mágica', price: 200, emoji: '🪄', resource: 'varita', type: 'item' }
];

function getRandomOffers(count = 10) {
    const shuffled = [...buyOffers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).sort((a, b) => a.id - b.id);
}

export default {
    name: 'comerciante',
    alias: ['trader', 'mercader', 'tienda'],
    
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
            
            let economy = loadEconomy();
            let merchant = loadMerchant();
            const user = initUserEconomy(economy, senderNumber, pushName);
            
            const now = Date.now();
            const restockTime = 3600000; // 1 hora
            
            // Reabastecer si pasó 1 hora
            if (!merchant.lastRestock || (now - merchant.lastRestock) > restockTime) {
                merchant.offers = getRandomOffers(10);
                merchant.lastRestock = now;
                saveMerchant(merchant);
            }
            
            // Si hay un argumento numérico, procesar compra rápida
            if (args && args.length > 0) {
                const offerId = parseInt(args[0]);
                
                if (!isNaN(offerId) && offerId >= 1) {
                    const selected = merchant.offers.find(o => o.id === offerId);
                    
                    if (!selected) {
                        return await replyWithContext(
                            '❌ Oferta no encontrada',
                            [senderJid]
                        );
                    }
                    
                    if (user.coins < selected.price) {
                        return await replyWithContext(
                            `❌ No tienes suficientes coins\n` +
                            `> *${selected.item}* cuesta *${selected.price}* coins\n` +
                            `> Tienes: *${user.coins}* coins`,
                            [senderJid]
                        );
                    }
                    
                    user.coins -= selected.price;
                    
                    if (selected.type === 'mineral') {
                        if (!user.minerals[selected.resource]) user.minerals[selected.resource] = 0;
                        user.minerals[selected.resource] += 1;
                    } else if (selected.type === 'item') {
                        if (!user.items[selected.resource]) user.items[selected.resource] = 0;
                        user.items[selected.resource] += 1;
                    } else if (selected.type === 'mejora') {
                        user.items[selected.resource] = (user.items[selected.resource] || 0) + 1;
                    }
                    
                    merchant.offers = merchant.offers.filter(o => o.id !== offerId);
                    
                    saveEconomy(economy);
                    saveMerchant(merchant);
                    
                    return await replyWithContext(
                        `✅ *Compra exitosa*\n\n` +
                        `> Compraste: ${selected.emoji} *${selected.item}*\n` +
                        `> Te quedan: *${user.coins}* coins`,
                        [senderJid]
                    );
                }
            }
            
            // Mostrar lista desplegable estilo setprimary
            const timeLeft = restockTime - (now - merchant.lastRestock);
            const minutesLeft = Math.floor(timeLeft / 60000);
            const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
            
            // Crear rows para la lista desplegable
            const rows = merchant.offers.map(offer => ({
                title: `${offer.emoji} ${offer.item}`,
                description: `💰 ${offer.price} coins`,
                id: `${config.prefix}comerciante ${offer.id}`
            }));
            
            const sections = [{
                title: "🛒 PRODUCTOS DISPONIBLES",
                rows: rows
            }];
            
            const message = `🧙 *COMERCIANTE AMBULANTE*\n\n` +
                           `🕐 *Reabastecimiento:* ${minutesLeft}m ${secondsLeft}s\n` +
                           `💰 *Tus coins:* ${user.coins}\n\n` +
                           `📜 *Selecciona un producto del menú desplegable para comprarlo.*`;
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: message,
                footer: `🛒 ${config.name}`,
                interactiveButtons: [
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: "🛍️ Ver productos",
                            sections,
                        }),
                    },
                ],
            }, { quoted: msg });
            
            console.log(`✅ Comerciante abierto por ${pushName || senderNumber} - ${merchant.offers.length} ofertas`);
            
        } catch (error) {
            console.error('❌ Error en comando comerciante:', error);
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Error: ${error.message}`,
                contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: options.config?.canalId || '',
                        serverMessageId: 0,
                        newsletterName: options.config?.canalNombre || ''
                    }
                }
            }, { quoted: msg });
        }
    }
};
