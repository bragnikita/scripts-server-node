#!/bin/bash
set -Eeuo pipefail
set -x # for debugging
trap "echo 'error: Script failed: see failed command above'" ERR

(cd config/ansible; ansible-playbook -i hosts nginx.yml)

exit $?