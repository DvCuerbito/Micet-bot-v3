import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '..', 'temp');

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFolderSize(folderPath) {
    let totalSize = 0;
    try {
        if (fs.existsSync(folderPath)) {
            const files = fs.readdirSync(folderPath);
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                } else if (stats.isDirectory()) {
                    totalSize += getFolderSize(filePath);
                }
            }
        }
    } catch (error) {
        console.error('Error calculando tamaño:', error);
    }
    return totalSize;
}

function cleanTemp() {
    let deletedCount = 0;
    let deletedSize = 0;
    
    try {
        if (fs.existsSync(TEMP_DIR)) {
            const files = fs.readdirSync(TEMP_DIR);
            
            for (const file of files) {
                const filePath = path.join(TEMP_DIR, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isFile()) {
                    deletedSize += stats.size;
                    fs.unlinkSync(filePath);
                    deletedCount++;
                } else if (stats.isDirectory()) {
                    const folderSize = getFolderSize(filePath);
                    deletedSize += folderSize;
                    fs.rmSync(filePath, { recursive: true, force: true });
                    deletedCount++;
                }
            }
        } else {
            return { success: false, error: 'La carpeta temp no existe', deletedCount: 0, deletedSize: 0 };
        }
        
        return { success: true, deletedCount, deletedSize, error: null };
        
    } catch (error) {
        console.error('Error limpiando temp:', error);
        return { success: false, error: error.message, deletedCount, deletedSize };
    }
}

export default {
    name: 'cleartemp',
    alias: ['limpiartemp', 'deletetemp'],
    
    async execute(sock, msg, options) {
        try {
            const { config, args, senderNumber, pushName, replyWithContext } = options;
            const from = msg.key.remoteJid;
            
            const OWNER_ID = '5219992042946';
            
            // Limpiar el número (eliminar @s.whatsapp.net y caracteres no numéricos)
            const cleanSenderNumber = senderNumber ? senderNumber.replace(/[^0-9]/g, '') : '';
            
            if (cleanSenderNumber !== OWNER_ID) {
                await replyWithContext(
                    `๑ֵ݊🍀 ᥱᥣ ᥴ᥆mᥲᥒძ᥆ \`${config.prefix}cleartemp\` ᥒ᥆ ᥱ᥊іs𝗍ᥱ.\n> ೯۪🎑̶ֵ ᥙsᥲ ${config.prefix}help ⍴ᥲrᥲ ᥎ᥱr mіs ᥴ᥆mᥲᥒძ᥆s`,
                    []
                );
                return;
            }
            
            // Verificar si la carpeta temp existe
            if (!fs.existsSync(TEMP_DIR)) {
                await replyWithContext(
                    `📁 *La carpeta temp no existe*`,
                    []
                );
                return;
            }
            
            // Calcular tamaño antes de limpiar
            const sizeBefore = getFolderSize(TEMP_DIR);
            
            // Mostrar reacción de limpieza
            try {
                await sock.sendMessage(from, { react: { text: '🧹', key: msg.key } });
            } catch (e) {}
            
            // Enviar mensaje de procesamiento
            await replyWithContext(
                `🧹 *Limpiando carpeta temp...*\n\n📁 Ruta: ${TEMP_DIR}\n📦 Tamaño actual: ${formatSize(sizeBefore)}`,
                []
            );
            
            // Limpiar la carpeta temp
            const result = cleanTemp();
            
            if (result.success) {
                const sizeAfter = getFolderSize(TEMP_DIR);
                
                const caption = `╭ִׄ─ֺ࡙─ᰮ̥━̼╸╼ֺ࡙🍒╾ׄ╺ֺ━ִ─ֺ̥─꥓̼╮ֺ\n           *Clear*\n⏝ּ̥〫⌣꥓ּ︶̥✿ֺ꤫❀꥓ּ︶ִ̥⌣𝅼⏝ּ̥〫\n\nㅤׅ̥݀֯𐔌ּ࡙݀͡🍭 *Archivos eliminados* » ${result.deletedCount}\nㅤׅ̥݀֯𐔌ּ࡙݀͡🍭 *Espacio liberado* » ${formatSize(result.deletedSize)}\nㅤׅ̥݀֯𐔌ּ࡙݀͡🍭 *Tamaño antes* » ${formatSize(sizeBefore)}\nㅤׅ̥݀֯𐔌ּ࡙݀͡🍭 *Tamaño después* » ${formatSize(sizeAfter)}`;
                
                await replyWithContext(caption, []);
                
                try {
                    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                } catch (e) {}
                
                console.log(`🧹 Temp limpiado por OWNER ${pushName || senderNumber}: ${result.deletedCount} archivos, ${formatSize(result.deletedSize)} liberados`);
                
            } else {
                await replyWithContext(
                    `❌ *Error al limpiar la carpeta temp*\n\n> ${result.error}`,
                    []
                );
                
                try {
                    await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
                } catch (e) {}
            }
            
        } catch (error) {
            console.error('❌ Error en cleartemp:', error);
            
            try {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            } catch (e) {}
            
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
