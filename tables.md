# Users:
- userId,
- password,
- email,
- name,
# Posts:
- postId
- imgURL
- votes
    - int
- species
    - probably FK, or maybe needs to be in its own table
- ~~comments~~
    - not in the table, found through FK's
- other fields... title, more tags?

# Comments:
- commentId
- postId
    - FK
- parentId
    - is FK to commentId
- votes
    - int
# PostVotes:
    - postId
    - userId
    - vote
        - +1,-1, hasn't voted
# CommentVotes:
    - commentId
    - userId
    - vote
        - +1,-1, hasn't voted

# Friends
    - userId
    - friendId
    - requestStatus
        - accepted, pending, rejected