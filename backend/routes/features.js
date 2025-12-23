const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const DIARY_FILE = path.join(__dirname, "../data/diaries.json");
const USERS_FILE = path.join(__dirname, "../data/users.json");

// --- СТАТУС ОНЛАЙН ---
router.post("/ping", (req, res) => {
    const { username } = req.body;
    let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    let user = users.find(u => u.username === username);
    if (user) {
        user.lastSeen = Date.now(); // Записываем время активности
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }
    res.json({ status: "ok" });
});

router.get("/online", (req, res) => {
    let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    const now = Date.now();
    // Считаем онлайн тех, кто подавал сигналы в последние 30 секунд
    const onlineUsers = users.filter(u => now - u.lastSeen < 30000).map(u => u.username);
    res.json(onlineUsers);
});

// --- ЛИЧНЫЙ ДНЕВНИК ---
router.get("/diary/:username", (req, res) => {
    const diaries = JSON.parse(fs.readFileSync(DIARY_FILE, "utf8"));
    const userDiary = diaries.filter(d => d.username === req.params.username);
    res.json(userDiary);
});

router.post("/diary/add", (req, res) => {
    const diaries = JSON.parse(fs.readFileSync(DIARY_FILE, "utf8"));
    const newNote = {
        id: Date.now(),
        username: req.body.username,
        text: req.body.text,
        date: new Date().toLocaleDateString()
    };
    diaries.push(newNote);
    fs.writeFileSync(DIARY_FILE, JSON.stringify(diaries, null, 2));
    res.json(newNote);
});

module.exports = router;