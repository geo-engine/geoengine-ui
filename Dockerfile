# NodeJS Image
FROM node:11.10-alpine AS builder

# Make alpine edge repositories accessible
RUN echo "http://dl-2.alpinelinux.org/alpine/edge/main" >> /etc/apk/repositories && \
	echo "http://dl-2.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories && \
	echo "http://dl-2.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
    apk upgrade --update-cache --available

# Setup directories
WORKDIR /app


# Add dependencies
RUN apk add --no-cache \
    git \
    openssl \
    make \
    g++ \
    python \
    xvfb \
	firefox

# Copy WAVE source code
COPY . /app/wave

# Start Xvfb server listening on :99.0
RUN Xvfb :99 -screen 0 1280x720x16 & > xvfb.log &

# Build WAVE
RUN cd /app/wave && \
    rm -rf node_modules/ && \
    npm install && \
    DISPLAY=:99.0 npm run test:headless[firefox] && \
    NODE_OPTIONS="--max-old-space-size=4096" npm run build-production

# Create Snakeoil SSL
RUN openssl genrsa 1024 > /app/server.key && \
    chmod 400 /app/server.key && \
    openssl req -new -x509 -nodes -sha1 -days 365 -key /app/server.key -out /app/server.crt -subj "/C=DE/ST=DE/L=Marburg/O=VAT/OU=VAT/CN=default" && \
    cat /app/server.key && \
    cat /app/server.crt

##################################################
##################################################
##################################################

# Apache Image
FROM httpd:alpine AS runner

# Setup directories
WORKDIR /app

# Copy program and link config
COPY --from=builder /app/wave/dist/ /usr/local/apache2/htdocs/
COPY --from=builder /app/server.key /usr/local/apache2/conf/server.key
COPY --from=builder /app/server.crt /usr/local/apache2/conf/server.crt

# Copy Apache Configuration Files
COPY docker-files/httpd.conf /usr/local/apache2/conf/httpd.conf
COPY docker-files/httpd-ssl.conf /usr/local/apache2/conf/extra/httpd-ssl.conf
RUN ln -sfT /dev/stderr /usr/local/apache2/logs/error_log && \
    ln -sfT /dev/stdout /usr/local/apache2/logs/access_log

# Update System, Clean up Scripts and APT when done.
RUN apk --no-cache upgrade --available && \
    rm -rf /var/cache/apk/*

# Make port 80 available to the world outside this container
EXPOSE 80

# Apache Config
ENV ADMIN_EMAIL=vat@example.com

# Mapping URL
#ENV MAPPING_URL "fcgi://localhost:10100/"
ENV MAPPING_URL "https://sng107.sng.uni-frankfurt.de/dev/cgi-bin/mapping_cgi"

# Background Map
ENV BACKGROUND_MAP_URL "http://sng107.sng.uni-frankfurt.de/mapcache/"

# Config File
#VOLUME /usr/local/apache2/htdocs/assets/config.json

# Certificates
#VOLUME /usr/local/apache2/conf/server.key
#VOLUME /usr/local/apache2/conf/server.crt
