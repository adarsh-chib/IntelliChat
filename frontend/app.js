const API_BASE = 'http://localhost:2000';

const state = {
    token: localStorage.getItem('token') || null,
    userName: localStorage.getItem('userName') || null,
    tokenBalance: parseInt(localStorage.getItem('tokenBalance')) || 0,
    currentChatId: null,
    abortController: null,
    isLoginMode: true
};

// Selectors
const authView = document.getElementById('auth-view');
const chatView = document.getElementById('chat-view');
const authBtn = document.getElementById('auth-btn');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const toggleAuthLink = document.getElementById('toggle-auth-link');
const toggleText = document.getElementById('toggle-text');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatHistoryList = document.getElementById('chat-history');
const newChatBtn = document.getElementById('new-chat-btn');
const deleteAllBtn = document.getElementById('delete-all-btn');
const memoryStatus = document.getElementById('memory-status');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');
const tokenBalanceDisplay = document.getElementById('token-balance');
const tokenModal = document.getElementById('token-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

function init() {
    if (state.token) {
        if (isTokenExpired(state.token)) {
            logout();
        } else {
            userDisplay.innerText = state.userName || 'User';
            tokenBalanceDisplay.innerText = state.tokenBalance;
            showChatView();
            loadChatHistory();
            startTokenCheck();
        }
    }
}

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true;
    }
}

function startTokenCheck() {
    // Check every minute if token is expired
    setInterval(() => {
        if (state.token && isTokenExpired(state.token)) {
            alert('Session expired. Please login again.');
            logout();
        }
    }, 60000);
}

function logout() {
    state.token = null;
    state.currentChatId = null;
    state.userName = null;
    state.tokenBalance = 0;
    
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('tokenBalance');

    authView.classList.remove('hidden');
    chatView.classList.add('hidden');
    
    // Clear UI for a fresh start
    messagesContainer.innerHTML = '<div class="welcome-message"><h1>How can I help you today?</h1></div>';
    chatHistoryList.innerHTML = '';
    userDisplay.innerText = 'User';
    tokenBalanceDisplay.innerText = '0';
    
    // Clear inputs
    emailInput.value = '';
    passwordInput.value = '';
    nameInput.value = '';
}

logoutBtn.addEventListener('click', logout);

closeModalBtn.addEventListener('click', () => {
    tokenModal.classList.add('hidden');
});

function showTokenModal() {
    tokenModal.classList.remove('hidden');
    // Basic calculation for "Midnight" reset
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    document.getElementById('reset-time').innerText = `${hours}h ${minutes}m`;
}

toggleAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    state.isLoginMode = !state.isLoginMode;
    
    if (state.isLoginMode) {
        authTitle.innerText = 'Welcome Back';
        authSubtitle.innerText = 'Login to access your persistent AI memory';
        authBtn.innerText = 'Enter Workspace';
        toggleText.innerText = "Don't have an account?";
        toggleAuthLink.innerText = 'Sign Up';
        nameInput.classList.add('hidden');
    } else {
        authTitle.innerText = 'Create Account';
        authSubtitle.innerText = 'Start your journey with persistent AI memory';
        authBtn.innerText = 'Join IntelliChat';
        toggleText.innerText = "Already have an account?";
        toggleAuthLink.innerText = 'Login';
        nameInput.classList.remove('hidden');
    }
});

async function securedFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (state.token) {
        options.headers['Authorization'] = `Bearer ${state.token}`;
    }

    const res = await fetch(url, options);
    
    if (res.status === 401) {
        logout();
        throw new Error('Unauthorized');
    }
    
    return res;
}

authBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const name = nameInput.value;

    const endpoint = state.isLoginMode ? '/user/login' : '/user/create';
    const body = state.isLoginMode ? { email, password } : { name, email, password };

    authBtn.disabled = true;
    authBtn.innerText = 'Processing...';

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.success) {
            if (state.isLoginMode) {
                state.token = data.data.tokenAccess; 
                state.userName = data.data.userWithoutPassword.name;
                state.tokenBalance = data.data.userWithoutPassword.tokenBalance || 0;

                localStorage.setItem('token', state.token);
                localStorage.setItem('userName', state.userName);
                localStorage.setItem('tokenBalance', state.tokenBalance);

                userDisplay.innerText = state.userName || 'User';
                tokenBalanceDisplay.innerText = state.tokenBalance;
                
                showChatView();
                loadChatHistory();
                startTokenCheck();
            } else {
                alert('Account created! Please login.');
                state.isLoginMode = true;
                toggleAuthLink.click();
            }
        } else {
            alert(data.message || 'Operation failed');
        }
    } catch (err) {
        alert('Could not connect to server.');
    } finally {
        authBtn.disabled = false;
        authBtn.innerText = state.isLoginMode ? 'Enter Workspace' : 'Join IntelliChat';
    }
});

