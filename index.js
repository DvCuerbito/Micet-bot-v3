import { 
    makeWASocket,
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidDecode
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';
import chalk from "chalk";
import NodeCache from 'node-cache';
import cfonts from 'cfonts';
import readlineSync from "readline-sync";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = await import('./config.js').then(m => m.default || m);
import handler from './handler.js';
import { initializeSubBotManager, getConnectionStatus } from './lib/subBotManager.js';
import { initializeMainBotManager, getMainBotStatus } from './lib/mainBotManager.js';

const msgRetryCounterCache = new NodeCache();

const log = {
  info: (msg) => console.log(chalk.bgBlue.white.bold(`INFO`), chalk.white(msg)),
  success: (msg) => console.log(chalk.bgGreen.white.bold(`SUCCESS`), chalk.greenBright(msg)),
  warn: (msg) => console.log(chalk.bgYellowBright.blueBright.bold(`WARNING`), chalk.yellow(msg)),
  warning: (msg) => console.log(chalk.bgYellowBright.blueBright.bold(`WARNING`), chalk.yellow(msg)),
  error: (msg) => console.log(chalk.bgRed.white.bold(`ERROR`), chalk.redBright(msg))
};

const sessionName = "./sessions";
const methodCodeQR = process.argv.includes("--qr");
const methodCode = process.argv.includes("code") || process.argv.includes("--code");
let phoneNumber = "";
let phoneInput = "";
let opcion;

const DIGITS = (s = "") => String(s).replace(/\D/g, "");
function normalizePhoneForPairing(input) {
  let s = DIGITS(input);
  if (!s) return "";
  if (s.startsWith("0")) s = s.replace(/^0+/, "");
  if (s.length === 10 && s.startsWith("3")) s = "57" + s;
  if (s.startsWith("52") && !s.startsWith("521") && s.length >= 12) s = "521" + s.slice(2);
  if (s.startsWith("54") && !s.startsWith("549") && s.length >= 11) s = "549" + s.slice(2);
  return s;
}

const folders = ['databases', 'temp', 'plugins', 'sessions', 'img', 'Sessions', 'Sessions/Subs', 'Sessions/Main'];
folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
});

function cleanTempFolder() {
    const tempPath = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempPath)) {
        fs.mkdirSync(tempPath, { recursive: true });
        return;
    }
    try {
        const files = fs.readdirSync(tempPath);
        let deletedCount = 0;
        files.forEach(file => {
            const filePath = path.join(tempPath, file);
            try {
                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                }
            } catch (err) {}
        });
        if (deletedCount > 0) {
            console.log(chalk.gray(`[ 🗑️ ] Cache tmp: ${deletedCount} archivos eliminados`));
        }
    } catch (error) {}
}

function startTempCleaner() {
    cleanTempFolder();
    setInterval(() => cleanTempFolder(), 5 * 60 * 1000);
}

console.clear();

const { say } = cfonts;
say('Moonlight', {
    font: 'chrome',
    align: 'center',
    gradient: ['red', 'magenta']
});

say(`Powered by Moonlight Staff`, {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta']
});

console.log(chalk.magentaBright('\n❀ Iniciando...\n'));

if (methodCodeQR) {
    opcion = "1";
} else if (methodCode) {
    opcion = "2";
} else if (!fs.existsSync("./sessions/creds.json")) {
    console.log(chalk.bold.white("\nSeleccione una opción:"));
    console.log(chalk.blueBright("1. Con código QR"));
    console.log(chalk.cyan("2. Con código de texto de 8 dígitos"));
    opcion = readlineSync.question(chalk.bold.white("--> "));
    
    while (!/^[1-2]$/.test(opcion)) {
        console.log(chalk.bold.redBright(`No se permiten numeros que no sean 1 o 2`));
        opcion = readlineSync.question("--> ");
    }
    
    if (opcion === "2") {
        console.log(chalk.bold.redBright(`\nPor favor, Ingrese el número de WhatsApp.\n${chalk.bold.yellowBright("Ejemplo: +57301******")}\n${chalk.bold.magentaBright('---> ')}`));
        phoneInput = readlineSync.question("");
        phoneNumber = normalizePhoneForPairing(phoneInput);
    }
}

