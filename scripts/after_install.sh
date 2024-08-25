#!/bin/bash

# navigate to app folder
cd /home/ubuntu/app

# install dependencies

npx prisma generate
npx prisma migrate dev
npm install

# npm run build
# cp -r build/* /var/www/html

