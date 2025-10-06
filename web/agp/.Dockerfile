FROM node:16.2-alpine AS build

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine AS production

RUN mkdir /app

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /temp/prod.conf
RUN envsubst /app < /temp/prod.conf > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]