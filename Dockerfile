FROM node:22.13.1-bookworm

LABEL org.opencontainers.image.authors="NII"
LABEL org.opencontainers.image.url="https://github.com/NII-DG/dmp-editor"
LABEL org.opencontainers.image.documentation="https://github.com/NII-DG/dmp-editor/blob/main/README.md"
LABEL org.opencontainers.image.source="https://github.com/NII-DG/dmp-editor/blob/main/Dockerfile"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.licenses="Apache-2.0"

WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
