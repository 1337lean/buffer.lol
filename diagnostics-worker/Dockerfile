FROM node:20-alpine

RUN apk add --no-cache iputils traceroute

WORKDIR /worker
COPY package.json ./
COPY src ./src

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["npm", "start"]
