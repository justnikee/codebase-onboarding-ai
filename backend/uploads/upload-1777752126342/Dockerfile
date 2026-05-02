FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# tsx is needed to run TypeScript directly — add it back after --omit=dev
RUN npm install tsx

CMD ["node", "--import", "tsx/esm", "src/index.ts"]
