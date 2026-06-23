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

if (!global.conns) global.conns = []

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

async function joinGroupAutomatically(sock, groupLink) {
  try {
    const groupCode = groupLink.match(/https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/)?.[1];
    
    if (!groupCode) {
      return false;
    }
    
    const groupJid = await sock.groupGetInviteInfo(groupCode);
    
    if (groupJid && groupJid.id) {
      await sock.groupAcceptInvite(groupCode);
      return true;
    }
    
  } catch (error) {
    // Silenciar errores de unión a grupo
  }
  
  return false;
}

function deleteSubBotSession(phone) {
  try {
    const sessionPath = path.join(process.cwd(), 'Sessions', 'Subs', phone);
    
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(chalk.red(`[SUBBOT ${phone}] 🗑️ Carpeta de sesión eliminada`));
      return true;
    }
  } catch (error) {
    console.error(chalk.red(`[SUBBOT ${phone}] ❌ Error eliminando carpeta:`), error.message);
  }
  return false;
}

function loadBotConfig(phone) {
  try {
    const configPath = path.join(process.cwd(), 'info', phone, 'config.js');
    
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const jsonMatch = configContent.match(/export default\s+({[\s\S]*})/);
      
      if (jsonMatch && jsonMatch[1]) {
        const savedConfig = eval('(' + jsonMatch[1] + ')');
        console.log(chalk.green(`[SUBBOT ${phone}] ✅ Configuración cargada`));
        return savedConfig;
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`[SUBBOT ${phone}] ⚠️ Error cargando configuración:`, error.message));
  }
  return null;
}

const codeGeneratedMap = new Map();

