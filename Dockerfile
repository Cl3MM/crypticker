# FROM node:9.2-slim
FROM node:9.2-alpine

MAINTAINER Cl3MM

ENV APP_PATH=/data

COPY package.json yarn.lock crontab /tmp/

RUN \
      mkdir -p $APP_PATH \
      && cd /tmp \
      && yarn install --frozen-lockfile --production \
      && cp -a /tmp/node_modules ${APP_PATH}/ \
      && rm -rf /tmp/* \
      && cd $APP_PATH

COPY . $APP_PATH

WORKDIR $APP_PATH

EXPOSE 3000

CMD ["node", "-v"]
