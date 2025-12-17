document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const location = params.get('location'); 

    if (location) {
        fetchToursByLocation(location);
    } else {
        document.getElementById('catalog-title').innerText = "Выберите направление";
        document.getElementById('tour-list-container').innerHTML = '<p>Пожалуйста, вернитесь на страницу выбора направлений.</p>';
    }
});

function formatLocationName(location) {
    const nameMap = {
        'phuket': 'Пхукет', 
        'rome': 'Рим', 
        'bali': 'Бали', 
        'paris': 'Париж'
    };
    return nameMap[location.toLowerCase()] || location.charAt(0).toUpperCase() + location.slice(1);
}


async function fetchToursByLocation(location) {
    const container = document.getElementById('tour-list-container');
    const titleElement = document.getElementById('catalog-title');
    
    if (!container || !titleElement) return;

    titleElement.innerText = `Туры: ${formatLocationName(location)}`;
    container.innerHTML = '<p>Загрузка туров...</p>';

    const apiUrl = `/api/tours?location=${location}`; 

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
            container.innerHTML = ''; 
            result.data.forEach(tour => {
                const card = createTourCard(tour);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<p>Туры по направлению "${formatLocationName(location)}" не найдены.</p>`;
        }
    } catch (error) {
        console.error('Ошибка загрузки туров:', error);
        container.innerHTML = '<p>Не удалось загрузить туры.</p>';
    }
}