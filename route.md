# `api/v1/bird`
## `GET`
- will get all posts
- allow filters, sorting and pagination
## `POST`
- will post
- upon post use a CNN to identify the bird.
- look at photo metadata for location?

# `api/v1/bird/:postId`
## `GET`
- gets a specific post
## `api/v1/bird/:postId/vote`
### `PUT`
- vote on the post
## `UPDATE`
## `DELETE`
# `api/v1/bird/:postId/comment`
- post comments
## `GET`
- will get all comments 
- allow filters, sorting and pagination
## `POST`
- will post a comment
- specify parent comment in body if exists
## `UPDATE`
## `DELETE`
## `api/v1/bird/:postId/comment/:commentId/vote`
### `PUT`
- vote on the post

# `api/v1/auth`
## `POST`
- login and register

# `api/v1/friend`
- incomplete
- get friends
- post request, response