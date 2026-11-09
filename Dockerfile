# Ascandir InteractiveMap – Server-Version für Docker / Portainer
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 DATA_DIR=/data
COPY package.json ./
COPY server ./server
COPY src ./src
RUN mkdir -p /data && chown -R node:node /data /app
USER node
EXPOSE 8080
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT:-8080}/health" > /dev/null || exit 1
CMD ["node", "server/server.js"]
