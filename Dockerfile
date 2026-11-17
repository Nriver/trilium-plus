# !!! Don't try to build this Dockerfile directly, run it through bin/build-docker.sh script !!!
FROM node:24.22.1-alpine

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

# Avoid downloading the Electron binary, it is not needed for the server build
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

# Install app dependencies
RUN set -x \
    && apk add --no-cache --virtual .build-dependencies \
        autoconf \
        automake \
        g++ \
        gcc \
        libtool \
        make \
        nasm \
        libpng-dev \
        python3 \
    && npm install -g pnpm@11.28.4 \
    && pnpm install --frozen-lockfile \
    && apk del .build-dependencies \
    && pnpm run webpack \
    && pnpm prune --prod \
    && test -s src/public/app-dist/excalidraw.js \
    && test -s node_modules/@excalidraw/excalidraw/dist/prod/index.css \
    && cp src/public/app/share.js src/public/app-dist/. \
    && cp -r src/public/app/doc_notes src/public/app-dist/. \
    && rm -rf src/public/app

# Some setup tools need to be kept
RUN apk add --no-cache su-exec shadow

# Add application user and setup proper volume permissions
RUN adduser -s /bin/false node; exit 0

# Start the application
EXPOSE 8080
CMD [ "./start-docker.sh" ]

HEALTHCHECK --start-period=10s CMD exec su-exec node node docker_healthcheck.js
