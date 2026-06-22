import config from '../config.js'

export default {
    name: 'menu',
    alias: ['help', 'commands', 'comandos', 'ayuda'],
    description: 'Ver el menú de comandos',
    use: '.menu',

    async execute(sock, msg, { senderNumber }) {
        const from = msg.key.remoteJid
        
        const nombreBot = config.nombre || 'Bot'
        const tipoBot = config.tipo === 'principal' ? 'Bot Principal' : 'Sub-Bot'
        
        const menu = `𝐇𝐨𝐥𝐚! 𝐒𝐨𝐲 ${nombreBot} (${tipoBot})
ᴀǫᴜɪ ᴛɪᴇɴᴇs ʟᴀ ʟɪsᴛᴀ ᴅᴇ ᴄᴏᴍᴀɴᴅᴏs
╭┈ ↷
│ ✐ 𝓓𝓮𝔀𝓮𝓵𝓸𝓹𝓮𝓭 𝓫𝔂 ${config.creador} ⚡
│ ✐ ꒷ꕤ🍟ദ ᴄᴀɴᴀʟ ᴏғɪᴄɪᴀʟ ෴
│ https://whatsapp.com/channel/0029VbCq9xP2ZjCr6AGMzi1b
╰─────────────────

» ˚୨•(=^●ω●^=)• ⊹ \`Economía\` ⊹
> ✐ Comandos de *Economía* para ganar dinero y divertirte con tus amigos.

✧ \`${config.prefix}balance\` \`${config.prefix}bal\` \`${config.prefix}coins\` _<usuario>_
> Ver cuantos coins tienes.
✧ \`${config.prefix}coinflip\` \`${config.prefix}flip\` \`${config.prefix}cf\` _[cantidad] <cara/cruz>_
> Apostar coins en un cara o cruz.
✧ \`${config.prefix}daily\`
> Reclamar tu recompensa diaria.
✧ \`${config.prefix}work\` \`${config.prefix}w\`
> Ganar coins trabajando.
✧ \`${config.prefix}adventure\` \`${config.prefix}aventura\`
> Sal de aventura y gana recompensas aleatorias.
✧ \`${config.prefix}pescar\` \`${config.prefix}fish\`
> Ve a pescar y atrapa peces para vender.
✧ \`${config.prefix}cazar\` \`${config.prefix}hunt\`
> Sal a cazar animales y gana coins.
✧ \`${config.prefix}correr\` \`${config.prefix}run\`
> Entrena corriendo para ganar exp y coins.
✧ \`${config.prefix}crime\` \`${config.prefix}crimen\`
> Comete un crimen, arriesga todo o gana mucho.
✧ \`${config.prefix}poder\` \`${config.prefix}power\`
> Usa tu poder para conseguir recompensas.
✧ \`${config.prefix}talar\`
> Tala árboles para conseguir madera y coins.
✧ \`${config.prefix}cofre\`
> Abre un cofre misterioso cada cierto tiempo.
✧ \`${config.prefix}reciclar\`
> Recicla items basura por coins.

» ˚୨•(=^●ω●^=)• ⊹ \`Descargas\` ⊹
> ✐ Comandos de *Descargas* para descargar archivos de varias fuentes.

✧ \`${config.prefix}ig\` \`${config.prefix}instagram\` _[Link]_
> Descargar un reel/post de Instagram
✧ \`${config.prefix}fb\` \`${config.prefix}facebook\` _[Link]_
> Descargar un video de Facebook
✧ \`${config.prefix}tiktok\` \`${config.prefix}tt\` _[Link]_
> Descargar un video de TikTok
✧ \`${config.prefix}mediafire\` \`${config.prefix}mf\` _[Link]_
> Descargar un archivo de MediaFire

» ˚୨•(=^●ω●^=)• ⊹ \`Anime\` ⊹
> ✐ Comandos de *Anime* con reacciones.

✧ \`${config.prefix}besar\` \`${config.prefix}kiss\` _[@usuario]_
> Dar un beso a alguien
✧ \`${config.prefix}abrazar\` \`${config.prefix}hug\` _[@usuario]_
> Dar un abrazo a alguien
✧ \`${config.prefix}golpear\` \`${config.prefix}slap\` _[@usuario]_
> Golpear a alguien
✧ \`${config.prefix}triate\` \`${config.prefix}cry\` _[@usuario]_
> Llorar por alguien
✧ \`${config.prefix}enojado\` \`${config.prefix}angry\` _[@usuario]_
> Estar enojado con alguien
✧ \`${config.prefix}fumar\` \`${config.prefix}smoke\` _[@usuario]_
> Fumar
✧ \`${config.prefix}comer\` \`${config.prefix}eat\` _[@usuario]_
> Comer algo
✧ \`${config.prefix}cafe\` \`${config.prefix}coffee\` _[@usuario]_
> Tomar café
✧ \`${config.prefix}matar\` \`${config.prefix}kill\` _[@usuario]_
> Matar a alguien

» ˚୨•(=^●ω●^=)• ⊹ \`Diversión\` ⊹
> ✐ Comandos de *Diversión* para pasar el rato.

✧ \`${config.prefix}sorteo\` _[premio]_
> Crear un sorteo en el grupo
✧ \`${config.prefix}doceo\` _[@usuario]_
> Docear a alguien del grupo
✧ \`${config.prefix}formarpareja\` \`${config.prefix}pareja\`
> Forma parejas aleatorias del grupo
✧ \`${config.prefix}top\` _[texto]_
> Top 10 de lo que quieras
✧ \`${config.prefix}lesbiana\` _[@usuario]_
> Ver qué tan lesbiana es alguien
✧ \`${config.prefix}gay\` _[@usuario]_
> Ver qué tan gay es alguien
✧ \`${config.prefix}therian\` _[@usuario]_
> Ver qué tan therian es alguien

» ˚୨•(=^●ω●^=)• ⊹ \`Juegos\` ⊹
> ✐ Comandos de *Juegos* para divertirte.

✧ \`${config.prefix}carrera\` _[cantidad]_
> Crear carrera multijugador. Usa *go* para iniciar
✧ \`${config.prefix}carrera bot\` _[cantidad]_
> Jugar contra el bot. Elegí con *bot1-4*

» ˚୨•(=^●ω●^=)• ⊹ \`Sub-bots\` ⊹
> ✐ Comandos para registrar tu propio bot.

✧ \`${config.prefix}qr\` \`${config.prefix}code\`
> Crear un Sub-Bot con un codigo QR/Code
✧ \`${config.prefix}qrpremium\` \`${config.prefix}codepremium\`
> Crear un Bot Premium con un codigo QR/Code
✧ \`${config.prefix}join\` _[Invitacion]_
> Unir al bot a un grupo
✧ \`${config.prefix}leave\` \`${config.prefix}salir\`
> Salir de un grupo
✧ \`${config.prefix}logout\`
> Cerrar sesion del bot

» ˚୨•(=^●ω●^=)• ⊹ \`Stickers\` ⊹
> ✐ Comandos de *Stickers* para crear y gestionar stickers.

✧ \`${config.prefix}sticker\` \`${config.prefix}s\` \`${config.prefix}stickers\` _{citar una imagen/video}_
> Convertir una imagen/video a sticker
✧ \`${config.prefix}toimage\` \`${config.prefix}toimg\` _{citar sticker}_
> Convertir un sticker a imagen.

» ˚୨•(=^●ω●^=)• ⊹ \`Útilidades\` ⊹
> ✐ Comandos de *Útilidades*

✧ \`${config.prefix}ping\` \`${config.prefix}p\`
> Medir tiempo de respuesta
✧ \`${config.prefix}creador\` \`${config.prefix}owner\`
> Información del creador del bot
✧ \`${config.prefix}canal\` \`${config.prefix}channel\`
> Link del canal oficial
✧ \`${config.prefix}grupo\` \`${config.prefix}gp\` \`${config.prefix}group\`
> Link del grupo oficial

» ˚୨•(=^●ω●^=)• ⊹ \`Administración\` ⊹
> ✐ Comandos para administradores de grupos.

✧ \`${config.prefix}kick\` _<@usuario> | {mencion}_
> Expulsar a un usuario del grupo.
✧ \`${config.prefix}promote\` _<@usuario> | {mencion}_
> Ascender a un usuario a administrador.
✧ \`${config.prefix}demote\` _<@usuario> | {mencion}_
> Descender a un usuario de administrador.
✧ \`${config.prefix}tag\` \`${config.prefix}hidetag\` \`${config.prefix}tagall\` _[mensaje]_
> Envía un mensaje mencionando a todos.

» ˚୨•(=^●ω●^=)• ⊹ \`Owner\` ⊹
> ✐ Comandos del *Dueño*.

✧ \`${config.prefix}getcode\` \`${config.prefix}getplugin\` _[nombre]_
> Obtener el código de un plugin
✧ \`${config.prefix}eval\` \`${config.prefix}e\` _[código]_
> Ejecutar código JavaScript
✧ \`${config.prefix}restar\` \`${config.prefix}restart\`
> Reiniciar el bot
✧ \`${config.prefix}setbanner\` _[imagen]_
> Cambiar el banner del menú
✧ \`${config.prefix}setchannelid\` _[id]_
> Establecer ID del canal oficial`

        // Si hay banner en config, manda imagen con el menú
        if (config.banner) {
            await sock.sendMessage(from, { 
                image: { url: config.banner },
                caption: menu,
                mentions: [`${senderNumber}@s.whatsapp.net`]
            }, { quoted: msg })
        } else {
            // Si no hay banner, manda solo texto
            await sock.sendMessage(from, { 
                text: menu,
                mentions: [`${senderNumber}@s.whatsapp.net`]
            }, { quoted: msg })
        }
    }
                                  }
