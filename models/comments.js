const {pool} = require('../db.js');

//need a get replies...

//add pagination and querying
exports.getAllComments = async (query={}) =>{
    const conn = await pool.getConnection();
    try{
        //would be good if we could get number of replies...
        const values=[]
        let sqlQ = `SELECT 
        comments.id AS comment_id, comments.parent_id AS parent_id,
        comments.user_id AS user_id, users.username AS username,
        comments.text AS text, COALESCE(vote_sum.votes, 0) AS votes,
        comments.posted_at AS posted_at
        FROM comments
        JOIN users ON comments.user_id=users.id
        LEFT JOIN (
            SELECT SUM(vote) AS votes, comment_id
            FROM comment_votes GROUP BY comment_id
            ) vote_sum ON comments.id = vote_sum.comment_id
        WHERE 1=1
        `
        //query builder
        if (query.username){
        const usernameList = Array.isArray(query.users) ? query.users : query.users.split(",");
        const placeholders = usernameList.map(() => "?").join(","); 
          sqlQ += ` AND username IN (${placeholders})`;
         values.push(...usernameList);
        }
        //should add date query for before and after...
        if (query.voteLimit){
            const voteLimit = parseInt(query.voteLimit);
            if (!isNaN(voteLimit)){
                sqlQ += ` AND votes >= ?`;
                values.push(voteLimit);
            }
        }
        try {
            if (query.sortBy){
            let sortBy="";
            switch(query.sortBy.toUpperCase()){
                case 'VOTES':
                    sortBy="votes";
                    break;
                case 'POSTED_AT':
                    sortBy="posted_at";
                    break;
                default:
                    sortBy="votes"

            }
            if (query.order){
                const order = query.order.toUpperCase();
                if (order==='ASC'||order==="DESC"){
                    sqlQ += ` ORDER BY ${sortBy} ${order}`;
                }
            }
        }
        } catch (error) {
            console.log(error);
        }

        const rows = await conn.query(sqlQ, values);
        console.log('add pagination, query, make pretty...show vote count...')
        return rows;
    } finally {
        conn.release();
    };
};

exports.getCommentById = async(id) =>{
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM comments WHERE id = ?',[id]);
    conn.release();
    console.log('show vote count...')
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
        const comment_id = Number(result.insertId)
        return comment_id;
    } finally{conn.release()};
};

// update
exports.updateCommentById = async (comment_id, user_id,text)=>{
    const conn = await pool.getConnection();
    const result= await conn.query(`
        UPDATE comments
        SET text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id =?`, [text, comment_id, user_id]
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
    return result.affectedRows>0;
};

exports.getCommentVotes = async (comment_id)=>{
    const conn = await pool.getConnection();
    const result = await conn.query(`
        SELECT SUM(vote) FROM comment_votes WHERE comment_id=?`,[comment_id]);
    conn.release();
    return result; //check format, may need to be result[0]
}