// commands.js - Discord bot commands
module.exports = (client) => {
    client.on('messageCreate', async (message) => {
        // Ignore messages from bots
        if (message.author.bot) return;
        
        // Basic command handler
        if (message.content.startsWith('!help')) {
            message.reply({
                embeds: [{
                    title: 'ENM Store Bot Help',
                    description: 'Available commands:',
                    color: 0x7289DA,
                    fields: [
                        { name: '!help', value: 'Show this help message' },
                        { name: '!key', value: 'Check your active keys' },
                        { name: '!store', value: 'Visit our store' },
                        { name: '!support', value: 'Get support' }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });
        }
        
        if (message.content.startsWith('!store')) {
            message.reply('🎮 Visit our store: https://enm-store.netlify.app');
        }
        
        if (message.content.startsWith('!support')) {
            message.reply('📩 Need help? Contact support or create a ticket!');
        }
    });
};