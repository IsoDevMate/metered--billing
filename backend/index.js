const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
const app = express();
require("dotenv").config();
const mongoose=require('mongoose')
const connectDB =require('./db')
const port = process.env.PORT || 5050;
const bodyParser = require("body-parser");

const admin = require('firebase-admin');
const  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { reportUsageToStripe } = require('./controllers/stripe/reportUsage');
const serviceAccount = require('./metered-billing-firebase-adminsdk-ywzni-1175eb0676.json'); 
const redisClient = require("./config.js");
const RedisStore = require('connect-redis').default;
const  approutes = require('./routes/routes');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  ignoreUndefinedProperties: true, 
  databaseURL: 'default',
  storageBucket: 'gs://metered-billing.appspot.com'
});

const db = admin.firestore();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());

app.use('/api', approutes);

app.get("/", async (req, res, next) => {
     res.send("Welcome to our Stripe Metered usage Records BillingApi  backend API")
   });

// connect Database
connectDB();


cron.schedule('*/9 * * * *', () => {
  console.log('Running usage report billing on each customer');
  reportUsageToStripe();
});

const start = async () => {
  try {
      await redisClient.connect() 
      console.log('Connected to Redis');
  
}
  catch (error) {
      console.error('Error connecting to Redis:', error);
  }
}

start();
mongoose.connection.once('open',()=>{
  
    console.log(`Connected Successfully to the Database: ${mongoose.connection.name}`)
    app.listen(port, () => {
      console.log(`app is running at localhost:${port}`);
    });
    })

    module.exports = { app, stripe };