
document.addEventListener('DOMContentLoaded', () => {
    renderDirectionsSelector();
});

const DIRECTIONS_DATA = [
    { name: 'Бали', locationParam: 'Bali', image: 'images/trend-1.png' },
    { name: 'Рим', locationParam: 'Rome', image: 'images/trend-2.png' },
    { name: 'Пхукет', locationParam: 'Phuket', image: 'images/trend-3.png' },
    { name: 'Париж', locationParam: 'Paris', image: 'images/trend-4.png' },
];

function renderDirectionsSelector() {
    const container = document.getElementById('directions-container'); 
    
    if (!container) {
        console.error("Контейнер с ID 'directions-container' не найден!");
        return;
    }

    const titleElement = document.getElementById('directions-title');
    if (titleElement) {
        titleElement.innerText = "Выберите направление";
    }

    const collectionDiv = document.createElement('div');
    collectionDiv.classList.add('directionsCollection');
    
    DIRECTIONS_DATA.forEach(direction => {
        const item = document.createElement('div');
        item.classList.add('directionsItem');
        
        item.innerHTML = `
            <img src="${direction.image}" alt="${direction.name}" class="directionsItem_img">
            <div class="directions_text-overlay">
                <a href="catalog.html?location=${direction.locationParam}" class="directionsItem_title">${direction.name}</a>
            </div>
        `;
        
        collectionDiv.appendChild(item);
    });
    
    container.innerHTML = '';
    container.appendChild(collectionDiv);
}