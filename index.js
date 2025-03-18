require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

conn.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    return;
  }
  console.log("Connected to the database.");
});

app.get("/", (req, res) => {
  res.send("API is working!");
});

// addSchool - POST
app.post("/addSchool", (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  //Checks if any field is empty
  if (!name || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      error: "All fields (name, address, latitude, longitude) are required.",
    });
  }

  //Checks if the input is of correct data type
  if (typeof name !== "string" || typeof address !== "string") {
    return res
      .status(400)
      .json({ error: "Name and address should be strings." });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude must be valid numbers." });
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({
      error:
        "Latitude must be between -90 and 90, and longitude between -180 and 180.",
    });
  }

  //adds school to database
  const query =
    "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)";
  conn.query(query, [name, address, lat, lon], (err) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err });
    }
    res.status(201).json({ message: "School added successfully!" });
  });
});

// listSchools - Get
app.get("/listSchools", (req, res) => {
  const { latitude, longitude } = req.query;

  //checks if any field is empty
  if (latitude === undefined || longitude === undefined) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required." });
  }
  //checks datatype
  const userLat = parseFloat(latitude);
  const userLon = parseFloat(longitude);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.status(400).json({ error: "Invalid latitude or longitude." });
  }

  //Haversine Formula - to calculate distance
  const query =
    "SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance FROM schools ORDER BY distance";

  conn.query(query, [userLat, userLon, userLat], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database error", details: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "No schools found." });
    }
    res.status(200).json(results);
  });
});

//server listen port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
