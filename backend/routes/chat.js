const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const CHARS_PATH = path.join(__dirname, "../data/characters.json");
const MESSAGES_PATH = path.join(__dirname, "../data/messages.json");

// Гарантируем наличие папки data и файлов
if (!fs.existsSync(path.join(__dirname, "../data"))) fs.mkdirSync(path.join(__dirname, "../data"));
if (!fs.existsSync(MESSAGES_PATH)) fs.writeFileSync(MESSAGES_PATH, JSON.stringify([]));

router.get("/messages", (req, res) => {
    try {
        const data = fs.readFileSync(MESSAGES_PATH, "utf8");
        res.json(JSON.parse(data));
    } catch (e) { res.json([]); }
});

router.post("/send", (req, res) => {
    try {
        const { charName, text, location } = req.body;
        if (!charName || !text) return res.status(400).json({ error: "Empty fields" });

        let messages = JSON.parse(fs.readFileSync(MESSAGES_PATH, "utf8"));
        
        // Находим или создаем персонажа для опыта
        let characters = JSON.parse(fs.readFileSync(CHARS_PATH, "utf8"));
        let char = characters.find(c => c.name === charName);
        let levelUp = false;

        if (char) {
            char.exp = (char.exp || 0) + 10;
            let nextLvl = (char.level || 1) * 100;
            if (char.exp >= nextLvl) {
                char.level = (char.level || 1) + 1;
                levelUp = true;
            }
            fs.writeFileSync(CHARS_PATH, JSON.stringify(characters, null, 2));
        }

        const newMessage = {
            charName,
            text,
            location: location || "Листвейн",
            timestamp: new Date().toLocaleTimeString(),
            title: char ? (char.title || "Путешественник") : "Гость"
        };

        messages.push(newMessage);
        if (messages.length > 50) messages.shift();
        fs.writeFileSync(MESSAGES_PATH, JSON.stringify(messages, null, 2));

        res.json({ success: true, levelUp });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
