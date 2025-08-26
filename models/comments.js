const pool = require('../db.js');

//add pagination and querying
exports.getAllComments = async () =>{
    const conn = await pool.getConnection();
    try{
        const rows = await conn.query('SELECT * FROM comments');
        return rows;
    } finally {
        conn.release();
    };
};

exports.getCommentById = async(id) =>{
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM comments WHERE id = ?',[id]);
    conn.release();
    return rows[0];
};

//TEST to see if the parent_id if/else works
exports.createComment = async (user_id, post_id, text, parent_id) => {
    const conn = await pool.getConnection();
    try{
        let result;
        if (parent_id){
            result = await conn.query(`
                INSERT INTO comments ( user_id, post_id, text, parent_id)
                VALUES (?, ?, ?, ?)`,[user_id, post_id, text, parent_id]);
        } else{
            result = await conn.query(`
                INSERT INTO comments ( user_id, post_id, text)
                VALUES (?, ?, ?)`,[user_id, post_id, text]);
        }
        
        return result.insertId;
    } finally{conn.release()};
};

// update
exports.updateCommentById = async (post_id, user_id,text)=>{
    const conn = await pool.getConnection();
    const result= await conn.query(`
        UPDATE comments
        SET text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id =?`, [text, post_id, user_id]
    );
    conn.release();
    return { updated: result.affectedRows > 0};
};

// delete
exports.deleteCommentById = async(comment_id, user_id) =>{
    const conn = await pool.getConnection();
    const result  = await conn.query('DELETE FROM comments WHERE id = ? AND user_id =?',[comment_id, user_id]);
    conn.release();
    return { deleted: result.affectedRows > 0 };
};

//vote
exports.voteOnComment = async (user_id, comment_id, vote)=>{
    const conn = await pool.getConnection();
    const result = await conn.query(`
        INSERT INTO comment_votes (user_id, comment_id, vote)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            vote = VALUES(vote)`,[user_id, comment_id, vote]
    );
    conn.release();
    return result;
};

exports.getCommentVotes = async (comment_id)=>{
    const conn = await pool.getConnection();
    const result = await conn.query(`
        SELECT SUM(vote) FROM comment_votes WHERE comment_id=?`,[comment_id]);
    conn.release();
    return result; //check format, may need to be result[0]
}