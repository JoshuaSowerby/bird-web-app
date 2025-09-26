const {pool} = require('../db.js');// FIX this should be in models?


//REGISTER
exports.commitUser = async (username, sub) => {

    const client = await pool.connect();

    try {
        const result =await client.query(`
            INSERT INTO users (username, sub)
            VALUES ($1, $2)
            RETURNING id`,[username, sub]);
        return result.rows[0].id;
    } catch (error){
        throw new Error(`Error registering user: ${error.message}`);
    }
    finally {
        client.release();
    }
};


exports.userIdFromSub = async (sub) =>{
    //cache candidate, TODO
    const client = await pool.connect();
    try {
        const result =await client.query(`
            SELECT id
            FROM users
            WHERE sub =$1`,[sub]);
        return result.rows[0].id;
    } catch (error){
        throw new Error(`Error getting user_id: ${error.message}`);
    }
    finally {
        client.release();
    }
}