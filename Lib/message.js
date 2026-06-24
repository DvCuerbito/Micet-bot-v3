import { jidDecode } from '@whiskeysockets/baileys'

export async function smsg(sock, m) {
  if (!m) return m

  const M = m
  const msg = M.message || {}

  // Tipo de mensaje
  const type = Object.keys(msg)[0]
  M.type = type

  // Contenido
  M.body =
    msg.conversation ||
    msg[type]?.text ||
    msg[type]?.caption ||
    msg[type]?.contentText ||
    ''

  // Ids
  M.id = M.key?.id
  M.chat = M.key?.remoteJid
  M.fromMe = M.key?.fromMe
  M.isGroup = M.chat?.endsWith('@g.us')
  
  // Obtener el número real del sender (sin @s.whatsapp.net)
  // Usar participantAlt si existe (para LID), si no usar participant o el método tradicional
  const getCleanNumber = (jid) => {
    if (!jid) return null
    // Si es LID (termina con @lid), extraer el número del participantAlt
    if (jid.endsWith('@lid')) {
      // Buscar participantAlt en el key
      if (M.key?.participantAlt) {
        return M.key.participantAlt.replace('@s.whatsapp.net', '').replace(/:\d+/, '')
      }
    }
    // Si ya es número normal, limpiar
    return jid.replace('@s.whatsapp.net', '').replace(/:\d+/, '')
  }

  // Sender - usar participantAlt si está disponible (para LID)
  if (M.fromMe) {
    M.sender = sock.user.id
  } else if (M.isGroup) {
    // Para grupos, priorizar participantAlt (número real) sobre participant (LID)
    if (M.key?.participantAlt) {
      M.sender = M.key.participantAlt
    } else if (M.key?.participant) {
      M.sender = M.key.participant
    } else {
      M.sender = M.key?.participant || M.chat
    }
  } else {
    M.sender = M.chat
  }
  
  // Número limpio (solo dígitos)
  M.senderNumber = getCleanNumber(M.sender)
  
  // JID limpio para menciones
  M.senderJid = M.sender

  // Push name
  M.pushName = M.pushName || M.name || 'Sin nombre'

  // Menciones
  M.mentionedJid =
    msg[type]?.contextInfo?.mentionedJid || []

  // Quoted
  const quoted = msg[type]?.contextInfo?.quotedMessage
  if (quoted) {
    const qType = Object.keys(quoted)[0]
    M.quoted = {
      type: qType,
      id: msg[type].contextInfo.stanzaId,
      sender: msg[type].contextInfo.participant,
      text:
        quoted[qType]?.text ||
        quoted[qType]?.caption ||
        '',
      message: quoted
    }
    
    // Número limpio del quoted
    M.quoted.senderNumber = getCleanNumber(M.quoted.sender)

    M.quoted.delete = () =>
      sock.sendMessage(M.chat, {
        delete: {
          remoteJid: M.chat,
          fromMe: false,
          id: M.quoted.id,
          participant: M.quoted.sender
        }
      })
  } else {
    M.quoted = null
  }

  // Helpers
  M.reply = (text, options = {}) =>
    sock.sendMessage(
      M.chat,
      { text, ...options },
      { quoted: M }
    )

  M.react = emoji =>
    sock.sendMessage(M.chat, {
      react: { text: emoji, key: M.key }
    })

  // Normalizar jid
  M.decodeJid = jid => {
    if (!jid) return jid
    if (/:\d+@/.test(jid)) {
      const d = jidDecode(jid) || {}
      return d.user && d.server
        ? `${d.user}@${d.server}`
        : jid
    }
    return jid
  }

  return M
}

// ✅ Exportación por defecto (opcional)
export default { smsg }
