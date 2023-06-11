FROM node:20-slim AS build

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
  apt-get install -y curl

# https://github.com/cli/cli/blob/trunk/docs/install_linux.md#installing-gh-on-linux-and-bsd
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
  chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg

WORKDIR /inga-ui

COPY . .
RUN npm install


FROM node:20-slim

WORKDIR /inga-ui

COPY --from=build /usr/share/keyrings/githubcli-archive-keyring.gpg /usr/share/keyrings/githubcli-archive-keyring.gpg
COPY --from=build /inga-ui .

RUN apt-get update && \
  apt-get install -y ca-certificates
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
  apt-get update && \
  apt-get install -y \
    gh && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["bash"]
