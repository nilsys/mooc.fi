FROM node:12

RUN apt-get update \
  && apt-get install -yy build-essential libpng-dev postgresql-client libpq-dev redis-tools git jq \
  && rm -rf /var/lib/apt/lists/*

RUN wget https://github.com/edenhill/librdkafka/archive/v1.4.0.tar.gz  -O - | tar -xz \
  && cd librdkafka-1.4.0 \
  && ./configure --prefix=/usr \
  && make && make install \
  && cd ..

RUN mkdir -p /app && chown -R node /app

USER node

WORKDIR /app

COPY --chown=node package.json /app/
COPY --chown=node package-lock.json /app/

RUN env BUILD_LIBRDKAFKA=0 npm ci

COPY --chown=node . /app

RUN cp .env.example .env \
    && npm run generate \
    && env NODE_ENV=production GOOGLE_CLOUD_STORAGE_BUCKET=x npm run build \
    && rm .env

ENV NODE_ENV=production

EXPOSE 4000
EXPOSE 7001

CMD [ "npm", "run", "start" ]
