export default {
    name: 'creador',
    alias: ['owner'],

    async execute(sock, msg, options) {
        try {
            const { config, usersDB, senderNumber, senderJid, pushName } = options;
            const from = msg.key.remoteJid;
            
            // Verificar registro
            if (usersDB && senderNumber && !usersDB[senderNumber]) {
                await sock.sendMessage(from, { 
                    text: `🍟 Para usar mis comandos tienes que estar registrado.\n> Uso : ${config.prefix}reg Misa.16`
                }, { quoted: msg });
                return;
            }
            
            // Descargar imagen - Usando fetch global en lugar de node-fetch
            const response = await fetch('https://files.catbox.moe/qmixu7.jpeg');
            if (!response.ok) throw new Error('No se pudo descargar la imagen');
            
            const imgBuf = Buffer.from(await response.arrayBuffer());
            
            // Enviar imagen con caption y botones
            await sock.sendMessage(from, {
                image: imgBuf,
                caption: `⠾🍟 ⢷ Nombre » IAM DEV CUERBITL\n⠾🍫 ⢷ Staff » MICET\n⠾🌵 ⢷ Bot » MICET`,
                footer: 'Bot Moonlight',
                templateButtons: [
                    {
                        index: 1,
                        urlButton: {
                            displayText: 'gihub',
                            url: 'https://github.com/DvCuerbito/Micet-bot-v3.git'
                        }
                    },
                    {
                        index: 2,
                        urlButton: {
                            displayText: 'micet',
                            url: 'https://wa.me/542646762285'
                        }
                    },
                    {
                        index: 3,
                        urlButton: {
                            displayText: 'WhatsApp',
                            url: 'https://wa.me/5492644156919'
                        }
                    }
                ]
            }, { quoted: msg }); // Responde al mensaje del usuario
            
            console.log(`✅ Creador enviado a ${pushName || senderNumber}`);
            
        } catch (error) {
            console.error('❌ Error creador:', error.message);
            // Enviar mensaje de error respondiendo al usuario
            await sock.sendMessage(from, { 
                text: `❌ Error al enviar información del creador: ${error.message}` 
            }, { quoted: msg });
        }
    }
};
