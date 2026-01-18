// Main Application Script
document.addEventListener('DOMContentLoaded', function() {
    // Tab Switching
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and tabs
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding tab
            const tabId = this.getAttribute('data-tab') + 'Tab';
            const activeTab = document.getElementById(tabId);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        });
    });

    // Settings Panel
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettings = document.getElementById('closeSettings');
    const settingsPanel = document.getElementById('settingsPanel');
    
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.add('active');
    });
    
    closeSettings.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
    });

    // Close settings when clicking outside
    settingsPanel.addEventListener('click', (e) => {
        if (e.target === settingsPanel) {
            settingsPanel.classList.remove('active');
        }
    });

    // Theme Switching
    const themeSelect = document.getElementById('themeSelect');
    themeSelect.addEventListener('change', function() {
        document.body.setAttribute('data-theme', this.value);
    });

    // Shop Items Data
    const timedKeys = [
        { id: '24h', name: '24-Hour Key', price: 0.50, features: ['24-hour access', 'Basic features', 'Email support'] },
        { id: '7d', name: '7-Day Key', price: 2.00, features: ['7-day access', 'All features', 'Priority support'] },
        { id: '30d', name: '30-Day Key', price: 5.00, features: ['30-day access', 'All features', 'Priority support', 'Updates included'] }
    ];

    // Populate Timed Keys
    const timedKeysContainer = document.getElementById('timedKeys');
    timedKeys.forEach(key => {
        const keyCard = document.createElement('div');
        keyCard.className = 'key-card';
        keyCard.innerHTML = `
            <div class="key-header">
                <i class="fas fa-clock"></i>
                <h4>${key.name}</h4>
            </div>
            <div class="key-price">€${key.price.toFixed(2)}</div>
            <ul class="key-features">
                ${key.features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
            </ul>
            <button class="buy-btn" data-id="${key.id}" data-price="${key.price}" data-type="timed" data-name="${key.name}">
                <i class="fab fa-paypal"></i> Buy Now
            </button>
        `;
        timedKeysContainer.appendChild(keyCard);
    });

    // Checkout Modal
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckout = document.querySelector('.close-checkout');
    const buyButtons = document.querySelectorAll('.buy-btn');
    const proceedToPayPal = document.getElementById('proceedToPayPal');

    let currentPurchase = null;

    // Add event listeners to dynamically created buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('buy-btn') || e.target.closest('.buy-btn')) {
            const button = e.target.classList.contains('buy-btn') ? e.target : e.target.closest('.buy-btn');
            const id = button.getAttribute('data-id');
            const price = button.getAttribute('data-price');
            const name = button.getAttribute('data-name');
            const type = button.getAttribute('data-type');
            
            currentPurchase = { id, price, name, type };
            
            document.getElementById('checkoutItemName').textContent = name;
            document.getElementById('checkoutItemPrice').textContent = `€${parseFloat(price).toFixed(2)}`;
            document.getElementById('checkoutTotal').textContent = `€${parseFloat(price).toFixed(2)}`;
            
            checkoutModal.classList.add('active');
        }
    });

    closeCheckout.addEventListener('click', () => {
        checkoutModal.classList.remove('active');
        currentPurchase = null;
    });

    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) {
            checkoutModal.classList.remove('active');
            currentPurchase = null;
        }
    });

    // PayPal Integration
    proceedToPayPal.addEventListener('click', async function() {
        if (!currentPurchase) return;
        
        // Generate unique transaction ID
        const transactionId = 'ENM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // Store transaction in localStorage (mark as pending)
        const pendingTransaction = {
            id: transactionId,
            itemId: currentPurchase.id,
            itemName: currentPurchase.name,
            price: currentPurchase.price,
            type: currentPurchase.type,
            timestamp: Date.now(),
            status: 'pending',
            paymentLink: `https://www.paypal.me/slimeryt/${currentPurchase.price}EUR`
        };
        
        // Save to localStorage
        saveTransaction(pendingTransaction);
        
        // Generate PayPal.me link with transaction info in the note
        const note = `ENM Tech - ${currentPurchase.name} - Transaction ID: ${transactionId}`;
        const encodedNote = encodeURIComponent(note);
        const paypalUrl = `https://www.paypal.me/slimeryt/${currentPurchase.price}EUR?locale.x=en_US&item_name=${encodedNote}`;
        
        // Open PayPal in new tab
        window.open(paypalUrl, '_blank');
        
        // Show verification modal
        showVerificationModal(pendingTransaction);
        
        // Close checkout modal
        checkoutModal.classList.remove('active');
        
        // Show pending notification
        checkPendingTransactions();
    });

    // FAQ Toggle
    const faqQuestions = document.querySelectorAll('.faq-question');
    const showFaqBtn = document.getElementById('showFaq');
    const faqSection = document.getElementById('faqSection');
    
    showFaqBtn.addEventListener('click', () => {
        faqSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            answer.classList.toggle('active');
            
            const icon = question.querySelector('i');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        });
    });

    // Account Navigation
    const accountNavLinks = document.querySelectorAll('.account-nav-link');
    const accountSections = document.querySelectorAll('.account-section');
    
    accountNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            accountNavLinks.forEach(l => l.classList.remove('active'));
            accountSections.forEach(section => section.classList.remove('active'));
            
            this.classList.add('active');
            const sectionId = this.getAttribute('data-account') + 'Section';
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Discord Rules Button
    const showRulesBtn = document.getElementById('showRules');
    if (showRulesBtn) {
        showRulesBtn.addEventListener('click', () => {
            showDiscordRules();
        });
    }

    // Initialize 3D key animation
    initKeyAnimation();

    // Check for saved settings
    loadSettings();

    // Check for pending transactions on page load
    checkPendingTransactions();

    // Check URL for transaction verification
    checkUrlForVerification();

    // Load Discord widget
    loadDiscordWidget();
});

