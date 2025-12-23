const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const USERS_FILE = path.join(__dirname, "../data/users.json");

// Константа админа
const ADMIN_LOGIN = "Fox01";

// Вспомогательная функция для чтения пользователей
const getUsers = () => {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
};

// Роут входа / регистрации
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ status: "error", error: "Введите имя и пароль" });
    }

    let users = getUsers();
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    // Если пользователя нет — создаем нового (авто-регистрация)
    if (!user) {
        user = {
            username: username,
            password: password, // В реальном проекте здесь должно быть хеширование (bcrypt)
            role: username === ADMIN_LOGIN ? "admin" : "user",
            created_at: new Date().toISOString()
        };
        users.push(user);
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } else {
        // Если пользователь есть, проверяем пароль
        if (user.password !== password) {
            return res.status(401).json({ status: "error", error: "Неверный пароль для этого лиса" });
        }
    }

    // При каждом входе проверяем, не стал ли пользователь админом (на случай смены ника)
    const role = user.username === ADMIN_LOGIN ? "admin" : "user";

    res.json({
        status: "ok",
        user: {
            username: user.username,
            role: role
        }
    });
});

// Роут проверки прав (опционально для фронтенда)
router.get("/check-admin/:username", (req, res) => {
    const username = req.params.username;
    if (username === ADMIN_LOGIN) {
        res.json({ isAdmin: true });
    } else {
        res.json({ isAdmin: false });
    }
});

module.exports = router;