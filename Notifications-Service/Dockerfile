FROM node:20-bookworm-slim

WORKDIR /app

COPY Notifications-Service/package*.json ./
RUN npm install

COPY Notifications-Service/ ./
COPY docker/scripts /opt/docker-scripts

RUN chmod +x /opt/docker-scripts/service-entrypoint.sh

CMD ["/opt/docker-scripts/service-entrypoint.sh"]