startTempCleaner();

let plugins = new Map();
let pluginWatcher = null;
let currentSock = null;
let reconexion = 0;
const intentos = 15;

async function cargarPluginIndividual(filePath) {
    try {
        const fileUrl = `file://${filePath}?update=${Date.now()}`;
        const pluginModule = await import(fileUrl);
        const pluginData = pluginModule.default || pluginModule;
        
        if (pluginData.name) {
            const fileName = path.basename(filePath);
            const oldNames = [];
            for (const [name, plugin] of plugins.entries()) {
                if (plugin === pluginData && name !== pluginData.name.toLowerCase()) {
                    oldNames.push(name);
                }
            }
            oldNames.forEach(name => plugins.delete(name));
            
            plugins.set(pluginData.name.toLowerCase(), pluginData);
            
            if (pluginData.alias && Array.isArray(pluginData.alias)) {
                pluginData.alias.forEach(alias => {
                    plugins.set(alias.toLowerCase(), pluginData);
                });
            }
            
            log.success(`Plugin cargado: ${pluginData.name}`);
            return true;
        }
    } catch (error) {
        log.error(`Error cargando plugin: ${path.basename(filePath)} - ${error.message}`);
    }
    return false;
}

async function cargarPlugins() {
    const pluginsDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
        fs.mkdirSync(pluginsDir, { recursive: true });
        return;
    }
    const pluginFiles = fs.readdirSync(pluginsDir).filter(file => file.endsWith('.js'));
    for (const file of pluginFiles) {
        await cargarPluginIndividual(path.join(pluginsDir, file));
    }
    log.info(`${plugins.size} plugin(s) cargado(s)`);
}

function iniciarWatcherPlugins() {
    const pluginsDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
    if (pluginWatcher) pluginWatcher.close();
    
    pluginWatcher = fs.watch(pluginsDir, { persistent: true }, async (eventType, filename) => {
        if (!filename || !filename.endsWith('.js')) return;
        const filePath = path.join(pluginsDir, filename);
        if (eventType === 'change') {
            setTimeout(async () => await cargarPluginIndividual(filePath), 100);
        }
        if (eventType === 'rename' && fs.existsSync(filePath)) {
            setTimeout(async () => await cargarPluginIndividual(filePath), 100);
        }
    });
}

