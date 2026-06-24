import { 
    makeWASocket,
    Browsers,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    jidDecode
} from '@whiskeysockets/baileys'

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import { smsg } from './message.js'
import { createInfoFolder } from './utils/createInfoFolder.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (!global.mainBots) global.mainBots = []

const cleanJid = jid => jid?.replace(/:\d+/, '').split('@')[0]

const createCompleteLogger = () => {
  const noop = () => {}
  
  return {
    level: 'silent',
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    child: () => createCompleteLogger()
  }
}

function loadBotConfig(phone) {
  try {
    const configPath = path.join(process.cwd(), 'info', phone, 'config.js');
    
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const jsonMatch = configContent.match(/export default\s+({[\s\S]*})/);
      
      if (jsonMatch && jsonMatch[1]) {
        const savedConfig = eval('(' + jsonMatch[1] + ')');
        console.log(chalk.green(`[MAINBOT ${phone}] ✅ Configuración cargada desde archivo`));
        return savedConfig;
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`[MAINBOT ${phone}] ⚠️ Error cargando configuración:`, error.message));
  }
  return null;
}

let codeGeneratedForMain = {};

export async function mainBot({
  m = null,
  client = null,
  phone,
  chatId = null,
  onSuccess = null,
  onError = null,
  joinGroup = true,
  isAutoReconnect = false
}) {

  const id = phone || (m ? cleanJid(m?.sender) : phone)
  const sessionDir = `./Sessions/Main/${id}`

  console.log(chalk.blue(`[MAINBOT ${phone}] Iniciando ${isAutoReconnect ? 'auto-reconnect' : 'nuevo'}`));
  console.log(chalk.blue(`[MAINBOT ${phone}] Sesión: ${sessionDir}`));
  
  // Protección contra null en auto-reconexión
  if (!m) m = { sender: phone + '@s.whatsapp.net' }
  
  if (!fs.existsSync('./Sessions/Main')) {
    fs.mkdirSync('./Sessions/Main', { recursive: true });
    console.log(chalk.yellow(`[MAINBOT ${phone}] Carpeta Main creada`));
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false,
    browser: Browsers.windows('Edge'),
    markOnlineOnConnect: true,
    syncFullHistory: false,
    logger: createCompleteLogger()
  })

  // Si client es null, usar sock
  if (!client) client = sock
  if (!chatId) chatId = phone + '@s.whatsapp.net'

  let qrSent = false;
  let connectedSuccessfully = false;
  let qrTimeout = null;
  let shouldJoinGroup = joinGroup;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  if (!codeGeneratedForMain[phone]) {
    codeGeneratedForMain[phone] = false;
  }

  sock.isSubBot = false
  sock.isMainBot = true
  sock.sessionType = 'main'
  sock.phoneNumber = phone

  console.log(chalk.blue(`[MAINBOT ${phone}] Socket creado`));

  sock.ev.on('creds.update', saveCreds)

  sock.decodeJid = jid => {
    if (!jid) return jid
    if (/:\d+@/.test(jid)) {
      const d = jidDecode(jid)
      return d?.user && d?.server ? `${d.user}@${d.server}` : jid
    }
    return jid
  }

  let mainBotConfig = loadBotConfig(phone);
  
  if (!mainBotConfig) {
    mainBotConfig = {
      name: 'MICETT PREM',
      name1: 'PREMIUM,
      prefix: '.',
      tipo: 'PREMIUM',
      version: '2.0.1',
      navegador: 'Windows Edge',
      botowner: '5219992042946',
      creador: 'Cuerbito',
      baileys: '7.0.9',
      canalId: '120363427517609839@newsletter',
      canalNombre:  'Premium bot 💎',
      owner: ['5219992042946', '5492644156919', '542646762285'],
      ownerNumber: '',
      group1: 'https://chat.whatsapp.com/KCJNyt4SQZR392FOZXlsb3',
      group2: 'https://chat.whatsapp.com/LnuUG5cfZHgEERIWrI1t85',
      group3: 'https://whatsapp.com/channel/0029Vb6qIht5q08ZMPgVrA1y',
      isMainBot: true,
      APIs: {
        xyro: { url: "https://api.xyro.site", key: null },
        yupra: { url: "https://api.yupra.my.id", key: null },
        vreden: { url: "https://api.vreden.web.id", key: null },
        delirius: { url: "https://api.delirius.store", key: null },
        zenzxz: { url: "https://api.zenzxz.my.id", key: null },
        siputzx: { url: "https://api.siputzx.my.id", key: null },
        adonix: { url: "https://api-adonix.ultraplus.click", key: 'Destroy-xyz' }
      }
    };
    console.log(chalk.yellow(`[MAINBOT ${phone}] ⚠️ No hay configuración, usando valores básicos`));
  }

  if (!mainBotConfig.canalId) mainBotConfig.canalId = '120363403616345878@newsletter';
  if (!mainBotConfig.canalNombre) mainBotConfig.canalNombre = '✩ ᴍᴏᴏɴʟɪɢʜᴛ sᴛᴀғғ ✩';
  if (!mainBotConfig.group1) mainBotConfig.group1 = 'https://chat.whatsapp.com/KCJNyt4SQZR392FOZXlsb3';
  if (!mainBotConfig.group2) mainBotConfig.group2 = 'https://chat.whatsapp.com/LnuUG5cfZHgEERIWrI1t85';
  if (!mainBotConfig.group3) mainBotConfig.group3 = 'https://whatsapp.com/channel/0029Vb6qIht5q08ZMPgVrA1y';
  
  if (!mainBotConfig.APIs) {
    mainBotConfig.APIs = {
      xyro: { url: "https://api.xyro.site", key: null },
      yupra: { url: "https://api.yupra.my.id", key: null },
      vreden: { url: "https://api.vreden.web.id", key: null },
      delirius: { url: "https://api.delirius.store", key: null },
      zenzxz: { url: "https://api.zenzxz.my.id", key: null },
      siputzx: { url: "https://api.siputzx.my.id", key: null },
      adonix: { url: "https://api-adonix.ultraplus.click", key: 'Destroy-xyz' }
    };
  }

  if (!Array.isArray(mainBotConfig.owner)) {
    mainBotConfig.owner = mainBotConfig.owner ? [mainBotConfig.owner] : [];
  }

  let handler = null
  let plugins = new Map()
  
  async function loadHandlerAndPlugins() {
    try {
      const pluginsDir = './plugins'
      if (fs.existsSync(pluginsDir)) {
        const pluginFiles = fs.readdirSync(pluginsDir).filter(file => 
          file.endsWith('.js') && !file.startsWith('_')
        )
        
        if (!isAutoReconnect) {
          console.log(chalk.cyan(`[MAINBOT ${phone}] Encontrados ${pluginFiles.length} plugins`))
        }
        
        for (const file of pluginFiles) {
          try {
            const pluginUrl = new URL(`../plugins/${file}`, import.meta.url).href
            const pluginModule = await import(pluginUrl)
            
            if (pluginModule.default) {
              const plugin = pluginModule.default
              plugins.set(plugin.name, plugin)
              
              if (plugin.alias) {
                if (Array.isArray(plugin.alias)) {
                  plugin.alias.forEach(alias => plugins.set(alias, plugin))
                } else {
                  plugins.set(plugin.alias, plugin)
                }
              }
            }
          } catch (error) {
            if (!isAutoReconnect) {
              console.log(chalk.yellow(`[MAINBOT ${phone}] ❌ ${file}:`, error.message))
            }
          }
        }
      }
      
      try {
        const handlerUrl = new URL('../handler.js', import.meta.url).href
        const handlerModule = await import(handlerUrl)
        handler = handlerModule.default
        console.log(chalk.green(`[MAINBOT ${phone}] ✅ Handler cargado`))
      } catch (error) {
        if (!isAutoReconnect) {
          console.log(chalk.red(`[MAINBOT ${phone}] ❌ Error cargando handler:`, error.message))
        }
      }
      
    } catch (error) {
      if (!isAutoReconnect) {
        console.log(chalk.red(`[MAINBOT ${phone}] Error cargando recursos:`, error.message))
      }
    }
  }

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      
      if (!msg.message) return;
      
      if (handler && plugins.size > 0) {
        await handler(sock, msg, plugins, mainBotConfig)
      }
      
    } catch (error) {
      if (!isAutoReconnect) {
        console.error(chalk.red(`[MAINBOT ${phone}] Error en handler:`), error.message)
      }
    }
  })

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {

    console.log(chalk.blue(`[MAINBOT ${phone}] Conexión update: ${connection}`));

    if (qr && phone && !qrSent && !isAutoReconnect && !codeGeneratedForMain[phone]) {
      try {
        codeGeneratedForMain[phone] = true;
        qrSent = true;
        console.log(chalk.cyan(`[MAINBOT ${phone}] Generando código...`));
        
        if (qrTimeout) clearTimeout(qrTimeout);
        
        let code = await sock.requestPairingCode(phone)
        code = code.match(/.{1,4}/g)?.join('-') || code

        console.log(chalk.green(`[MAINBOT ${phone}] Código obtenido: ${code}`))
        
        if (client && chatId) {
          try {
            const codeMessage = await client.sendMessage(chatId, { 
              text: `*${code}*` 
            });
            
            console.log(chalk.green(`[MAINBOT ${phone}] ✓ Código enviado`));
            
            setTimeout(async () => {
              try {
                await client.sendMessage(chatId, { delete: codeMessage.key });
              } catch (deleteError) {}
            }, 60_000);
            
          } catch (sendError) {
            console.error(chalk.red(`[MAINBOT ${phone}] Error enviando código:`), sendError.message);
          }
        }

        qrTimeout = setTimeout(() => {
          if (!connectedSuccessfully) {
            console.log(chalk.yellow(`[MAINBOT ${phone}] QR expirado`))
            if (typeof onError === 'function') {
              onError(new Error('QR expirado'));
            }
          }
        }, 65_000);

      } catch (e) {
        console.log(chalk.red(`[MAINBOT ${phone}] PAIRING ERROR`), e.message || e)
        if (typeof onError === 'function') onError(e);
      }
    }

    if (connection === 'open') {
      connectedSuccessfully = true;
      reconnectAttempts = 0;
      
      console.log(chalk.cyan(`[MAINBOT ${phone}] Conexión abierta`));
      
      if (qrTimeout) clearTimeout(qrTimeout);
      
      sock.userId = cleanJid(sock.user.id)
      sock.phoneNumber = phone;

      const existingIndex = global.mainBots.findIndex(c => c.userId === sock.userId);
      if (existingIndex === -1) {
        global.mainBots.push(sock);
      } else {
        global.mainBots[existingIndex] = sock;
      }

      console.log(chalk.green(`[MAINBOT ${phone}] ✅ Conectado ${isAutoReconnect ? '(auto-reconnect)' : ''}`))
      
      const refreshedConfig = loadBotConfig(phone);
      if (refreshedConfig) {
        mainBotConfig = refreshedConfig;
      }
      
      // Crear carpeta info
      try {
        const result = createInfoFolder(phone, 'main', mainBotConfig)
        if (result.success) {
          console.log(chalk.green(`[MAINBOT ${phone}] ✅ Carpeta info lista`))
        }
      } catch (infoError) {
        console.log(chalk.yellow(`[MAINBOT ${phone}] ⚠️ Error carpeta info:`, infoError.message))
      }
      
      if (typeof onSuccess === 'function') {
        onSuccess(sock.userId);
      }
      
      await loadHandlerAndPlugins()
      
      console.log(chalk.cyan(`[MAINBOT ${phone}] 📂 Plugins: ${plugins.size} | 🔧 Prefijo: ${mainBotConfig.prefix}`));
      
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      const isLoggedOut = reason === DisconnectReason.loggedOut

      console.log(chalk.red(`[MAINBOT ${phone}] ❌ Desconectado (${reason})`))
      
      if (sock.userId) {
        global.mainBots = global.mainBots.filter(c => c.userId !== sock.userId);
      }

      if (isLoggedOut) {
        console.log(chalk.red(`[MAINBOT ${phone}] 🔴 Sesión desvinculada - eliminando carpeta`));
        try {
          if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
          }
        } catch (error) {
          console.log(chalk.red(`[MAINBOT ${phone}] Error eliminando sesión:`), error.message);
        }
        return;
      }
      
      if (!isLoggedOut) {
        reconnectAttempts++;
        
        if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
          console.log(chalk.yellow(`[MAINBOT ${phone}] ⏳ Reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} en 3s...`))
          
          setTimeout(() => {
            mainBot({
              m: { sender: phone + '@s.whatsapp.net' },
              client: sock,
              phone: phone,
              chatId: phone + '@s.whatsapp.net',
              onSuccess: null,
              onError: null,
              joinGroup: false,
              isAutoReconnect: true
            });
          }, 3000);
        } else {
          console.log(chalk.red(`[MAINBOT ${phone}] 🔴 Máximos intentos alcanzados (${MAX_RECONNECT_ATTEMPTS})`));
        }
      }
    }
  })

  return sock
}

export default { mainBot }
