# Image classifying queues

- have an in and out queue
    - do this to save on reqs
- classifier (py) watches in queue, on message classifies and dequeues. Then adds classification to out queue.
- node js watches out queue and commits database transactions then dequeues


OK, that may not work because we still need to get the image...
- either keep the spawn process and have one js file manage the queue
- or install the relevant python libraries to get from SQS and S3 (maybe pg too)

- just make it its own image then use docker compose...