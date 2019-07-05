#!/usr/bin/env bash
set -e

[[ $TRAVIS_BRANCH != "$1" ]] && exit 0

openssl aes-256-cbc -K ${DEPLOY_KEY} -in config/server_key_enc -d -a -out config/server_key
eval "$(ssh-agent -s)"
chmod 600 config/server_key
ssh-add config/server_key
bundle exec cap production deploy:check
bundle exec cap production deploy

#ssh ec2-user@${DEPLOY_HOST} mkdir -p /var/www/gamescripter/extra
#rsync --delete -azhv coverage/ ec2-user@${DEPLOY_HOST}:/var/www/gamescripter/extra/coverage/

echo "======== Deploy success =========="
sleep 5
RES=$(curl -L -s -o /dev/null -w "%{http_code}" ${DEPLOY_HOST}/status)
if [ ${RES} != "200" ]; then
 echo "PING failed with code ${RES}"
 exit 1
fi

echo "======== Status test success ======="