FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_YANDEX_MAPS_API_KEY=""
ENV VITE_YANDEX_MAPS_API_KEY=$VITE_YANDEX_MAPS_API_KEY

RUN if [ ! -f api-key.txt ]; then printf '' > api-key.txt; fi
RUN if [ -n "$VITE_YANDEX_MAPS_API_KEY" ]; then printf '%s' "$VITE_YANDEX_MAPS_API_KEY" > api-key.txt; fi
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["/bin/sh", "-c", "if [ -n \"$VITE_YANDEX_MAPS_API_KEY\" ]; then printf '%s' \"$VITE_YANDEX_MAPS_API_KEY\" > /usr/share/nginx/html/api-key.txt; fi && exec nginx -g 'daemon off;'"]
