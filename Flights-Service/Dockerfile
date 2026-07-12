FROM node:20-bookworm-slim

WORKDIR /app

COPY Flights-Service/package*.json ./
RUN npm install

COPY Flights-Service/ ./
COPY docker/scripts /opt/docker-scripts

RUN chmod +x /opt/docker-scripts/service-entrypoint.sh

EXPOSE 3000

CMD ["/opt/docker-scripts/service-entrypoint.sh"]
