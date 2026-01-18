// Bot Configuration Generator
// This file generates the actual bot code based on admin settings

class BotConfigGenerator {
    constructor(config) {
        this.config = config;
    }

    generateBotCode() {
        const botCode = `
// ENM Tech Discord Bot
// Generated: ${new Date().toISOString()}

const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        'Guilds',
        'GuildMessages',
        'MessageContent',
        'GuildMembers'
    ]
});

// Bot Configuration
const config = ${JSON.stringify(this.config, null, 4)};

// Webhook Manager
class WebhookManager {
    constructor() {
        this.webhooks = {};
        this.initializeWebhooks();
    }

    async initializeWebhooks() {
        if (config.webhooks.purchase) {
            this.webhooks.purchase = new Discord.WebhookClient({ url: config.webhooks.purchase });
        }
        if (config.webhooks.error) {
            this.webhooks.error = new Discord.WebhookClient({ url: config.webhooks.error });
        }
        if (config.webhooks.log) {
            this.webhooks.log = new Discord.WebhookClient({ url: config.webhooks.log });
        }
    }

    async sendPurchaseNotification(data) {
        if (!this.webhooks.purchase) return;
        
        const embed = new Discord.EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🎉 New Purchase!')
            .setDescription(\`New purchase from <@\${data.userId}>\`)
            .addFields(
                { name: 'Item', value: data.item, inline: true },
                { name: 'Amount', value: \`€\${data.amount}\`, inline: true },
                { name: 'Transaction ID', value: data.transactionId }
            )
            .setTimestamp()
            .setFooter({ text: 'ENM Tech Store' });

        await this.webhooks.purchase.send({ embeds: [embed] });
    }

    async sendLog(message, type = 'info') {
        if (!this.webhooks.log) return;
        
        const embed = new Discord.EmbedBuilder()
            .setColor(type === 'error' ? 0xff0000 : type === 'warning' ? 0xffaa00 : 0x00aaff)
            .setTitle(\`\${type.toUpperCase()}\`)
            .setDescription(message)
            .setTimestamp();

        await this.webhooks.log.send({ embeds: [embed] });
    }
}

// Role Manager
class RoleManager {
    constructor() {
        this.roleCache = new Map();
    }

    async assignRole(member, roleType) {
        const roleId = config.roles[roleType];
        if (!roleId) return false;

        try {
            const role = await member.guild.roles.fetch(roleId);
            if (role) {
                await member.roles.add(role);
                return true;
            }
        } catch (error) {
            console.error(\`Failed to assign role \${roleType}:\`, error);
        }
        return false;
    }

    async removeRole(member, roleType) {
        const roleId = config.roles[roleType];
        if (!roleId) return false;

        try {
            const role = await member.guild.roles.fetch(roleId);
            if (role && member.roles.cache.has(roleId)) {
                await member.roles.remove(role);
                return true;
            }
        } catch (error) {
            console.error(\`Failed to remove role \${roleType}:\`, error);
        }
        return false;
    }

    async updateUserRoles(member, purchases) {
        if (config.automation.autoAssignRoles) {
            await this.assignRole(member, 'customer');
        }

        // Check for premium purchases
        const hasPremium = purchases.some(p => p.type === 'lifetime' || p.price >= 10);
        if (hasPremium) {
            await this.assignRole(member, 'premium');
        }
    }
}

// Command Handler
class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.autoResponses = new Map();
        this.loadCommands();
    }

    loadCommands() {
        config.commands.forEach(cmd => {
            if (cmd.enabled) {
                this.commands.set(cmd.name.toLowerCase(), {
                    name: cmd.name,
                    description: cmd.description,
                    usage: cmd.usage,
                    response: cmd.response,
                    enabled: cmd.enabled
                });
            }
        });
    }

    async handleMessage(message) {
        if (message.author.bot) return;
        
        const content = message.content.toLowerCase();
        const prefix = config.prefix;

        // Check for auto-responses
        for (const [trigger, response] of this.autoResponses) {
            if (content.includes(trigger)) {
                await message.reply(response);
                return;
            }
        }

        // Check for commands
        if (content.startsWith(prefix)) {
            const args = message.content.slice(prefix.length).trim().split(/\\s+/);
            const commandName = args.shift().toLowerCase();
            const fullCommand = \`\${prefix}\${commandName}\`;

            const command = this.commands.get(fullCommand);
            if (command) {
                await this.executeCommand(message, command, args);
            }
        }
    }

    async executeCommand(message, command, args) {
        try {
            let response = command.response;
            
            // Replace variables
            response = response
                .replace(/{user}/g, message.author.username)
                .replace(/{userId}/g, message.author.id)
                .replace(/{server}/g, message.guild.name)
                .replace(/{prefix}/g, config.prefix);

            await message.reply(response);
        } catch (error) {
            console.error(\`Error executing command \${command.name}:\`, error);
            await message.reply('An error occurred while executing this command.');
        }
    }

    addAutoResponse(trigger, response, caseSensitive = false) {
        const key = caseSensitive ? trigger : trigger.toLowerCase();
        this.autoResponses.set(key, response);
    }
}

// Event Handlers
client.on('ready', async () => {
    console.log(\`Logged in as \${client.user.tag}!\`);
    
    // Set bot status
    client.user.setPresence({
        activities: [{
            name: config.status,
            type: config.activity
        }],
        status: 'online'
    });

    // Initialize managers
    const webhookManager = new WebhookManager();
    const roleManager = new RoleManager();
    const commandHandler = new CommandHandler();

    // Store managers
    client.webhookManager = webhookManager;
    client.roleManager = roleManager;
    client.commandHandler = commandHandler;

    // Send ready notification
    if (config.channels.log) {
        const logChannel = await client.channels.fetch(config.channels.log);
        if (logChannel) {
            await logChannel.send(\`✅ Bot is online! (\${config.prefix}help for commands)\`);
        }
    }
});

client.on('guildMemberAdd', async (member) => {
    if (config.automation.autoWelcome) {
        const welcomeChannel = config.channels.welcome;
        if (welcomeChannel) {
            const channel = await client.channels.fetch(welcomeChannel);
            if (channel) {
                let message = config.automation.welcomeMessage
                    .replace(/{user}/g, member.user.tag)
                    .replace(/{server}/g, member.guild.name)
                    .replace(/{memberCount}/g, member.guild.memberCount);
                
                await channel.send(message);
            }
        }
    }

    // Auto-assign customer role
    if (config.automation.autoAssignRoles) {
        await client.roleManager.assignRole(member, 'customer');
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Handle commands
    await client.commandHandler.handleMessage(message);

    // Log messages in log channel
    if (config.channels.log && message.channel.id !== config.channels.log) {
        const logChannel = await client.channels.fetch(config.channels.log);
        if (logChannel) {
            const embed = new Discord.EmbedBuilder()
                .setColor(0x7289da)
                .setAuthor({
                    name: message.author.tag,
                    iconURL: message.author.displayAvatarURL()
                })
                .setDescription(message.content.substring(0, 1024))
                .addFields(
                    { name: 'Channel', value: \`#\${message.channel.name}\`, inline: true },
                    { name: 'User ID', value: message.author.id, inline: true }
                )
                .setTimestamp();

            if (message.attachments.size > 0) {
                embed.setImage(message.attachments.first().url);
            }

            await logChannel.send({ embeds: [embed] });
        }
    }
});

// Error handling
client.on('error', console.error);
process.on('unhandledRejection', console.error);

// Login
client.login(config.token);
        `;

        return botCode;
    }

