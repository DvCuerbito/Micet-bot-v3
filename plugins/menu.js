let handler = async (m, { conn, usedPrefix, command }) => {
    await conn.sendMessage(m.chat, { react: { text: "🍟", key: m.key } })
    
    let nombreBot = global.botname || conn.getName(conn.user.jid) || 'Micet-Bot'
    let tipoBot = 'Sub Bot'
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

> [💼] ECONOMY BOT
> ${usedPrefix}work
> ${usedPrefix}Slut
> ${usedPrefix}Crime
> ${usedPrefix}Pescar
> ${usedPrefix}bal
> ${usedPrefix}poder
> ${usedPrefix}rt (red o black)
> ========================

> [💼] ADMINISTRACION
> ${usedPrefix}open
> ${usedPrefix}closep
> ${usedPrefix}promote
> ${usedPrefix}demote
> ${usedPrefix}kick
> ${usedPrefix}warn
> ${usedPrefix}delwarns
> ${usedPrefix}warns
> ${usedPrefix}bot
> ========================


> [⚡] INFO BOT
> ${usedPrefix}creador
> ${usedPrefix}ping
> ${usedPrefix}infobot
> ${usedPrefix}bots
> ========================

> [🧃] DESCARGAS
> ${usedPrefix}play
> ${usedPrefix}play2
> ${usedPrefix}tiktok
> ${usedPrefix}facebook
> ${usedPrefix}ig
> ${usedPrefix}apk
> ${usedPrefix}mediafire
> ========================

> [🍟] DIVERSIÓN
> ${usedPrefix}Slap (menciona un sticker)
> ${usedPrefix}Sorteo
> ${usedPrefix}gay
> ${usedPrefix}lesbiana
> ${usedPrefix}bratv
> ${usedPrefix}qc
> ${usedPrefix}brat
> ${usedPrefix}top2
> ${usedPrefix}baltop
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
