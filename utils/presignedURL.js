const {pool, s3Client} = require('../db.js');
const S3Presigner = require("@aws-sdk/s3-request-presigner");
const S3 = require("@aws-sdk/client-s3");

const getPresignedURL = async (img_uuid) => {
    try {
        const command = new S3.GetObjectCommand({
        Bucket: process.env.BUCKET,
        Key: img_uuid,
        });
        const presignedURL = await S3Presigner.getSignedUrl(
            s3Client,
            command,
            {expiresIn: 3600}
        );
    return presignedURL;
    } catch (error) {
        console.log(error);
    }
    
}

module.exports = getPresignedURL