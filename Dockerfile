# 使用官方的、轻量级的 Nginx 镜像作为我们的基础
###############
# Build stage #
###############
FROM node:lts-alpine AS builder
WORKDIR /app

# 使用 corepack 管理 pnpm 版本，确保与项目一致
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

# 只拷贝依赖清单以优化缓存
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 拷贝源码并构建
COPY index.html ./
COPY src ./src
RUN pnpm build

###############
#  Serve dist  #
###############
FROM nginx:1.27.0-alpine-slim

# 模板目录与运行时替换 PORT
RUN mkdir -p /etc/nginx/templates
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# 只拷贝构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 文档性暴露端口；Cloud Run 实际使用 PORT 环境变量
EXPOSE 8080

# 运行时渲染 Nginx 配置并以前台模式启动
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
