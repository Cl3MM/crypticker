FROM node:9.2
# FROM node:9.2-alpine

MAINTAINER Cl3MM

ENV APP_PATH=/data \
    STDOUT_LOC=/proc/1/fd/1 \
    STDERR_LOC=/proc/1/fd/2

COPY package.json yarn.lock crontab /tmp/

RUN \
      mkdir -p $APP_PATH \
      && apt-get update \
      && apt-get install -y --no-install-recommends chrpath libssl-dev libxft-dev libfreetype6-dev libfontconfig1-dev
RUN \
      cd /tmp \
      && PHANTOM_ARTIFACT="phantomjs-2.1.1-linux-x86_64" \
      && wget --header="Accept: text/html" --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20100101 Firefox/21.0" https://bitbucket.org/ariya/phantomjs/downloads/${PHANTOM_ARTIFACT}.tar.bz2 \
      && tar -xvjf "$PHANTOM_ARTIFACT".tar.bz2 \
      && mv "$PHANTOM_ARTIFACT" /usr/local/share \
      && ln -sf /usr/local/share/"$PHANTOM_ARTIFACT"/bin/phantomjs /usr/local/bin
RUN \
      cd /tmp \
      # && apt-get install -y --no-install-recommends bash tzdata cron \
      # && apt-get autoclean -y --force-yes \
      # && rm -rf /var/lib/apt/lists/* \
      # && adduser --no-create-home --gecos '' --shell /bin/bash --uid 1001 --ingroup users --disabled-password crypto \
      && yarn install --frozen-lockfile --production \
      && cp -a /tmp/node_modules ${APP_PATH}/ \
      # && cp /tmp/crontab /etc/cron.d/ticker \
      # && chmod 0644 /etc/cron.d/ticker \
      # && crontab /tmp/crontab \
      && rm -rf /tmp/* \
      # && touch /var/log/cron.log \
      # && chown crypto:users /var/log/cron.log \
      # && chmod 774 /var/log/cron.log \
      # && cp /usr/share/zoneinfo/Europe/Paris /etc/localtime \
      # && echo "Europe/Paris" >  /etc/timezone \
      && cd $APP_PATH

COPY . $APP_PATH

WORKDIR $APP_PATH

VOLUME /mnt

EXPOSE 3000

CMD ["node", "-v"]
