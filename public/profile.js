document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProfile();
    loadBookings();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const editBtn = document.getElementById('edit-profile-btn');
});

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

async function loadProfile() {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const response = await fetch(`/api/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            window.location.href = 'index.html';
            return;
        }
        
        const result = await response.json();
        
        if (result.data) {
            const user = result.data;
            document.getElementById('profile-fullname').value = user.FullName || '';
            document.getElementById('profile-email').value = user.Email || '';
            document.getElementById('profile-phone').value = user.Phone || '';
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

async function loadBookings() {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) return;
    
    try {
        const response = await fetch(`/api/bookings/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            renderBookings(result.data || []);
        }
    } catch (error) {
        console.error('Ошибка загрузки истории покупок:', error);
    }
}

function renderBookings(bookings) {
    const container = document.getElementById('bookings-container');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = '<p class="empty-message">История покупок пуста</p>';
        return;
    }
    
    container.innerHTML = '';
    
    bookings.forEach(booking => {
        const bookingCard = document.createElement('div');
        bookingCard.classList.add('booking-card');
        
        const date = new Date(booking.BookingDate).toLocaleDateString('ru-RU');
        
        bookingCard.innerHTML = `
            <div class="booking-info">
                <h3>${booking.TourTitle || 'Тур'}</h3>
                <p class="booking-date">Дата бронирования: ${date}</p>
                <p class="booking-quantity">Количество билетов: ${booking.Quantity}</p>
                <p class="booking-total">Итоговая стоимость: $${parseFloat(booking.TotalPrice).toFixed(2)}</p>
            </div>
        `;
        
        container.appendChild(bookingCard);
    });
}

function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

