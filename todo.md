# A2 todo
---

alot of this is AWS side...
# DATABASE
- all instances of client need to be wrapped in try{...}finally{client.release()}

# CPU intensive (statelessness)
- move the classification to a queue (AWS SQS) so that if it looses its state we dont get a bunch of incomplete things
- a separate docker container would likely deal with the queue.
- please test
# Services
- move Maria to the managed postgres **<--- do this first**
- ~~replace `ON DUPLICATE KEY UPDATE` with ` ON CONFLICT` ...~~ you will have to do this on case by case basis, im not putting the full thing here
- ~~replace `result.affectedRows` with `result.rowCount`~~
    - `getAllPosts` `getAllComments` need to be fixed
    - all the returns will be broken
        - ~~replace `result` with `result.rows`~~
            - there are some unclear cases, will need to test more
        - ~~`.insertId` needs to be replaced with `RETURNING id` added to query then `result.rows[0].id`~~
    - ~~`client.query()` returns `{ rows: [...] }`~~ replaced, needs to be tested
        - change all `results` that match this to accommodate
    - ~~postgres uses snake_case for tables and unless you "" them they will go to lower case.~~
    - fix the query builder, especially its use of `?`
    - FIXED..~~`.insertId` is not available, instead do like:~~
    ```
    const result = await client.query(
    `INSERT INTO users (username, email, pw_hash)
    VALUES ($1, $2, $3)
    RETURNING id;`,
    [username, email, pw_hash]
    );

    const user_id = result.rows[0].id;
    ```
    - change the following:
        - 
        - ~~`imgUUID` -> `img_uuid`~~
            - I just replaced all, don't think it will mess up.
        - ~~`await pool.getConnection()` -> `await pool.connect()`~~
        - ~~`conn` -> `client`~~
        -~~`LIKE` -> `ILIKE`~~
        - ~~`?` -> `$1` or `$2` etc ALSO the thing we use to generate them in the query builders~~
    - ~~fix queries to be like `await client.query('INSERT INTO users(name) VALUES($1)', ['Alice']);`~~
- implement cognito
	- federated login
	- MFA
	- maybe admin role (they can delete anything etc)
- implement the secret store
# presigned
- fix the current presigend to not create a new one every time, put it in its own table
- should we be able to upload via one too?
# Set up route 53
- self explanatory

# Additional

## IaC

## Caching?
- could cache top filter, things like that
- should add pagination would help out with this, then could cache first page etc

## additional service
- move votes to dynamo or the like.


---
# A1 todo
---

# Core
- ## 80% cpu for 5 minutes
    - If img classifier doesn't then increase input size
- ## script to reach 80% for 5 mins
    - allow bulk uploading
- ## 2 data types
    - images, todo
    - ~~ACID data from relational db...~~
- ## containerize and store on AWS ECR
- 1.  find out how to set up the .venv for python automatically
- 2. have docker run a "setup" file first that ensures that our db and s3 bucket are working
- ## pull for AWS ECR to EC2
- ## ~~API that can be used as primary interface~~
- ## user login with session management using JWT, users have meaningful difference
    - login
    - jwt
    - ~~differences, you can only delete your posts, post ownerships etc~~
# Additional
- ## extended api
    - ~~versioning~~
        - debatable if we do this because I doubt we will get off v0 during this project
    - pagination
    - filtering
    - sorting
- ## ~~custom processing~~
    - the bird classifier
- ## Infrastructure as code
    - uses infrastructure-as-code technologies such as Docker Compose, CloudFormation, or the CDK
- ## web client that uses all endpoints


# IMPLEMENT IMG UPLOAD...
- use S3 bucket
- replace the img URL with the key value in the mariaDB.
- on GET return a presigned URL in the response rather that the key value
- no point in presigned for upload, as we would just have to dl to classify.
- presigned on dl would work though
- use form-data instead, so we can use multipart/form-data. so we don't have to upload binaries... we will need multer
    - https://www.youtube.com/watch?v=srPXMt1Q0nY

# switch votes to dynamoDB
- do this too fulfill structured non ACID?
- essentially add votes to the post and comments table, but this variable points to the dynamoDB

