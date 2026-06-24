export default {
    name: 'restart',
    alias: ['reiniciar', 'reboot'],
    
    async execute(sock, msg, options) {
        try {
            const { config, usersDB, senderNumber, senderJid, pushName } = options;
            const from = msg.key.remoteJid;
            
            // Verificar registro
            if (usersDB && senderNumber && !usersDB[senderNumber]) {
                await sock.sendMessage(from, { 
                    text: `🍒 Para usar mis comandos tienes que estar registrado.\n> Uso : ${config.prefix}reg Misa.16`,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
                return;
            }
            
            // Verificar si el usuario es el owner (desde config.js)
            const isOwner = config.owner && config.owner.some(ownerNum => 
                ownerNum.replace(/\D/g, '') === (senderNumber || '').replace(/\D/g, '')
            );
            
            if (!isOwner) {
                // Responder como si el comando no existiera
                await sock.sendMessage(from, { 
                    text: `๑ֵ݊🍀 ᥱᥣ ᥴ᥆mᥲᥒძ᥆ \`${config.prefix}restart\` ᥒ᥆ ᥱ᥊іs𝗍ᥱ.\n> ೯۪🎑̶ֵ ᥙsᥲ ${config.prefix}help ⍴ᥲrᥲ ᥎ᥱr mіs ᥴ᥆mᥲᥒძ᥆s`,
                    contextInfo: {
                        mentionedJid: [senderJid],
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
                return;
            }

            // Mostrar que está procesando
            await sock.sendPresenceUpdate('composing', from);

            // Enviar mensaje de que se está reiniciando
            await sock.sendMessage(from, { 
                text: `❀ *Reiniciando a* ${config.name || 'Bot'} ❀\n> ► Espera hasta que el *Socket* se reinicie.`,
                contextInfo: {
                    mentionedJid: [senderJid],
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.canalId || '',
                        serverMessageId: 0,
                        newsletterName: config.canalNombre || ''
                    },
                    forwardingScore: 9999999,
                    isForwarded: true
                }
            }, { quoted: msg });

            console.log(`⚠️ Bot siendo reiniciado por OWNER: ${pushName || senderNumber}`);
            
            // Esperar 3 segundos antes de reiniciar para enviar el mensaje
            setTimeout(() => {
                console.log(`🔄 Reiniciando bot...`);
                
                // Si estás usando PM2 o algún gestor de procesos
                if (process.send) {
                    // Si estamos en un proceso hijo (como PM2)
                    process.send("restart");
                    console.log(`✅ Señal de reinicio enviada a PM2`);
                } else {
                    // Salir del proceso (será reiniciado por un proceso supervisor)
                    console.log(`⚠️ Saliendo del proceso...`);
                    
                    // Cerrar todas las conexiones WebSocket primero
                    if (sock.ws) {
                        try {
                            sock.ws.close();
                            console.log(`✅ Conexión WebSocket cerrada`);
                        } catch (e) {
                            console.error(`❌ Error al cerrar WebSocket: ${e.message}`);
                        }
                    }
                    
                    // Salir del proceso después de un breve retraso
                    setTimeout(() => {
                        process.exit(0);
                    }, 1000);
                }
            }, 3000);

        } catch (error) {
            console.error(`❌ Error en restart: ${error.message}`);
            
            try {
                await sock.sendMessage(msg.key.remoteJid, { 
                    text: `🍃 *Se ha producido un problema al intentar reiniciar*\n\nError: ${error.message.substring(0, 80)}`,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: options.config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: options.config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    }
};
