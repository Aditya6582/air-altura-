FROM node:20-bookworm-slim

WORKDIR /app

COPY Booking-service/package*.json ./
RUN npm install

COPY Booking-service/ ./
COPY docker/scripts /opt/docker-scripts

RUN chmod +x /opt/docker-scripts/service-entrypoint.sh

EXPOSE 4000

CMD ["/opt/docker-scripts/service-entrypoint.sh"]
