# O npm i do alpine é mto mais rápido que pelo chainguard. Acredito que é devido ao cache do alpine ser mais eficiente que o do chainguard
FROM node:alpine as dependencies

WORKDIR /app/dependencies

# Copiar os arquivos de dependências
COPY package.json ./
RUN npm i --verbose

# A imagem principal é pelo chainguard pois é a imagem que possui mais seguimentos de segurança
FROM node:alpine as build

# Alteração da pasta de instalação dos módulos
# Isso é feito para casos em que há necessidade de rodar o projeto em DEV para "debug em desespero"
ENV NODE_MODULE_PATH=/app/dependencies
ENV NODE_PATH=$NODE_MODULE_PATH/node_modules
RUN npm config set prefix $NODE_MODULE_PATH && mkdir -p /app/dependencies

WORKDIR /app/source

# Copiar o restante dos arquivos do projeto
COPY --from=dependencies /app/dependencies /app/
COPY . .

RUN npm run build 
CMD npm start 
