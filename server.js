const express = require('express');
const path = require('path');
const db = require('./database'); 
const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public'))); 

const locationMap = {
    // Из directions.js приходят английские параметры (?location=Bali/Rome/Phuket/Paris),
    // а в БД каталоги хранятся на русском.
    'Bali': 'Бали',
    'Rome': 'Рим',
    'Phuket': 'Пхукет',
    'Paris': 'Париж',
    // Дополнительно поддержим и русские значения, если когда-нибудь будут использоваться напрямую в URL
    'Бали': 'Бали',
    'Рим': 'Рим',
    'Пхукет': 'Пхукет',
    'Париж': 'Париж'
};

app.get('/api/tours', (req, res) => {
    const locationParam = req.query.location; 
    const russianCatalogName = locationMap[locationParam];

    let sql;
    let params = [];

    let baseSql = `
        SELECT
            t.TourID, t.Title, t.StartDate, t.AvailableSeats, t.Price, 
            tc.CatalogName,  -- Теперь это название направления (Пхукет, Рим и т.д.)
            t.ImagePath as MainImage,
            td.Location      -- Полное название локации (Пхукет, Таиланд)
        FROM
            Tours t
        JOIN
            TourCatalogs tc ON t.CatalogID = tc.CatalogID  -- ИСПОЛЬЗУЕМ TourCatalogs
        JOIN
            TourDetails td ON t.TourID = td.TourID  
    `;

    if (russianCatalogName) {
        sql = `
            ${baseSql}
            WHERE
                tc.CatalogName = ?  
            ORDER BY
                t.StartDate ASC;
        `;
        params.push(russianCatalogName); 
    } else {
        sql = `${baseSql} ORDER BY t.StartDate ASC;`;
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ "error": "Ошибка базы данных при получении списка туров." });
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});


app.get('/api/tour/:id', (req, res) => {
    const tourId = req.params.id;

    const sql = `
        SELECT 
            T.*, TD.Location, TD.Description, TD.Highlights, TD.IncludedItems, TD.NotIncludedItems, 
            TD.ImageGallery, TD.MapIframeURL, TD.FAQs, 
            TC.CatalogName AS CatalogName -- Получаем название направления/каталога
        FROM 
            Tours T
        JOIN 
            TourDetails TD ON T.TourID = TD.TourID
        JOIN 
            TourCatalogs TC ON T.CatalogID = TC.CatalogID -- ИСПОЛЬЗУЕМ TourCatalogs
        WHERE 
            T.TourID = ?
    `;

    db.get(sql, [tourId], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ "error": "Ошибка базы данных при получении деталей тура." });
            return;
        }
        if (row) {
            try {
                row.Highlights = JSON.parse(row.Highlights);
                row.IncludedItems = JSON.parse(row.IncludedItems);
                row.NotIncludedItems = JSON.parse(row.NotIncludedItems);
                row.ImageGallery = JSON.parse(row.ImageGallery);
                row.FAQs = JSON.parse(row.FAQs);
            } catch (e) {
                console.error("Ошибка парсинга JSON для деталей тура:", e);
            }

            res.json({
                message: "success",
                data: row
            });
        } else {
            res.status(404).json({ "error": "Тур не найден." });
        }
    });
});

app.get('/api/catalogs', (req, res) => {
    const sql = `SELECT CatalogID, CatalogName FROM TourCatalogs ORDER BY CatalogName;`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ "error": "Ошибка базы данных при получении списка каталогов." });
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});