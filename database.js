
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
        
        db.run(`DROP TABLE IF EXISTS TourDetails`);
        db.run(`DROP TABLE IF EXISTS Tours`);
        db.run(`DROP TABLE IF EXISTS TourCategories`); 
        db.run(`DROP TABLE IF EXISTS PaymentStatuses`);
        
        db.run(`
            CREATE TABLE IF NOT EXISTS TourCatalogs (
                CatalogID INTEGER PRIMARY KEY AUTOINCREMENT,
                CatalogName TEXT NOT NULL UNIQUE -- Будут названия: 'Бали', 'Рим', 'Пхукет', 'Париж'
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
                -- Локация (полное название) все еще здесь, если она отличается от CatalogName
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
                // Пхукет (CatalogID = 1), TourID 1–6
                ['Приключенческая однодневная поездка на острова Пхи-Пхи', '2026-05-15 08:00', 30, 200.00, 1, 'images/phuket-1.png'],
                ['Закатный круиз по Андаманскому морю', '2026-05-18 17:00', 20, 250.00, 1, 'images/phuket-2.png'],
                ['Сафари на слонах и джип-тур по джунглям', '2026-06-02 09:00', 16, 180.00, 1, 'images/phuket-3.png'],
                ['Снорклинг на Симиланских островах', '2026-06-10 07:30', 12, 220.00, 1, 'images/phuket-4.png'],
                ['Экскурсия в старый город Пхукета и храмы', '2026-06-20 10:00', 25, 90.00, 1, 'images/phuket-5.png'],
                ['Дайвинг для начинающих у острова Рача', '2026-07-01 08:30', 10, 260.00, 1, 'images/phuket-6.png'],

                // Рим (CatalogID = 2), TourID 7–9 (3 карточки: rome.jpg, rome-2.jpg, rome-3.jpg)
                ['Исторический тур по Риму и Ватикану', '2026-03-01 09:30', 25, 899.99, 2, 'images/rome.jpg'],
                ['Ночной Рим: огни Колизея и фонтаны', '2026-03-05 19:00', 20, 150.00, 2, 'images/rome-2.jpg'],
                ['Кулинарный мастер-класс итальянской кухни', '2026-03-10 11:00', 12, 120.00, 2, 'images/rome-3.jpg'],

                // Бали (CatalogID = 3), TourID 10–13 (4 карточки: bali.jpg, bali-2.jpg, bali-3.jpg, bali-4.jpg)
                ['Исследование Бали: Храмы и Водопады (5 дней)', '2026-08-20 10:00', 18, 550.00, 3, 'images/bali.jpg'],
                ['Закат на храме Улувату и шоу Кечак', '2026-08-22 16:00', 25, 95.00, 3, 'images/bali-2.jpg'],
                ['Джунгли Убуда и рисовые террасы', '2026-08-25 09:00', 20, 110.00, 3, 'images/bali-3.jpg'],
                ['Остров Нуса-Пенида: пляжи и смотровые площадки', '2026-08-28 07:00', 15, 210.00, 3, 'images/bali-4.jpg'],

                // Париж (CatalogID = 4), TourID 14–18 (5 карточек: paris.jpg, paris-2.jpg, paris-3.jpg, paris-4.jpg, paris-5.jpg)
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
            
            const details = [
                // Пхукет, Таиланд — детали для туров с ID 1–6
                [1, 'Пхукет, Таиланд', `Однодневный тур на легендарные острова Пхи-Пхи с купанием, снорклингом и обедом на пляже.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [2, 'Пхукет, Таиланд', `Расслабляющий круиз на комфортабельной яхте с ужином и встречей заката в Андаманском море.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [3, 'Пхукет, Таиланд', `Приключенческий тур по джунглям Пхукета с поездкой на слонах и джип-сафари.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [4, 'Пхукет, Таиланд', `Поездка на Симиланские острова с лучшими локациями для снорклинга и подводных фото.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [5, 'Пхукет, Таиланд', `Обзорная экскурсия по Старому городу Пхукета с посещением храмов и смотровых площадок.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [6, 'Пхукет, Таиланд', `Программа для начинающих дайверов у острова Рача с инструктором и двумя погружениями.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],

                // Рим, Италия — туры с ID 7–9
                [7, 'Рим, Италия', `Классический маршрут по Риму и Ватикану с посещением основных достопримечательностей.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [8, 'Рим, Италия', `Вечерняя прогулка по огням Колизея, фонтанам и площадям исторического центра.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [9, 'Рим, Италия', `Кулинарный мастер-класс с шеф-поваром и дегустацией традиционных блюд.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],

                // Бали, Индонезия — туры с ID 10–13
                [10, 'Бали, Индонезия', `Пятидневная программа с посещением храмов, рисовых террас и водопадов Бали.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [11, 'Бали, Индонезия', `Закат на Улувату, шоу Кечак и ужин на берегу океана.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [12, 'Бали, Индонезия', `Экскурсия по джунглям Убуда, плантациям и смотровым площадкам.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [13, 'Бали, Индонезия', `Однодневная поездка на Нуса-Пениду с посещением лучших пляжей острова.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],

                // Париж, Франция — туры с ID 14–18
                [14, 'Париж, Франция', `Вечерний круиз по Сене с видом на Эйфелеву башню и прогулкой по центру города.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [15, 'Париж, Франция', `Посещение Лувра и прогулка по берегам Сены со stop-кадрами для фото.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [16, 'Париж, Франция', `Поездка в Версальский дворец с прогулкой по знаменитым садам.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [17, 'Париж, Франция', `Тур в регион Шампань с посещением винных подземелий и дегустацией.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs],
                [18, 'Париж, Франция', `Прогулка по Монмартру, базилике Сакре-Кёр и улочкам художников.`, highlights, included, notIncluded, gallery, `https://yandex.ru/map-widget/v1/?um=...`, faqs]
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