FROM node:24-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port and run the custom server
EXPOSE 3000
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
