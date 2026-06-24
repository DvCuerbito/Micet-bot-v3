import axios from 'axios'
import { sticker } from '../lib/sticker.js'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!q) return m.reply(`*Responde a un mensaje o escribe un texto*\n\nEjemplo:\n${usedPrefix + command} Hola we\n\nO responde a un mensaje con ${usedPrefix + command}`)

    let txt = q.msg?.text || q.text || text || ''
    if (!txt) return m.reply('❌ No hay texto pa hacer el quote')

    await conn.sendMessage(m.chat, { react: { text: "🎨", key: m.key } })

    try {
        // Saca la foto y nombre del user
        let who = q.sender || m.sender
        let name = await conn.getName(who)
        let pp = await conn.profilePictureUrl(who, 'image').catch(_ => 'https://i.imgur.com/WHhJfjd.png')

        // Limpia el texto pa la API
        let cleanText = txt.replace(/@\d+/g, '').slice(0, 2000) // Max 2000 caracteres

        // API de quotes
        let api = `https://quoteapi.vercel.app/generate?text=${encodeURIComponent(cleanText)}&username=${encodeURIComponent(name)}&avatar=${encodeURIComponent(pp)}&backgroundColor=%231a1a1a`

        let res = await axios.get(api, { responseType: 'arraybuffer' })
        if (!res.data) throw 'Error generando el quote'

        // Convierte a sticker
        let stiker = await sticker(res.data, false, name, 'Cuervito-Bot')
        await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m })

    } catch (e) {
        console.log(e)
        m.reply('❌ Error al crear el quote. La API debe estar caída, intenta más tarde')
    }
}

handler.help = ['qc']
handler.tags = ['sticker']
handler.command = ['qc', 'quote']
handler.register = true

export default handler
