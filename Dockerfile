# Use Node.js image compatible with Mac M1
FROM node:14-alpine

# Set the working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    bash \
    && npm install puppeteer@12.0.1

# Copy package.json and package-lock.json
COPY package*.json ./

# Install other dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose port 8088
EXPOSE 8088

# Start the application
CMD ["npm", "start"]
