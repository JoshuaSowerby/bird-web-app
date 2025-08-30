FROM node:22-slim
WORKDIR /app
COPY . .

RUN npm i

# installing python and pip, ai told me to do the "&& rm -rf /var/lib/apt/lists/*" part 
# and put the second RUN for pip into the first to save on disk space
RUN apt-get update && apt-get install -y python3 python3-venv python3-pip \
    && python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir numpy Pillow torch torchvision --index-url https://download.pytorch.org/whl/cpu


EXPOSE 3000

CMD ["node", "index.js"]