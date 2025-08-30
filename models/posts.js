const {pool, s3Client} = require('../db.js');
const getPresignedURL = require('../utils/presignedURL.js');
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
exports.getAllPosts = async (query={}) =>{
    const conn = await pool.getConnection();
    //let sqlQ=`SELECT * FROM posts WHERE 1=1`//-- WHERE 1=1 is ai
    
    //-- ai did coalesce and suggested LEFT JOIN instead of JOIN
    const values=[]
    let sqlQ = `SELECT 
    posts.id AS post_id, posts.user_id AS user_id,
    users.username AS username, posts.imgUUID AS imgUUID,
    posts.title AS title, posts.ai_species as ai_species,
    COALESCE(vote_sum.votes, 0) AS votes,
    posts.posted_at AS posted_at
    FROM posts
    JOIN users ON posts.user_id=users.id
    LEFT JOIN (
        SELECT SUM(vote) AS votes, post_id
        FROM post_votes GROUP BY post_id
        ) vote_sum ON posts.id = vote_sum.post_id
    WHERE 1=1
    `
    
    //query builder
    if (query.ai_species) {//-- ai generated species filter
         const speciesList = Array.isArray(query.ai_species) ? query.ai_species : query.ai_species.split(",");
         const placeholders = speciesList.map(() => "?").join(","); 
         sqlQ += ` AND ai_species IN (${placeholders})`;
        values.push(...speciesList);
    }
    if (query.users){
        const userList = Array.isArray(query.users) ? query.users : query.users.split(",");
        const placeholders = userList.map(() => "?").join(","); 
          sqlQ += ` AND ai_species IN (${placeholders})`;
         values.push(...userList);
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
    
    const rows = await conn.query(sqlQ,values);
    conn.release();
    console.log('replace imgUUID with presigned link, paginate, filter, link votes somehow')
    //TODO FIX IMPORTANT
    // in rows remove imgUUID and replace with presigned URL\
    
    const updatedRows = await Promise.all( //-- ai gen from pervious iteration
        rows.map(async row => {
            const presignedURL = await getPresignedURL(row.imgUUID);
            row.imgURL = presignedURL;
            delete row.imgUUID;
            return row;
        })
    );
    return updatedRows;
    
};

//TODO show votes in this get
exports.getPostById = async(id) =>{
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM posts WHERE id = ?',[id]);
    conn.release();
    // removing uuid and adding presigned link
    const post = rows[0]
    const presignedURL = await getPresignedURL(post.imgUUID);
    post.imgURL= presignedURL
    delete post.imgUUID;
    return rows[0];
};

//FIX switch to imgUUID
exports.createPost = async (user_id, imgUUID, title, ai_species, visibility='visible') => {
    if (!ai_species){
        ai_species='pending';
    }
    const conn = await pool.getConnection();
    const result = await conn.query(`
        INSERT INTO posts ( user_id, imgUUID, title, ai_species, visibility
        ) VALUES (?, ?, ?, ?, ?)`,[user_id, imgUUID, title, ai_species, visibility]);
    conn.release();
    const post_id = Number(result.insertId)
    return post_id;///check
}

exports.updateBirdPrediction = async (post_id, prediction) =>{
    const conn = await pool.getConnection();
    try{
        const result = await conn.query(`
                UPDATE posts
                SET ai_species = ?
                WHERE id = ?`, [prediction, post_id]);
    } catch (error){
        console.error(error);
    }finally{
        conn.release();
    }
    
}
// update
//Do we need an update? yeah for visibility at least
//is there a better way to do this? probably joining strings...
//FIX, please, this is bad
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

exports.getPostVotes = async (post_id)=>{
    const conn = await pool.getConnection();
    const result = await conn.query(`
        SELECT SUM(vote) FROM post_votes WHERE post_id=?`,[post_id]);
    conn.release();
    return result; //check format, may need to be result[0]
}