FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY server.js ./
COPY label_data.json ./

EXPOSE 8787

CMD ["node", "server.js"]
