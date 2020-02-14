#!/bin/bash
WORK_PATH='/usr/projects/qixi'
cd $WORK_PATH
echo "先清除旧代码"
git reset --hard origin/mater 
git clean -f
echo "拉取新代码"
git pull origin master

echo "开始执行构建"
docker build -t qixi:1.0 .
echo "停止旧容器并删除旧容器"
docker stop qixi-container
docker rm qixi-container
echo "启动新容器"
docker container run -p 80:80 --name qixi-container -d qixi:1.0
