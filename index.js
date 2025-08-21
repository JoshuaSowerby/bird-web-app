const express = require('express');
//const express = require("express");
//const mongoose = require("mongoose");
//MySQL, PostgreSQL, MariaDB
//const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// Import routes


const app = express();

// Middleware

// Routes

// Connect to DB


app.listen(PORT, () => console.log(`port:${PORT}`));