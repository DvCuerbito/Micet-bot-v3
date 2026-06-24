import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER_ID = "189202503315478";

export default {
    name: 'catdesc',
    alias: [],
    
    async execute(sock, msg, options) {
        try {
            const { args, config, sender } = options;
            const from = msg.key.remoteJid;
            
            // Verificar si es el owner
            const senderNumber = sender.split('@')[0];
            if (senderNumber !== OWNER_ID) {
                await sock.sendMessage(from, {
                    text: `🍟 el comando \`${config.prefix}catdesc\` no lo encontré.\n> ೯۪🍫 ᥙsᥲ ${config.prefix}help ⍴ᥲrᥲ ᥎ᥱr mіs ᥴ᥆mᥲᥒძ᥆s`,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
                return;
            }
            
            // Obtener argumentos
            const input = args.join(' ');
            const parts = input.split('=').map(part => part.trim());
            
            if (parts.length < 2 || !parts[0] || !parts[1]) {
                await sock.sendMessage(from, {
                    text: `🌵 *ᴅᴇʙᴇs ᴘʀᴏᴘᴏʀᴄɪᴏɴᴀʀ ᴜɴᴀ ᴄᴀᴛᴇɢᴏʀɪ́ᴀ ʏ ᴅᴇsᴄʀɪᴘᴄɪᴏ́ɴ*\n\`Ejemplo\`\n> ${config.prefix}catdesc Información = Comandos de información del bot`,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
                return;
            }
            
            const categoryName = parts[0];
            const description = parts.slice(1).join('=').trim();
            
            // Cargar menú
            const menuPath = path.join(__dirname, '..', 'databases', 'menu.json');
            let menuData = { 
                categories: [], 
                banner: 'img/banner.jpg',
                commandDescriptions: {},
                categoryDescriptions: {}
            };
            
            try {
                if (fs.existsSync(menuPath)) {
                    const data = fs.readFileSync(menuPath, 'utf8');
                    menuData = JSON.parse(data);
                }
            } catch (error) {
                console.error('Error cargando menú:', error);
            }
            
            // Verificar si la categoría existe
            const categoryExists = menuData.categories.some(cat => cat.name === categoryName);
            
            if (!categoryExists) {
                await sock.sendMessage(from, {
                    text: `🍟 *ʟᴀ ᴄᴀᴛᴇɢᴏʀɪ́ᴀ "${categoryName}" ɴᴏ ᴇxɪsᴛᴇ*\nUsa ${config.prefix}setcat para crearla`,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
                return;
            }
            
            // Guardar descripción
            if (!menuData.categoryDescriptions) {
                menuData.categoryDescriptions = {};
            }
            
            menuData.categoryDescriptions[categoryName] = description;
            
            // Guardar archivo
            try {
                fs.writeFileSync(menuPath, JSON.stringify(menuData, null, 2));
                
                await sock.sendMessage(from, {
                    text: `😼 *sᴇ ʜᴀ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴏ ʟᴀ ᴅᴇsᴄʀɪᴘᴄɪᴏ́ɴ ᴅᴇ ʟᴀ ᴄᴀᴛᴇɢᴏʀɪ́ᴀ* *${categoryName}*`,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
            } catch (error) {
                console.error('Error guardando catdesc:', error);
                
                await sock.sendMessage(from, {
                    text: `🌵 *ᴇʀʀᴏʀ ᴀʟ ɢᴜᴀʀᴅᴀʀ ʟᴀ ᴅᴇsᴄʀɪᴘᴄɪᴏ́ɴ*`,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
            }
        } catch (error) {
            console.error('Error en catdesc:', error);
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Error: ${error.message}`,
                contextInfo: {
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: options.config.canalId || '',
                        serverMessageId: 0,
                        newsletterName: options.config.canalNombre || ''
                    },
                    forwardingScore: 9999999,
                    isForwarded: true
                }
            }, { quoted: msg });
        }
    }
};
