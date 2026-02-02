FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm ci --legacy-peer-deps
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_SUPABASE_URL
ARG REACT_APP_SUPABASE_KEY
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_KEY=$REACT_APP_SUPABASE_KEY
COPY . /app
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
