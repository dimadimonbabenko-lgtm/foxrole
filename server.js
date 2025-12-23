const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Настройка порта (для облачных сервисов и Ngrok)
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
// cors() без параметров разрешает запросы с ЛЮБЫХ доменов (необходимо для Ngrok)
app.use(cors());
app.use(express.json());

// Раздача статических файлов (если HTML лежит в этой же папке или в public)
app.use(express.static(path.join(__dirname, "../"))); 

// --- ПРОВЕРКА ДИРЕКТОРИЙ ---
// Создаем папку data, если её нет, чтобы сервер не падал
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// --- РОУТЫ ---
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const charRoutes = require("./routes/characters");
const loreRoutes = require("./routes/lore");
const featRoutes = require("./routes/features");

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/characters", charRoutes);
app.use("/api/lore", loreRoutes);
app.use("/api/features", featRoutes);

// Базовый роут для проверки работы сервера
app.get("/", (req, res) => {
    res.send("FoxRole Server is running...");
});

// --- ЗАПУСК ---
// Указываем '0.0.0.0', чтобы сервер принимал внешние запросы через туннель
app.listen(PORT, "0.0.0.0", () => {
    console.log(`
    ============================================
    🦊 СЕРВЕР FOXROLE ЗАПУЩЕН!
    Локально: http://localhost:${PORT}
    Для Ngrok: используйте команду 'ngrok http ${PORT}'
    ============================================
    `);
});