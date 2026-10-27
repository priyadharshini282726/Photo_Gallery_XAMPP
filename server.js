const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "photo_gallery"
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
  } else {
    console.log("MySQL connected successfully.");
    connection.release();
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_");
    cb(null, Date.now() + "-" + safeName + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    if (allowed.test(path.extname(file.originalname)) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, JPEG, PNG, GIF and WEBP images are allowed."));
    }
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

app.get("/api/albums", (req, res) => {
  db.query("SELECT * FROM albums ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/albums", (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Album name is required." });

  db.query("INSERT INTO albums (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, name });
  });
});

app.delete("/api/albums/:id", (req, res) => {
  const id = Number(req.params.id);

  db.query("SELECT COUNT(*) AS count FROM photos WHERE album_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    if (rows[0].count > 0) {
      return res.status(400).json({
        error: "Delete or move the photos in this album before deleting the album."
      });
    }

    db.query("DELETE FROM albums WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Album deleted." });
    });
  });
});

app.get("/api/photos", (req, res) => {
  const albumId = req.query.album;

  let sql = `
    SELECT photos.*, albums.name AS album_name
    FROM photos
    LEFT JOIN albums ON photos.album_id = albums.id
  `;
  const params = [];

  if (albumId && albumId !== "all") {
    sql += " WHERE photos.album_id = ?";
    params.push(Number(albumId));
  }

  sql += " ORDER BY photos.created_at DESC";

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/photos", upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Please select an image." });

  const title = String(req.body.title || req.file.originalname).trim();
  const albumId = req.body.album_id ? Number(req.body.album_id) : null;

  db.query(
    "INSERT INTO photos (title, filename, album_id) VALUES (?, ?, ?)",
    [title, req.file.filename, albumId],
    (err, result) => {
      if (err) {
        fs.unlink(req.file.path, () => {});
        return res.status(500).json({ error: err.message });
      }

      res.json({
        id: result.insertId,
        title,
        filename: req.file.filename,
        album_id: albumId
      });
    }
  );
});

app.delete("/api/photos/:id", (req, res) => {
  const id = Number(req.params.id);

  db.query("SELECT filename FROM photos WHERE id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length) return res.status(404).json({ error: "Photo not found." });

    const filename = rows[0].filename;

    db.query("DELETE FROM photos WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      fs.unlink(path.join(uploadDir, filename), () => {});
      res.json({ message: "Photo deleted." });
    });
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Photo Gallery running at http://localhost:${PORT}`);
});