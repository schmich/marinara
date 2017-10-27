#!/bin/bash

set -euf -o pipefail

cd $(dirname $0)

chmod 400 deploy_key
eval `ssh-agent -s`
ssh-add deploy_key

url=`git config remote.origin.url`
user=$(basename $(dirname "$url"))
project=$(basename "$url" .git)
repo="git@github.com:$user/$project-localization"
sha=`git rev-parse --verify HEAD`

git clone --depth 1 "$repo" out
ruby gen-status.rb > out/status.json

cd out && git add status.json
if [ -z "$(git diff --cached)" ]; then
  echo 'No changes to deploy.'
  exit 0
fi

git config user.name "$COMMIT_AUTHOR_NAME"
git config user.email "$COMMIT_AUTHOR_EMAIL"
git commit -a -m "Automatic build for $user/$project@${sha}."
git push "$repo" master
