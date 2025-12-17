function createTourCard(tour) {
    const card = document.createElement('div');
    card.classList.add('catalogItem')
    
    const dateObj = new Date(tour.StartDate);
    const formattedDate = dateObj.toLocaleDateString('ru-RU'); 
    const tourDetailUrl = `tour.html?tourId=${tour.TourID}`;

    card.innerHTML = `
        <div class="cardTour_left-side">
            <div class="img">
                <img src="${tour.MainImage}" alt="${tour.Title}">
            </div>
            <div class="cardTours_description">
                <h2 class="tour-name">
                    <a href="${tourDetailUrl}">${tour.Title}</a>
                </h2>
                <div class="TripItem_otzivi">
                    <img src="images/stars.png" alt="Рейтинг" class="stars">
                    <p>4.5 (10)</p> 
                </div>
                <p class="cardTour_description">
                    Доступно мест: ${tour.AvailableSeats}
                </p>
                <div class="cardTour_links">
                    <p>Гарантия лучшей цены</p>
                    <p>Бесплатная отмена бронирования</p>
                </div>
            </div>
        </div>
        <div class="cardTour_right-side">
            <div class="cardTour_days">
                <p>${formattedDate}</p>
            </div>
            <div class="cardTour_details">
                <div class="cardTour_price">    
                    <p class="old_price">$${(tour.Price * 1.1).toFixed(2)}</p> 
                    <p class="new_price">От <span>$${tour.Price.toFixed(2)}</span></p>
                </div>
                <a href="${tourDetailUrl}">Просмотреть детали</a>
            </div>
        </div>
    `;
    
    return card;
}