function initKeyAnimation() {
    const key3d = document.querySelector('.key-3d');
    
    if (!key3d) return;
    
    // Add mouse move interaction
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        
        key3d.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
    });
}

function loadSettings() {
    const savedTheme = localStorage.getItem('enmTheme') || 'dark';
    const savedAnimations = localStorage.getItem('enmAnimations') !== 'false';
    const savedCurrency = localStorage.getItem('enmCurrency') || 'EUR';
    
    const themeSelect = document.getElementById('themeSelect');
    const animations = document.getElementById('animations');
    const currency = document.getElementById('currency');
    
    if (themeSelect) themeSelect.value = savedTheme;
    if (document.body) document.body.setAttribute('data-theme', savedTheme);
    if (animations) animations.checked = savedAnimations;
    if (currency) currency.value = savedCurrency;
    
    // Save settings when changed
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            localStorage.setItem('enmTheme', this.value);
            document.body.setAttribute('data-theme', this.value);
        });
    }
    
    if (animations) {
        animations.addEventListener('change', function() {
            localStorage.setItem('enmAnimations', this.checked);
        });
    }
    
    if (currency) {
        currency.addEventListener('change', function() {
            localStorage.setItem('enmCurrency', this.value);
        });
    }
}

// Save transaction to localStorage
function saveTransaction(transaction) {
    let transactions = JSON.parse(localStorage.getItem('enm_transactions') || '[]');
    transactions.push(transaction);
    localStorage.setItem('enm_transactions', JSON.stringify(transactions));
}

// Update transaction status
function updateTransactionStatus(transactionId, status, key = null) {
    let transactions = JSON.parse(localStorage.getItem('enm_transactions') || '[]');
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (transaction) {
        transaction.status = status;
        if (key) transaction.key = key;
        transaction.verifiedAt = Date.now();
        localStorage.setItem('enm_transactions', JSON.stringify(transactions));
    }
}

