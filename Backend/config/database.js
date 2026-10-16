const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    console.log('Mongo URI exists:', !!process.env.MONGO_URI)
    console.log('Mongo URI:', process.env.MONGO_URI?.replace(/:\/\/.*@/, '://***:***@'))

    await mongoose.connect(process.env.MONGO_URI)

    console.log('Database Connected Successfully')
  } catch (error) {
    console.error('Database Failed:', error)
    process.exit(1)
  }
}

module.exports = connectDB