# potential problem with models.py on EC2
- my of fixed this, would recommend brining dinoV2 model locally so we don't have to import it...
```
SqlError: (conn:3, no: 1406, SQLState: 22001) Data too long for column 'ai_species' at row 1
sql:
                UPDATE posts
                SET ai_species = ?
                WHERE id = ? - parameters:['Downloading: "https://github.com/facebookresearch/dinov2/zipball/main" to /home/ubuntu/.cache/torch/hub/main.zip
Downloading: "https://dl.fbaipubli...
    at module.exports.createError (/home/ubuntu/bird-web-app/node_modules/mariadb/lib/misc/errors.js:66:10)
    at PacketNodeEncoded.readError (/home/ubuntu/bird-web-app/node_modules/mariadb/lib/io/packet.js:588:19)
    at Query.handleErrorPacket (/home/ubuntu/bird-web-app/node_modules/mariadb/lib/cmd/parser.js:92:24)
    at Query.readResponsePacket (/home/ubuntu/bird-web-app/node_modules/mariadb/lib/cmd/parser.js:70:21)
    at PacketInputStream.receivePacketBasic (/home/ubuntu/bird-web-app/node_modules/mariadb/lib/io/packet-input-stream.js:85:9)
    at PacketInputStream.onData (/home/ubuntu/bird-web-app/node_modules/mariadb/lib/io/packet-input-stream.js:135:20)
    at Socket.emit (node:events:518:28)
    at addChunk (node:internal/streams/readable:561:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
    at Readable.push (node:internal/streams/readable:392:5) {
  sqlMessage: "Data too long for column 'ai_species' at row 1",
  sql: '\n' +
    '                UPDATE posts\n' +
    '                SET ai_species = ?\n' +
    `                WHERE id = ? - parameters:['Downloading: "https://github.com/facebookresearch/dinov2/zipball/main" to /home/ubuntu/.cache/torch/hub/main.zip\n` +
    'Downloading: "https://dl.fbaipubli...',
  fatal: false,
  errno: 1406,
  sqlState: '22001',
  code: 'ER_DATA_TOO_LONG'
}

```

# Misc
- ~~fix req.params.___~~
    - ~~to use .params rather than .body~~
    - ~~to use consistent naming~~
- some way to reclassify images using the model, or ask it to try again...
- add input validation to routes
- add more status codes
- add console.log() to confirm things are working
- add bulk post functionality
- add get for users
    - GET name
    - GET posts
    - GET comments
    - GET post/comment votes etc
# SECURITY
- the final version should't just send them the error, it should be specific to what they did wrong, they don't need to know...
    - for example if you try to send a duplicate register, it will show you your passwords hash etc
- think there are others, find FIX and TODO to see them in comments

# optional change
- move python to its own container, pass the uuid to it so it outputs uuid and pred then watch its  stdout and commit it...

# Check endpoints
- should try again with token  of other user...
## `/api/v0/auth`
- POST `/register`
    - register succeeds
    - duplicate register fails
- POST `/login`
    - correct details
        - works
        - returns valid JWT with correct .user_id
    - incorrect email
        - {"message":"Cannot read properties of undefined (reading 'pw_hash')"}
    - incorrect pw
        - {"message":"invalid credentials"}
## `/api/v0/bird/posts`
- POST `/`
    - unverified is unable to post
    - unable to post without imgURL, should add input val for everything
    - can successfully post
        - on post the ai_species will be 'pending'
        - once the model is finished it should update the post.
- GET `/`
    - no posts returns: `[]`
    - more than 0 posts returns: valid return
    - TODO, sort and filter by votes, species etc
    - make votes visible in get so we don't need seperate for votes...
- GET `/post:id`
    - works
    - on invalid id it returns nothing, it should give 404
- DELETE `/post:id`
    - authorized: works, will send success if row failed to delete (such as if it doesn't exist), but will tell you it didnt delete in "results"
    - invalid token: fails
- PUT `/:post_id/vote`
    - unauth: access denied
    - auth: succeeds with -1, 0, 1
        - invalid number/input: bad error message, improve
- GET `/:post_id/vote`
    - correctly returns? try with more users
    - returns null by default
## `/api/v0/bird/posts/:postId/comments`
- POST `/`
    - works
- GET `/`
    - works, kind of bad at the moment as it doesn't nest comments of comments. would be better if it sent them formatted better, or paginated...
    - TODO, filter and sort comments based off votes
        - SHOW VOTES in get
- GET `/:commentId`
    - works
- DELETE `/:commentId`
    - works
- PUT `/:commentId/vote`
    - works
- GET `/:commentId/vote`
    - works, but null by default
- no ability to update comment?
    - there is a models func for this so add it later
