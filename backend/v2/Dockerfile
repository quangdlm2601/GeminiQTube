FROM node:20

# Disable youtube-dl-exec postinstall to avoid GitHub rate-limit
ENV npm_config_ignore_scripts=true

# Install yt-dlp + ffmpeg systemwide
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg && \
    pip3 install yt-dlp --break-system-packages && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
