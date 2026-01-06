const sqlite3 = require('sqlite3').verbose();
const DB_FILE = './beyond_horizons.db';

const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Ошибка при подключении к БД:', err.message);
    } else {
        console.log('Успешное подключение к SQLite базе данных.');
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) {
                console.error("PRAGMA statement failed.", err.message);
            }
            initializeDB(); 
        });
    }
});

function initializeDB() {
    db.serialize(() => {
        
        db.run(`
            CREATE TABLE IF NOT EXISTS TourCatalogs (
                CatalogID INTEGER PRIMARY KEY AUTOINCREMENT,
                CatalogName TEXT NOT NULL UNIQUE 
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS Users (
                UserID INTEGER PRIMARY KEY AUTOINCREMENT,
                FullName TEXT NOT NULL,
                Email TEXT NOT NULL UNIQUE,
                Password TEXT NOT NULL,
                Phone TEXT NOT NULL,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS Bookings (
                BookingID INTEGER PRIMARY KEY AUTOINCREMENT,
                UserID INTEGER,
                TourID INTEGER,
                Quantity INTEGER NOT NULL,
                TotalPrice REAL NOT NULL,
                BookingDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (UserID) REFERENCES Users(UserID),
                FOREIGN KEY (TourID) REFERENCES Tours(TourID)
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS PaymentStatuses (
                StatusID INTEGER PRIMARY KEY AUTOINCREMENT,
                StatusName TEXT NOT NULL UNIQUE
            )
        `);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS Tours (
                TourID INTEGER PRIMARY KEY AUTOINCREMENT,
                Title TEXT NOT NULL,
                StartDate TEXT NOT NULL, 
                AvailableSeats INTEGER NOT NULL,
                Price REAL NOT NULL, 
                -- Ссылается на CatalogID, а не CategoryID
                CatalogID INTEGER, 
                ImagePath TEXT, 
                FOREIGN KEY (CatalogID) REFERENCES TourCatalogs(CatalogID)
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS TourDetails (
                DetailID INTEGER PRIMARY KEY AUTOINCREMENT,
                TourID INTEGER UNIQUE NOT NULL,
                Location TEXT NOT NULL,          
                Description TEXT,
                Highlights TEXT,                 
                IncludedItems TEXT,              
                NotIncludedItems TEXT,           
                ImageGallery TEXT,               
                MapIframeURL TEXT,
                FAQs TEXT,                       
                FOREIGN KEY (TourID) REFERENCES Tours(TourID) ON DELETE CASCADE
            )
        `);
        
        insertTourCatalogs(() => {
            insertTours(() => {
                insertTourDetails(() => {
                    console.log("Инициализация и заполнение БД тестовыми данными завершено.");
                });
            });
        });
        
        insertPaymentStatuses();
    });
}


function insertTourCatalogs(callback) {
    db.get("SELECT COUNT(*) AS count FROM TourCatalogs", (err, row) => {
        if (row && row.count === 0) {
            console.log("Наполнение таблиц тестовыми данными (Каталоги/Направления)...");
            const catalogs = [
                ['Пхукет'],
                ['Рим'],
                ['Бали'],
                ['Париж']
            ];
            
            db.serialize(() => {
                const insertCat = db.prepare("INSERT INTO TourCatalogs (CatalogName) VALUES (?)");
                catalogs.forEach(cat => insertCat.run(cat));
                insertCat.finalize(callback); 
            });
        } else {
            if (callback) callback();
        }
    });
}
function insertPaymentStatuses(callback) {
    db.get("SELECT COUNT(*) AS count FROM PaymentStatuses", (err, row) => {
        if (row && row.count === 0) {
            const statuses = [['Ожидает оплаты'], ['Оплачен'], ['Отменен']];
            db.serialize(() => {
                const insertStatus = db.prepare("INSERT INTO PaymentStatuses (StatusName) VALUES (?)");
                statuses.forEach(status => insertStatus.run(status));
                insertStatus.finalize(callback);
            });
        } else {
            if (callback) callback();
        }
    });
}

function insertTours(callback) {
    db.get("SELECT COUNT(*) AS count FROM Tours", (err, row) => {
        if (row && row.count === 0) {
            console.log("Наполнение таблиц тестовыми данными (Туры)...");
            const tours = [
                ['Приключенческая однодневная поездка на острова Пхи-Пхи', '2026-05-15 08:00', 30, 200.00, 1, 'images/phuket-1.png'],
                ['Закатный круиз по Андаманскому морю', '2026-05-18 17:00', 20, 250.00, 1, 'images/phuket-2.png'],
                ['Сафари на слонах и джип-тур по джунглям', '2026-06-02 09:00', 16, 180.00, 1, 'images/phuket-3.png'],
                ['Снорклинг на Симиланских островах', '2026-06-10 07:30', 12, 220.00, 1, 'images/phuket-4.png'],
                ['Экскурсия в старый город Пхукета и храмы', '2026-06-20 10:00', 25, 90.00, 1, 'images/phuket-5.png'],
                ['Дайвинг для начинающих у острова Рача', '2026-07-01 08:30', 10, 260.00, 1, 'images/phuket-6.png'],

                ['Исторический тур по Риму и Ватикану', '2026-03-01 09:30', 25, 899.99, 2, 'images/rome.jpg'],
                ['Ночной Рим: огни Колизея и фонтаны', '2026-03-05 19:00', 20, 150.00, 2, 'images/rome-2.jpg'],
                ['Кулинарный мастер-класс итальянской кухни', '2026-03-10 11:00', 12, 120.00, 2, 'images/rome-3.jpg'],

                ['Исследование Бали: Храмы и Водопады (5 дней)', '2026-08-20 10:00', 18, 550.00, 3, 'images/bali.jpg'],
                ['Закат на храме Улувату и шоу Кечак', '2026-08-22 16:00', 25, 95.00, 3, 'images/bali-2.jpg'],
                ['Джунгли Убуда и рисовые террасы', '2026-08-25 09:00', 20, 110.00, 3, 'images/bali-3.jpg'],
                ['Остров Нуса-Пенида: пляжи и смотровые площадки', '2026-08-28 07:00', 15, 210.00, 3, 'images/bali-4.jpg'],

                ['Огни Парижа: Круиз по Сене и Эйфелева башня', '2026-06-25 19:00', 40, 150.00, 4, 'images/paris.jpg'],
                ['Версальский дворец и сады', '2026-06-27 09:00', 30, 190.00, 4, 'images/paris-2.jpg'],
                ['Шампань: винные подземелья и дегустация', '2026-06-28 08:30', 18, 220.00, 4, 'images/paris-3.jpg'],
                ['Монмартр и художественный Париж', '2026-06-29 14:00', 22, 140.00, 4, 'images/paris-4.jpg'],
                ['Диснейленд Париж: семейное приключение', '2026-06-30 08:00', 35, 210.00, 4, 'images/paris-5.jpg']
            ];
            
            db.serialize(() => {
                const insertTour = db.prepare(`
                    INSERT INTO Tours 
                    (Title, StartDate, AvailableSeats, Price, CatalogID, ImagePath) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                tours.forEach(tour => insertTour.run(tour));
                insertTour.finalize(callback);
            });
        } else {
            if (callback) callback();
        }
    });
}

