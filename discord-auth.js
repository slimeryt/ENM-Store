// Discord OAuth2 Integration
const DISCORD_CLIENT_ID = '1462431933425516644';
const REDIRECT_URI = window.location.origin || 'https://enm-store.netlify.app';
const DISCORD_API_URL = 'https://discord.com/api/v10';

// Discord OAuth2 URL
const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify%20email`;

class DiscordAuth {
    constructor() {
        this.accessToken = null;
        this.user = null;
        this.guilds = [];
        this.roles = ['customer']; // Default role
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
    }

    bindEvents() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.login());
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    checkAuth() {
        const token = localStorage.getItem('discord_access_token');
        if (token) {
            this.accessToken = token;
            this.getUserInfo();
        } else {
            this.showLogin();
        }
    }

    login() {
        // Store current URL to return after auth
        localStorage.setItem('return_url', window.location.href);
        
        // Redirect to Discord OAuth2
        window.location.href = DISCORD_OAUTH_URL;
    }

    async handleCallback() {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const token = params.get('access_token');
            
            if (token) {
                localStorage.setItem('discord_access_token', token);
                this.accessToken = token;
                await this.getUserInfo();
                
                // Clear hash from URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Redirect to saved URL or home
                const returnUrl = localStorage.getItem('return_url') || '/';
                localStorage.removeItem('return_url');
                window.location.href = returnUrl;
            }
        }
    }

    async getUserInfo() {
        if (!this.accessToken) return;
        
        try {
            const response = await fetch(`${DISCORD_API_URL}/users/@me`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.ok) {
                this.user = await response.json();
                this.showUserProfile();
                this.loadUserPurchases();
                this.setupReferralSystem();
                this.addVerificationBadge();
                this.updateAccountTab();
                this.showWelcomeMessage();
                
                // Check for premium status
                await this.checkPremiumStatus();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Failed to get user info:', error);
            this.logout();
        }
    }

    showUserProfile() {
        const loginBtn = document.getElementById('loginBtn');
        const userProfile = document.getElementById('userProfile');
        const userAvatar = document.getElementById('userAvatar');
        const username = document.getElementById('username');
        
        if (this.user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
            
            const avatarUrl = this.user.avatar 
                ? `https://cdn.discordapp.com/avatars/${this.user.id}/${this.user.avatar}.png?size=256`
                : 'https://cdn.discordapp.com/embed/avatars/0.png';
            
            if (userAvatar) userAvatar.src = avatarUrl;
            if (username) username.textContent = this.user.username;
            
            // Update Discord status in settings
            this.updateDiscordStatus(true);
        }
    }

    showLogin() {
        const loginBtn = document.getElementById('loginBtn');
        const userProfile = document.getElementById('userProfile');
        
        if (loginBtn) loginBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
        
        // Update Discord status in settings
        this.updateDiscordStatus(false);
    }

    updateDiscordStatus(connected) {
        const discordStatus = document.getElementById('discordStatus');
        if (discordStatus) {
            discordStatus.innerHTML = `
                <span class="status-dot ${connected ? 'connected' : 'disconnected'}"></span>
                <span>${connected ? 'Connected' : 'Not Connected'}</span>
            `;
        }
    }

    updateAccountTab() {
        const accountInfo = document.getElementById('accountInfo');
        if (accountInfo && this.user) {
            const avatarUrl = this.user.avatar 
                ? `https://cdn.discordapp.com/avatars/${this.user.id}/${this.user.avatar}.png?size=256`
                : 'https://cdn.discordapp.com/embed/avatars/0.png';
            
            // Check for purchases to determine premium status
            const purchases = JSON.parse(localStorage.getItem(`purchases_${this.user.id}`)) || [];
            const hasLifetime = purchases.some(p => p.type === 'lifetime');
            const totalSpent = purchases.reduce((sum, p) => sum + parseFloat(p.price), 0);
            
            let roleBadges = '<span class="role-badge customer">Customer</span>';
            if (hasLifetime) {
                roleBadges += '<span class="role-badge premium">Premium</span>';
            }
            if (totalSpent >= 10) {
                roleBadges += '<span class="role-badge supporter">Supporter</span>';
            }
            
            accountInfo.innerHTML = `
                <img src="${avatarUrl}" alt="${this.user.username}'s avatar">
                <h3>${this.user.username}</h3>
                <p class="user-discriminator">#${this.user.discriminator || '0000'}</p>
                <p class="user-id">ID: ${this.user.id}</p>
                <div class="user-roles">
                    ${roleBadges}
                </div>
                <div class="account-stats">
                    <div class="stat">
                        <strong>${purchases.length}</strong>
                        <span>Purchases</span>
                    </div>
                    <div class="stat">
                        <strong>€${totalSpent.toFixed(2)}</strong>
                        <span>Total Spent</span>
                    </div>
                </div>
            `;
        }
    }

    logout() {
        localStorage.removeItem('discord_access_token');
        this.accessToken = null;
        this.user = null;
        this.showLogin();
        
        // Clear account info
        const accountInfo = document.getElementById('accountInfo');
        if (accountInfo) {
            accountInfo.innerHTML = '<p>Please log in to view your account</p>';
        }
        
        // Clear purchases list
        const purchasesList = document.querySelector('.purchases-list');
        if (purchasesList) {
            purchasesList.innerHTML = '<p class="empty-state">Please log in to view your purchases</p>';
        }
        
        // Clear keys list
        const keysList = document.querySelector('.keys-list');
        if (keysList) {
            keysList.innerHTML = '<p class="empty-state">Please log in to view your keys</p>';
        }
        
        // Clear referral code
        const referralCodeContainer = document.getElementById('referralCodeContainer');
        if (referralCodeContainer) {
            referralCodeContainer.innerHTML = '<p>Log in to get your referral code</p>';
        }
    }

    async loadUserPurchases() {
        if (!this.user) return;
        
        const purchases = JSON.parse(localStorage.getItem(`purchases_${this.user.id}`)) || [];
        this.updatePurchasesList(purchases);
        this.updateKeysList(purchases.filter(p => p.key));
    }

    updatePurchasesList(purchases) {
        const purchasesList = document.querySelector('.purchases-list');
        if (!purchasesList) return;
        
        if (purchases.length === 0) {
            purchasesList.innerHTML = '<p class="empty-state">No purchases yet</p>';
            return;
        }
        
        purchasesList.innerHTML = purchases.sort((a, b) => new Date(b.date) - new Date(a.date)).map(purchase => `
            <div class="purchase-item">
                <div class="purchase-info">
                    <strong>${purchase.name}</strong>
                    <span>€${purchase.price.toFixed(2)}</span>
                </div>
                <div class="purchase-details">
                    <p>Transaction ID: ${purchase.transactionId}</p>
                    <p>Date: ${new Date(purchase.date).toLocaleDateString()}</p>
                    ${purchase.key ? `<p>Key: <code>${purchase.key}</code></p>` : ''}
                </div>
            </div>
        `).join('');
    }

    updateKeysList(keys) {
        const keysList = document.querySelector('.keys-list');
        if (!keysList) return;
        
        if (keys.length === 0) {
            keysList.innerHTML = '<p class="empty-state">No active keys</p>';
            return;
        }
        
        keysList.innerHTML = keys.map(key => {
            const isExpired = key.expiry && new Date(key.expiry) < new Date();
            return `
                <div class="key-item ${isExpired ? 'expired' : 'active'}">
                    <div class="key-info">
                        <strong>${key.name}</strong>
                        <code class="key-code">${key.key}</code>
                    </div>
                    <div class="key-status">
                        <span class="status-badge ${isExpired ? 'expired' : 'active'}">
                            ${isExpired ? 'Expired' : 'Active'}
                        </span>
                        <span class="key-expiry">
                            ${key.expiry ? `Expires: ${new Date(key.expiry).toLocaleDateString()}` : 'Lifetime'}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async recordPurchase(purchaseData) {
        if (!this.user) return;
        
        // Get existing purchases
        let purchases = JSON.parse(localStorage.getItem(`purchases_${this.user.id}`)) || [];
        
        // Check if this transaction already exists
        const existingIndex = purchases.findIndex(p => p.transactionId === purchaseData.transactionId);
        
        if (existingIndex === -1) {
            // Add new purchase
            purchases.push({
                transactionId: purchaseData.transactionId,
                name: purchaseData.name,
                price: parseFloat(purchaseData.price),
                key: purchaseData.key,
                type: purchaseData.type,
                date: new Date().toISOString(),
                active: true,
                expiry: purchaseData.type === 'lifetime' ? null : this.calculateExpiry(purchaseData.type)
            });
            
            // Save back to localStorage
            localStorage.setItem(`purchases_${this.user.id}`, JSON.stringify(purchases));
            
            // Update UI
            this.updatePurchasesList(purchases);
            this.updateKeysList(purchases.filter(p => p.key));
            
            // Update account tab with new stats
            this.updateAccountTab();
            
            // Check for premium status
            await this.checkPremiumStatus();
            
            // Show purchase notification
            this.showPurchaseNotification(purchaseData);
        }
    }

    calculateExpiry(type) {
        const now = new Date();
        switch(type) {
            case '24h': return new Date(now.setDate(now.getDate() + 1)).toISOString();
            case '7d': return new Date(now.setDate(now.getDate() + 7)).toISOString();
            case '30d': return new Date(now.setDate(now.getDate() + 30)).toISOString();
            default: return null;
        }
    }

    showPurchaseNotification(purchaseData) {
        const notification = document.createElement('div');
        notification.className = 'discord-notification';
        notification.innerHTML = `
            <div class="notification-header">
                <i class="fas fa-key"></i>
                <h4>Purchase Recorded!</h4>
                <button class="close-notification">&times;</button>
            </div>
            <div class="notification-body">
                <p>Your purchase of <strong>${purchaseData.name}</strong> has been saved to your account.</p>
                <p>Key: <code>${purchaseData.key}</code></p>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    async checkPremiumStatus() {
        if (!this.user) return;
        
        const purchases = JSON.parse(localStorage.getItem(`purchases_${this.user.id}`)) || [];
        const hasLifetime = purchases.some(p => p.type === 'lifetime');
        
        if (hasLifetime && !this.roles.includes('premium')) {
            this.roles.push('premium');
            this.addPremiumFeatures();
        }
    }

    addPremiumFeatures() {
        // Add premium discount badges to shop items
        const keyCards = document.querySelectorAll('.key-card');
        keyCards.forEach(card => {
            const priceElement = card.querySelector('.key-price');
            if (priceElement) {
                const originalPrice = parseFloat(priceElement.textContent.replace('€', ''));
                const discountedPrice = (originalPrice * 0.9).toFixed(2); // 10% discount
                
                // Check if discount badge already exists
                if (!card.querySelector('.premium-discount')) {
                    const discountBadge = document.createElement('div');
                    discountBadge.className = 'premium-discount';
                    discountBadge.innerHTML = `
                        <i class="fas fa-crown"></i>
                        <span>Premium Price: €${discountedPrice}</span>
                    `;
                    priceElement.parentElement.appendChild(discountBadge);
                }
            }
        });
        
        // Update user roles in account tab
        this.updateAccountTab();
    }

    setupReferralSystem() {
        if (!this.user) return;
        
        // Generate referral code for user
        const referralCode = `ENM-${this.user.id.substring(0, 8).toUpperCase()}`;
        localStorage.setItem(`referral_${this.user.id}`, referralCode);
        
        // Update referral section
        this.updateReferralSection(referralCode);
    }

    updateReferralSection(referralCode) {
        const referralCodeContainer = document.getElementById('referralCodeContainer');
        if (!referralCodeContainer) return;
        
        // Get referral stats (in real app, this would come from backend)
        const referredCount = 0;
        const earnedAmount = 0.00;
        
        referralCodeContainer.innerHTML = `
            <div class="referral-code">
                <strong>Your Code:</strong>
                <code>${referralCode}</code>
                <button class="copy-referral" onclick="navigator.clipboard.writeText('${referralCode}')">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
        `;
        
        // Update stats
        const referredCountElement = document.getElementById('referredCount');
        const earnedAmountElement = document.getElementById('earnedAmount');
        
        if (referredCountElement) referredCountElement.textContent = referredCount;
        if (earnedAmountElement) earnedAmountElement.textContent = `€${earnedAmount.toFixed(2)}`;
    }

    addVerificationBadge() {
        if (!this.user) return;
        
        const purchases = JSON.parse(localStorage.getItem(`purchases_${this.user.id}`)) || [];
        const totalSpent = purchases.reduce((sum, p) => sum + p.price, 0);
        
        if (totalSpent >= 20 || purchases.some(p => p.type === 'lifetime')) {
            const badge = document.createElement('span');
            badge.className = 'verified-badge';
            badge.innerHTML = '<i class="fas fa-shield-alt"></i> Verified Buyer';
            badge.title = 'Trusted customer with multiple purchases';
            
            const userProfile = document.getElementById('userProfile');
            if (userProfile && !userProfile.querySelector('.verified-badge')) {
                userProfile.insertBefore(badge, userProfile.querySelector('#logoutBtn'));
            }
        }
    }

    showWelcomeMessage() {
        if (!this.user) return;
        
        const welcomed = localStorage.getItem(`welcomed_${this.user.id}`);
        if (!welcomed) {
            const notification = document.createElement('div');
            notification.className = 'discord-notification';
            notification.innerHTML = `
                <div class="notification-header">
                    <i class="fab fa-discord"></i>
                    <h4>Welcome to ENM Store! 👋</h4>
                    <button class="close-notification">&times;</button>
                </div>
                <div class="notification-body">
                    <p>Thanks for connecting your Discord account, <strong>${this.user.username}</strong>!</p>
                    <p>You can now track purchases, access your keys, and enjoy exclusive features.</p>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            notification.querySelector('.close-notification').addEventListener('click', () => {
                notification.remove();
            });
            
            localStorage.setItem(`welcomed_${this.user.id}`, 'true');
            
            // Auto-remove after 15 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 15000);
        }
    }
}

// Initialize Discord Auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.discordAuth = new DiscordAuth();
    
    // Handle OAuth2 callback if hash is present
    if (window.location.hash.includes('access_token')) {
        window.discordAuth.handleCallback();
    }
});