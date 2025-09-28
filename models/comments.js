const {pool} = require('../db.js');

//need a get replies...

//add pagination and querying
exports.getAllComments = async (query={}) =>{
    const client = await pool.connect();
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
        let count=1;
        //query builder
        if (query.username){
            sqlQ+=` AND username ILIKE $${count++}`
            values.push(`%${query.username}%`)
        }
        if (query.parent_id && !isNaN(query.parent_id) && query.parent_id>0){
            sqlQ+= ` AND parent_id = $${count++}`
            values.push(query.parent_id);
        }
        if (query.text){
            sqlQ+=` AND text ILIKE $${count++}`
            values.push(`%${query.text}%`)
        }
        //should add date query for before and after...
        if (query.voteLimit){
            const voteLimit = parseInt(query.voteLimit);
            if (!isNaN(voteLimit)){
                sqlQ += ` AND COALESCE(vote_sum.votes, 0) >= $${count++}`;
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

        const result = await client.query(sqlQ, values);
        console.log('add pagination, query, make pretty...show vote count...')
        return result.rows;
    } finally {
        client.release();
    };
};

exports.getCommentById = async(id) =>{
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM comments WHERE id = $1',[Number(id)]);
    client.release();
    console.log('show vote count...')
    return result.rows[0];
};

//TEST to see if the parent_id if/else works
exports.createComment = async (user_id, post_id, text, parent_id) => {
    const client = await pool.connect();
    try{
        let result;
        if (parent_id){
            result = await client.query(`
                INSERT INTO comments ( user_id, post_id, text, parent_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id`,[Number(user_id), Number(post_id), text, Number(parent_id)]);
        } else{
            result = await client.query(`
                INSERT INTO comments ( user_id, post_id, text)
                VALUES ($1, $2, $3)
                RETURNING id`,[Number(user_id), Number(post_id), text]);
        }
        const comment_id = result.rows[0].id;
        return comment_id;
    } finally{client.release()};
};

// update
exports.updateCommentById = async (comment_id, user_id,text)=>{
    const client = await pool.connect();
    const result= await client.query(`
        UPDATE comments
        SET text = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id =$3`, [text, Number(comment_id), Number(user_id)]
    );
    client.release();
    return { updated: result.rowCount > 0};
};

// delete
exports.deleteCommentById = async(comment_id, user_id) =>{
    const client = await pool.connect();
    const result  = await client.query('DELETE FROM comments WHERE id = $1 AND user_id =$2',[Number(comment_id), Number(user_id)]);
    client.release();
    return { deleted: result.rowCount > 0 };
};

//vote
exports.voteOnComment = async (user_id, comment_id, vote)=>{
    const client = await pool.connect();
    const result = await client.query(`
        INSERT INTO comment_votes (user_id, comment_id, vote)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, comment_id) DO UPDATE
            SET vote = EXCLUDED.vote`,[Number(user_id), Number(comment_id), Number(vote)]
    );
    client.release();
    return result.rowCount>0;
};

exports.getCommentVotes = async (comment_id)=>{
    const client = await pool.connect();
    const result = await client.query(`
        SELECT SUM(vote) FROM comment_votes WHERE comment_id=$1`,[Number(comment_id)]);
    client.release();
    return result.rows; //check format
}