function showChatView() {
    authView.classList.add('hidden');
    chatView.classList.remove('hidden');
}

async function loadChatHistory() {
    try {
        const res = await securedFetch(`${API_BASE}/chats`);
        const data = await res.json();
        if (data.success) renderHistory(data.data);
    } catch (err) {
        console.error('Error loading history:', err);
    }
}

function renderHistory(chats) {
    chatHistoryList.innerHTML = '';
    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${state.currentChatId === chat.id ? 'active' : ''}`;
        
        item.innerHTML = `
            <div class="history-item-content">
                <div class="title">${chat.title || 'Untitled Chat'}</div>
                <div class="date">${new Date(chat.createdAt).toLocaleDateString()}</div>
            </div>
            <button class="delete-chat-btn" title="Delete chat">🗑️</button>
        `;

        // Click content to select chat
        item.querySelector('.history-item-content').onclick = () => selectChat(chat);
        
        // Click trash icon to delete
        item.querySelector('.delete-chat-btn').onclick = (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        };

        chatHistoryList.appendChild(item);
    });
}

async function deleteChat(chatId) {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
        const res = await securedFetch(`${API_BASE}/chats/${chatId}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            if (state.currentChatId === chatId) {
                newChatBtn.click();
            }
            loadChatHistory();
        }
    } catch (err) {
        console.error('Error deleting chat:', err);
    }
}

async function deleteAllChats() {
    if (!confirm('Are you sure you want to delete ALL chats? This cannot be undone.')) return;

    try {
        const res = await securedFetch(`${API_BASE}/chats/clear`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            newChatBtn.click();
            loadChatHistory();
        }
    } catch (err) {
        console.error('Error deleting all chats:', err);
    }
}

deleteAllBtn.addEventListener('click', deleteAllChats);

async function selectChat(chat) {
    state.currentChatId = chat.id;
    document.getElementById('current-chat-title').innerText = chat.title || 'Chat';
    messagesContainer.innerHTML = ''; // Clear current view
    
    if (chat.summary) memoryStatus.classList.remove('hidden');
    else memoryStatus.classList.add('hidden');

    try {
        const res = await securedFetch(`${API_BASE}/chats/${chat.id}/messages`);
        const data = await res.json();
        if (data.success) {
            data.data.forEach(msg => addMessage(msg.content, msg.role));
        }
    } catch (err) {
        console.error('Error loading messages:', err);
    }

    loadChatHistory();
}

async function sendMessage() {
    if (state.tokenBalance < 10) {
        showTokenModal();
        return;
    }
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    messageInput.value = '';
    const aiBubble = addMessage('', 'ai');

    state.abortController = new AbortController();

    try {
        const response = await securedFetch(`${API_BASE}/chat`, {
            method: 'POST',
            signal: state.abortController.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                chatId: state.currentChatId
            })
        });

        const newChatId = response.headers.get('x-chat-id');
        if (newChatId && !state.currentChatId) {
            state.currentChatId = newChatId;
            loadChatHistory();
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let streamBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            streamBuffer += decoder.decode(value, { stream: true });
            let lines = streamBuffer.split('\n');
            streamBuffer = lines.pop(); 
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                    const content = trimmed.slice(6);
                    if (content.includes('Insufficient tokens')) {
                        showTokenModal();
                        aiBubble.remove();
                        return;
                    }
                    if (content.startsWith('[ERROR]')) {
                        aiBubble.classList.add('error');
                    }
                    fullContent += content;
                    aiBubble.innerText = fullContent;
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        }

        // Update local token balance (matches backend decrement)
        state.tokenBalance = Math.max(0, state.tokenBalance - 10);
        tokenBalanceDisplay.innerText = state.tokenBalance;
        localStorage.setItem('tokenBalance', state.tokenBalance);

    } catch (err) {
        if (err.name === 'AbortError') {
            aiBubble.innerText += ' [Stopped by user]';
        } else if (err.message !== 'Unauthorized') {
            console.error('Chat error:', err);
        }
    }
}

function addMessage(text, role) {
    const welcome = document.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.innerText = text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return div;
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

newChatBtn.addEventListener('click', () => {
    state.currentChatId = null;
    messagesContainer.innerHTML = '<div class="welcome-message"><h1>New Conversation</h1></div>';
    document.getElementById('current-chat-title').innerText = 'New Conversation';
    memoryStatus.classList.add('hidden');
});

init();

