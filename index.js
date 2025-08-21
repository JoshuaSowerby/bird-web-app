const express = require('express');
//const express = require("express");
//const mongoose = require("mongoose");
//MySQL, PostgreSQL, MariaDB
//const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

// Import routes
const authRoutes= require('./router/authRoutes.js');
const birdPostRoutes = require('./router/birdPostRoutes.js');
const commentRoutes = require('./router/commentRoutes.js');

// App
const app = express();

// Middleware
app.use(express.urlencoded({extended:true}));
app.use(express.json());

// Routes
app.use('/api/v0/auth', authRoutes);
app.use('/api/v0/bird/posts', birdPostRoutes);
app.use('/api/v0/bird/posts/:postId/comments', commentRoutes);

// Connect to DB


app.listen(PORT, () => console.log(`port:${PORT}`));