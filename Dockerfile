FROM node:20-alpine AS client-build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_YANDEX_MAPS_API_KEY=""
ENV VITE_YANDEX_MAPS_API_KEY=$VITE_YANDEX_MAPS_API_KEY

RUN if [ ! -f api-key.txt ]; then printf '' > api-key.txt; fi
RUN if [ -n "$VITE_YANDEX_MAPS_API_KEY" ]; then printf '%s' "$VITE_YANDEX_MAPS_API_KEY" > api-key.txt; fi
RUN npm run build:client

FROM node:20-alpine AS server-build

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server ./

RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=client-build /app/dist ./dist
COPY --from=client-build /app/api-key.txt ./dist/api-key.txt
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/package.json ./server/package.json
COPY --from=server-build /app/server/prisma ./server/prisma

EXPOSE 3000

CMD ["/bin/sh", "-c", "if [ -n \"$VITE_YANDEX_MAPS_API_KEY\" ]; then printf '%s' \"$VITE_YANDEX_MAPS_API_KEY\" > /app/dist/api-key.txt; fi && exec node server/dist/index.js"]
