import fetch from 'node-fetch';

export default {
    name: 'catbox',
    async execute(sock, msg, options) {
        const { args } = options;
        const from = msg.key.remoteJid;
        const url = args[0];
        if (!url ||!url.includes('catbox.moe')) {
            await sock.sendMessage(from, { text: '⭐ Debes proporcionar un link de catbox' }, { quoted: msg });
            return;
        }
        const res = await fetch(url);
        const buffer = Buffer.from(await res.arrayBuffer());
        const isVideo = url.toLowerCase().endsWith('.mp4');
        await sock.sendMessage(from, isVideo? { video: buffer } : { image: buffer }, { quoted: msg });
    }
};
