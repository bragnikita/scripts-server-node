#!/usr/bin/env bash
set -e

[[ ${TRAVIS_BRANCH} != "$1" ]] && exit 0

(cd config && ./gen_secret_files.sh)

cat config/deploy_key | gpg --passphrase-fd 0 --batch --yes --output config/server_key --decrypt config/server_key.enc
eval "$(ssh-agent -s)"
chmod 600 config/server_key
ssh-add config/server_key
bundle exec cap production deploy:check
bundle exec cap production deploy

echo "======== Deploy success =========="
sleep 5
RES=$(curl -L -s -o /dev/null -w "%{http_code}" -H @config/curl_head ${DEPLOY_HOST}/status)
if [ ${RES} != "200" ]; then
 echo "PING failed with code ${RES}"
 exit 1
fi

echo "======== Status test success ======="