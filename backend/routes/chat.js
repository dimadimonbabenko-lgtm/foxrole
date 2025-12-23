const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Пути к данным
const CHARS_PATH = path.join(__dirname, "../data/characters.json");
const MESSAGES_PATH = path.join(__dirname, "../data/messages.json");

// --- СИСТЕМА УРОВНЕЙ И ТИТУЛОВ ---

/**
 * Определяет титул персонажа на основе его уровня
 */
function getTitle(level) {
    if (level >= 30) return "🔥 Божество Листвейна";
    if (level >= 20) return "🏆 Легендарный Герой";
    if (level >= 15) return "⚔️ Мастер Клинка";
    if (level >= 10) return "🌟 Искатель Приключений";
    if (level >= 5)  return "🍃 Путешественник";
    return "🐾 Новичок";
}

/**
 * Рассчитывает, сколько опыта нужно для следующего уровня
 * Уровни становятся сложнее: 100, 250, 450, 700...
 */
function calculateMaxExp(level) {
    return level * 100 + (level - 1) * 50;
}

// --- РОУТЫ ЧАТА ---

// Получение всех сообщений
router.get("/messages", (req, res) => {
    try {
        if (!fs.existsSync(MESSAGES_PATH)) return res.json([]);
        const messages = JSON.parse(fs.readFileSync(MESSAGES_PATH, "utf8"));
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Ошибка загрузки чата" });
    }
});

// Отправка сообщения и начисление опыта
router.post("/send", (req, res) => {
    const { charName, text, location } = req.body;

    if (!charName || !text) {
        return res.status(400).json({ error: "Не все поля заполнены" });
    }

    try {
        // 1. Загружаем персонажей для обновления опыта
        let characters = [];
        if (fs.existsSync(CHARS_PATH)) {
            characters = JSON.parse(fs.readFileSync(CHARS_PATH, "utf8"));
        }

        let charIndex = characters.findIndex(c => c.name === charName);
        let levelUpOccurred = false;
        let currentTitle = "Новичок";

        if (charIndex !== -1) {
            let char = characters[charIndex];

            // Начисляем опыт: 10 за сообщение + бонус за длину текста (до 5)
            const expGain = 10 + Math.min(Math.floor(text.length / 20), 5);
            char.exp = (char.exp || 0) + expGain;

            // Если maxExp не задан (старый персонаж), задаем его
            if (!char.maxExp) char.maxExp = calculateMaxExp(char.level || 1);

            // Проверка повышения уровня (цикл на случай, если опыта пришло ОЧЕНЬ много)
            while (char.exp >= char.maxExp) {
                char.level = (char.level || 1) + 1;
                char.exp -= char.maxExp;
                char.maxExp = calculateMaxExp(char.level);
                levelUpOccurred = true;
            }

            // Обновляем титул
            char.title = getTitle(char.level);
            currentTitle = char.title;

            // Сохраняем обновленного персонажа
            characters[charIndex] = char;
            fs.writeFileSync(CHARS_PATH, JSON.stringify(characters, null, 2));
        }

        // 2. Сохраняем само сообщение
        let messages = [];
        if (fs.existsSync(MESSAGES_PATH)) {
            messages = JSON.parse(fs.readFileSync(MESSAGES_PATH, "utf8"));
        }

        const newMessage = {
            id: Date.now(),
            charName,
            title: currentTitle, // Сохраняем титул в сообщении
            text,
            location: location || "Неизвестно",
            timestamp: new Date().toLocaleTimeString()
        };

        messages.push(newMessage);
        // Храним последние 100 сообщений
        if (messages.length > 100) messages.shift();
        
        fs.writeFileSync(MESSAGES_PATH, JSON.stringify(messages, null, 2));

        // Отправляем ответ фронтенду
        res.json({ 
            success: true, 
            levelUp: levelUpOccurred,
            newLevel: characters[charIndex]?.level
        });

    } catch (err) {
        console.error("Ошибка чата:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

module.exports = router;
