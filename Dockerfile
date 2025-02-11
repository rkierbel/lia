# Use Node.js LTS
FROM node:20-slim as base

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Development stage
FROM base as development
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM base as production
RUN npm ci --only=production
COPY . .
RUN npm install typescript @types/node --save-dev && \
    npm run build && \
    npm prune --production

# Final stage - selected based on NODE_ENV
FROM ${NODE_ENV:-development}
ENV PORT=${PORT:-3003}
EXPOSE ${PORT}

CMD ["node", "dist/server.js"]