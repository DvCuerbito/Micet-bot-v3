import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(__dirname);

export default {
    name: 'backup',
    alias: [], // Sin alias como en tu estilo
    
    async execute(sock, msg, options) {
        try {
            const { config, usersDB, senderNumber, senderJid, pushName, args } = options;
            const from = msg.key.remoteJid;
            
            // Verificar registro
            if (usersDB && senderNumber && !usersDB[senderNumber]) {
                await sock.sendMessage(from, { 
                    text: `🧃 Para usar mis comandos tienes que estar registrado.\n> Uso : ${config.prefix}reg Misa.16`,
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
            
            // Verificar si el usuario es el owner
            const isOwner = config.owner && config.owner.some(ownerNum => 
                ownerNum.replace(/\D/g, '') === (senderNumber || '').replace(/\D/g, '')
            );
            
            if (!isOwner) {
                await sock.sendMessage(from, {
                    text: `๑ֵ݊🍀 ᥱᥣ ᥴ᥆mᥲᥒძ᥆ \`${config.prefix}backup\` ᥒ᥆ ᥱ᥊іs𝗍ᥱ.\n> ೯۪🎑̶ֵ ᥙsᥲ ${config.prefix}help ⍴ᥲrᥲ ᥎ᥱr mіs ᥴ᥆mᥲᥒძ᥆s`,
                    contextInfo: {
                        mentionedJid: [senderJid],
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
            
            // Mostrar que está procesando
            await sock.sendPresenceUpdate('composing', from);
            
            try {
                await sock.sendMessage(from, { react: { text: '📦', key: msg.key } });
            } catch (e) {}
            
            // Mensaje de inicio
            await sock.sendMessage(from, {
                text: `🌠 Creando respaldo del bot...\n> Esto puede tomar unos segundos`,
                contextInfo: {
                    mentionedJid: [senderJid],
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.canalId || '',
                        serverMessageId: 0,
                        newsletterName: config.canalNombre || ''
                    }
                }
            }, { quoted: msg });
            
            // Crear timestamp para el nombre del archivo
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
            const zipFileName = `${config.name || 'bot'}-backup-${timestamp}.zip`;
            const tempDir = path.join(__dirname, '..', 'temp');
            
            // Asegurar que existe la carpeta temp
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            const zipFilePath = path.join(tempDir, zipFileName);
            
            // Crear archivo ZIP
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Máxima compresión
            });
            
            // Variable para almacenar la lista de archivos incluidos
            const includedItems = [];
            
            // Manejar eventos del archiver
            archive.on('error', (err) => {
                throw err;
            });
            
            // Pipe del archivo de salida
            archive.pipe(output);
            
            // Archivos y carpetas a incluir (solo los esenciales, excluir videos pesados)
            const itemsToBackup = [
                'databases',
                'videos',
                'plugins',
                'config.js',
                'handler.js',
                'lib',
                'index.js',
                'package.json',
                'package-lock.json'
            ];
            
            const baseDir = path.join(__dirname, '..');
            
            // Función para calcular tamaño de carpeta
            const getFolderSize = (dir) => {
                let size = 0;
                try {
                    const files = fs.readdirSync(dir);
                    for (const file of files) {
                        const filePath = path.join(dir, file);
                        const fileStat = fs.statSync(filePath);
                        if (fileStat.isDirectory()) {
                            size += getFolderSize(filePath);
                        } else {
                            size += fileStat.size;
                        }
                    }
                } catch (e) {
                    console.log(`Error calculando tamaño de ${dir}:`, e.message);
                }
                return size;
            };
            
            // Agregar cada item al ZIP
            for (const item of itemsToBackup) {
                const itemPath = path.join(baseDir, item);
                
                if (fs.existsSync(itemPath)) {
                    const stats = fs.statSync(itemPath);
                    
                    if (stats.isDirectory()) {
                        // Calcular tamaño de la carpeta
                        const folderSize = getFolderSize(itemPath);
                        const folderSizeMB = folderSize / (1024 * 1024);
                        
                        // Si es videos y es muy grande, omitir
                        if (item === 'videos' && folderSizeMB > 50) {
                            console.log(`⚠️ Carpeta ${item} es muy grande (${folderSizeMB.toFixed(2)}MB), omitiendo...`);
                            includedItems.push(`📂 ${item} (omitido - ${folderSizeMB.toFixed(2)}MB)`);
                            continue;
                        }
                        
                        // Si la carpeta es muy grande (>20MB), advertir
                        if (folderSizeMB > 20) {
                            console.log(`⚠️ Carpeta ${item} es grande: ${folderSizeMB.toFixed(2)}MB`);
                        }
                        
                        archive.directory(itemPath, item);
                        includedItems.push(`📂 ${item} (${folderSizeMB.toFixed(2)}MB)`);
                        console.log(`📁 Agregando carpeta: ${item} (${folderSizeMB.toFixed(2)}MB)`);
                    } else {
                        const fileSizeMB = stats.size / (1024 * 1024);
                        archive.file(itemPath, { name: item });
                        includedItems.push(`📄 ${item} (${fileSizeMB.toFixed(2)}MB)`);
                        console.log(`📄 Agregando archivo: ${item} (${fileSizeMB.toFixed(2)}MB)`);
                    }
                } else {
                    console.log(`⚠️ No encontrado: ${item}`);
                }
            }
            
            // Finalizar el archivo
            await archive.finalize();
            
            // Esperar a que se termine de escribir
            await new Promise((resolve, reject) => {
                output.on('close', () => {
                    console.log(`✅ Backup creado: ${zipFileName} (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`);
                    resolve();
                });
                output.on('error', reject);
            });
            
            const zipSize = archive.pointer();
            const zipSizeMB = zipSize / (1024 / 1024);
            
            // Verificar tamaño máximo (WhatsApp tiene límite de 100MB para documentos)
            if (zipSize > 95 * 1024 * 1024) {
                await sock.sendMessage(from, {
                    text: `⚠️ *El backup es demasiado grande* (${zipSizeMB.toFixed(2)}MB)\n\n` +
                          `El límite de WhatsApp es ~100MB. Intenta excluir carpetas pesadas como 'videos' o 'temp'.\n\n` +
                          `Puedes ejecutar el comando nuevamente después de limpiar archivos temporales.`,
                    contextInfo: {
                        mentionedJid: [senderJid],
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        }
                    }
                }, { quoted: msg });
                
                // Limpiar archivo
                try { fs.unlinkSync(zipFilePath); } catch (e) {}
                return;
            }
            
            // Leer el archivo ZIP
            const zipBuffer = fs.readFileSync(zipFilePath);
            
            // Crear lista de archivos para el caption
            let filesList = '';
            const maxItems = 15;
            const itemsToShow = includedItems.slice(0, maxItems);
            
            itemsToShow.forEach(item => {
                filesList += `├─ ${item}\n`;
            });
            
            if (includedItems.length > maxItems) {
                filesList += `└─ ... y ${includedItems.length - maxItems} más\n`;
            } else if (filesList.length > 0) {
                const lastIndex = filesList.lastIndexOf('├─');
                if (lastIndex !== -1) {
                    filesList = filesList.substring(0, lastIndex) + '└─' + filesList.substring(lastIndex + 2);
                }
            }
            
            // Enviar el archivo
            await sock.sendMessage(from, {
                document: zipBuffer,
                fileName: zipFileName,
                mimetype: 'application/zip',
                caption: `🌠 *BACKUP COMPLETO*\n\n` +
                        `🍁 Respaldo creado exitosamente\n` +
                        `📁 Archivos incluidos:\n` +
                        filesList +
                        `\n🗓️ Fecha: ${new Date().toLocaleString()}\n` +
                        `📊 Tamaño: ${zipSizeMB.toFixed(2)} MB\n` +
                        `🔰 Solicitado por: ${pushName || senderNumber}`,
                contextInfo: {
                    mentionedJid: [senderJid],
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.canalId || '',
                        serverMessageId: 0,
                        newsletterName: config.canalNombre || ''
                    }
                }
            }, { quoted: msg });
            
            // Reacción de éxito
            try {
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
            } catch (e) {}
            
            console.log(`✅ Backup enviado a OWNER: ${pushName || senderNumber} - ${zipSizeMB.toFixed(2)} MB`);
            
            // Limpiar archivo temporal después de enviar
            setTimeout(() => {
                try {
                    if (fs.existsSync(zipFilePath)) {
                        fs.unlinkSync(zipFilePath);
                        console.log(`🧹 Archivo temporal eliminado: ${zipFileName}`);
                    }
                } catch (cleanError) {
                    console.error('Error eliminando archivo temporal:', cleanError);
                }
            }, 30000);
            
        } catch (error) {
            console.error('❌ Error en comando backup:', error);
            
            try {
                await sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ *Error al crear backup:*\n\`\`\`${error.message}\`\`\``,
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
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    }
};
