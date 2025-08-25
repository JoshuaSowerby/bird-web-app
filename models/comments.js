const pool = require('../db.js');

//add pagination and querying
exports.getAll = async () =>{
    const conn = await pool.getConnection();
    try{
        const rows = await conn.query('SELECT * FROM comments');
        return rows;
    } finally {
        conn.release();
    };
};

exports.getById = async(id) =>{
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM comments WHERE id = ?',[id]);
    conn.release();
    return rows[0];
};

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
        
        return { id: Number(result.insertId)};
    } finally{conn.release()};
};

// update
exports.updateById = async (id,text)=>{
    const conn = await pool.getConnection();
    const result= await conn.query(`
        UPDATE comments
        SET text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`, [text, id]
    );
    conn.release();
    return { updated: result.affectedRows > 0};
};

// delete
exports.deleteById = async(id) =>{
    const conn = await pool.getConnection();
    const result  = await conn.query('DELETE FROM comments WHERE id = ?',[id]);
    conn.release();
    return { deleted: result.affectedRows > 0 };
};

//vote
exports.voteOnPost = async (user_id, comment_id, vote)=>{
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

exports.getVotes = async (comment_id)=>{
    const conn = await pool.getConnection();
    const result = await conn.query(`
        SELECT SUM(vote) FROM comment_votes WHERE comment_id=?`,[comment_id]);
    conn.release();
    return result; //check format, may need to be result[0]
}