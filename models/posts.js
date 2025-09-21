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
    const client = await pool.connect();
    //let sqlQ=`SELECT * FROM posts WHERE 1=1`//-- WHERE 1=1 is ai
    
    //-- ai did coalesce and suggested LEFT JOIN instead of JOIN
    const values=[]
    let sqlQ = `SELECT 
    posts.id AS post_id, posts.user_id AS user_id,
    users.username AS username, posts.img_uuid AS img_uuid,
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
    let count = 1;
    //query builder
    if (query.ai_species) {//-- ai generated species filter
         const speciesList = Array.isArray(query.ai_species) ? query.ai_species : query.ai_species.split(",");
         const placeholders = speciesList.map(() => `$${count++}`).join(","); 
         sqlQ += ` AND ai_species IN (${placeholders})`;
        values.push(...speciesList);
    }
    if (query.title){
        sqlQ+=` AND title ILIKE $${count++}`
        values.push(`%${query.title}%`)
    }
    if (query.username){
        sqlQ+=` AND username ILIKE $${count++}`
        values.push(`%${query.username}%`)
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
    
    const result = await client.query(sqlQ,values);
    client.release();
    console.log('replace img_uuid with presigned link, paginate, filter, link votes somehow')
    //TODO FIX IMPORTANT
    // in rows remove img_uuid and replace with presigned URL\
    
    const updatedRows = await Promise.all( //-- ai gen from pervious iteration
        result.rows.map(async row => {
            console.log(`CACHE THIS url, or just ave to db, FIX`)
            const presignedURL = await getPresignedURL(row.img_uuid);
            row.imgURL = presignedURL;
            delete row.img_uuid;
            return row;
        })
    );
    return updatedRows;
    
};

//TODO show votes in this get
exports.getPostById = async(id) =>{
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM posts WHERE id = $1',[id]);
    client.release();
    // removing uuid and adding presigned link
    const post = result.rows[0]
    const presignedURL = await getPresignedURL(post.img_uuid);
    post.imgURL= presignedURL
    delete post.img_uuid;
    return result.rows[0];
};

//FIX switch to img_uuid
exports.createPost = async (user_id, img_uuid, title, ai_species, visibility='visible') => {
    if (!ai_species){
        ai_species='pending';
    }
    const client = await pool.connect();
    const result = await client.query(`
        INSERT INTO posts ( user_id, img_uuid, title, ai_species, visibility
        ) VALUES ($1,$2,$3, $4, $5)
         RETURNING id`,[user_id, img_uuid, title, ai_species, visibility]);
    client.release();
    const post_id = result.rows[0].id
    return post_id;///check
}

exports.updateBirdPrediction = async (post_id, prediction) =>{
    const client = await pool.connect();
    try{
        const result = await client.query(`
                UPDATE posts
                SET ai_species = $1
                WHERE id = $2`, [prediction, post_id]);
    } catch (error){
        console.error(error);
    }finally{
        client.release();
    }
    
}
// update
//Do we need an update? yeah for visibility at least
//is there a better way to do this? probably joining strings...
//FIX, please, this is bad
exports.updatePostById = async (id,visibility,title)=>{
    const client = await pool.connect();
    let visResult;
    let titleResult;
    if (visibility){
        visResult= await client.query(`
            UPDATE posts
            SET visibility =$1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2`, [visibility, id])
    } else {
        visResult = {rowCount:-1};
    }

    if (title){
        titleResult= await client.query(`
            UPDATE posts
            SET title =$1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2`, [title, id])
    } else {
        titleResult = {rowCount:-1};
    }
    client.release();
    return {
        visUpdated: visResult.rowCount > 0,
        titleUpdated: titleResult.rowCount > 0}
};

// delete
exports.deletePostById = async(post_id, user_id) =>{
    const client = await pool.connect();
    const result  = await client.query(
        `DELETE FROM posts
        WHERE id = $1 AND user_id =$2`,[post_id, user_id]);
    client.release();
    return { deleted: result.rowCounts > 0 };
};

//vote
exports.voteOnPost = async (user_id, post_id, vote)=>{
    const client = await pool.connect();
    const result = await client.query(`
        INSERT INTO post_votes (user_id, post_id, vote)
        VALUES ($1,$2,$3)
        ON CONFLICT (user_id, post_id) DO UPDATE
            SET vote = EXCLUDED.vote`,[user_id, post_id, vote]
    );
    client.release();
    return result;//unused
};

exports.getPostVotes = async (post_id)=>{
    const client = await pool.connect();
    const result = await client.query(`
        SELECT SUM(vote) FROM post_votes WHERE post_id=$1`,[post_id]);
    client.release();
    return result.rows; //check format, may need to be result[0]
}