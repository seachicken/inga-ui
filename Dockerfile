FROM node:20-slim AS build

WORKDIR /app

COPY . .

RUN npm install && \
  npm run build


FROM busybox:1.36

WORKDIR /html

COPY --from=build /app/dist .

ENTRYPOINT ["httpd", "-f", "-h", "/html", "-p"]
CMD ["8080"]

