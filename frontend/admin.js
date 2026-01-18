// In your frontend admin.js, make sure this is at the top:
const API_BASE_URL = 'http://localhost:3001/api';
let authToken = null;

// Update the login function:
loginAdminBtn.addEventListener('click', async function() {
    const password = adminPasswordInput.value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            const data = await response.json();
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            showDashboard();
        } else {
            showLoginError();
        }
    } catch (error) {
        showLoginError('Connection failed. Is backend running?');
    }
});