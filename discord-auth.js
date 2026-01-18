// Discord OAuth2 Integration
const DISCORD_CLIENT_ID = '1462431933425516644';
const REDIRECT_URI = 'https://enm-store.netlify.app';
const DISCORD_API_URL = 'https://discord.com/api/v10';

// Discord OAuth2 URLs
const DISCORD_OAUTH_URL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=identify%20email`;

class DiscordAuth {
    constructor() {
        this.accessToken = null;
        this.user = null;
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
            
            // Update account tab
            this.updateAccountTab();
        }
    }

    showLogin() {
        const loginBtn = document.getElementById('loginBtn');
        const userProfile = document.getElementById('userProfile');
        
        if (loginBtn) loginBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
    }

    updateAccountTab() {
        const accountInfo = document.getElementById('accountInfo');
        if (accountInfo && this.user) {
            accountInfo.innerHTML = `
                <img src="${this.user.avatar ? `https://cdn.discordapp.com/avatars/${this.user.id}/${this.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}" 
                     alt="${this.user.username}'s avatar">
                <h3>${this.user.username}</h3>
                <p>${this.user.email || 'No email provided'}</p>
                <div class="account-stats">
                    <div class="stat">
                        <strong>0</strong>
                        <span>Purchases</span>
                    </div>
                    <div class="stat">
                        <strong>0</strong>
                        <span>Active Keys</span>
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
    }

    async loadUserPurchases() {
        // In a real application, this would fetch from your backend
        // For now, we'll use localStorage
        const purchases = JSON.parse(localStorage.getItem(`purchases_${this.user.id}`)) || [];
        const keys = JSON.parse(localStorage.getItem(`keys_${this.user.id}`)) || [];
        
        this.updatePurchasesList(purchases);
        this.updateKeysList(keys);
    }

    updatePurchasesList(purchases) {
        const purchasesList = document.querySelector('.purchases-list');
        if (!purchasesList) return;
        
        if (purchases.length === 0) {
            purchasesList.innerHTML = '<p class="empty-state">No purchases yet</p>';
            return;
        }
        
        purchasesList.innerHTML = purchases.map(purchase => `
            <div class="purchase-item">
                <div class="purchase-info">
                    <strong>${purchase.name}</strong>
                    <span>€${purchase.price.toFixed(2)}</span>
                </div>
                <div class="purchase-date">
                    ${new Date(purchase.date).toLocaleDateString()}
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
        
        keysList.innerHTML = keys.map(key => `
            <div class="key-item ${key.active ? 'active' : 'expired'}">
                <div class="key-info">
                    <strong>${key.name}</strong>
                    <code class="key-code">${key.code}</code>
                </div>
                <div class="key-status">
                    <span class="status-badge ${key.active ? 'active' : 'expired'}">
                        ${key.active ? 'Active' : 'Expired'}
                    </span>
                    <span class="key-expiry">
                        ${key.expiry ? `Expires: ${new Date(key.expiry).toLocaleDateString()}` : 'Lifetime'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    async recordPurchase(purchaseData) {
        if (!this.user) {
            alert('Please log in to complete your purchase');
            return;
        }
        
        const purchase = {
            ...purchaseData,
            date: new Date().toISOString(),
            userId: this.user.id,
            status: 'completed'
        };
        
        // Generate a key
        const key = {
            name: purchaseData.name,
            type: purchaseData.type,
            code: this.generateKeyCode(),
            date: new Date().toISOString(),
            active: true,
            expiry: purchaseData.type === 'lifetime' ? null : this.calculateExpiry(purchaseData.type)
        };
        
        // Save to localStorage (in real app, send to backend)
        const purchases = JSON.parse(localStorage.getItem(`purchases_${this.user.id}`)) || [];
        const keys = JSON.parse(localStorage.getItem(`keys_${this.user.id}`)) || [];
        
        purchases.push(purchase);
        keys.push(key);
        
        localStorage.setItem(`purchases_${this.user.id}`, JSON.stringify(purchases));
        localStorage.setItem(`keys_${this.user.id}`, JSON.stringify(keys));
        
        // Update UI
        this.updatePurchasesList(purchases);
        this.updateKeysList(keys);
        
        // Show success message
        this.showKeyModal(key);
    }

    generateKeyCode() {
        return 'ENM-' + Array.from({length: 4}, () => 
            Math.random().toString(36).substring(2, 6).toUpperCase()
        ).join('-');
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

    showKeyModal(key) {
        const modal = document.createElement('div');
        modal.className = 'key-modal';
        modal.innerHTML = `
            <div class="key-modal-content">
                <h3>Purchase Successful! 🎉</h3>
                <p>Your key has been generated and saved to your account.</p>
                <div class="key-display">
                    <strong>Key:</strong>
                    <code>${key.code}</code>
                </div>
                <p class="key-note">This key has also been saved to your account dashboard.</p>
                <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Initialize Discord Auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.discordAuth = new DiscordAuth();
    
    // Handle OAuth2 callback if hash is present
    if (window.location.hash.includes('access_token')) {
        window.discordAuth.handleCallback();
    }
    
    // Add style for key modal
    const style = document.createElement('style');
    style.textContent = `
        .key-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1003;
        }
        
        .key-modal-content {
            background: var(--card-bg);
            padding: 2rem;
            border-radius: 20px;
            max-width: 500px;
            text-align: center;
        }
        
        .key-display {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
            font-family: monospace;
            font-size: 1.2rem;
        }
        
        .key-display code {
            color: var(--accent-color);
            font-weight: bold;
        }
        
        .key-note {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-top: 1rem;
        }
        
        .key-modal-content button {
            background: var(--gradient-2);
            color: white;
            border: none;
            padding: 0.8rem 2rem;
            border-radius: 10px;
            cursor: pointer;
            margin-top: 1rem;
        }
        
        .empty-state {
            text-align: center;
            padding: 2rem;
            color: var(--text-secondary);
        }
        
        .purchase-item, .key-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 0.5rem;
        }
        
        .key-code {
            background: rgba(0, 217, 255, 0.1);
            padding: 0.2rem 0.5rem;
            border-radius: 5px;
            font-family: monospace;
        }
        
        .status-badge {
            padding: 0.2rem 0.5rem;
            border-radius: 5px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .status-badge.active {
            background: rgba(67, 181, 129, 0.2);
            color: #43b581;
        }
        
        .status-badge.expired {
            background: rgba(240, 71, 71, 0.2);
            color: #f04747;
        }
    `;
    document.head.appendChild(style);
});

// Update PayPal payment to record purchase
document.addEventListener('DOMContentLoaded', () => {
    const proceedBtn = document.getElementById('proceedToPayPal');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', async function() {
            const price = document.getElementById('checkoutTotal').textContent.replace('€', '');
            const name = document.getElementById('checkoutItemName').textContent;
            const type = document.querySelector('.checkout-modal').getAttribute('data-purchase-type');
            
            // Redirect to PayPal
            const paypalUrl = `https://www.paypal.me/slimeryt/${price}EUR`;
            const note = `ENM Tech - ${name}`;
            const encodedNote = encodeURIComponent(note);
            
            window.open(`${paypalUrl}?locale.x=en_US&item_name=${encodedNote}`, '_blank');
            
            // Record purchase (simulate)
            if (window.discordAuth && window.discordAuth.user) {
                setTimeout(() => {
                    window.discordAuth.recordPurchase({
                        name,
                        price: parseFloat(price),
                        type
                    });
                    
                    document.querySelector('.checkout-modal').classList.remove('active');
                }, 1000);
            }
        });
    }
});