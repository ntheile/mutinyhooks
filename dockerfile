FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY package.json /app
COPY yarn.lock /app
COPY server.js /app
COPY lib.js /app

RUN yarn install

EXPOSE 6969

# Run server.js when the container launches
CMD ["node", "server.js"]
