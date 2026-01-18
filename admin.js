// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Configuration storage - NO HARDCODED SECRETS
    let botConfig = {
        token: '', // Will be loaded from secure storage
        clientId: '', // Will be loaded from secure storage
        prefix: '!',
        status: 'Managing ENM Store',
        activity: 'LISTENING',
        permissions: {
            manageRoles: true,
            manageMessages: true,
            kickMembers: false,
            banMembers: false,
            readMessages: true,
            sendMessages: true,
            embedLinks: true,
            attachFiles: true
        },
        channels: {
            log: '',
            announce: '',
            welcome: '',
            support: ''
        },
        roles: {
            customer: '',
            premium: '',
            admin: '',
            mod: ''
        },
        commands: [
            { name: '!help', enabled: true, description: 'Shows all available commands', usage: '!help', response: 'Here are the available commands...' },
            { name: '!key', enabled: true, description: 'Shows your active keys', usage: '!key', response: 'Your active keys...' },
            { name: '!purchase', enabled: true, description: 'Shows your purchase history', usage: '!purchase', response: 'Your purchase history...' },
            { name: '!support', enabled: true, description: 'Opens a support ticket', usage: '!support [message]', response: 'Support ticket created...' }
        ],
        automation: {
            autoAssignRoles: true,
            autoWelcome: true,
            autoLogPurchases: true,
            autoUpdateStatus: true,
            welcomeMessage: 'Welcome {user} to ENM Store! 🎉\n\nCheck out our store: https://enm-store.netlify.app\nUse !help for commands',
            purchaseMessage: '🎉 New purchase from {user}!\n\n**Item:** {item}\n**Amount:** {amount}\n**Transaction ID:** {transactionId}\n\nThank you for your support! ❤️'
        },
        webhooks: {
            purchase: '',
            error: '',
            log: ''
        },
        logs: []
    };

    // Admin password - No hardcoded value
    let ADMIN_PASSWORD = '';

    // Initialize
    loadConfig();
    loadSecrets();
    initEventListeners();
    updateStats();

    // Login functionality
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginAdminBtn = document.getElementById('loginAdminBtn');
    const loginError = document.getElementById('loginError');
    const adminLogin = document.getElementById('adminLogin');
    const adminDashboard = document.getElementById('adminDashboard');
    const adminLogout = document.getElementById('adminLogout');

    // Check if already logged in (from localStorage)
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showDashboard();
    }

    loginAdminBtn.addEventListener('click', function() {
        const password = adminPasswordInput.value;
        if (password === ADMIN_PASSWORD) {
            localStorage.setItem('adminLoggedIn', 'true');
            showDashboard();
        } else {
            loginError.style.display = 'block';
            adminPasswordInput.style.borderColor = 'var(--danger-color)';
            setTimeout(() => {
                loginError.style.display = 'none';
                adminPasswordInput.style.borderColor = '';
            }, 3000);
        }
    });

    adminPasswordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginAdminBtn.click();
        }
    });

    adminLogout.addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        adminDashboard.style.display = 'none';
        adminLogin.style.display = 'flex';
        adminPasswordInput.value = '';
    });

    function showDashboard() {
        adminLogin.style.display = 'none';
        adminDashboard.style.display = 'block';
        addLog('Admin logged in', 'success');
    }

    // Navigation
    const adminNavLinks = document.querySelectorAll('.admin-nav-link');
    const adminSections = document.querySelectorAll('.admin-section');

    adminNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            adminNavLinks.forEach(l => l.classList.remove('active'));
            adminSections.forEach(section => section.classList.remove('active'));
            
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section') + 'Section';
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Bot Settings
    const saveBotSettingsBtn = document.getElementById('saveBotSettingsBtn');
    const toggleTokenBtn = document.getElementById('toggleTokenBtn');
    const botTokenInput = document.getElementById('botToken');

    saveBotSettingsBtn.addEventListener('click', function() {
        botConfig.token = botTokenInput.value;
        botConfig.clientId = document.getElementById('clientId').value;
        botConfig.prefix = document.getElementById('prefix').value;
        botConfig.status = document.getElementById('botStatus').value;
        botConfig.activity = document.getElementById('botActivity').value;

        // Save permissions
        botConfig.permissions.manageRoles = document.getElementById('permManageRoles').checked;
        botConfig.permissions.manageMessages = document.getElementById('permManageMessages').checked;
        botConfig.permissions.kickMembers = document.getElementById('permKickMembers').checked;
        botConfig.permissions.banMembers = document.getElementById('permBanMembers').checked;
        botConfig.permissions.readMessages = document.getElementById('permReadMessages').checked;
        botConfig.permissions.sendMessages = document.getElementById('permSendMessages').checked;
        botConfig.permissions.embedLinks = document.getElementById('permEmbedLinks').checked;
        botConfig.permissions.attachFiles = document.getElementById('permAttachFiles').checked;

        saveConfig();
        saveSecrets();
        addLog('Bot settings saved', 'success');
        alert('Bot settings saved successfully!');
    });

    toggleTokenBtn.addEventListener('click', function() {
        const type = botTokenInput.type === 'password' ? 'text' : 'password';
        botTokenInput.type = type;
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Channel Management
    const saveChannelsBtn = document.getElementById('saveChannelsBtn');
    const fetchChannelsBtn = document.getElementById('fetchChannelsBtn');

    saveChannelsBtn.addEventListener('click', function() {
        botConfig.channels.log = document.getElementById('logChannel').value;
        botConfig.channels.announce = document.getElementById('announceChannel').value;
        botConfig.channels.welcome = document.getElementById('welcomeChannel').value;
        botConfig.channels.support = document.getElementById('supportChannel').value;

        saveConfig();
        addLog('Channel settings saved', 'success');
        alert('Channel settings saved!');
    });

    fetchChannelsBtn.addEventListener('click', function() {
        if (!botConfig.token) {
            alert('Please enter your bot token first!');
            return;
        }
        
        // In a real implementation, you would fetch channels from Discord API
        // For now, we'll simulate with sample data
        simulateFetchChannels();
    });

    function simulateFetchChannels() {
        const sampleChannels = [
            { id: '1234567890', name: 'general', type: 'text' },
            { id: '1234567891', name: 'announcements', type: 'text' },
            { id: '1234567892', name: 'welcome', type: 'text' },
            { id: '1234567893', name: 'support', type: 'text' },
            { id: '1234567894', name: 'logs', type: 'text' },
            { id: '1234567895', name: 'bot-commands', type: 'text' }
        ];

        const channelList = document.getElementById('channelList');
        const logChannelSelect = document.getElementById('logChannel');
        const announceChannelSelect = document.getElementById('announceChannel');
        const welcomeChannelSelect = document.getElementById('welcomeChannel');
        const supportChannelSelect = document.getElementById('supportChannel');

        // Clear existing options except first
        [logChannelSelect, announceChannelSelect, welcomeChannelSelect, supportChannelSelect].forEach(select => {
            while (select.options.length > 1) {
                select.remove(1);
            }
        });

        channelList.innerHTML = '';

        sampleChannels.forEach(channel => {
            const channelItem = document.createElement('div');
            channelItem.className = 'channel-item';
            channelItem.innerHTML = `
                <div class="channel-icon">
                    <i class="fas fa-hashtag"></i>
                </div>
                <div class="channel-info">
                    <div class="channel-name">${channel.name}</div>
                    <div class="channel-id">ID: ${channel.id}</div>
                </div>
            `;
            channelList.appendChild(channelItem);

            // Add to selects
            const option = new Option(`#${channel.name}`, channel.id);
            logChannelSelect.add(option.cloneNode(true));
            announceChannelSelect.add(option.cloneNode(true));
            welcomeChannelSelect.add(option.cloneNode(true));
            supportChannelSelect.add(option.cloneNode(true));
        });

        addLog('Fetched channels from Discord', 'success');
    }

    // Role Management
    const saveRolesBtn = document.getElementById('saveRolesBtn');
    const fetchRolesBtn = document.getElementById('fetchRolesBtn');
    const createRoleBtn = document.getElementById('createRoleBtn');
    const newRoleColor = document.getElementById('newRoleColor');
    const newRoleColorHex = document.getElementById('newRoleColorHex');
    const colorPreview = document.getElementById('colorPreview');

    saveRolesBtn.addEventListener('click', function() {
        botConfig.roles.customer = document.getElementById('customerRole').value;
        botConfig.roles.premium = document.getElementById('premiumRole').value;
        botConfig.roles.admin = document.getElementById('adminRole').value;
        botConfig.roles.mod = document.getElementById('modRole').value;

        saveConfig();
        addLog('Role settings saved', 'success');
        alert('Role settings saved!');
    });

    fetchRolesBtn.addEventListener('click', function() {
        if (!botConfig.token) {
            alert('Please enter your bot token first!');
            return;
        }
        
        simulateFetchRoles();
    });

    function simulateFetchRoles() {
        const sampleRoles = [
            { id: '1234567890', name: '@everyone', color: '#99aab5' },
            { id: '1234567891', name: 'Customer', color: '#7289da' },
            { id: '1234567892', name: 'Premium', color: '#ffd700' },
            { id: '1234567893', name: 'Admin', color: '#ed4245' },
            { id: '1234567894', name: 'Moderator', color: '#57f287' }
        ];

        const customerRoleSelect = document.getElementById('customerRole');
        const premiumRoleSelect = document.getElementById('premiumRole');
        const adminRoleSelect = document.getElementById('adminRole');
        const modRoleSelect = document.getElementById('modRole');

        // Clear existing options except first
        [customerRoleSelect, premiumRoleSelect, adminRoleSelect, modRoleSelect].forEach(select => {
            while (select.options.length > 1) {
                select.remove(1);
            }
        });

        sampleRoles.forEach(role => {
            const option = new Option(role.name, role.id);
            customerRoleSelect.add(option.cloneNode(true));
            premiumRoleSelect.add(option.cloneNode(true));
            adminRoleSelect.add(option.cloneNode(true));
            modRoleSelect.add(option.cloneNode(true));
        });

        addLog('Fetched roles from Discord', 'success');
    }

    createRoleBtn.addEventListener('click', function() {
        const roleName = document.getElementById('newRoleName').value;
        const roleColor = newRoleColor.value;
        const permissions = document.getElementById('newRolePermissions').value;
        const hoist = document.getElementById('newRoleHoist').checked;
        const mentionable = document.getElementById('newRoleMentionable').checked;

        if (!roleName) {
            alert('Please enter a role name!');
            return;
        }

        if (!botConfig.token) {
            alert('Please enter your bot token first!');
            return;
        }

        // Simulate role creation
        addLog(`Created new role: ${roleName}`, 'success');
        
        // Reset form
        document.getElementById('newRoleName').value = '';
        document.getElementById('newRolePermissions').value = '';
        document.getElementById('newRoleHoist').checked = false;
        document.getElementById('newRoleMentionable').checked = false;
        
        alert(`Role "${roleName}" created successfully!`);
    });

    // Color picker functionality
    newRoleColor.addEventListener('input', function() {
        newRoleColorHex.value = this.value;
        colorPreview.style.backgroundColor = this.value;
    });

    newRoleColorHex.addEventListener('input', function() {
        if (this.value.match(/^#[0-9A-F]{6}$/i)) {
            newRoleColor.value = this.value;
            colorPreview.style.backgroundColor = this.value;
        }
    });

    // Commands Management
    const addCommandBtn = document.getElementById('addCommandBtn');
    const addCommandModal = document.getElementById('addCommandModal');
    const cancelCommandBtn = document.getElementById('cancelCommandBtn');
    const saveCommandBtn = document.getElementById('saveCommandBtn');
    const modalCloseButtons = document.querySelectorAll('.modal-close');

    addCommandBtn.addEventListener('click', function() {
        addCommandModal.classList.add('active');
    });

    cancelCommandBtn.addEventListener('click', function() {
        addCommandModal.classList.remove('active');
        clearCommandForm();
    });

    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
            clearCommandForm();
        });
    });

    saveCommandBtn.addEventListener('click', function() {
        const name = document.getElementById('newCommandName').value;
        const description = document.getElementById('newCommandDescription').value;
        const usage = document.getElementById('newCommandUsage').value;
        const response = document.getElementById('newCommandResponse').value;
        const enabled = document.getElementById('newCommandEnabled').checked;

        if (!name || !description || !response) {
            alert('Please fill all required fields!');
            return;
        }

        botConfig.commands.push({
            name: name.startsWith(botConfig.prefix) ? name : botConfig.prefix + name,
            enabled: enabled,
            description: description,
            usage: usage,
            response: response
        });

        saveConfig();
        addLog(`Added new command: ${name}`, 'success');
        addCommandModal.classList.remove('active');
        clearCommandForm();
        alert('Command added successfully!');
    });

    function clearCommandForm() {
        document.getElementById('newCommandName').value = '';
        document.getElementById('newCommandDescription').value = '';
        document.getElementById('newCommandUsage').value = '';
        document.getElementById('newCommandResponse').value = '';
        document.getElementById('newCommandEnabled').checked = true;
    }

    // Auto-Responses
    const addAutoResponseBtn = document.getElementById('addAutoResponseBtn');

    addAutoResponseBtn.addEventListener('click', function() {
        const trigger = document.getElementById('autoResponseTrigger').value;
        const message = document.getElementById('autoResponseMessage').value;
        const caseSensitive = document.getElementById('autoResponseCaseSensitive').checked;

        if (!trigger || !message) {
            alert('Please fill all required fields!');
            return;
        }

        addLog(`Added auto-response for: ${trigger}`, 'success');
        
        // Reset form
        document.getElementById('autoResponseTrigger').value = '';
        document.getElementById('autoResponseMessage').value = '';
        document.getElementById('autoResponseCaseSensitive').checked = false;
        
        alert('Auto-response added successfully!');
    });

    // Automation
    const saveAutomationBtn = document.getElementById('saveAutomationBtn');

    saveAutomationBtn.addEventListener('click', function() {
        botConfig.automation.autoAssignRoles = document.getElementById('autoAssignRoles').checked;
        botConfig.automation.autoWelcome = document.getElementById('autoWelcome').checked;
        botConfig.automation.autoLogPurchases = document.getElementById('autoLogPurchases').checked;
        botConfig.automation.autoUpdateStatus = document.getElementById('autoUpdateStatus').checked;
        botConfig.automation.welcomeMessage = document.getElementById('welcomeMessage').value;
        botConfig.automation.purchaseMessage = document.getElementById('purchaseMessage').value;

        saveConfig();
        addLog('Automation settings saved', 'success');
        alert('Automation settings saved!');
    });

    // Webhooks
    const testWebhookBtn = document.getElementById('testWebhookBtn');
    const saveWebhooksBtn = document.getElementById('saveWebhooksBtn');
    const testWebhookModal = document.getElementById('testWebhookModal');
    const cancelTestBtn = document.getElementById('cancelTestBtn');
    const sendTestBtn = document.getElementById('sendTestBtn');

    testWebhookBtn.addEventListener('click', function() {
        testWebhookModal.classList.add('active');
    });

    cancelTestBtn.addEventListener('click', function() {
        testWebhookModal.classList.remove('active');
        document.getElementById('testWebhookResult').style.display = 'none';
    });

    sendTestBtn.addEventListener('click', async function() {
        const type = document.getElementById('testWebhookType').value;
        const message = document.getElementById('testMessage').value;
        const resultDiv = document.getElementById('testWebhookResult');

        const webhookUrl = botConfig.webhooks[type];
        if (!webhookUrl) {
            resultDiv.innerHTML = `<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> No webhook URL configured for ${type}</div>`;
            resultDiv.style.display = 'block';
            return;
        }

        try {
            // Simulate webhook test
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            resultDiv.innerHTML = `<div style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Test webhook sent successfully!</div>`;
            resultDiv.style.display = 'block';
            
            addLog(`Test ${type} webhook sent`, 'success');
        } catch (error) {
            resultDiv.innerHTML = `<div style="color: var(--danger-color);"><i class="fas fa-exclamation-circle"></i> Failed to send webhook: ${error.message}</div>`;
            resultDiv.style.display = 'block';
            
            addLog(`Failed to send test webhook: ${error.message}`, 'error');
        }
    });

    saveWebhooksBtn.addEventListener('click', function() {
        botConfig.webhooks.purchase = document.getElementById('purchaseWebhook').value;
        botConfig.webhooks.error = document.getElementById('errorWebhook').value;
        botConfig.webhooks.log = document.getElementById('logWebhook').value;

        saveConfig();
        addLog('Webhook settings saved', 'success');
        alert('Webhook settings saved!');
    });

    // Quick Actions
    const sendTestMsgBtn = document.getElementById('sendTestMsgBtn');
    const syncUsersBtn = document.getElementById('syncUsersBtn');
    const updateRolesBtn = document.getElementById('updateRolesBtn');
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    const refreshStatusBtn = document.getElementById('refreshStatusBtn');

    sendTestMsgBtn.addEventListener('click', function() {
        if (!botConfig.token) {
            alert('Please configure bot token first!');
            return;
        }
        addLog('Test message sent to Discord', 'success');
        alert('Test message sent!');
    });

    syncUsersBtn.addEventListener('click', function() {
        if (!botConfig.token) {
            alert('Please configure bot token first!');
            return;
        }
        addLog('Syncing Discord users...', 'info');
        setTimeout(() => {
            addLog('Discord users synced successfully', 'success');
            updateStats();
            alert('Users synced successfully!');
        }, 2000);
    });

    updateRolesBtn.addEventListener('click', function() {
        if (!botConfig.token) {
            alert('Please configure bot token first!');
            return;
        }
        addLog('Updating user roles...', 'info');
        setTimeout(() => {
            addLog('User roles updated successfully', 'success');
            alert('Roles updated successfully!');
        }, 2000);
    });

    clearLogsBtn.addEventListener('click', function() {
        if (confirm('Clear all logs older than 7 days?')) {
            botConfig.logs = botConfig.logs.filter(log => {
                const logDate = new Date(log.timestamp);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return logDate > weekAgo;
            });
            saveConfig();
            addLog('Cleared old logs', 'success');
            alert('Old logs cleared!');
        }
    });

    refreshStatusBtn.addEventListener('click', function() {
        updateBotStatus();
    });

    // Logs Management
    const exportLogsBtn = document.getElementById('exportLogsBtn');
    const clearAllLogsBtn = document.getElementById('clearAllLogsBtn');
    const clearWebhookLogsBtn = document.getElementById('clearWebhookLogsBtn');
    const logFilters = document.querySelectorAll('[data-filter]');

    exportLogsBtn.addEventListener('click', function() {
        const logsStr = JSON.stringify(botConfig.logs, null, 2);
        const blob = new Blob([logsStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enm-bot-logs-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addLog('Logs exported', 'success');
    });

    clearAllLogsBtn.addEventListener('click', function() {
        if (confirm('Clear ALL logs? This cannot be undone.')) {
            botConfig.logs = [];
            saveConfig();
            document.getElementById('systemLogs').innerHTML = '<div class="log-entry info">Logs cleared</div>';
            addLog('All logs cleared', 'warning');
        }
    });

    clearWebhookLogsBtn.addEventListener('click', function() {
        document.getElementById('webhookLogs').innerHTML = '';
    });

    logFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            logFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            const filterType = this.getAttribute('data-filter');
            const logs = document.querySelectorAll('#systemLogs .log-entry');
            
            logs.forEach(log => {
                if (filterType === 'all') {
                    log.style.display = 'block';
                } else {
                    log.style.display = log.classList.contains(filterType) ? 'block' : 'none';
                }
            });
        });
    });

    // Backup & Restore
    const backupConfigBtn = document.getElementById('backupConfigBtn');
    const configUpload = document.getElementById('configUpload');
    const saveBackupSettingsBtn = document.getElementById('saveBackupSettingsBtn');

    backupConfigBtn.addEventListener('click', function() {
        const configStr = JSON.stringify(botConfig, null, 2);
        const blob = new Blob([configStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enm-bot-config-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addLog('Configuration exported', 'success');
    });

    configUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const fileName = document.getElementById('selectedFileName');
        fileName.textContent = `Selected: ${file.name}`;
        
        if (confirm(`Load configuration from ${file.name}? This will overwrite current settings.`)) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const newConfig = JSON.parse(event.target.result);
                    botConfig = { ...botConfig, ...newConfig };
                    saveConfig();
                    loadConfig(); // Reload UI
                    addLog('Configuration imported successfully', 'success');
                    alert('Configuration imported successfully!');
                } catch (error) {
                    addLog('Failed to import configuration: Invalid file', 'error');
                    alert('Invalid configuration file!');
                }
            };
            reader.readAsText(file);
        }
    });

    saveBackupSettingsBtn.addEventListener('click', function() {
        const schedule = document.getElementById('backupSchedule').value;
        addLog(`Backup schedule set to: ${schedule}`, 'success');
        alert('Backup settings saved!');
    });

    // Load secrets from secure storage
    function loadSecrets() {
        // Check if we have secrets in sessionStorage (temporary, secure)
        const storedToken = sessionStorage.getItem('discord_token');
        const storedClientId = sessionStorage.getItem('discord_client_id');
        const storedPassword = sessionStorage.getItem('admin_password');
        
        if (storedToken && storedClientId && storedPassword) {
            botConfig.token = storedToken;
            botConfig.clientId = storedClientId;
            ADMIN_PASSWORD = storedPassword;
            
            // Update UI fields
            document.getElementById('botToken').value = storedToken;
            document.getElementById('clientId').value = storedClientId;
            
            addLog('Secrets loaded from secure storage', 'success');
            return;
        }
        
        // If no stored secrets, check URL parameters (for initial setup)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const clientId = urlParams.get('client_id');
        const password = urlParams.get('password');
        
        if (token && clientId && password) {
            // Store in sessionStorage (not localStorage for security)
            sessionStorage.setItem('discord_token', token);
            sessionStorage.setItem('discord_client_id', clientId);
            sessionStorage.setItem('admin_password', password);
            
            // Remove sensitive data from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Load the values
            loadSecrets();
            return;
        }
        
        // If still no secrets, prompt the user
        if (!botConfig.token || !botConfig.clientId) {
            showSetupPrompt();
        }
    }
    
    function showSetupPrompt() {
        const setupModal = document.createElement('div');
        setupModal.className = 'modal active';
        setupModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-cog"></i> Initial Setup Required</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="setupToken">Discord Bot Token:</label>
                        <input type="password" id="setupToken" class="form-control" placeholder="Enter your Discord bot token">
                        <small class="form-text">Get this from https://discord.com/developers/applications</small>
                    </div>
                    <div class="form-group">
                        <label for="setupClientId">Discord Client ID:</label>
                        <input type="text" id="setupClientId" class="form-control" placeholder="Enter your Discord client ID">
                    </div>
                    <div class="form-group">
                        <label for="setupPassword">Admin Password:</label>
                        <input type="password" id="setupPassword" class="form-control" placeholder="Set an admin password">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirm Password:</label>
                        <input type="password" id="confirmPassword" class="form-control" placeholder="Confirm admin password">
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancelSetup" class="btn btn-secondary">Cancel</button>
                    <button id="saveSetup" class="btn btn-primary">Save & Continue</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(setupModal);
        
        document.getElementById('saveSetup').addEventListener('click', function() {
            const token = document.getElementById('setupToken').value;
            const clientId = document.getElementById('setupClientId').value;
            const password = document.getElementById('setupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!token || !clientId || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            // Store securely
            sessionStorage.setItem('discord_token', token);
            sessionStorage.setItem('discord_client_id', clientId);
            sessionStorage.setItem('admin_password', password);
            
            // Update config
            botConfig.token = token;
            botConfig.clientId = clientId;
            ADMIN_PASSWORD = password;
            
            // Update UI
            document.getElementById('botToken').value = token;
            document.getElementById('clientId').value = clientId;
            
            // Remove modal
            document.body.removeChild(setupModal);
            
            addLog('Initial setup completed', 'success');
            alert('Setup completed! You can now use the admin panel.');
        });
        
        document.getElementById('cancelSetup').addEventListener('click', function() {
            document.body.removeChild(setupModal);
        });
        
        setupModal.querySelector('.modal-close').addEventListener('click', function() {
            document.body.removeChild(setupModal);
        });
    }
    
    function saveSecrets() {
        // Save current token and client ID to sessionStorage
        if (botConfig.token && botConfig.clientId) {
            sessionStorage.setItem('discord_token', botConfig.token);
            sessionStorage.setItem('discord_client_id', botConfig.clientId);
        }
    }

    // Utility Functions
    function loadConfig() {
        const savedConfig = localStorage.getItem('enmBotConfig');
        if (savedConfig) {
            try {
                const parsed = JSON.parse(savedConfig);
                botConfig = { 
                    ...botConfig, 
                    ...parsed,
                    // Don't overwrite secrets from secure storage
                    token: botConfig.token || parsed.token || '',
                    clientId: botConfig.clientId || parsed.clientId || ''
                };
                
                // Load into UI (except secrets which are already loaded)
                document.getElementById('prefix').value = botConfig.prefix;
                document.getElementById('botStatus').value = botConfig.status;
                document.getElementById('botActivity').value = botConfig.activity;
                
                // Permissions
                document.getElementById('permManageRoles').checked = botConfig.permissions.manageRoles;
                document.getElementById('permManageMessages').checked = botConfig.permissions.manageMessages;
                document.getElementById('permKickMembers').checked = botConfig.permissions.kickMembers;
                document.getElementById('permBanMembers').checked = botConfig.permissions.banMembers;
                document.getElementById('permReadMessages').checked = botConfig.permissions.readMessages;
                document.getElementById('permSendMessages').checked = botConfig.permissions.sendMessages;
                document.getElementById('permEmbedLinks').checked = botConfig.permissions.embedLinks;
                document.getElementById('permAttachFiles').checked = botConfig.permissions.attachFiles;
                
                // Channels
                document.getElementById('logChannel').value = botConfig.channels.log;
                document.getElementById('announceChannel').value = botConfig.channels.announce;
                document.getElementById('welcomeChannel').value = botConfig.channels.welcome;
                document.getElementById('supportChannel').value = botConfig.channels.support;
                
                // Roles
                document.getElementById('customerRole').value = botConfig.roles.customer;
                document.getElementById('premiumRole').value = botConfig.roles.premium;
                document.getElementById('adminRole').value = botConfig.roles.admin;
                document.getElementById('modRole').value = botConfig.roles.mod;
                
                // Automation
                document.getElementById('autoAssignRoles').checked = botConfig.automation.autoAssignRoles;
                document.getElementById('autoWelcome').checked = botConfig.automation.autoWelcome;
                document.getElementById('autoLogPurchases').checked = botConfig.automation.autoLogPurchases;
                document.getElementById('autoUpdateStatus').checked = botConfig.automation.autoUpdateStatus;
                document.getElementById('welcomeMessage').value = botConfig.automation.welcomeMessage;
                document.getElementById('purchaseMessage').value = botConfig.automation.purchaseMessage;
                
                // Webhooks
                document.getElementById('purchaseWebhook').value = botConfig.webhooks.purchase;
                document.getElementById('errorWebhook').value = botConfig.webhooks.error;
                document.getElementById('logWebhook').value = botConfig.webhooks.log;
                
                addLog('Configuration loaded from storage', 'success');
            } catch (error) {
                addLog('Failed to load configuration', 'error');
            }
        }
        
        // Display logs
        displayLogs();
        updateBotStatus();
    }

    function saveConfig() {
        try {
            // Don't save secrets to localStorage
            const configToSave = { ...botConfig };
            // Remove tokens from saved config for security
            configToSave.token = '';
            configToSave.clientId = '';
            
            localStorage.setItem('enmBotConfig', JSON.stringify(configToSave));
        } catch (error) {
            addLog('Failed to save configuration', 'error');
        }
    }

    function addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleString();
        const logEntry = { message, type, timestamp };
        botConfig.logs.unshift(logEntry);
        
        // Keep only last 1000 logs
        if (botConfig.logs.length > 1000) {
            botConfig.logs = botConfig.logs.slice(0, 1000);
        }
        
        saveConfig();
        displayLogs();
    }

    function displayLogs() {
        const systemLogs = document.getElementById('systemLogs');
        const recentLogs = document.getElementById('recentLogs');
        
        // System logs (filtered view)
        let systemLogsHTML = '';
        botConfig.logs.slice(0, 50).forEach(log => {
            systemLogsHTML += `<div class="log-entry ${log.type}">[${log.timestamp}] ${log.message}</div>`;
        });
        systemLogs.innerHTML = systemLogsHTML;
        
        // Recent logs (overview)
        let recentLogsHTML = '';
        botConfig.logs.slice(0, 10).forEach(log => {
            recentLogsHTML += `<div class="log-entry ${log.type}">${log.message}</div>`;
        });
        recentLogs.innerHTML = recentLogsHTML;
    }

    function updateStats() {
        // Get data from localStorage (from main store)
        const transactions = JSON.parse(localStorage.getItem('enm_transactions') || '[]');
        const completedTransactions = transactions.filter(t => t.status === 'completed');
        
        // Calculate stats
        const totalPurchases = completedTransactions.length;
        const revenue = completedTransactions.reduce((sum, t) => sum + parseFloat(t.price), 0);
        
        // Count active keys (simplified)
        let activeKeys = 0;
        const allPurchases = [];
        
        // Get all purchases from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('purchases_')) {
                const purchases = JSON.parse(localStorage.getItem(key) || '[]');
                allPurchases.push(...purchases);
            }
        }
        
        activeKeys = allPurchases.filter(p => {
            if (!p.expiry) return true; // Lifetime keys
            return new Date(p.expiry) > new Date(); // Not expired
        }).length;
        
        // Update UI
        document.getElementById('totalUsers').textContent = Object.keys(localStorage).filter(k => k.startsWith('discord_access_token')).length;
        document.getElementById('totalPurchases').textContent = totalPurchases;
        document.getElementById('activeKeys').textContent = activeKeys;
        document.getElementById('revenue').textContent = `€${revenue.toFixed(2)}`;
        
        document.getElementById('lastChecked').textContent = new Date().toLocaleTimeString();
    }

    function updateBotStatus() {
        const statusIndicator = document.getElementById('botStatusIndicator');
        const statusText = document.getElementById('botStatusText');
        
        if (botConfig.token) {
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'Online (Token configured)';
        } else {
            statusIndicator.className = 'status-indicator offline';
            statusText.textContent = 'Offline (No token)';
        }
    }

    function initEventListeners() {
        // Initialize all event listeners
        updateBotStatus();
        
        // Auto-update stats every 30 seconds
        setInterval(updateStats, 30000);
        
        // Clear session on page unload (optional, for security)
        window.addEventListener('beforeunload', function() {
            // Keep secrets in sessionStorage for now
            // If you want to clear them, uncomment next line:
            // sessionStorage.clear();
        });
    }

    // Initialize
    addLog('Admin panel initialized', 'info');
});