export async function startSubBot({
  m,
  client,
  phone,
  chatId,
  caption = '',
  onSuccess = null,
  onError = null,
  joinGroup = true,
  isCode = true,
  commandFlags = {}
}) {

  const id = phone || cleanJid(m?.sender)
  const sessionDir = `./Sessions/Subs/${id}`

  const hasValidSession = fs.existsSync(sessionDir) && fs.existsSync(path.join(sessionDir, 'creds.json'));
  
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: true,
    syncFullHistory: false,
    logger: createCompleteLogger(),
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    connectTimeoutMs: 60000
  })

  let qrSent = false;
  let connectedSuccessfully = false;
  let qrTimeout = null;
  let isAutoReconnect = chatId === 'auto-reconnect@system';
  let shouldJoinGroup = joinGroup;
  
  const shouldGenerateCode = !hasValidSession && !codeGeneratedMap.get(phone);
  
  if (shouldGenerateCode) {
    codeGeneratedMap.set(phone, true);
    console.log(chalk.cyan(`[SUBBOT ${phone}] No hay sesión válida, se generará código`));
  } else if (hasValidSession) {
    console.log(chalk.green(`[SUBBOT ${phone}] ✅ Sesión válida encontrada`));
  }

  sock.isSubBot = true
  sock.phoneNumber = phone
  sock.botName = 'Moonlight'

  sock.ev.on('creds.update', saveCreds)

  sock.decodeJid = jid => {
    if (!jid) return jid
    if (/:\d+@/.test(jid)) {
      const d = jidDecode(jid)
      return d?.user && d?.server ? `${d.user}@${d.server}` : jid
    }
    return jid
  }

  let subBotConfig = loadBotConfig(phone);
  
  if (!subBotConfig) {
    subBotConfig = {
      name: 'MICET SUB',
      name1: '𝗌𝗎b-bᦅƚ',
      prefix: '.',
      tipo: '𝗌𝗎b-bᦅƚ',
      version: '2.0.1',
      navegador: 'Ubuntu Chrome',
      creador: '🤓  —͟͞ ⁱᵃᵐ  𓊈Dv Cuerbito𓊉 𒆜ᴼᶠⁱᶜⁱᵃˡ',
      baileys: '7.0.9',
      canalId: '120363427517609839@newsletter',
      canalNombre: '🤓  —͟͞ ⁱᵃᵐ  𓊈Dv Cuerbito𓊉 𒆜ᴼᶠⁱᶜⁱᵃˡ',
      owner: ['5492644156919', '5219992042946', '542646762285'],
      botowner: '5492644156919',
      ownerNumber: '5492644156919',
      group1: 'https://whatsapp.com/channel/0029VbCq9xP2ZjCr6AGMzi1b',
      group2: 'https://whatsapp.com/channel/0029VbCq9xP2ZjCr6AGMzi1b',
      group3: 'https://whatsapp.com/channel/0029VbCq9xP2ZjCr6AGMzi1b',
      isSubBot: true,
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
    console.log(chalk.yellow(`[SUBBOT ${phone}] ⚠️ Usando configuración por defecto`));
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
          console.log(chalk.cyan(`[SUBBOT ${phone}] Encontrados ${pluginFiles.length} plugins`))
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
              console.log(chalk.yellow(`[SUBBOT ${phone}] ❌ ${file}:`, error.message))
            }
          }
        }
      }
      
      try {
        const handlerUrl = new URL('../handler.js', import.meta.url).href
        const handlerModule = await import(handlerUrl)
        handler = handlerModule.default
      } catch (error) {
        if (!isAutoReconnect) {
          console.log(chalk.red(`[SUBBOT ${phone}] ❌ Error cargando handler:`, error.message))
        }
      }
      
    } catch (error) {
      if (!isAutoReconnect) {
        console.log(chalk.red(`[SUBBOT ${phone}] Error cargando recursos:`, error.message))
      }
    }
  }

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      
      if (!msg.message) return;
      
      let body = '';
      if (msg.message?.conversation) {
        body = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        body = msg.message.extendedTextMessage.text;
      } else if (msg.message?.imageMessage?.caption) {
        body = msg.message.imageMessage.caption || '';
      }
      
      const isCommand = body.startsWith('.');
      
      if (msg.key.fromMe && !isCommand) {
        return;
      }
      
      if (body.trim() && !isAutoReconnect) {
        const senderInfo = msg.key.fromMe ? '[SELF]' : '[USER]';
        console.log(chalk.magenta(`[SUBBOT ${phone}] ${senderInfo} ${body.substring(0, 30)}${body.length > 30 ? '...' : ''}`));
      }
      
      if (msg.key.fromMe && isCommand) {
        console.log(chalk.green(`[SUBBOT ${phone}] 🤖 Bot usando su propio comando: ${body}`));
      }
      
      if (handler && plugins.size > 0) {
        await handler(sock, msg, plugins, subBotConfig)
      }
    } catch (error) {
      if (!isAutoReconnect) {
        console.error(chalk.red(`[SUBBOT ${phone}] Error en handler:`), error.message)
      }
    }
  })

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {

    if (qr && shouldGenerateCode && !qrSent && !connectedSuccessfully && !isAutoReconnect) {
      try {
        qrSent = true;
        console.log(chalk.cyan(`[SUBBOT ${phone}] Generando código de emparejamiento...`));
        
        if (qrTimeout) clearTimeout(qrTimeout);
        
        let codeGen = await sock.requestPairingCode(phone, 'PORNOHUB');
        codeGen = codeGen.match(/.{1,4}/g)?.join("-") || codeGen;
        
        console.log(chalk.green(`[SUBBOT ${phone}] ✅ Código generado: ${codeGen}`));
        
        if (client && chatId) {
          await client.sendMessage(chatId, {
            text: `ꢜ۪𝆬🍀ໍ݄㍒٫ؕ⬚ᨘᨗ *_Toca el boton para copiar el codigo_*`,
            footer: "© Moonlight Staff",
            interactiveButtons: [
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "Copy",
                  copy_code: codeGen
                })
              }
            ]
          }, { quoted: m });
          console.log(chalk.green(`[SUBBOT ${phone}] 📤 Código enviado`));
        }

        qrTimeout = setTimeout(() => {
          if (!connectedSuccessfully) {
            console.log(chalk.yellow(`[SUBBOT ${phone}] ⏰ Código expirado`));
            if (typeof onError === 'function') {
              onError(new Error('Código expirado - Intenta nuevamente'));
            }
          }
        }, 60_000);

      } catch (e) {
        console.log(chalk.red(`[SUBBOT ${phone}] ❌ Error en pairing:`), e.message || e)
        codeGeneratedMap.delete(phone);
        
        if (typeof onError === 'function') {
          onError(e);
        }
        
        if (!isAutoReconnect && client && chatId) {
          try {
            await client.sendMessage(chatId, {
              text: `❌ *Error al generar código*\n\n${e.message || 'Error desconocido'}\n\nPor favor, intenta nuevamente.`
            }, { quoted: m })
          } catch {}
        }
      }
    }

    if (connection === 'open') {
      connectedSuccessfully = true;
      codeGeneratedMap.delete(phone);
      
      if (qrTimeout) clearTimeout(qrTimeout);
      
      sock.userId = cleanJid(sock.user.id)
      sock.phoneNumber = phone;

      if (!global.conns.find(c => c.userId === sock.userId)) {
        global.conns.push(sock)
      }

      console.log(chalk.green(`[SUBBOT ${phone}] ✅ Conectado exitosamente!`))
      
      const refreshedConfig = loadBotConfig(phone);
      if (refreshedConfig) {
        subBotConfig = refreshedConfig;
        console.log(chalk.green(`[SUBBOT ${phone}] 📢 Canal: ${subBotConfig.canalNombre}`));
      }
      
      try {
        const vinculadorNumber = m?.sender ? cleanJid(m.sender) : phone
        const result = createInfoFolder(vinculadorNumber, 'sub', subBotConfig)
        
        if (result.success) {
          if (result.existed) {
            console.log(chalk.blue(`[SUBBOT ${phone}] 📁 Carpeta info ya existía`))
          } else {
            console.log(chalk.green(`[SUBBOT ${phone}] ✅ Carpeta info creada`))
          }
        }
      } catch (infoError) {
        console.log(chalk.yellow(`[SUBBOT ${phone}] ⚠️ Error creando carpeta info:`, infoError.message))
      }
      
      if (typeof onSuccess === 'function') {
        onSuccess(sock.userId);
      }
      
      await loadHandlerAndPlugins()
      
      console.log(chalk.cyan(`[SUBBOT ${phone}] 📂 Plugins: ${plugins.size}`));
      console.log(chalk.cyan(`[SUBBOT ${phone}] 🎯 Prefijo: .`));
      
      if (shouldJoinGroup) {
        setTimeout(async () => {
          try {
            const groupLink = 'https://chat.whatsapp.com/E7bKReXRXwN9ucFQBH9Za0';
            await joinGroupAutomatically(sock, groupLink);
          } catch (error) {}
        }, 3000);
      }
      
      if (!isAutoReconnect) {
        try {
          await sock.sendMessage(sock.user.id, {
            text: `🤖 *SubBot activo*\n\n✅ Conectado correctamente\n🔧 Prefijo: .\n📁 Comandos: ${plugins.size}\n📢 Canal: ${subBotConfig.canalNombre}`
          })
        } catch (error) {}
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const isLoggedOut = statusCode === DisconnectReason.loggedOut
      
      console.log(chalk.red(`[SUBBOT ${phone}] ❌ Desconectado (${statusCode})`))
      
      if (isLoggedOut || statusCode === 403 || statusCode === 401) {
        console.log(chalk.red(`[SUBBOT ${phone}] 🔌 Sesión inválida/revocada - eliminando carpeta`));
        deleteSubBotSession(phone);
        codeGeneratedMap.delete(phone);
        
        if (typeof onError === 'function') {
          onError(new Error(`Sesión inválida (${statusCode})`));
        }
      } else {
        if (!isAutoReconnect) {
          console.log(chalk.yellow(`[SUBBOT ${phone}] ⏳ Reconectando en 5s...`))
          setTimeout(() => {
            startSubBot({ m, client, phone, chatId, onSuccess, onError, joinGroup, isCode, commandFlags })
          }, 5000);
        }
      }
    }
  })

  return sock
}

export default { startSubBot }
