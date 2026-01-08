FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

# Install dependencies
RUN npm install

# Generate Prisma client
WORKDIR /app/packages/backend
RUN npm run db:generate

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

WORKDIR /app

EXPOSE 3000

CMD ["npm", "run", "dev", "-w", "@trainer3/backend"]
