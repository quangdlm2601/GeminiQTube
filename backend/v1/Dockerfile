# Use Python slim
FROM python:3.12-slim

WORKDIR /app

# Install Chromium + dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium ffmpeg \
    libnss3 libx11-xcb1 libxcomposite1 libxrandr2 libxdamage1 \
    libasound2 libgbm1 libxext6 libxfixes3 libxrender1 fonts-liberation \
    wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright Chromium
RUN playwright install chromium

# Copy app code
COPY . .

# Expose port for Flask
EXPOSE 8080

# Start both cookie refresher and Flask API
CMD ["sh", "-c", "\
    python refresh_cookies.py & \
    gunicorn --workers 1 --threads 4 --bind 0.0.0.0:8080 app:app \
"]
