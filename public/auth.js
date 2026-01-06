document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    initAuthModal();
});

function updateAuthUI() {
    const token = localStorage.getItem('authToken');
    const loginButtons = document.querySelectorAll('.open-popup, .open-auth');
    
    loginButtons.forEach(btn => {
        if (token) {
            btn.innerHTML = '<a href="profile.html">Профиль</a>';
            btn.classList.remove('open-popup', 'open-auth');
            
            const link = btn.querySelector('a');
            if (link) {
                const newLink = link.cloneNode(true);
                btn.replaceChild(newLink, link);
                
                newLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = 'profile.html';
                });
            }
        } else {
            btn.innerHTML = '<a href="#!">Войти</a>';
            btn.classList.add('open-popup', 'open-auth');
        }
    });
}

function initAuthModal() {
    const token = localStorage.getItem('authToken');
    if (token) {
        return;
    }
    
    const openButtons = document.querySelectorAll('.open-popup, .open-auth');
    const popupBg = document.querySelector('.popup-bg');
    const closeButtons = document.querySelectorAll('.close-popup, .popup-bg');
    const switchButtons = document.querySelectorAll('.switch-auth-mode');
    
    if (!popupBg) {
        return;
    }
    
    popupBg.style.display = 'none';
    
    openButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const link = btn.querySelector('a');
            if (link && link.getAttribute('href') === 'profile.html') {
                if (localStorage.getItem('authToken')) {
                    window.location.href = 'profile.html';
                    return;
                }
            }
            
            e.preventDefault();
            e.stopPropagation();
            if (popupBg) {
                popupBg.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                showLoginForm();
            }
        });
        
        const link = btn.querySelector('a');
        if (link) {
            link.addEventListener('click', (e) => {
                if (link.getAttribute('href') === 'profile.html') {
                    if (localStorage.getItem('authToken')) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                }
                
                if (popupBg) {
                    popupBg.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    showLoginForm();
                }
            });
        }
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target === btn || e.target.classList.contains('close-popup')) {
                if (popupBg) {
                    popupBg.style.display = 'none';
                    document.body.style.overflow = '';
                }
            }
        });
    });
    
    switchButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const mode = btn.dataset.mode;
            if (mode === 'register') {
                showRegisterForm();
            } else {
                showLoginForm();
            }
        });
    });
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const popupTitle = document.querySelector('.popup-title');
    
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (popupTitle) popupTitle.textContent = 'Вход';
}

function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const popupTitle = document.querySelector('.popup-title');
    
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (popupTitle) popupTitle.textContent = 'Регистрация';
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('register-fullname').value.trim(),
        email: document.getElementById('register-email').value.trim(),
        password: document.getElementById('register-password').value,
        confirmPassword: document.getElementById('register-confirm-password').value,
        phone: document.getElementById('register-phone').value.trim()
    };
    
    if (!formData.fullName || !formData.email || !formData.password || !formData.phone) {
        showError('Все поля обязательны для заполнения');
        return;
    }
    
    if (formData.password !== formData.confirmPassword) {
        showError('Пароли не совпадают');
        return;
    }
    
    if (formData.password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Регистрация успешна! Теперь войдите в систему.');
            setTimeout(() => {
                showLoginForm();
                document.getElementById('register-form').reset();
            }, 1500);
        } else {
            showError(result.error || 'Ошибка при регистрации');
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showError('Ошибка соединения с сервером');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value
    };
    
    if (!formData.email || !formData.password) {
        showError('Введите email и пароль');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('userId', result.userId);
            
            showSuccess('Вход выполнен успешно!');
            setTimeout(() => {
                const popupBg = document.querySelector('.popup-bg');
                if (popupBg) {
                    popupBg.style.display = 'none';
                    document.body.style.overflow = '';
                }
                updateAuthUI();
                window.location.href = 'profile.html';
            }, 1000);
        } else {
            showError(result.error || 'Неверный email или пароль');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        showError('Ошибка соединения с сервером');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'auth-message error';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'auth-message success';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    updateAuthUI();
    window.location.href = 'index.html';
}

if (window.location.pathname.includes('profile.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    });
}
