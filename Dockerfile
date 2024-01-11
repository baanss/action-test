# build source files
FROM node:18.12.0 AS build

WORKDIR /usr/src/h_server_backend

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# production
FROM node:18.12.0
SHELL ["/bin/bash", "-c"]

ENV DB_MIGRATION_FROM="init"
ENV DB_DATABASE="${DB_DATABASE}"
ENV DB_USERNAME="${DB_USERNAME}"
ENV DB_PASSWORD="${DB_PASSWORD}"

WORKDIR /usr/src/h_server_backend

## python
COPY requirements.txt .
RUN apt-get update -y
RUN apt-get install -y python3-pip python-dev build-essential

RUN pip3 install -r requirements.txt

COPY ./scripts scripts

## node
COPY package*.json ./
RUN npm set-script prepare '' && npm ci --only=production

COPY --from=build /usr/src/h_server_backend/dist dist

# TODO: migration 실행 전 데이터베이스 백업 스크립트 실행
CMD echo "Environment SEED_DATA=${SEED_DATA}" \
    &&  npm run migrate:prod && npm run insert:prod && npm run start