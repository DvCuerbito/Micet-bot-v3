let handler = async (m, { conn, usedPrefix, command }) => {
    await conn.sendMessage(m.chat, { react: { text: "⚡", key: m.key } })
    
    let nombreBot = global.botname || conn.getName(conn.user.jid) || 'Cuervito-Bot'
    let tipoBot = 'Sub Bot MD'
    let user = `@${m.sender.split('@')[0]}`
    let canal = 'https://whatsapp.com/channel/0029VbCq9xP2ZjCr6AGMzi1b'
    let creador = global.creador || 'Cuerbito 𒆜ᴼᶠⁱᶜⁱᵃˡ'
    
    let menu = `
> [ ${nombreBot} ]
> 🍫 Bot    : ${nombreBot}
> 👤 User   : ${user}
> 🍟 Dev    : ${creador}
> 🤖 Tipo   : ${tipoBot}
> 💎 Canal  : ${canal}
> ========================

> [🧃] DESCARGAS
> ${usedPrefix}play
> ${usedPrefix}play2
> ${usedPrefix}tiktok
> ${usedPrefix}facebook
> ${usedPrefix}ig
> ========================

> [🍟] INFO BOT
> ${usedPrefix}creador
> ${usedPrefix}ping
> ${usedPrefix}infobot
> ${usedPrefix}bots
> ========================

> [🍫] UTILES BOT
> ${usedPrefix}inspect
> ${usedPrefix}sticker
> ${usedPrefix}qc
> ${usedPrefix}brat
> ${usedPrefix}sugerir
> ${usedPrefix}report
> ${usedPrefix}link
> ${usedPrefix}delete
> ========================

> [🍩] SUB-BOTS
> ${usedPrefix}code
> ${usedPrefix}setname
> ${usedPrefix}setbanner
> ========================

> [🌵] OWNER CMDS
> ${usedPrefix}eval
> ${usedPrefix}getcode
> ${usedPrefix}reload
> ${usedPrefix}codepremium
> ${usedPrefix}restart
> ========================`.trim()
    
    // Si tienes imagen en config
    if (global.imagen1) {
        await conn.sendMessage(m.chat, { 
            image: { url: global.imagen1 }, 
            caption: menu, 
            mentions: [m.sender] 
        }, { quoted: m })
    } else {
        // Si no hay imagen, manda solo texto
        await conn.sendMessage(m.chat, { 
            text: menu, 
            mentions: [m.sender] 
        }, { quoted: m })
    }
}

handler.help = ['menu', 'help', 'menú']
handler.tags = ['main']
handler.command = ['menu', 'help', 'menú']
handler.register = true

export default handler
