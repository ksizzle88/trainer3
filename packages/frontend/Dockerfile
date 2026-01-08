FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

RUN npm install

WORKDIR /app/packages/shared
RUN npm run build

WORKDIR /app

EXPOSE 5173

CMD ["npm", "run", "dev", "-w", "@trainer3/frontend", "--", "--host"]
