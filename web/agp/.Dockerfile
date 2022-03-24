FROM node:16.2-alpine as build

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --production

COPY . .
RUN yarn build

FROM nginx:stable-alpine as production

RUN mkdir /app

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /temp/prod.conf
RUN envsubst /app < /temp/prod.conf > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]