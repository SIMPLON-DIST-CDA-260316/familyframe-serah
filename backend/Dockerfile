FROM node:25.6.1-alpine3.23

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN npm install --global pnpm@12.15.0
RUN apk add --no-cache openssl
RUN pnpm install --frozen-lockfile

COPY prisma/ ./prisma/
RUN pnpm db:generate

COPY src/ ./src/

CMD ["pnpm", "dev:docker"]