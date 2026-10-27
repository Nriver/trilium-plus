#!/usr/bin/env bash

if [[ $# -eq 0 ]] ; then
    echo "Missing argument of new version"
    exit 1
fi

VERSION=$1
SERIES=${VERSION:0:4}-latest

docker push nriver/trilium-plus:$VERSION
docker push nriver/trilium-plus:$SERIES

if [[ $VERSION == $SERIES ]]; then
  docker push nriver/trilium-plus:latest
fi
