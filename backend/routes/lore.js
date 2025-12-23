const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const FILE = path.join(__dirname, "../data/lore.json");

router.get("/", (req, res) => {
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    res.json(data);
});

module.exports = router;