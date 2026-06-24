import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { mainBot } from './mainBot.js'

let globalMainClient = null;
let globalConfig = null;

export function initializeMainBotManager(mainClient, config) {
  globalMainClient = mainClient;
  globalConfig = config;
  console.log(chalk.green('[MAIN] Sistema inicializado'));
  
  setTimeout(async () => {
    await autoReconnectAllMainBots();
  }, 3000);
}

async function autoReconnectAllMainBots() {
  console.log(chalk.blue('[MAIN] Buscando main bots para reconectar...'));
  
  const sessionsDir = './Sessions/Main';
  
  if (!fs.existsSync(sessionsDir)) {
    console.log(chalk.yellow('[MAIN] No hay sesiones Main/'));
    return;
  }

  try {
    const folders = fs.readdirSync(sessionsDir);
    console.log(chalk.blue(`[MAIN] Encontradas ${folders.length} sesiones de main bots`));
    
    let reconnectedCount = 0;
    
    for (const folder of folders) {
      const phoneNumber = folder;
      const sessionPath = path.join(sessionsDir, folder);
      
      if (fs.statSync(sessionPath).isDirectory()) {
        const credsPath = path.join(sessionPath, 'creds.json');
        
        if (fs.existsSync(credsPath)) {
          try {
            console.log(chalk.blue(`[MAINBOT MANAGER] ⚡ Reconectando main bot: ${phoneNumber}`));
            
            const mockMessage = {
              key: {
                remoteJid: 'auto-reconnect@system',
                fromMe: true,
                participant: null
              },
              sender: `${phoneNumber}@s.whatsapp.net`
            };

            await mainBot({
              m: mockMessage,
              client: globalMainClient,
              phone: phoneNumber,
              chatId: 'auto-reconnect@system',
              joinGroup: true,
              isAutoReconnect: true,
              onSuccess: (connectedNumber) => {
                reconnectedCount++;
                console.log(chalk.green(`[MAINBOT MANAGER] ✅ Reconectado: ${connectedNumber}`));
              },
              onError: (error) => {
                console.log(chalk.yellow(`[MAINBOT MANAGER] ⚠️ No se pudo reconectar ${phoneNumber}: ${error.message}`));
                
                if (error.message?.includes('creds') || error.message?.includes('sesión')) {
                  setTimeout(() => {
                    cleanupInvalidSession(phoneNumber);
                  }, 10000);
                }
              }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
          } catch (error) {
            console.log(chalk.red(`[MAINBOT MANAGER] ❌ Error con ${phoneNumber}: ${error.message}`));
          }
        }
      }
    }
    
    console.log(chalk.green(`[MAINBOT MANAGER] 🎯 Finalizado: ${reconnectedCount}/${folders.length} main bots reconectados`));
    
  } catch (error) {
    console.log(chalk.red('[MAINBOT MANAGER] ❌ Error leyendo sesiones:', error.message));
  }
}

function cleanupInvalidSession(phoneNumber) {
  const sessionDir = `./Sessions/Main/${phoneNumber}`;
  
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
      console.log(chalk.yellow(`[MAINBOT MANAGER] 🗑️ Sesión eliminada: ${phoneNumber}`));
    }
  } catch (error) {
    // Ignorar errores
  }
}

export function getMainBotStatus() {
  const mainDir = './Sessions/Main';
  
  let totalMains = 0;
  let activeMains = 0;
  
  if (fs.existsSync(mainDir)) {
    try {
      const folders = fs.readdirSync(mainDir);
      totalMains = folders.length;
      
      activeMains = folders.filter(folder => {
        const credsPath = path.join(mainDir, folder, 'creds.json');
        return fs.existsSync(credsPath);
      }).length;
    } catch {
      // Ignorar errores
    }
  }
  
  return {
    total: totalMains,
    active: activeMains
  };
              }
