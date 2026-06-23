export default {
    name: 'sorteo',
    alias: ['sortear', 'giveaway'],
    group: true, // solo funciona en grupos

    async execute(sock, msg, { args, senderJid, config }) {
        try {
            const from = msg.key.remoteJid
            const premio = args.join(' ').trim()

            if (!premio) {
                return await sock.sendMessage(from, {
                    text: `*🍟 ¿Qué vas a sortear?*\n\nEjemplo: ${config.prefijo}sorteo 1 mes de Nitro`,
                    contextInfo: {
                        mentionedJid: [senderJid],
                        forwardingScore: 9999999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        }
                    }
                }, { quoted: msg })
            }

            // Obtener participantes del grupo
            const groupMetadata = await sock.groupMetadata(from)
            let participantes = groupMetadata.participants
               .filter(p => !p.admin) // sacamos admins para que sea justo
               .map(p => p.id)

            // Si querés incluir admins, usá esta línea en vez de la de arriba:
            // let participantes = groupMetadata.participants.map(p => p.id)

            // Sacamos al bot y al que hizo el sorteo para que no se auto-gane
            participantes = participantes.filter(p => p !== sock.user.id && p !== senderJid)

            if (participantes.length < 1) {
                return await sock.sendMessage(from, {
                    text: '❌ No hay suficientes participantes para hacer el sorteo.'
                }, { quoted: msg })
            }

            await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })

            // Animación chafa para el hype
            let mensaje = await sock.sendMessage(from, { text: '🎰 *Iniciando sorteo...* 🎰' }, { quoted: msg })

            await new Promise(r => setTimeout(r, 1500))
            await sock.sendMessage(from, { edit: mensaje.key, text: '🎰 *Buscando ganador...* 🎰' })

            await new Promise(r => setTimeout(r, 1500))
            await sock.sendMessage(from, { edit: mensaje.key, text: '🎰 *El Ganador es...* 🎰' })

            await new Promise(r => setTimeout(r, 1000))

            // Elegir ganador random
            const ganador = participantes[Math.floor(Math.random() * participantes.length)]

            const textoFinal = `
╔══════╗
║ 🎉 *SORTEO FINALIZADO*
╠═══════════════════════
║ 👑 Ganador » @${ganador.split('@')[0]}
║ 🍕 Premio » ${premio}
║ 🌮 Participantes » ${participantes.length}
║ 🍟 Host » @${senderJid.split('@')[0]}
╠═══════════════════════
║ *Felicidades we 🎊*
╚═══════════════════════╝`.trim()

            await sock.sendMessage(from, {
                text: textoFinal,
                mentions: [ganador, senderJid],
                contextInfo: {
                    forwardingScore: 9999999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.canalId || '',
                        serverMessageId: 0,
                        newsletterName: config.canalNombre || ''
                    }
                }
            }, { edit: mensaje.key })

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } })

        } catch (error) {
            console.error('Error en sorteo:', error)
            await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ Error al hacer el sorteo. ¿Estoy en un grupo?'
            }, { quoted: msg })
        }
    }
}
