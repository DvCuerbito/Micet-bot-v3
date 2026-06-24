import fs from 'fs';
import path from 'path';

const OWNER_NUMBER = "5492644156919";
const ECONOMY_FILE = path.resolve('./databases/economy.json');

function loadEconomy() {
    try {
        if (fs.existsSync(ECONOMY_FILE)) {
            return JSON.parse(fs.readFileSync(ECONOMY_FILE, 'utf8'));
        }
        return {};
    } catch (e) {
        return {};
    }
}

function saveEconomy(data) {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
}

function getRealPhoneNumber(usersDB, jid) {
    if (!jid ||!usersDB) return null;
    const id = jid.split('@')[0];
    for (const [num, u] of Object.entries(usersDB)) {
        if (u.lid === jid || u.lid === id) return num;
    }
    for (const [num, u] of Object.entries(usersDB)) {
        if (u.jid === jid || u.jid === id) return num;
    }
    if (/^[\d]+$/.test(id) && id.length > 8) {
        if (usersDB[id]) return id;
        return id;
    }
    return null;
}

export default {
    name: 'clear',
    alias: [],
    async execute(sock, msg, options) {
        try {
            const { config, usersDB, senderNumber } = options;
            const from = msg.key.remoteJid;
            if (senderNumber!== OWNER_NUMBER) {
                await sock.sendMessage(from, { text: `๑ֵ݊🍀 ᥱᥣ ᥴ᥆mᥲᥒძ᥆ \`${config.prefix}clear\` ᥒ᥆ ᥱ᥊іs𝗍ᥱ.` }, { quoted: msg });
                return;
            }

            const args = options.args || [];
            let targetNumber = null;
            let targetMentionJid = null;

            if (args.length > 0 && /^\d+$/.test(args[0])) {
                targetNumber = args[0];
                targetMentionJid = `${targetNumber}@s.whatsapp.net`;
            } else {
                const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
                const jid = mentioned || quoted;
                if (jid) {
                    targetNumber = getRealPhoneNumber(usersDB, jid);
                    targetMentionJid = jid;
                }
            }

            if (!targetNumber) {
                await sock.sendMessage(from, { text: `🐈 *Debes responder, mencionar o poner un número*\n> Ejemplo: ${config.prefix}clear 5219992042946` }, { quoted: msg });
                return;
            }

            const economy = loadEconomy();
            if (!economy[targetNumber]) {
                await sock.sendMessage(from, { text: `❌ Usuario no encontrado en economía.` }, { quoted: msg });
                return;
            }

            economy[targetNumber].coins = 0;
            saveEconomy(economy);

            await sock.sendMessage(from, {
                text: `🧹 @${targetNumber} *Tiene ahora* *0 coins*`,
                mentions: [targetMentionJid || `${targetNumber}@s.whatsapp.net`],
                contextInfo: { mentionedJid: [targetMentionJid || `${targetNumber}@s.whatsapp.net`] }
            }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
        }
    }
};
