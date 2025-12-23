const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const FILE = path.join(__dirname, "../data/characters.json");

router.get("/", (req, res) => {
  const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
  res.json(data);
});

router.post("/save", (req, res) => {
  const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
  data.push(req.body);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  res.json({ status: "ok" });
});

module.exports = router;