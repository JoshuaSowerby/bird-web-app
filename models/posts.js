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
exports.getAllPosts = async () =>{
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM posts');
    conn.release();
    console.log('replace imgUUID with presigned link, paginate, filter, link votes somehow')
    //TODO FIX IMPORTANT
    // in rows remove imgUUID and replace with presigned URL\
    
    const updatedRows = await Promise.all( //-- ai
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