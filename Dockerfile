# Use Node.js official image
FROM node:21.7.1-alpine

# Set the working directory
WORKDIR /backendApp

# Copy package.json and package-lock.json first to allow Docker caching properly
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the correct port
EXPOSE 5000

# Start the Node.js application using nodemon
CMD ["npx", "nodemon", "index.js"]
