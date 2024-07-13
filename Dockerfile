FROM node:20-slim AS build

WORKDIR /app

COPY . .

RUN npm install && \
  npm run build


FROM busybox:1.36

ENV SERVER_PORT=8080

WORKDIR /html

COPY --from=build /app/inga-report /html

CMD ["httpd", "-f", "-p", "$SERVER_PORT", "-h", "/html"]

