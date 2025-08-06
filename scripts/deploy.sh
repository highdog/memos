#!/bin/bash

# Memos 自定义版本部署脚本
# 使用方法: ./deploy.sh [method] [options]
# 方法: registry|export|build
# 示例: ./deploy.sh registry your-dockerhub-username

set -e

METHOD=${1:-"export"}
DOCKER_USERNAME=${2:-""}
SERVER_HOST=${3:-""}
SERVER_PATH=${4:-"/opt/memos"}

echo "🚀 开始部署 Memos 自定义版本..."
echo "部署方法: $METHOD"

case $METHOD in
  "registry")
    if [ -z "$DOCKER_USERNAME" ]; then
      echo "❌ 错误: 使用 registry 方法需要提供 Docker Hub 用户名"
      echo "用法: ./deploy.sh registry your-dockerhub-username"
      exit 1
    fi
    
    echo "📦 标记镜像..."
    docker tag memos-local $DOCKER_USERNAME/memos:custom
    
    echo "🔐 登录 Docker Hub..."
    docker login
    
    echo "⬆️ 推送镜像..."
    docker push $DOCKER_USERNAME/memos:custom
    
    echo "✅ 镜像已推送到 Docker Hub"
    echo "在服务器上使用以下镜像: $DOCKER_USERNAME/memos:custom"
    ;;
    
  "export")
    echo "📦 导出镜像..."
    docker save memos-local -o memos-custom.tar
    
    echo "📊 镜像文件信息:"
    ls -lh memos-custom.tar
    
    if [ -n "$SERVER_HOST" ]; then
      echo "⬆️ 传输到服务器..."
      scp memos-custom.tar $SERVER_HOST:$SERVER_PATH/
      
      echo "🔧 在服务器上导入镜像..."
      ssh $SERVER_HOST "cd $SERVER_PATH && docker load -i memos-custom.tar"
      
      echo "✅ 镜像已导入到服务器"
    else
      echo "✅ 镜像已导出为 memos-custom.tar"
      echo "请手动传输到服务器并执行: docker load -i memos-custom.tar"
    fi
    ;;
    
  "build")
    echo "📦 打包源代码..."
    tar -czf memos-source.tar.gz \
      --exclude=node_modules \
      --exclude=.git \
      --exclude=web/dist \
      --exclude=server/router/frontend/dist \
      --exclude=memos-custom.tar \
      --exclude=memos-source.tar.gz \
      .
    
    echo "📊 源码包信息:"
    ls -lh memos-source.tar.gz
    
    if [ -n "$SERVER_HOST" ]; then
      echo "⬆️ 传输源码到服务器..."
      scp memos-source.tar.gz $SERVER_HOST:$SERVER_PATH/
      
      echo "🔧 在服务器上构建..."
      ssh $SERVER_HOST "cd $SERVER_PATH && \
        tar -xzf memos-source.tar.gz && \
        cd web && npm install && npm run release && \
        cd .. && docker build -f scripts/Dockerfile -t memos-local ."
      
      echo "✅ 在服务器上构建完成"
    else
      echo "✅ 源码已打包为 memos-source.tar.gz"
      echo "请传输到服务器并执行构建命令"
    fi
    ;;
    
  *)
    echo "❌ 未知的部署方法: $METHOD"
    echo "支持的方法: registry, export, build"
    exit 1
    ;;
esac

echo ""
echo "🎉 部署完成!"
echo ""
echo "📋 服务器上的 compose.yaml 配置:"
echo "services:"
echo "  memos:"
if [ "$METHOD" = "registry" ] && [ -n "$DOCKER_USERNAME" ]; then
echo "    image: $DOCKER_USERNAME/memos:custom"
else
echo "    image: memos-local"
fi
echo "    container_name: memos"
echo "    volumes:"
echo "      - ~/.memos/:/var/opt/memos"
echo "    ports:"
echo "      - 5230:5230"
echo ""
echo "🚀 在服务器上启动:"
echo "docker-compose up -d"