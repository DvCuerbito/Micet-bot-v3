import fs from 'fs'

const dbPath = './database/pokedex.json'

function leerDB() {
    if (!fs.existsSync(dbPath)) return { users: {} }
    return JSON.parse(fs.readFileSync(dbPath))
}

export default {
    name: 'pokedex',
    alias: ['dex', 'mispokemones', 'mypokemon'],
    description: 'Muestra tu colección de pokémon',

    async execute(sock, msg, { config }) {
        try {
            const from = msg.key.remoteJid
            const senderJid = msg.key.participant || msg.key.remoteJid

            let db = leerDB()
            const userData = db.users?.[senderJid]

            if (!userData || userData.pokedex.length === 0) {
                return await sock.sendMessage(from, {
                    text: '❌ Tu pokedex está vacía. Usa `.pokemon` para conseguir pokémon'
                }, { quoted: msg })
            }

            await sock.sendMessage(from, { react: { text: '📕', key: msg.key } })

            let lista = userData.pokedex
               .sort((a, b) => a.id - b.id)
               .slice(0, 30)
               .map(p => `*#${p.id.toString().padStart(3, '0')} ${p.nombre}* x${p.cantidad} ${p.rareza}`)
               .join('\n')

            const texto = `𔖮๋ׅꉹ᮫ִׁ۫⚡ *TU POKÉDEX* 𔖮๋ׅꉹ᮫ִׁ۫📕

𔖮๋ׅꉹ᮫ִׁ۫🍟𐋕᮫ִׁ᷂𐴲᮫ִׁ╾᳞҇┄⵿֟፝━᮫๋࣭݁ Total: ${userData.contador}/1010 Pokémon
𔖮๋ׅꉹ᮫ִׁ۫🥪𐋕᮫ִׁ᷂𐴲᮫ִׁ╾᳞҇┄⵿֟፝━᮫๋࣭݁ Completado: ${((userData.contador / 1010) * 100).toFixed(1)}%

${lista}

${userData.pokedex.length > 30? `\n_...y ${userData.pokedex.length - 30} más_` : ''}

*Usa \`.pokemon\` para atrapar más*`

            await sock.sendMessage(from, { text: texto }, { quoted: msg })

        } catch (error) {
            console.error('Error en pokedex:', error)
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error al cargar tu pokedex'
            }, { quoted: msg })
        }
    }
              }
