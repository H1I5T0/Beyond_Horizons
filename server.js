const express = require('express');
const path = require('path');
const crypto = require('crypto');
const db = require('./database'); 
const app = express();
const PORT = 3000;

app.use(express.json());

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ "error": "Токен не предоставлен" });
    }
    
    req.token = token;
    next();
}

app.use(express.static(path.join(__dirname, 'public'))); 

const locationMap = {
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

app.post('/api/auth/register', (req, res) => {
    const { fullName, email, password, phone } = req.body;
    
    if (!fullName || !email || !password || !phone) {
        return res.status(400).json({ "error": "Все поля обязательны для заполнения" });
    }
    
    const hashedPassword = hashPassword(password);
    
    const sql = `INSERT INTO Users (FullName, Email, Password, Phone) VALUES (?, ?, ?, ?)`;
    
    db.run(sql, [fullName, email, hashedPassword, phone], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ "error": "Пользователь с таким email уже существует" });
            }
            console.error(err.message);
            return res.status(500).json({ "error": "Ошибка при регистрации пользователя" });
        }
        
        res.json({
            message: "success",
            userId: this.lastID
        });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ "error": "Введите email и пароль" });
    }
    
    const hashedPassword = hashPassword(password);
    
    const sql = `SELECT UserID, FullName, Email, Phone FROM Users WHERE Email = ? AND Password = ?`;
    
    db.get(sql, [email, hashedPassword], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ "error": "Ошибка при входе" });
        }
        
        if (!row) {
            return res.status(401).json({ "error": "Неверный email или пароль" });
        }
        
        const token = generateToken();
        
        res.json({
            message: "success",
            token: token,
            userId: row.UserID
        });
    });
});

app.get('/api/user/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    
    const sql = `SELECT UserID, FullName, Email, Phone FROM Users WHERE UserID = ?`;
    
    db.get(sql, [userId], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ "error": "Ошибка при получении данных пользователя" });
        }
        
        if (!row) {
            return res.status(404).json({ "error": "Пользователь не найден" });
        }
        
        res.json({
            message: "success",
            data: row
        });
    });
});

app.get('/api/bookings/:userId', authenticateToken, (req, res) => {
    const userId = req.params.userId;
    
    const sql = `
        SELECT 
            b.BookingID, b.Quantity, b.TotalPrice, b.BookingDate,
            t.Title as TourTitle
        FROM Bookings b
        JOIN Tours t ON b.TourID = t.TourID
        WHERE b.UserID = ?
        ORDER BY b.BookingDate DESC
    `;
    
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ "error": "Ошибка при получении истории бронирований" });
        }
        
        res.json({
            message: "success",
            data: rows
        });
    });
});

app.post('/api/bookings', authenticateToken, (req, res) => {
    const { userId, tourId, quantity, totalPrice } = req.body;
    
    if (!userId || !tourId || !quantity || !totalPrice) {
        return res.status(400).json({ "error": "Все поля обязательны" });
    }
    
    const checkSeatsSql = `SELECT AvailableSeats FROM Tours WHERE TourID = ?`;
    
    db.get(checkSeatsSql, [tourId], (err, tour) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ "error": "Ошибка при проверке доступности мест" });
        }
        
        if (!tour) {
            return res.status(404).json({ "error": "Тур не найден" });
        }
        
        if (tour.AvailableSeats < quantity) {
            return res.status(400).json({ "error": "Недостаточно свободных мест" });
        }
        
        const insertSql = `INSERT INTO Bookings (UserID, TourID, Quantity, TotalPrice) VALUES (?, ?, ?, ?)`;
        
        db.run(insertSql, [userId, tourId, quantity, totalPrice], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ "error": "Ошибка при создании бронирования" });
            }
            
            const bookingId = this.lastID;
            
            const updateSeatsSql = `UPDATE Tours SET AvailableSeats = AvailableSeats - ? WHERE TourID = ?`;
            
            db.run(updateSeatsSql, [quantity, tourId], (err) => {
                if (err) {
                    console.error(err.message);
                }
                
                res.json({
                    message: "success",
                    bookingId: bookingId
                });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
