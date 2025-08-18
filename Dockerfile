# 使用官方的、轻量级的 Nginx 镜像作为我们的基础
# Nginx 是一个非常高效的 Web 服务器，非常适合托管静态文件
FROM nginx:1.27.0-alpine-slim

# 将我们项目中的所有文件（index.html, src/ 文件夹等）
# 复制到 Nginx 容器内预设的网站根目录 /usr/share/nginx/html
COPY . /usr/share/nginx/html

# 告诉外界，这个容器将会监听 80 端口
EXPOSE 80

# 容器启动时，自动在前台运行 Nginx 服务
# 这是 Cloud Run 要求的运行方式
CMD ["nginx", "-g", "daemon off;"]