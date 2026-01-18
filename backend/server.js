require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// Initialize Discord client
let discordClient = null;
let botStatus = 'offline';

// Admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Connect to Discord
async function connectToDiscord() {
    try {
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            console.error('❌ DISCORD_BOT_TOKEN not set in environment variables');
            return;
        }

        console.log('🔗 Connecting to Discord...');

        discordClient = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.DirectMessages
            ],
            partials: [
                Partials.Channel,
                Partials.Message,
                Partials.User,
                Partials.GuildMember,
                Partials.Reaction
            ]
        });

        discordClient.once('ready', () => {
            console.log(`✅ Discord bot logged in as ${discordClient.user.tag}`);
            console.log(`📊 Serving ${discordClient.guilds.cache.size} servers`);
            botStatus = 'online';
        });

        discordClient.on('error', (error) => {
            console.error('❌ Discord client error:', error);
            botStatus = 'error';
        });

        discordClient.on('warn', (warning) => {
            console.warn('⚠️ Discord warning:', warning);
        });

        discordClient.on('disconnect', () => {
            console.log('🔌 Discord client disconnected');
            botStatus = 'offline';
        });

        await discordClient.login(token);
        
        // Check if intents are properly enabled
        console.log('📋 Checking bot configuration...');
        console.log(`   - Guilds: ${discordClient.options.intents.has(GatewayIntentBits.Guilds)}`);
        console.log(`   - Guild Messages: ${discordClient.options.intents.has(GatewayIntentBits.GuildMessages)}`);
        console.log(`   - Message Content: ${discordClient.options.intents.has(GatewayIntentBits.MessageContent)}`);
        console.log(`   - Guild Members: ${discordClient.options.intents.has(GatewayIntentBits.GuildMembers)}`);
        console.log(`   - Guild Presences: ${discordClient.options.intents.has(GatewayIntentBits.GuildPresences)}`);
        
    } catch (error) {
        console.error('❌ Failed to connect to Discord:', error.message);
        console.log('\n⚠️  TROUBLESHOOTING:');
        console.log('1. Go to: https://discord.com/developers/applications');
        console.log('2. Select your application');
        console.log('3. Click "Bot" in left sidebar');
        console.log('4. Scroll to "Privileged Gateway Intents"');
        console.log('5. Enable ALL THREE intents:');
        console.log('   - Presence Intent');
        console.log('   - Server Members Intent');
        console.log('   - Message Content Intent');
        console.log('6. Click "Save Changes"');
        console.log('7. Restart this server');
        botStatus = 'error';
    }
}

// ... rest of the middleware and routes remain the same ...

// Start server and connect to Discord
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log('\n🔑 Checking environment variables...');
    console.log(`   - DISCORD_BOT_TOKEN: ${process.env.DISCORD_BOT_TOKEN ? '✓ Set' : '✗ Missing'}`);
    console.log(`   - ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? '✓ Set' : '✗ Missing'}`);
    console.log(`   - PORT: ${PORT}`);
    
    // Connect to Discord after server starts
    await connectToDiscord();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down gracefully...');
    if (discordClient) {
        await discordClient.destroy();
        console.log('✅ Discord client disconnected');
    }
    process.exit(0);
});