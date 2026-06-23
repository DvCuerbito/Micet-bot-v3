import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { startSubBot } from './startSubBot.js'

let globalMainClient = null;
let globalConfig = null;

export function initializeSubBotManager(mainClient, config) {
  globalMainClient = mainClient;
  globalConfig = config;
  console.log(chalk.green('[AUTO-RECONEXION] ✅ Sistema inicializado'));
  
  setTimeout(async () => {
    await autoReconnectAllSubBots();
  }, 3000);
}

async function autoReconnectAllSubBots() {
  console.log(chalk.cyan('[AUTO-RECONEXION SUBS] 🔄 Buscando sub-bots para reconectar...'));
  
  const sessionsDir = './Sessions/Subs';
  
  if (!fs.existsSync(sessionsDir)) {
    console.log(chalk.yellow('[AUTO-RECONEXION SUBS] 📁 No hay sesiones Subs/'));
    return;
  }

  try {
    const folders = fs.readdirSync(sessionsDir);
    console.log(chalk.cyan(`[AUTO-RECONEXION SUBS] 📂 Encontradas ${folders.length} sesiones de sub-bots`));
    
    let reconnectedCount = 0;
    
    for (const folder of folders) {
      const phoneNumber = folder;
      const sessionPath = path.join(sessionsDir, folder);
      
      if (fs.statSync(sessionPath).isDirectory()) {
        const credsPath = path.join(sessionPath, 'creds.json');
        
        if (fs.existsSync(credsPath)) {
          try {
            console.log(chalk.cyan(`[AUTO-RECONEXION SUBS] ⚡ Reconectando sub-bot: ${phoneNumber}`));
            
            const mockMessage = {
              key: {
                remoteJid: 'auto-reconnect@system',
                fromMe: true,
                participant: null
              },
              sender: `${phoneNumber}@s.whatsapp.net`
            };

            await startSubBot({
              m: mockMessage,
              client: globalMainClient,
              phone: phoneNumber,
              chatId: 'auto-reconnect@system',
              caption: '',
              joinGroup: true,
              onSuccess: (connectedNumber) => {
                reconnectedCount++;
                console.log(chalk.green(`[AUTO-RECONEXION SUBS] ✅ Reconectado: ${connectedNumber}`));
              },
              onError: (error) => {
                const errorMsg = error.message || String(error);
                console.log(chalk.yellow(`[AUTO-RECONEXION SUBS] ⚠️ Error en ${phoneNumber}: ${errorMsg}`));
                
                if (errorMsg.includes('403') || errorMsg.includes('creds') || errorMsg.includes('sesion') || errorMsg.includes('invalid')) {
                  console.log(chalk.red(`[AUTO-RECONEXION SUBS] 🗑️ Eliminando sesión corrupta de ${phoneNumber} (error 403)`));
                  cleanupInvalidSession(phoneNumber, 'Subs');
                }
              }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
          } catch (error) {
            const errorMsg = error.message || String(error);
            console.log(chalk.red(`[AUTO-RECONEXION SUBS] ❌ Error con ${phoneNumber}: ${errorMsg}`));
            
            if (errorMsg.includes('403')) {
              console.log(chalk.red(`[AUTO-RECONEXION SUBS] 🗑️ Eliminando sesión de ${phoneNumber} por error 403`));
              cleanupInvalidSession(phoneNumber, 'Subs');
            }
          }
        }
      }
    }
    
    console.log(chalk.green(`[AUTO-RECONEXION SUBS] 🎯 Finalizado: ${reconnectedCount}/${folders.length} sub-bots reconectados`));
    
  } catch (error) {
    console.log(chalk.red('[AUTO-RECONEXION SUBS] ❌ Error leyendo sesiones:', error.message));
  }
}

function cleanupInvalidSession(phoneNumber, type) {
  const sessionDir = `./Sessions/${type}/${phoneNumber}`;
  
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log(chalk.red(`[AUTO-RECONEXION] 🗑️ Sesión ${type} eliminada: ${phoneNumber}`));
    }
  } catch (error) {
    console.log(chalk.red(`[AUTO-RECONEXION] ❌ Error eliminando sesión ${phoneNumber}:`, error.message));
  }
}

export function getConnectionStatus() {
  const subsDir = './Sessions/Subs';
  
  let totalSubs = 0;
  let activeSubs = 0;
  
  if (fs.existsSync(subsDir)) {
    try {
      const folders = fs.readdirSync(subsDir);
      totalSubs = folders.length;
      
      activeSubs = folders.filter(folder => {
        const credsPath = path.join(subsDir, folder, 'creds.json');
        return fs.existsSync(credsPath);
      }).length;
    } catch {
      // Ignorar errores
    }
  }
  
  return {
    total: totalSubs,
    active: activeSubs,
    subs: { total: totalSubs, active: activeSubs }
  };
              }
