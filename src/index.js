const express = require('express')
const axios = require('axios')
const responseTime = require("response-time")
const redis = require("redis")
const { promisify } = require('util')

const app = express()

app.use(responseTime())

// Conection with Redis
const client = redis.createClient({
    host: '127.0.0.1',
    port: 6379,
    legacyMode: true
})
client.connect();

// Using promisify
const GET_ASYNC = promisify(client.get).bind(client)
const SET_ASYNC = promisify(client.set).bind(client)


// Method without PROMISIFY
app.get("/characters", async(req, res) => {

    // Response from Redis
    client.get('characters', async(err, reply) => {
        if (reply) {
            return res.json(JSON.parse(reply))
        }

        // Data to Save
        const response = await axios.get(
            "https://rickandmortyapi.com/api/character"
        )

        // Set data to redis
        client.set('characters', JSON.stringify(response.data), (err, reply) => {
            if (err) console.log(err);

            console.log(reply);

            res.json(response.data);
        })
    })
})


//Method with PROMISIFY
app.get('/characters2', async(req, res) => {

    try {
        //Response from cache
        const reply = await GET_ASYNC("characters")
        if (reply) return res.json(JSON.parse(reply))

        // Datos a guardar
        const response = await axios.get(
            "https://rickandmortyapi.com/api/character"
        )

        await SET_ASYNC("characters", JSON.stringify(response.data))
        res.json(response.data)

    } catch (error) {
        console.log(error)
    }
})


// SAVE AND GET ONE ELEMENT
app.get("/character/:id", async(req, res) => {

    //Save the route
    //console.log(req.originalUrl)

    try {
        const reply = await GET_ASYNC(req.params.id)

        if (reply) return res.json(JSON.parse(reply))

        const response = await axios.get(
            "https://rickandmortyapi.com/api/character/" + req.params.id)

        await SET_ASYNC(req.params.id, JSON.stringify(response.data))

        return res.json(response.data)
    } catch (error) {
        return res.status(error.response.status).json({ message: error.message })
    }
})




app.listen(3000)

console.log('run in port 3000')