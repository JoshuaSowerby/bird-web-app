import os

import psycopg2

import boto3
#from botocore.exceptions import ClientError

from model import birdClassifier

# .env vars
REGION=os.environ['REGION']

SQS_URL=os.environ['SQS_URL']

BUCKET=os.environ['BUCKET']

POSTGRES_USER=os.environ['POSTGRES_USER']
POSTGRES_PASSWORD=os.environ['POSTGRES_PASSWORD']
POSTGRES_DB=os.environ['POSTGRES_DB']
DB_HOST=os.environ['DB_HOST']
DB_PORT=os.environ['DB_PORT']


if __name__ == "__main__":
    #connect to db
    #classifier = Classifier()
    conn = psycopg2.connect(
        host=DB_HOST,
        dbname=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
        port=DB_PORT
    )
    cur = conn.cursor()
    print('connected to pg!')
    
    s3_client = boto3.client('s3', region_name=REGION)
    sqs_client = boto3.client("sqs", region_name=REGION)
    
    classifier=birdClassifier()
    while True:
        ## if the SQS message is invalid we should delete or ignore it?
        try:
            receive_response = sqs_client.receive_message(
                QueueUrl=SQS_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,#fix
                VisibilityTimeout=300#fix
            )
            messages = receive_response.get("Messages")
            if messages:
                img_uuid=messages[0]["Body"]
                print(f"Received:{img_uuid}")
                response = s3_client.get_object(Bucket=BUCKET, Key=img_uuid)
                img_bytes = response['Body'].read()
                
                ai_species=classifier.classifyImg(img_bytes)
                print(f"ai_species:{ai_species}")
                
                cur.execute(
                    "UPDATE posts"
                    " SET ai_species = %s"
                    " WHERE img_uuid = %s;", (ai_species, img_uuid))
                conn.commit()
                #cur.close()
                #conn.close()
                print("Committed")


                delete_response = sqs_client.delete_message(
                    QueueUrl=SQS_URL,
                    ReceiptHandle=messages[0]["ReceiptHandle"]
                )
                print("Deleting the message", delete_response)
        except psycopg2.Error as e:
            print(f'pg error:\n{e}\ntrying to reconnect to pg')
            conn = psycopg2.connect(
            host=DB_HOST,
            dbname=POSTGRES_DB,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            port=DB_PORT
            )
            cur = conn.cursor()
            print('connected to pg!')
        except Exception as e:
            print(f"loop broke\n{e}")


