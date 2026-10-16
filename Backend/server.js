const dns = require('dns')

dns.setServers(['8.8.8.8', '1.1.1.1'])

require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/database')
const port = process.env.PORT 

const startServer = async () =>{
    await connectDB()

    app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})
}

startServer()
