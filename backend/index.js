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
//const { reportUsageToStripe } = require('./controllers/stripe/reportUsage');
const serviceAccount = require('./metered-billing-firebase-adminsdk-ywzni-1175eb0676.json'); 
const redisClient = require("./config.js");
//const RedisStore = require('connect-redis').default;
const  approutes = require('./routes/routes');
const User = require('./models/schema.js');
const DataUsage = require('./models/datausageschema.js');
const multer = require('multer');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  ignoreUndefinedProperties: true, 
  databaseURL: 'default',
  storageBucket: ''
});

const db = admin.firestore();

const upload = multer({
  storage: multer.memoryStorage(),
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());

// connect Database
connectDB();

app.use('/api', approutes);

app.get("/", async (req, res, next) => {
     res.send("Welcome to our Stripe Metered usage Records BillingApi  backend API")
   });



  
app.post('/upload', upload.single('image'), async (req, res) => {
  const firebaseUid = req.body.userId;
  console.log( " firebase userid",firebaseUid);

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  if (!firebaseUid) {
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  const user = await User.findOne({ firebaseUid : firebaseUid});

  if (!user) {
    console.log(user);
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
 
  try {
    const fileRef = admin.storage().bucket().file(`uploads/${req.file.originalname}`);
    await fileRef.save(req.file.buffer, { contentType: req.file.mimetype });
    const fileUrl = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: firebaseUid },
      { $push: { uploadedFiles: fileUrl[0] } }, 
      { new: true } 
    );
    
    // Update the user's data usage
    let dataUsage = await DataUsage.findOne({ userId: user._id });
    if (!dataUsage) {
      dataUsage = new DataUsage({ userId: user._id });
    }
      
     dataUsage.totalUsage += req.file.size;
     dataUsage.usageRecords.push({ fileSize: req.file.size, timestamp: Date.now(), fileName: req.file.originalname });       await dataUsage.save();
   
     user.totalUsage = dataUsage.totalUsage;
     await user.save();
  
    res.status(200).json({ message: 'File uploaded successfully', fileUrl: fileUrl[0], fileName: req.file.originalname, userId: user.firebaseUid  }); 
     } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload file.' });
  }
});

async function reportUsageToStripe() {

  try {
    console.log("hello")
    if (!stripe) {
      console.error('Stripe is undefined');
      return;
    }

    if (!stripe.subscriptionItems) {
      console.error('Stripe subscriptionItems is undefined');
      return;
    }

    const users = await User.find({});

    for (const user of users) {
      const userId = user.firebaseUid;
      const totalUsageInBytes = user.totalUsage;
      const subscriptionId = user.subscriptionId;

      console.log(`Reporting usage for user ${userId}...`, totalUsageInBytes, subscriptionId)

      if (!subscriptionId) {
        console.log(`No subscription found for user ${userId}. Skipping usage reporting.`);
        continue;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (subscription.status !== 'active') {
        console.log(`Subscription ${subscriptionId} is not active (status: ${subscription.status}). Skipping usage reporting.`);
        continue;
      }

      const subscriptionItemId = subscription.items.data[0].id;
      const totalUsageInGB = totalUsageInBytes / (1024 * 1024 );

      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity: Math.round(totalUsageInGB * 100),
          timestamp: Math.floor(Date.now() / 1000),
          action: 'set',
        },
        {
          idempotencyKey: `usage-record-${userId}-${Date.now()}`,
        }
      );
      console.log(usageRecord.data)
      console.log(`Reported usage for user ${userId}: ${totalUsageInGB} GB ${usageRecord} to Stripe`);
    }
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
  }
}

cron.schedule('*/2 * * * *', () => {
 // console.log('Running usage report billing on each customer');
  reportUsageToStripe();
});
/*
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
*/
mongoose.connection.once('open',()=>{
  
    console.log(`Connected Successfully to the Database: ${mongoose.connection.name}`)
    app.listen(port, () => {
      console.log(`app is running at localhost:${port}`);
    });
    })

    module.exports = { app, stripe };
