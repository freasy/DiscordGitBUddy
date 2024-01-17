FROM node:18-alpine as build
WORKDIR /app
COPY . .
RUN npm ci

FROM node:18-alpine as run
COPY --from=build /app /app
WORKDIR /app
CMD [ "/bin/sh", "/app/docker/entry.sh" ]