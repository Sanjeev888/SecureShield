# Stage 1: Build React Client
FROM node:18-alpine AS client-build
WORKDIR /usr/src/app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Node Server
FROM node:18-alpine
WORKDIR /usr/src/app/server

COPY server/package*.json ./
COPY server/yarn.lock ./
RUN yarn install --production --pure-lockfile

COPY server/ ./
# Copy built client files to server public directory
COPY --from=client-build /usr/src/app/client/dist ./public
# Create uploads directory for Multer
RUN mkdir -p uploads

EXPOSE 3000
CMD ["yarn", "start"]
