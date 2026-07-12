FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY Air-Altura-Frontend/package*.json ./
RUN npm install

COPY Air-Altura-Frontend/ ./

ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY Air-Altura-Frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
