FROM node:12

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8099

CMD [ "npm", "run", "start" ]