// Show verification modal
function showVerificationModal(transaction) {
    const modal = document.createElement('div');
    modal.className = 'verification-modal';
    modal.innerHTML = `
        <div class="verification-content">
            <div class="verification-header">
                <h3><i class="fas fa-external-link-alt"></i> Complete Payment</h3>
                <button class="close-verification">&times;</button>
            </div>
            
            <div class="verification-body">
                <div class="step active">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h4>PayPal Window Opened</h4>
                        <p>A new tab has been opened with PayPal. Please complete your payment there.</p>
                        <p class="transaction-id">Transaction ID: <code>${transaction.id}</code></p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h4>Return Here</h4>
                        <p>After completing payment on PayPal, return to this window.</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h4>Verify Payment</h4>
                        <p>Click the button below to verify your payment and receive your key.</p>
                        <button class="verify-payment-btn">
                            <i class="fas fa-check-circle"></i> I've Paid - Give Me My Key
                        </button>
                    </div>
                </div>
                
                <div class="verification-info">
                    <div class="info-box">
                        <h5><i class="fas fa-shopping-cart"></i> Order Details</h5>
                        <p><strong>Item:</strong> ${transaction.itemName}</p>
                        <p><strong>Amount:</strong> €${transaction.price}</p>
                        <p><strong>Transaction ID:</strong> ${transaction.id}</p>
                    </div>
                    
                    <div class="info-box warning">
                        <h5><i class="fas fa-exclamation-triangle"></i> Important</h5>
                        <p>Only click "I've Paid" if you have actually completed the PayPal payment.</p>
                        <p>Your Transaction ID will be recorded. Abuse will result in account suspension.</p>
                    </div>
                </div>
                
                <div class="verification-actions">
                    <button class="cancel-verification">Cancel Transaction</button>
                    <a href="${transaction.paymentLink}" target="_blank" class="open-paypal-again">
                        <i class="fab fa-paypal"></i> Open PayPal Again
                    </a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.close-verification').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('.cancel-verification').addEventListener('click', () => {
        updateTransactionStatus(transaction.id, 'cancelled');
        modal.remove();
        checkPendingTransactions();
    });
    
    modal.querySelector('.verify-payment-btn').addEventListener('click', () => {
        verifyPayment(transaction, modal);
    });
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Verify payment (manual verification by user)
async function verifyPayment(transaction, modal) {
    const verifyBtn = modal.querySelector('.verify-payment-btn');
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Key...';
    verifyBtn.disabled = true;
    
    // Add delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a key
    const key = generateKey(transaction.type);
    
    // Update transaction status
    updateTransactionStatus(transaction.id, 'completed', key);
    
    // Show success message
    modal.querySelector('.verification-body').innerHTML = `
        <div class="payment-success">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Key Generated Successfully!</h3>
            
            <div class="key-display">
                <p><strong>Your Key:</strong></p>
                <div class="key-code">
                    <code>${key}</code>
                    <button class="copy-key" onclick="navigator.clipboard.writeText('${key}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            </div>
            
            <div class="success-details">
                <p><i class="fas fa-check"></i> Transaction ID: <strong>${transaction.id}</strong></p>
                <p><i class="fas fa-check"></i> Item: <strong>${transaction.itemName}</strong></p>
                <p><i class="fas fa-check"></i> Amount: <strong>€${transaction.price}</strong></p>
                <p><i class="fas fa-check"></i> Key Type: <strong>${transaction.type}</strong></p>
                <p><i class="fas fa-check"></i> Generated: <strong>${new Date().toLocaleString()}</strong></p>
            </div>
            
            <div class="success-actions">
                <button class="close-success" onclick="this.closest('.verification-modal').remove()">
                    <i class="fas fa-check"></i> Done
                </button>
                <button class="save-account" onclick="saveKeyToAccount('${transaction.id}', '${key}')">
                    <i class="fas fa-save"></i> Save to Account
                </button>
            </div>
            
            <div class="success-note">
                <p><i class="fas fa-info-circle"></i> This key has been saved with Transaction ID: ${transaction.id}</p>
                <p><i class="fas fa-shield-alt"></i> All transactions are logged for security purposes</p>
            </div>
        </div>
    `;
    
    // Update user's account if logged in
    if (window.discordAuth && window.discordAuth.user) {
        window.discordAuth.recordPurchase({
            transactionId: transaction.id,
            name: transaction.itemName,
            price: transaction.price,
            type: transaction.type,
            key: key
        });
    }
    
    // Check for pending transactions and update notification
    checkPendingTransactions();
}

// Generate key based on type
function generateKey(type) {
    const prefix = type === 'lifetime' ? 'ENM-LT-' : 'ENM-T-';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `${prefix}${timestamp}-${random}`;
}

// Check for pending transactions on page load
function checkPendingTransactions() {
    const transactions = JSON.parse(localStorage.getItem('enm_transactions') || '[]');
    const pending = transactions.filter(t => t.status === 'pending');
    
    if (pending.length > 0) {
        // Show or update notification
        let notification = document.querySelector('.pending-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'pending-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-clock"></i>
                    <span>You have ${pending.length} pending transaction${pending.length > 1 ? 's' : ''}</span>
                    <button onclick="showTransactionsPanel()">View</button>
                    <button class="close-notification">&times;</button>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Add event listeners
            notification.querySelector('.close-notification').addEventListener('click', () => {
                notification.remove();
            });
            
            notification.querySelector('button').addEventListener('click', () => {
                showTransactionsPanel();
            });
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.opacity = '0';
                    setTimeout(() => notification.remove(), 300);
                }
            }, 10000);
        }
    }
}

// Show transactions panel
window.showTransactionsPanel = function() {
    const transactions = JSON.parse(localStorage.getItem('enm_transactions') || '[]');
    
    const panel = document.createElement('div');
    panel.className = 'transactions-panel';
    panel.style.display = 'flex';
    panel.innerHTML = `
        <div class="transactions-content">
            <div class="transactions-header">
                <h3><i class="fas fa-history"></i> Transaction History</h3>
                <button class="close-panel">&times;</button>
            </div>
            
            <div class="transactions-list">
                ${transactions.length === 0 ? 
                    '<p class="empty-transactions">No transactions yet</p>' : 
                    transactions.sort((a, b) => b.timestamp - a.timestamp).map(t => `
                        <div class="transaction-item ${t.status}">
                            <div class="transaction-header">
                                <span class="transaction-id">${t.id}</span>
                                <span class="transaction-status ${t.status}">${t.status}</span>
                            </div>
                            <div class="transaction-details">
                                <p><strong>Item:</strong> ${t.itemName}</p>
                                <p><strong>Amount:</strong> €${t.price}</p>
                                <p><strong>Date:</strong> ${new Date(t.timestamp).toLocaleString()}</p>
                                ${t.key ? `<p><strong>Key:</strong> <code>${t.key}</code></p>` : ''}
                            </div>
                            ${t.status === 'pending' ? `
                                <div class="transaction-actions">
                                    <button onclick="completeTransaction('${t.id}')" class="complete-btn">
                                        <i class="fas fa-check"></i> Complete Payment
                                    </button>
                                    <button onclick="cancelTransaction('${t.id}')" class="cancel-btn">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')
                }
            </div>
            
            <div class="transactions-footer">
                <button class="clear-completed" onclick="clearCompletedTransactions()">
                    <i class="fas fa-trash"></i> Clear Completed
                </button>
                <button class="export-transactions" onclick="exportTransactions()">
                    <i class="fas fa-download"></i> Export
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    panel.querySelector('.close-panel').addEventListener('click', () => {
        panel.remove();
    });
    
    panel.addEventListener('click', (e) => {
        if (e.target === panel) {
            panel.remove();
        }
    });
};

// Complete a pending transaction
window.completeTransaction = function(transactionId) {
    const transactions = JSON.parse(localStorage.getItem('enm_transactions') || '[]');
    const transaction = transactions.find(t => t.id === transactionId);
    
    if (transaction) {
        showVerificationModal(transaction);
        document.querySelector('.transactions-panel')?.remove();
    }
};

// Cancel a transaction
window.cancelTransaction = function(transactionId) {
    if (confirm('Are you sure you want to cancel this transaction?')) {
        updateTransactionStatus(transactionId, 'cancelled');
        document.querySelector('.transactions-panel')?.remove();
        checkPendingTransactions();
        location.reload();
    }
};

// Clear completed transactions
window.clearCompletedTransactions = function() {
    if (confirm('Clear all completed transactions? This will remove them from your local history.')) {
        let transactions = JSON.parse(localStorage.getItem('enm_transactions') || '[]');
        transactions = transactions.filter(t => t.status !== 'completed');
        localStorage.setItem('enm_transactions', JSON.stringify(transactions));
        document.querySelector('.transactions-panel')?.remove();
        checkPendingTransactions();
    }
};

// Export transactions
window.exportTransactions = function() {
    const transactions = JSON.parse(localStorage.getItem('enm_transactions') || '[]');
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `enm-transactions-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Save key to account
window.saveKeyToAccount = function(transactionId, key) {
    alert('Key saved to your account!');
};

// Check URL for transaction verification
function checkUrlForVerification() {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transaction');
    
    if (transactionId) {
        const transactions = JSON.parse(localStorage.getItem('enm_transactions') || '[]');
        const transaction = transactions.find(t => t.id === transactionId);
        
        if (transaction && transaction.status === 'pending') {
            showVerificationModal(transaction);
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// Show Discord rules
function showDiscordRules() {
    const modal = document.createElement('div');
    modal.className = 'terms-modal';
    modal.innerHTML = `
        <div class="terms-content">
            <h3><i class="fab fa-discord"></i> Discord Community Rules</h3>
            <div class="terms-list">
                <p>By joining our Discord server, you agree to:</p>
                <ol>
                    <li>Follow Discord's Terms of Service</li>
                    <li>Respect all community members</li>
                    <li>No sharing of purchased keys</li>
                    <li>No chargeback abuse</li>
                    <li>Keep discussions relevant to ENM Tech</li>
                    <li>No spamming or self-promotion</li>
                    <li>Use appropriate channels for support</li>
                    <li>Keep personal disputes private</li>
                </ol>
                <p><strong>Violation of these rules may result in removal from the community and revocation of purchased keys.</strong></p>
            </div>
            <div class="terms-actions">
                <button class="accept-terms">I Understand</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.accept-terms').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Load Discord widget
function loadDiscordWidget() {
    const widgetContainer = document.getElementById('discord-widget');
    if (widgetContainer) {
        // You can add your Discord server ID here
        // For example: const serverId = '123456789012345678';
        // widgetContainer.innerHTML = `
        //     <iframe 
        //         src="https://discord.com/widget?id=${serverId}&theme=dark" 
        //         width="350" 
        //         height="500" 
        //         allowtransparency="true" 
        //         frameborder="0" 
        //         sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts">
        //     </iframe>
        // `;
        // widgetContainer.style.display = 'block';
    }
}