FROM node:20-bookworm-slim

WORKDIR /app

COPY API-Gateway/package*.json ./
RUN npm install

COPY API-Gateway/ ./
COPY docker/scripts /opt/docker-scripts

RUN chmod +x /opt/docker-scripts/service-entrypoint.sh

EXPOSE 5000

CMD ["/opt/docker-scripts/service-entrypoint.sh"]
