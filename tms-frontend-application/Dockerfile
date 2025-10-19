FROM node:20-slim AS build
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm install --legacy-peer-dep
    COPY . .
    # Set build-time environment variables
    ARG VITE_CLOUDINARY_CLOUD_NAME=dxqmzslkb
    ARG VITE_CLOUDINARY_UPLOAD_PRESET=my_unsigned_preset
    ARG VITE_BACKEND_API_URL=http://localhost:8080/api
    ENV VITE_CLOUDINARY_CLOUD_NAME=$VITE_CLOUDINARY_CLOUD_NAME
    ENV VITE_CLOUDINARY_UPLOAD_PRESET=$VITE_CLOUDINARY_UPLOAD_PRESET
    ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL
    RUN npm run build
   
   
    FROM nginx:alpine
    WORKDIR /usr/share/nginx/html
    RUN rm -rf ./*
    COPY --from=build /app/dist .  
    COPY nginx.conf /etc/nginx/nginx.conf  
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]