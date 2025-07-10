# Step 1: Build stage
FROM node:22-alpine as builder

WORKDIR /app

# 👉 devDependencies 포함 설치를 위해 NODE_ENV 설정은 나중에
COPY package*.json ./
RUN npm install

COPY . .

#   Prisma client 생성
RUN npx prisma generate

#   NestJS 앱 빌드 (nest CLI가 devDependencies에 있다고 가정)
RUN npm run build

# Step 2: Run stage (production image)
FROM node:22-alpine

WORKDIR /app

#   환경변수 설정 (실행 시점)
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

CMD ["node", "dist/main"]