    generateDeployScript() {
        return `#!/bin/bash
# ENM Tech Bot Deployment Script
# Generated: ${new Date().toISOString()}

echo "🚀 Starting ENM Tech Bot deployment..."

# Create project directory
mkdir -p enm-tech-bot
cd enm-tech-bot

# Create package.json
cat > package.json << EOF
{
  "name": "enm-tech-bot",
  "version": "1.0.0",
  "description": "Discord bot for ENM Tech Store",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js",
    "dev": "nodemon bot.js"
  },
  "dependencies": {
    "discord.js": "^14.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  },
  "engines": {
    "node": ">=16.9.0"
  }
}
EOF

# Create bot.js with configuration
cat > bot.js << 'EOF'
${this.generateBotCode()}
EOF

# Create .env file
cat > .env << EOF
BOT_TOKEN=${this.config.token}
CLIENT_ID=${this.config.clientId}
PREFIX=${this.config.prefix}
EOF

# Create README
cat > README.md << 'EOF'
# ENM Tech Discord Bot

This bot was generated from the ENM Tech Admin Panel.

## Features
- Purchase notifications
- Role management
- Automated welcome messages
- Command system
- Logging system

## Setup
1. Install dependencies: \`npm install\`
2. Configure your .env file with bot token
3. Run: \`npm start\`

## Hosting Options
- **Replit**: Upload files and run
- **Glitch**: Import from GitHub
- **Heroku**: Deploy with Procfile
- **VPS**: Run with PM2
- **Railway**: Easy deployment

## Commands
${this.config.commands.filter(c => c.enabled).map(c => `- ${c.name}: ${c.description}`).join('\n')}
EOF

# Create Procfile for Heroku
cat > Procfile << EOF
worker: npm start
EOF

echo "✅ Bot files generated!"
echo "📁 Files created:"
echo "  - package.json"
echo "  - bot.js (main bot code)"
echo "  - .env (configuration - ADD YOUR TOKEN HERE)"
echo "  - README.md"
echo "  - Procfile"
echo ""
echo "📦 Next steps:"
echo "1. Add your bot token to .env file"
echo "2. Run: npm install"
echo "3. Run: npm start"
echo ""
echo "🌐 Hosting options:"
echo "- Replit: Upload all files"
echo "- Glitch: Import repository"
echo "- Heroku: Connect GitHub repo"
echo "- Railway: One-click deploy"
echo "- VPS: Run with 'node bot.js'"
        `;
    }

    generateConfigFile() {
        return JSON.stringify(this.config, null, 2);
    }
}

// Export for use in admin panel
if (typeof window !== 'undefined') {
    window.BotConfigGenerator = BotConfigGenerator;
}

// For Node.js usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BotConfigGenerator;
}