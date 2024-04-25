
# specify the node base image with your desired version node:<version>
FROM node:16

WORKDIR /app

# copy the package.json to install dependencies
COPY package.json .

# install dependencies
RUN npm install

# copy the rest of the files
COPY . ./

# replace this with your application's default port
EXPOSE 5050

# start the app
CMD ["npm", "start"]