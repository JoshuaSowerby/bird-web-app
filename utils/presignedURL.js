const {s3Client} = require('../db.js');
const S3Presigner = require("@aws-sdk/s3-request-presigner");
const S3 = require("@aws-sdk/client-s3");
const memcached = require('../utils/cache.js');


const getPresignedURL = async (img_uuid) => {
    try {
        const cacheKey=`getPresignedURL:${img_uuid}`;
        console.log("try cache getPresignedURL")
        const value = await memcached.aGet(cacheKey);
        if (value) {
            console.log(`cached result for ${cacheKey}`);
            return value;
        }
        console.log(`no cached for ${cacheKey}`);
        const command = new S3.GetObjectCommand({
            Bucket: process.env.BUCKET,
            Key: img_uuid,
        });
        const presignedURL = await S3Presigner.getSignedUrl(
            s3Client,
            command,
            {expiresIn: 3600}
        );
        await memcached.aSet(cacheKey, presignedURL, 1800);
        return presignedURL;       
    } catch (error) {
        console.log(error);
    }
    
}

module.exports = getPresignedURL
