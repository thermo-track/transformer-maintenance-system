FROM node:20-slim AS build
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm install --legacy-peer-dep
    COPY . .
    RUN npm run build
   
   
    FROM nginx:alpine
    WORKDIR /usr/share/nginx/html
    RUN rm -rf ./*
    COPY --from=build /app/dist .  
    COPY nginx.conf /etc/nginx/nginx.conf  
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]