FROM node:9.2-alpine

MAINTAINER Cl3MM

ENV APP_PATH=/data \
    STDOUT_LOC=/proc/1/fd/1 \
    STDERR_LOC=/proc/1/fd/2

COPY package.json yarn.lock crontab /tmp/

RUN \
      mkdir -p $APP_PATH \
      && apk --no-cache add tzdata yarn \
      && cd /tmp \
      && yarn install --frozen-lockfile --production \
      && cp -a /tmp/node_modules ${APP_PATH}/ \
      && crontab /tmp/crontab \
      && rm -rf /tmp/* \
      && touch /var/log/cron.log \
      && cp /usr/share/zoneinfo/Europe/Paris /etc/localtime \
      && echo "Europe/Paris" >  /etc/timezone \
      && apk del tzdata \
      && rm -rf /var/cache/apk/* \
      && cd $APP_PATH

COPY . $APP_PATH

WORKDIR $APP_PATH

EXPOSE 3000

CMD ["node", "-v"]
