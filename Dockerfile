# build stage
FROM node:lts as builder
WORKDIR /app
COPY . /app
RUN npm install
RUN npm run build

# production stage
FROM node:lts-slim as production-stage
COPY --from=builder /app/dist /app
COPY --from=builder /app/frontend /app/frontend
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/node_modules /app/node_modules

VOLUME ["/upload"]

WORKDIR /app
EXPOSE 80
CMD ["node", "server.js"]