#!/usr/bin/env bash

VERSION=`jq -r ".version" package.json`
SERIES=${VERSION:0:4}-latest

sudo docker build -t nriver/trilium-plus:$VERSION --network host -t nriver/trilium-plus:$SERIES .

if [[ $VERSION != *"beta"* ]]; then
  sudo docker tag nriver/trilium-plus:$VERSION nriver/trilium-plus:latest
fi