async function startBot() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionName);
        const { version } = await fetchLatestBaileysVersion();
        const logger = pino({ level: "silent" });
        
        console.info = () => {};
        console.debug = () => {};
        
        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: false,
            browser: Browsers.macOS('Chrome'),
            auth: { 
                creds: state.creds, 
                keys: makeCacheableSignalKeyStore(state.keys, logger) 
            },
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            getMessage: async () => "",
            keepAliveIntervalMs: 45000,
            maxIdleTimeMs: 60000,
            msgRetryCounterCache,
        });

        currentSock = sock;
        global.client = sock;

        await cargarPlugins();
        iniciarWatcherPlugins();

        let managersStarted = false;

        if (opcion === "2" && !fs.existsSync("./sessions/creds.json")) {
            setTimeout(async () => {
                try {
                    if (!state.creds.registered) {
                        const pairing = await sock.requestPairingCode(phoneNumber);
                        const codeBot = pairing?.match(/.{1,4}/g)?.join("-") || pairing;
                        console.log(chalk.bold.white(chalk.bgMagenta(`\n🔢 Código de emparejamiento:`)), chalk.bold.white(chalk.white(codeBot)));
                        console.log(chalk.gray('📱 Ingresa este código en WhatsApp > Dispositivos vinculados\n'));
                    }
                } catch (err) {
                    log.error("Error al generar código: " + err.message);
                }
            }, 3000);
        }

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { qr, connection, lastDisconnect } = update;
            
            if (qr != 0 && qr != undefined || methodCodeQR) {
                if (opcion == '1' || methodCodeQR) {
                    console.log(chalk.green.bold("\n[ ✿ ] Escanea este código QR\n"));
                    qrcode.generate(qr, { small: true });
                }
            }

            if (connection === "close") {
                const reason = lastDisconnect?.error?.output?.statusCode || 0;
                
                if (reason === DisconnectReason.loggedOut) {
                    log.warn("Sesión cerrada. Eliminando...");
                    exec("rm -rf ./sessions/*");
                    process.exit(1);
                } else if (reason === DisconnectReason.forbidden) {
                    log.error("Error de conexión, escanee nuevamente...");
                    exec("rm -rf ./sessions/*");
                    process.exit(1);
                } else if (reason === DisconnectReason.multideviceMismatch) {
                    log.warn("Inicia nuevamente");
                    exec("rm -rf ./sessions/*");
                    process.exit(0);
                } else if (reason === DisconnectReason.connectionReplaced) {
                    log.warn("Primero cierre la sesión actual...");
                    return;
                } else {
                    reconexion++;
                    if (reconexion > intentos) {
                        log.error(`Demasiados reintentos (${intentos}). Reinicia manualmente.`);
                        process.exit(1);
                    }
                    const delay = Math.min(3000 * reconexion, 30000);
                    log.warn(`Desconexión (${reason}), reconectando en ${delay/1000}s...`);
                    setTimeout(() => startBot(), delay);
                }
            }

            if (connection === "open") {
                reconexion = 0;
                const userName = sock.user?.name || "Desconocido";
                console.log(chalk.green.bold(`\n[ ✿ ] Conectado a: ${userName}`));
                
                global.principalBot = sock;
                
                if (!managersStarted) {
                    managersStarted = true;
                    
                    console.log(chalk.cyan('\n[ 🤖 ] Iniciando Main Bots...'));
                    initializeMainBotManager(sock, config);
                    
                    console.log(chalk.cyan('[ 🛸 ] Iniciando Sub Bots...'));
                    initializeSubBotManager(sock, config);
                    
                    setTimeout(() => {
                        const subStatus = getConnectionStatus();
                        const mainStatus = getMainBotStatus();
                        console.log(chalk.cyan('\n📊 ESTADÍSTICAS:'));
                        console.log(chalk.cyan(`   🤖 Main bots: ${mainStatus.active}/${mainStatus.total} activos`));
                        console.log(chalk.cyan(`   🛸 Sub-bots: ${subStatus.active}/${subStatus.total} activos`));
                        console.log(chalk.green(`\n✅ Bot listo! Usa ${config.prefix}ping para probar.\n`));
                    }, 5000);
                }
            }
        });

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const kay = chatUpdate.messages[0];
                if (!kay?.message) return;
                if (kay.key?.remoteJid === 'status@broadcast') return;
                kay.message = Object.keys(kay.message)[0] === 'ephemeralMessage' 
                    ? kay.message.ephemeralMessage.message 
                    : kay.message;
                if (kay.key.fromMe && kay.key.id.startsWith('3EB0')) return;
                
                await handler(sock, kay, plugins, config);
            } catch (err) {
                console.log(chalk.red('Error en mensaje:'), err);
            }
        });

        sock.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
            }
            return jid;
        };

        return sock;
        
    } catch (error) {
        log.error(`Error en startBot: ${error.message}`);
        console.log(chalk.yellow('🔄 Reintentando en 5 segundos...'));
        setTimeout(() => startBot(), 5000);
    }
}

startBot();

process.once('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Cerrando bot...\n'));
    if (pluginWatcher) pluginWatcher.close();
    if (currentSock) {
        try { currentSock.end(); } catch (e) {}
    }
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    const msg = err?.message || '';
    if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed')) return;
    console.error(chalk.red('[uncaughtException]'), msg.slice(0, 120));
});

process.on('unhandledRejection', (reason) => {
    const msg = String(reason?.message || reason || '');
    if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed')) return;
    console.error(chalk.red('[unhandledRejection]'), msg.slice(0, 120));
});
