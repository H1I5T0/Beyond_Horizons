
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tourId = params.get('tourId');

    if (tourId) {
        fetchTourDetails(tourId);
    } else {
        console.error("Tour ID не найден в URL.");
        document.getElementById('tour-detail-title').innerText = "Ошибка: Тур не выбран.";
    }
});

let baseTourPrice = 0;

async function fetchTourDetails(id) {
    try {
        const response = await fetch(`/api/tour/${id}`);
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.data) {
            const tour = result.data;
            baseTourPrice = tour.Price;

            renderTourData(tour);
            
            setupAccordion(); 
            
            setupBookingControls();
        }
    } catch (error) {
        console.error('Ошибка загрузки деталей тура:', error);
        document.getElementById('tour-detail-title').innerText = "Ошибка загрузки данных.";
    }
}

function renderTourData(tour) {
    document.getElementById('tour-detail-title').innerText = tour.Title;
    document.getElementById('tour-location').innerText = tour.Location;
    

    document.getElementById('tour-single-price').innerText = `$${tour.Price.toFixed(2)}`;

    renderGallery(tour.ImageGallery);

    document.getElementById('tour-description-text').querySelector('p').innerText = tour.Description;
    renderList(tour.Highlights, 'tour-highlights-list', false);
    renderList(tour.IncludedItems, 'includes-list', true, 'pink');
    renderList(tour.NotIncludedItems, 'not-includes-list', true, 'gray');

    renderMap(tour.MapIframeURL);

    renderFAQ(tour.FAQs);
}

function renderGallery(imagePaths) {
    const galleryContainer = document.getElementById('tour-gallery');
    if (!galleryContainer || !imagePaths || imagePaths.length < 4) return;
    
    galleryContainer.innerHTML = ''; 

    galleryContainer.innerHTML = `
        <div class="first_columnImg">
            <img src="${imagePaths[0]}" alt="Изображение тура 1" class="gallery-item">
        </div>
        <div class="second_columnImg">
            <img src="${imagePaths[1]}" alt="Изображение тура 2" class="gallery-item">
            <div class="others-img">
                <img src="${imagePaths[2]}" alt="Изображение тура 3" class="gallery-item">
                <img src="${imagePaths[3]}" alt="Изображение тура 4" class="gallery-item">
            </div>
        </div>
    `;
}


/**
 * Создает элементы <li> для списков (Highlights, Includes/NotIncludes)
 * @param {Array<string>} items Массив строк
 * @param {string} containerId ID целевого UL
 * @param {boolean} addIcon Добавить ли иконку (для Included/NotIncluded)
 */
function renderList(items, containerId, addIcon = false, iconColor = '') {
    const ul = document.getElementById(containerId);
    if (!ul || !items) return;
    
    ul.innerHTML = '';
    
    items.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        
        if (addIcon) {
            li.classList.add('includes_columnItem');
            const icon = document.createElement('span');
            icon.classList.add('bullet-icon', iconColor === 'pink' ? 'bullet-pink' : 'bullet-gray');
            li.prepend(icon);
        }
        ul.appendChild(li);
    });
}

function renderMap(iframeSrc) {
    const mapContainer = document.getElementById('tour-map-container');
    if (!mapContainer || !iframeSrc) return;
    
    const iframe = document.createElement('iframe');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('src', iframeSrc);
    mapContainer.innerHTML = '';
    mapContainer.appendChild(iframe);
}

function renderFAQ(faqs) {
    const faqContainer = document.getElementById('faq-container');
    if (!faqContainer || !faqs) return;
    
    const h2 = faqContainer.querySelector('h2');
    faqContainer.innerHTML = ''; 
    faqContainer.appendChild(h2);
    
    faqs.forEach(item => {
        const question = item.question || item.q || '';
        const answer = item.answer || item.a || '';
        if (!question && !answer) return;

        const faqItem = document.createElement('div');
        faqItem.classList.add('faq-item');
        
        faqItem.innerHTML = `
            <div class="faq-question">
                ${question}
                <span class="faq-toggle"></span>
            </div>
            <div class="faq-answer">
                ${answer}
            </div>
        `;
        faqContainer.appendChild(faqItem);
    });
}

function setupAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        
        question.addEventListener('click', () => {
            const isCurrentlyActive = item.classList.contains('active');
            
            faqItems.forEach(otherItem => {
                const otherAnswer = otherItem.querySelector('.faq-answer');
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherAnswer.style.maxHeight = '0';
                }
            });

            if (isCurrentlyActive) {
                item.classList.remove('active');
                answer.style.maxHeight = '0';
            } else {
                item.classList.add('active');
                
                const contentHeight = answer.scrollHeight;
                answer.style.maxHeight = contentHeight + 60 + "px";
            }
        });
    });
}


function setupBookingControls() {
    const quantitySpan = document.getElementById('adult-quantity');
    const totalDiv = document.getElementById('total');
    const controls = document.querySelectorAll('.ticket-controls button');
    
    let currentQuantity = 0;
    
    function updateDisplay(newQuantity) {
        currentQuantity = Math.max(0, newQuantity);
        quantitySpan.innerText = currentQuantity;
        
        const total = currentQuantity * baseTourPrice;
        totalDiv.innerText = `$${total.toFixed(2)}`;
    }
    
    controls.forEach(button => {
        button.addEventListener('click', () => {
            let change = button.innerText === '+' ? 1 : -1;
            updateDisplay(currentQuantity + change);
        });
    });

    updateDisplay(0); 
    
    document.getElementById('bookNow').addEventListener('click', async () => {
        if (currentQuantity > 0) {
            const token = localStorage.getItem('authToken');
            const userId = localStorage.getItem('userId');
            
            if (!token || !userId) {
                alert('Для бронирования необходимо войти в систему');
                const openBtn = document.querySelector('.open-popup, .open-auth');
                if (openBtn) {
                    openBtn.click();
                }
                return;
            }
            
            const params = new URLSearchParams(window.location.search);
            const tourId = params.get('tourId');
            
            if (!tourId) {
                alert('Ошибка: ID тура не найден');
                return;
            }
            
            const totalPrice = currentQuantity * baseTourPrice;
            
            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: parseInt(userId),
                        tourId: parseInt(tourId),
                        quantity: currentQuantity,
                        totalPrice: totalPrice
                    })
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert(`Бронирование успешно! Забронировано ${currentQuantity} билетов на сумму ${totalDiv.innerText}`);
                } else {
                    alert(result.error || 'Ошибка при бронировании');
                }
            } catch (error) {
                console.error('Ошибка бронирования:', error);
                alert('Ошибка соединения с сервером');
            }
        } else {
            alert('Пожалуйста, выберите количество билетов.');
        }
    });
}