function insertTourDetails(callback) {
    db.get("SELECT COUNT(*) AS count FROM TourDetails", (err, row) => {
        if (row && row.count === 0) {
            console.log("Наполнение таблиц тестовыми данными (Детали туров)...");
            
            const highlights = JSON.stringify(["Увлекательная прогулка", "Посещение бухты Майя", "Обед включен"]);
            const included = JSON.stringify(["Профессиональный гид", "Трансфер", "Напитки"]);
            const notIncluded = JSON.stringify(["Чаевые", "Личные расходы"]);
            const gallery = JSON.stringify(['images/gallery-1.png', 'images/gallery-2.png']);
            const faqs = JSON.stringify([{ question: "Залог?", answer: "Нет." }]);
            
            const mapUrls = {
                phuket: 'https://yandex.ru/map-widget/v1/?um=constructor%3Ac23a3f53335b39de01001e771fd05f32caa8ad9b28f1d54dd0a7140f45c60c8f',
                rome: 'https://yandex.ru/map-widget/v1/?um=constructor%3A97da5d42b53b1e20e081d6d5a6951c6d7611f843a0a8bc89b5a07f81ff4bef4e',
                bali: 'https://yandex.ru/map-widget/v1/?um=constructor%3Ae3b4c86d1b048b59ab7461be079ffe5f52b7916d3e1ff3861f99089415e42ffa',
                paris: 'https://yandex.ru/map-widget/v1/?um=constructor%3Ac6760732e8e551b1c92e6ac913ddd5f4242f5ceb43b015d43acf1dfb394afdb9'
            };
            
            const details = [
                [1, 'Пхукет, Таиланд', `Однодневный тур на легендарные острова Пхи-Пхи с купанием, снорклингом и обедом на пляже.`, highlights, included, notIncluded, gallery, mapUrls.phuket, faqs],
                [2, 'Пхукет, Таиланд', `Расслабляющий круиз на комфортабельной яхте с ужином и встречей заката в Андаманском море.`, highlights, included, notIncluded, gallery, mapUrls.phuket, faqs],
                [3, 'Пхукет, Таиланд', `Приключенческий тур по джунглям Пхукета с поездкой на слонах и джип-сафари.`, highlights, included, notIncluded, gallery, mapUrls.phuket, faqs],
                [4, 'Пхукет, Таиланд', `Поездка на Симиланские острова с лучшими локациями для снорклинга и подводных фото.`, highlights, included, notIncluded, gallery, mapUrls.phuket, faqs],
                [5, 'Пхукет, Таиланд', `Обзорная экскурсия по Старому городу Пхукета с посещением храмов и смотровых площадок.`, highlights, included, notIncluded, gallery, mapUrls.phuket, faqs],
                [6, 'Пхукет, Таиланд', `Программа для начинающих дайверов у острова Рача с инструктором и двумя погружениями.`, highlights, included, notIncluded, gallery, mapUrls.phuket, faqs],

                [7, 'Рим, Италия', `Классический маршрут по Риму и Ватикану с посещением основных достопримечательностей.`, highlights, included, notIncluded, gallery, mapUrls.rome, faqs],
                [8, 'Рим, Италия', `Вечерняя прогулка по огням Колизея, фонтанам и площадям исторического центра.`, highlights, included, notIncluded, gallery, mapUrls.rome, faqs],
                [9, 'Рим, Италия', `Кулинарный мастер-класс с шеф-поваром и дегустацией традиционных блюд.`, highlights, included, notIncluded, gallery, mapUrls.rome, faqs],

                [10, 'Бали, Индонезия', `Пятидневная программа с посещением храмов, рисовых террас и водопадов Бали.`, highlights, included, notIncluded, gallery, mapUrls.bali, faqs],
                [11, 'Бали, Индонезия', `Закат на Улувату, шоу Кечак и ужин на берегу океана.`, highlights, included, notIncluded, gallery, mapUrls.bali, faqs],
                [12, 'Бали, Индонезия', `Экскурсия по джунглям Убуда, плантациям и смотровым площадкам.`, highlights, included, notIncluded, gallery, mapUrls.bali, faqs],
                [13, 'Бали, Индонезия', `Однодневная поездка на Нуса-Пениду с посещением лучших пляжей острова.`, highlights, included, notIncluded, gallery, mapUrls.bali, faqs],

                [14, 'Париж, Франция', `Вечерний круиз по Сене с видом на Эйфелеву башню и прогулкой по центру города.`, highlights, included, notIncluded, gallery, mapUrls.paris, faqs],
                [15, 'Париж, Франция', `Посещение Лувра и прогулка по берегам Сены со stop-кадрами для фото.`, highlights, included, notIncluded, gallery, mapUrls.paris, faqs],
                [16, 'Париж, Франция', `Поездка в Версальский дворец с прогулкой по знаменитым садам.`, highlights, included, notIncluded, gallery, mapUrls.paris, faqs],
                [17, 'Париж, Франция', `Тур в регион Шампань с посещением винных подземелий и дегустацией.`, highlights, included, notIncluded, gallery, mapUrls.paris, faqs],
                [18, 'Париж, Франция', `Прогулка по Монмартру, базилике Сакре-Кёр и улочкам художников.`, highlights, included, notIncluded, gallery, mapUrls.paris, faqs]
            ];
            
            db.serialize(() => {
                const insertDetail = db.prepare(`
                    INSERT INTO TourDetails 
                    (TourID, Location, Description, Highlights, IncludedItems, NotIncludedItems, ImageGallery, MapIframeURL, FAQs) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                details.forEach(detail => insertDetail.run(detail));
                
                insertDetail.finalize(callback);
            });
        } else {
            if (callback) callback();
        }
    });
}

module.exports = db;