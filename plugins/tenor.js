import fetch from 'node-fetch';

export default {
    name: 'tenor',
    
    async execute(sock, msg, options) {
        try {
            const { config, usersDB, senderNumber, senderJid, pushName } = options;
            const from = msg.key.remoteJid;
            
            // Verificar registro
            if (usersDB && senderNumber && !usersDB[senderNumber]) {
                await sock.sendMessage(from, { 
                    text: `[ ★ ] Para usar mis comandos tienes que estar registrado.\n> Uso : ${config.prefix}reg Misa.16`
                }, { quoted: msg });
                return;
            }
            
            // Obtener el texto de búsqueda
            const text = msg.message?.conversation || 
                        msg.message?.extendedTextMessage?.text || '';
            const args = text.split(' ').slice(1).join(' ');
            
            // Verificar si hay búsqueda
            if (!args || args.trim() === '') {
                await sock.sendMessage(from, { 
                    text: '[ ★ ] Debes proporcionar una búsqueda'
                }, { quoted: msg });
                return;
            }
            
            // Reaccionar con 🔍 mientras busca
            try {
                await sock.sendMessage(from, {
                    react: { text: '🔍', key: msg.key }
                });
            } catch (e) {}
            
            // Llamar a la API
            const response = await fetch(`https://api.delirius.store/search/tenor?q=${encodeURIComponent(args)}`);
            const json = await response.json();
            
            if (!json.status || !json.data || json.data.length === 0) {
                try {
                    await sock.sendMessage(from, {
                        react: { text: '❌', key: msg.key }
                    });
                } catch (e) {}
                
                await sock.sendMessage(from, { 
                    text: `[ ★ ] No se encontraron resultados para *${args}*`
                }, { quoted: msg });
                return;
            }
            
            // Mezclar todos los resultados aleatoriamente
            const shuffled = json.data.sort(() => Math.random() - 0.5);
            
            // Tomar 10 resultados aleatorios
            const resultados = shuffled.slice(0, 10);
            
            // Preparar las cards
            const cards = [];
            
            for (let i = 0; i < resultados.length; i++) {
                const item = resultados[i];
                
                let videoBuffer = null;
                try {
                    const gifRes = await fetch(item.mp4);
                    if (gifRes.ok) {
                        videoBuffer = Buffer.from(await gifRes.arrayBuffer());
                    }
                } catch (e) {
                    console.error(`[ ★ ] Error descargando video ${i + 1}:`, e.message);
                }
                
                if (videoBuffer) {
                    cards.push({
                        video: videoBuffer,
                        mimetype: 'video/mp4',
                        gifPlayback: true,
                        title: `[ ★ ] ${item.title}`,
                        body: `[ ★ ] *Título* » ${item.title}\n` +
                              `[ ★ ] *Creado* » ${item.created}\n` +
                              `[ ★ ] *Link* » ${item.gif}`,
                        footer: `[ ★ ] Resultado ${i + 1}/10`
                    });
                }
            }
            
            if (cards.length === 0) {
                try {
                    await sock.sendMessage(from, {
                        react: { text: '❌', key: msg.key }
                    });
                } catch (e) {}
                
                await sock.sendMessage(from, { 
                    text: `[ ★ ] No se pudieron cargar los GIFs para *${args}*`
                }, { quoted: msg });
                return;
            }
            
            // Enviar cards
            await sock.sendMessage(from, {
                text: `[ ★ ] *Tenor Search*\n\n` +
                      `[ ★ ] *Búsqueda:* ${args}\n` +
                      `[ ★ ] *Resultados:* ${cards.length} GIFs aleatorios`,
                footer: '[ ★ ] Moonlight Staff',
                cards: cards
            }, { quoted: msg });
            
            // Reaccionar con 🪴 al terminar con éxito
            try {
                await sock.sendMessage(from, {
                    react: { text: '🪴', key: msg.key }
                });
            } catch (e) {}
            
            console.log(`[ ★ ] Tenor enviado a ${pushName || senderNumber}: ${args}`);
            
        } catch (error) {
            console.error('[ ★ ] Error tenor:', error);
            
            try {
                await sock.sendMessage(from, {
                    react: { text: '❌', key: msg.key }
                });
            } catch (e) {}
            
            await sock.sendMessage(from, { 
                text: `[ ★ ] Error al buscar en Tenor: ${error.message}`
            }, { quoted: msg });
        }
    }
};
