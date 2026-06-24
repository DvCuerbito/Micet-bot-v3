import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================
// FUNCIONES LOCALES
// ====================

// Cargar base de datos de niveles
function loadLevelDB() {
    try {
        const levelFile = path.join(__dirname, '..', 'databases', 'level.json');
        if (fs.existsSync(levelFile)) {
            const data = fs.readFileSync(levelFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error cargando level.json:', error);
    }
    return {};
}

// Cargar base de datos de usuarios para obtener pushNames
function loadUsersDB() {
    try {
        const usersFile = path.join(__dirname, '..', 'databases', 'users.json');
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error cargando users.json:', error);
    }
    return {};
}

// Obtener top usuarios por exp
function getTopUsers(page = 1, usersPerPage = 10) {
    try {
        const levelDB = loadLevelDB();
        const usersDB = loadUsersDB();
        
        // Convertir a array y ordenar por exp descendente
        const usersArray = Object.entries(levelDB).map(([userNumber, data]) => {
            // Obtener pushName de usersDB si existe
            const pushName = usersDB[userNumber]?.pushName || userNumber;
            const userJid = usersDB[userNumber]?.jid || `${userNumber}@s.whatsapp.net`;
            
            return {
                userNumber: userNumber,
                userJid: userJid,
                pushName: pushName,
                exp: data.exp || 0,
                messages: data.messages || 0,
                commands: data.commands || 0
            };
        });
        
        // Ordenar por exp (mayor a menor)
        usersArray.sort((a, b) => b.exp - a.exp);
        
        // Calcular paginación
        const startIndex = (page - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const paginatedUsers = usersArray.slice(startIndex, endIndex);
        
        // Calcular total de páginas
        const totalPages = Math.ceil(usersArray.length / usersPerPage);
        
        return {
            users: paginatedUsers,
            currentPage: page,
            totalPages: totalPages,
            totalUsers: usersArray.length
        };
        
    } catch (error) {
        console.error('Error obteniendo top usuarios:', error);
        return {
            users: [],
            currentPage: 1,
            totalPages: 0,
            totalUsers: 0
        };
    }
}

// ====================
// COMANDO PRINCIPAL
// ====================

export default {
    name: 'top',
    alias: ['ranking', 'topusers', 'toplevel'],
    
    async execute(sock, msg, options) {
        try {
            const { args, config } = options;
            const from = msg.key.remoteJid;
            
            // Determinar página solicitada
            let page = 1;
            if (args.length > 0) {
                const requestedPage = parseInt(args[0]);
                if (!isNaN(requestedPage) && requestedPage > 0) {
                    page = requestedPage;
                }
            }
            
            // Obtener top usuarios
            const topData = getTopUsers(page, 10);
            
            // Verificar si hay usuarios
            if (topData.totalUsers === 0) {
                return await sock.sendMessage(from, {
                    text: '🎑 No hay datos de usuarios disponibles',
                    contextInfo: {
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        }
                    }
                }, { quoted: msg });
            }
            
            // Verificar si la página solicitada existe
            if (page > topData.totalPages) {
                return await sock.sendMessage(from, {
                    text: `❤️ Solo hay ${topData.totalPages} lista${topData.totalPages !== 1 ? 's' : ''} disponible${topData.totalPages !== 1 ? 's' : ''}`,
                    contextInfo: {
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        }
                    }
                }, { quoted: msg });
            }
            
            // Construir mensaje del top
            let message = `ꆭ 🌠ᩨ Top usuarios con más exp⠳ㅤׂ:\n`;
            message += `> ★ Lista *${topData.currentPage}* de ${topData.totalPages} lista${topData.totalPages !== 1 ? 's' : ''}.\n\n`;
            
            // Agregar cada usuario del top
            topData.users.forEach((user, index) => {
                const globalPosition = ((topData.currentPage - 1) * 10) + index + 1;
                message += `#${globalPosition} ${user.pushName}\n`;
                message += `ꉂ᮫ׅꉂ۪࣪🎑𖹭ᩧ᮫ׅ࣪ ${user.exp}\n\n`;
            });
            
            // Si es la última página y hay menos de 10 usuarios, no agregar línea extra
            if (topData.users.length === 10) {
                message = message.trim(); // Eliminar el último salto de línea si existe
            }
            
            // Recolectar todos los usuarios mencionados para mentions
            const mentions = topData.users.map(user => user.userJid).filter(jid => jid);
            
            // Enviar mensaje
            await sock.sendMessage(from, {
                text: message.trim(),
                mentions: mentions,
                contextInfo: {
                    mentionedJid: mentions,
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.canalId || '',
                        serverMessageId: 0,
                        newsletterName: config.canalmbre || '⭐̸̷᪲ 𝕸𝖔𝖔𝖓𝖑𝖎𝖌𝖍𝖙 𝖚𝖘𝖊𝖗𝖘 ♡⃘꤬֟🎑ꨩּ݄҇ᬊ໋۟'
                    }
                }
            }, { quoted: msg });
            
            console.log(`📊 Comando top ejecutado - Página ${page}`);
            
        } catch (error) {
            console.error('❌ Error en comando top:', error);
            
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Error al obtener top usuarios: ${error.message}`,
                    contextInfo: {
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: options.config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: options.config.canalNombre || ''
                        }
                    }
                }, { quoted: msg });
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    }
};
