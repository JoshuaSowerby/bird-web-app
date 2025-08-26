const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'pass',
    database: process.env.DB_name || 'birddb',
    connectionLimit: 5, //should I increase this?
});

// Init logic
( async () =>{
    let conn;
    try{
        conn = await pool.getConnection();
        console.log('connected');
        await conn.query(`
            /* users
            - need to properly verify emails etc.
            - also it should be the hash of the password
            */
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                #public_id#should add this, and then change jwt to use it instead,
                username VARCHAR(25) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                pw_hash VARCHAR(60) NOT NULL
            );

            /* posts
            - would be good if we allowed users to add suggested tags
              and allow others to vote on them so we can update the model later
            */
            CREATE TABLE IF NOT EXISTS posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                imgURL VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                #votes INT DEFAULT 0,# has its own table
                ai_species VARCHAR(255),
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                visibility VARCHAR(20) NOT NULL DEFAULT 'visible'
                    CHECK (visibility IN ('hidden', 'visible', 'friends_only')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                post_id INT NOT NULL,
                parent_id INT NULL,
                text VARCHAR(255) NOT NULL,
                #votes INT DEFAULT 0,# has its own table
                posted_at TIMESTAMP DEFAULT_CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
            );

            /* post_votes & comment_votes
            - vote should be from 3 options, +1, 0, -1.
            - If you haven't voted you have no table entry
            */
            CREATE TABLE IF NOT EXISTS post_votes (
                user_id INT NOT NULL,
                post_id INT NOT NULL,
                vote INT CHECK (vote in (-1, 0, 1)),
                PRIMARY KEY (user_id, post_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS comment_votes (
                user_id INT NOT NULL,
                comment_id INT NOT NULL,
                vote INT CHECK (vote in (-1, 0, 1)),
                PRIMARY KEY (user_id, comment_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
            );

            /*
            - later we should add friends so we can change post visibility 
            - also allow blocking users
            */

        `);
    } catch (err) {
        console.error('DB init failed:',err.message);
    } finally {
        if (conn){
            conn.release();
            console.log('connection released');
        }
    }
})();

module.exports = pool;