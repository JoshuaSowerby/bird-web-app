const pool = require('../db.js');

// There isn't any input validation in this...
//should almost everything be in a try catch clause?
/*
apparently everything should be
const conn = await pool.getConnection();
try {
    CODE...
} finally {
    conn.release();
};
*/

//add pagination and querying
exports.getAllPosts = async () =>{
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM posts');
    conn.release();
    return rows;
};

exports.getPostById = async(id) =>{
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM posts WHERE id = ?',[id]);
    conn.release();
    return rows[0];
};

exports.createPost = async (user_id, imgURL, title, ai_species, visibility='visible') => {
    
    const conn = await pool.getConnection();
    const result = await conn.query(`
        INSERT INTO posts ( user_id, imgURL, title, ai_species, visibility
        ) VALUES (?, ?, ?, ?, ?)`,[user_id, imgURL, title, ai_species, visibility]);
    conn.release();
    return result.insertId;///check
}

// update
//Do we need an update? yeah for visibility at least
//is there a better way to do this? probably joining strings...
exports.updatePostById = async (id,visibility,title)=>{
    const conn = await pool.getConnection();
    let visResult;
    let titleResult;
    if (visibility){
        visResult= await conn.query(`
            UPDATE posts
            SET visibility =?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`, [visibility, id])
    } else {
        visResult = {affectedRows:-1};
    }

    if (title){
        titleResult= await conn.query(`
            UPDATE posts
            SET title =?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`, [title, id])
    } else {
        titleResult = {affectedRows:-1};
    }
    conn.release();
    return {
        visUpdated: visResult.affectedRows > 0,
        titleUpdated: titleResult.affectedRows > 0}
};

// delete
exports.deletePostById = async(post_id, user_id) =>{
    const conn = await pool.getConnection();
    const result  = await conn.query(
        `DELETE FROM posts
        WHERE id = ? AND user_id =?`,[post_id, user_id]);
    conn.release();
    return { deleted: result.affectedRows > 0 };
};

//vote
exports.voteOnPost = async (user_id, post_id, vote)=>{
    const conn = await pool.getConnection();
    const result = await conn.query(`
        INSERT INTO post_votes (user_id, post_id, vote)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            vote = VALUES(vote)`,[user_id, post_id, vote]
    );
    conn.release();
    return result;
};

exports.getVotes = async (post_id)=>{
    const conn = await pool.getConnection();
    const result = await conn.query(`
        SELECT SUM(vote) FROM post_votes WHERE post_id=?`,[post_id]);
    conn.release();
    return result; //check format, may need to be result[0]
}