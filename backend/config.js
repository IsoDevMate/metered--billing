const { createClient } = require("redis");

const client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    }
});

client.on("connect", () => {
    console.log("Connected to redis...")
})

client.on("error", (error) => {
    console.log("Error connecting to redis...", error)
})

module.exports = client