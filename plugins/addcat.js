import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER_NUMBER = "5219992042946"; // Número del owner sin @

export default {
    name: 'addcat',
    alias: [],
    
    async execute(sock, msg, options) {
        try {
            const { args, config, senderNumber, senderJid } = options;
            const from = msg.key.remoteJid;
            
            // Verificar si es el owner (por número)
            if (senderNumber !== OWNER_NUMBER) {
                await sock.sendMessage(from, {
                    text: `๑ֵ݊🍀 ᥱᥣ ᥴ᥆mᥲᥒძ᥆ \`${config.prefix}addcat\` ᥒ᥆ ᥱ᥊іs𝗍ᥱ.\n> ೯۪🎑̶ֵ ᥙsᥲ ${config.prefix}help ⍴ᥲrᥲ ᥎ᥱr mіs ᥴ᥆mᥲᥒძ᥆s`,
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
            
            // Obtener nombre de categoría
            const categoryName = args.join(' ').trim();
            
            if (!categoryName) {
                await sock.sendMessage(from, {
                    text: `♡ Debes proporcionar el nombre de una categoría\n> Ejemplo » ${config.prefix}setcat Información`,
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
            
            // Cargar menú actual
            const menuPath = path.join(__dirname, '..', 'databases', 'menu.json');
            let menuData = { categories: [], banner: 'img/banner.jpg' };
            
            try {
                if (fs.existsSync(menuPath)) {
                    const data = fs.readFileSync(menuPath, 'utf8');
                    menuData = JSON.parse(data);
                }
            } catch (error) {
                console.error('Error cargando menú:', error);
            }
            
            // Verificar si la categoría ya existe
            const existingCategory = menuData.categories.find(cat => 
                cat.name.toLowerCase() === categoryName.toLowerCase()
            );
            
            if (existingCategory) {
                await sock.sendMessage(from, {
                    text: `♡ La categoría "${categoryName}" ya existe.`,
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
            
            // Agregar nueva categoría
            menuData.categories.push({
                name: categoryName,
                commands: []
            });
            
            // Guardar menú
            try {
                fs.writeFileSync(menuPath, JSON.stringify(menuData, null, 2));
                
                await sock.sendMessage(from, {
                    text: `♡ Se ha agregado la categoría "${categoryName}"`,
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
                console.error('Error guardando menú:', error);
                
                await sock.sendMessage(from, {
                    text: `🌼 Error al agregar categoría: ${error.message}`,
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
            console.error('Error en setcat:', error);
            
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
