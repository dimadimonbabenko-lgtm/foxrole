const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const FILE = path.join(__dirname, "../data/messages.json");
const ADMIN_LOGIN = "Fox01";

// Вспомогательная функция для чтения сообщений
const getAllMessages = () => {
    try {
        if (!fs.existsSync(FILE)) {
            fs.writeFileSync(FILE, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(FILE, "utf8");
        return JSON.parse(data || "[]");
    } catch (err) {
        console.error("Ошибка чтения сообщений:", err);
        return [];
    }
};

// 1. ПОЛУЧЕНИЕ СООБЩЕНИЙ ЛОКАЦИИ
router.get("/:location", (req, res) => {
    const allMessages = getAllMessages();
    const filtered = allMessages.filter(m => m.location === req.params.location);
    res.json(filtered);
});

// 2. ОТПРАВКА СООБЩЕНИЯ (С поддержкой GM-mode и Dice)
router.post("/send", (req, res) => {
    try {
        const { location, user, text, character, isDice, isGM } = req.body;
        const allMessages = getAllMessages();

        if (!text && !isDice) return res.status(400).json({ error: "Пустое сообщение" });

        let finalMessage = text;
        let senderName = user;
        let isMasterAction = false;

        // ЛОГИКА ГОЛОСА МИРА (Только для Fox01)
        if (isGM && user === ADMIN_LOGIN) {
            senderName = "✨ ЛЕГЕНДА ЛЕСА";
            isMasterAction = true;
        } 
        // ЛОГИКА КУБИКА
        else if (isDice) {
            const roll = Math.floor(Math.random() * 20) + 1;
            finalMessage = `🎲 Бросок d20: **${roll}**`;
        }

        const newMessage = {
            id: Date.now() + "_" + Math.random().toString(36).substr(2, 5),
            location,
            user: senderName,
            character: isMasterAction ? null : (character || null), // GM не использует маску
            text: finalMessage,
            isDice: isDice || false,
            isGM: isMasterAction, // Флаг для золотого стиля на фронтенде
            isSystem: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        allMessages.push(newMessage);
        
        // Ограничение истории для производительности
        if (allMessages.length > 1000) allMessages.shift();

        fs.writeFileSync(FILE, JSON.stringify(allMessages, null, 2));
        res.json({ status: "ok", message: newMessage });
    } catch (err) {
        res.status(500).json({ error: "Ошибка отправки" });
    }
});

// 3. МОДЕРАЦИЯ: ЗАМЕНА СООБЩЕНИЯ ЗАГЛУШКОЙ
router.post("/delete", (req, res) => {
    try {
        const { id, adminName } = req.body;
        if (adminName !== ADMIN_LOGIN) return res.status(403).json({ error: "Доступ запрещен" });

        let allMessages = getAllMessages();
        const msgIndex = allMessages.findIndex(m => m.id === id);

        if (msgIndex !== -1) {
            allMessages[msgIndex].text = `🛑 Сообщение удалено модератором комнаты **${adminName}**`;
            allMessages[msgIndex].isDeleted = true;
            
            fs.writeFileSync(FILE, JSON.stringify(allMessages, null, 2));
            res.json({ status: "ok" });
        } else {
            res.status(404).json({ error: "Сообщение не найдено" });
        }
    } catch (err) {
        res.status(500).json({ error: "Ошибка модерации" });
    }
});

// 4. ДИСЦИПЛИНА: ПОЛНАЯ ОЧИСТКА ЛОКАЦИИ
router.post("/clear", (req, res) => {
    try {
        const { location, adminName } = req.body;
        if (adminName !== ADMIN_LOGIN) return res.status(403).json({ error: "Нет прав" });

        let allMessages = getAllMessages();
        
        // Фильтруем, удаляя сообщения текущей локации
        const filteredMessages = allMessages.filter(m => m.location !== location);
        
        // Добавляем системную отметку об очистке
        filteredMessages.push({
            id: "sys_" + Date.now(),
            location: location,
            user: "СИСТЕМА",
            text: `✨ Хранитель **${adminName}** очистил чат. Листва этого места снова чиста.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
        });

        fs.writeFileSync(FILE, JSON.stringify(filteredMessages, null, 2));
        res.json({ status: "ok" });
    } catch (err) {
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

module.exports = router;