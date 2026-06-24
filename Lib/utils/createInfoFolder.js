import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Crea la carpeta info para un bot SOLO si no existe
 * @param {string} phoneNumber - Número de teléfono que vinculó el bot
 * @param {string} botType - Tipo de bot ('main' o 'sub')
 * @param {Object} config - Configuración del bot
 * @returns {Object} - Resultado de la operación
 */
export function createInfoFolder(phoneNumber, botType, config) {
  try {
    // Limpiar el número de teléfono (eliminar @s.whatsapp.net si existe)
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
    
    if (!cleanPhone) {
      throw new Error('Número de teléfono inválido')
    }
    
    // Ruta de la carpeta info (desde la raíz del proyecto)
    const infoPath = path.join(process.cwd(), 'info', cleanPhone)
    
    // ===== VERIFICAR SI YA EXISTE =====
    if (fs.existsSync(infoPath)) {
      console.log(`📁 INFO: La carpeta para ${cleanPhone} YA EXISTE en: ${infoPath}`)
      console.log(`📁 INFO: No se crearán archivos nuevos para no sobrescribir`)
      
      // Intentar cargar la configuración existente para devolverla
      try {
        const configPath = path.join(infoPath, 'config.js')
        if (fs.existsSync(configPath)) {
          // No podemos importar aquí porque es síncrono, pero podemos leer el archivo
          const configContent = fs.readFileSync(configPath, 'utf8')
          // Extraer el objeto JSON (esto es solo para info, no se devuelve)
          console.log(`📁 INFO: Configuración existente encontrada`)
        }
      } catch (readError) {
        // Ignorar errores de lectura
      }
      
      return {
        success: true,
        path: infoPath,
        phone: cleanPhone,
        existed: true, // Indicador de que ya existía
        message: 'La carpeta ya existía, no se realizaron cambios'
      }
    }
    
    // ===== SI NO EXISTE, CREARLA =====
    console.log(`📁 Creando nueva carpeta info para ${cleanPhone} en: ${infoPath}`)
    fs.mkdirSync(infoPath, { recursive: true })
    
    // Determinar el owner según el tipo de bot
    let botowner = ''
    if (botType === 'sub') {
      // Para sub-bots, el owner es quien vinculó el bot
      botowner = cleanPhone
    } else {
      // Para main-bots, usar el número proporcionado o el configurado
      botowner = config.ownerNumber || cleanPhone
    }
    
    // Configuración completa para guardar
    const fullConfig = {
      name: config.name || 'MICET',
      name2: config.name1 || config.name2 || 'MICET',
      prefix: config.prefix || (botType === 'main' ? '/' : '.'),
      tipo: botType === 'main' ? 'premium' : 'Sub-Bot',
      version: config.version || '1.1.0',
      navegador: config.navegador || (botType === 'main' ? 'Windows Edge' : 'Ubuntu Chrome'),
      baileys: config.baileys || '7.0.9',
      canalId: config.canalId || '120363403616345878@newsletter',
      canalNombre: config.canalNombre || '🤓  —͟͞ ⁱᵃᵐ  𓊈Dv Cuerbito𓊉 𒆜ᴼᶠⁱᶜⁱᵃˡ',
      creador: config.creador || '🤓  —͟͞ ⁱᵃᵐ  𓊈Dv Cuerbito𓊉 𒆜ᴼᶠⁱᶜⁱᵃˡ',
      botowner: botowner,
      owner: config.owner || ['5492644156919', '542646762285'],
      ownerNumber: config.ownerNumber || '5219992042946',
      group1: config.group1 || 'https://chat.whatsapp.com/KCJNyt4SQZR392FOZXlsb3',
      group2: config.group2 || 'https://chat.whatsapp.com/LnuUG5cfZHgEERIWrI1t85',
      group3: config.group3 || 'https://whatsapp.com/channel/0029Vb6qIht5q08ZMPgVrA1y',
      sessionName: 'session',
      
      // APIs
      APIs: config.APIs || {
        xyro: { url: "https://api.xyro.site", key: null },
        yupra: { url: "https://api.yupra.my.id", key: null },
        vreden: { url: "https://api.vreden.web.id", key: null },
        delirius: { url: "https://api.delirius.store", key: null },
        zenzxz: { url: "https://api.zenzxz.my.id", key: null },
        siputzx: { url: "https://api.siputzx.my.id", key: null },
        adonix: { url: "https://api-adonix.ultraplus.click", key: 'Destroy-xyz' }
      }
    }
    
    // Guardar config.js
    const configContent = `// Configuración del Bot - ${botType === 'main' ? 'Main Bot' : 'Sub Bot'}
// Creado para el número: ${cleanPhone}
// Creado el: ${new Date().toLocaleString()}

export default ${JSON.stringify(fullConfig, null, 2)}
`
    
    fs.writeFileSync(path.join(infoPath, 'config.js'), configContent)
    console.log(`📝 config.js creado para ${cleanPhone}`)
    
    // Copiar banner.jpg si existe (desde img/)
    const bannerSource = path.join(process.cwd(), 'img', 'banner.jpg')
    const bannerDest = path.join(infoPath, 'banner.jpg')
    
    if (fs.existsSync(bannerSource) && !fs.existsSync(bannerDest)) {
      fs.copyFileSync(bannerSource, bannerDest)
      console.log(`🖼️ banner.jpg copiado para ${cleanPhone}`)
    } else if (fs.existsSync(bannerDest)) {
      console.log(`🖼️ banner.jpg ya existe para ${cleanPhone}, no se sobrescribe`)
    } else {
      console.log(`⚠️ No se encontró banner.jpg en ${bannerSource}`)
    }
    
    // Copiar icon.jpg si existe (desde img/)
    const iconSource = path.join(process.cwd(), 'img', 'icon.jpg')
    const iconDest = path.join(infoPath, 'icon.jpg')
    
    if (fs.existsSync(iconSource) && !fs.existsSync(iconDest)) {
      fs.copyFileSync(iconSource, iconDest)
      console.log(`🖼️ icon.jpg copiado para ${cleanPhone}`)
    } else if (fs.existsSync(iconDest)) {
      console.log(`🖼️ icon.jpg ya existe para ${cleanPhone}, no se sobrescribe`)
    } else {
      console.log(`⚠️ No se encontró icon.jpg en ${iconSource}`)
    }
    
    return {
      success: true,
      path: infoPath,
      phone: cleanPhone,
      created: true,
      message: 'Carpeta info creada exitosamente'
    }
    
  } catch (error) {
    console.error(`❌ Error creando carpeta info:`, error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Verifica si ya existe una carpeta info para un número
 * @param {string} phoneNumber 
 * @returns {boolean}
 */
export function infoFolderExists(phoneNumber) {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
  const infoPath = path.join(process.cwd(), 'info', cleanPhone)
  return fs.existsSync(infoPath)
}

/**
 * Obtiene la configuración de un bot desde su carpeta info
 * @param {string} phoneNumber 
 * @returns {Object|null}
 */
export async function getInfoConfig(phoneNumber) {
  try {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
    const configPath = path.join(process.cwd(), 'info', cleanPhone, 'config.js')
    
    if (fs.existsSync(configPath)) {
      console.log(`📖 Leyendo configuración desde: ${configPath}`)
      const configUrl = new URL(`file://${configPath}`)
      const configModule = await import(configUrl)
      return configModule.default || configModule
    }
    
    console.log(`⚠️ No se encontró config en: ${configPath}`)
    return null
  } catch (error) {
    console.error(`Error leyendo config.js:`, error.message)
    return null
  }
}
