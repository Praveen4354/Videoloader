const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.static("public"));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Download folder
const DOWNLOAD_DIR = path.join(__dirname, "downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

// API
app.get("/api/download", (req, res) => {
  const { id, fmt } = req.query;

  if (!id) return res.status(400).send("Missing video ID");

  const url = `https://www.youtube.com/watch?v=${id}`;
  const filePath = path.join(DOWNLOAD_DIR, `${id}.mp4`);

  let format = "best";
  if (fmt === "720p") format = "best[height<=720]";
  if (fmt === "1080p") format = "best[height<=1080]";
  if (fmt === "4k") format = "best"; // safer for Railway

  const command = `${__dirname}/yt-dlp -f "${format}" -o "${filePath}" ${url}`;

  exec(command, (err, stdout, stderr) => {
    console.log("COMMAND:", command);
    console.log("STDOUT:", stdout);
    console.log("STDERR:", stderr);

    if (err) {
      console.error("ERROR:", err);
      return res.status(500).send("Download failed");
    }

    res.download(filePath, () => {
      fs.unlink(filePath, () => {});
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
