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
const DataUsage = require('./models/datausageschema');
const User = require('./models/schema');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const multer = require('multer');
const path = require('path');
const serviceAccount = require('./metered-billing-firebase-adminsdk-ywzni-1175eb0676.json'); 


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

app.get("/", async (req, res, next) => {
     res.send("Welcome to our Stripe Apicalls backend API")
   });

// connect Database
connectDB(); 


const upload = multer({
    storage: multer.memoryStorage(),
  });
  

  
  app.post('/upload', upload.single('image'), async (req, res) => {
    const firebaseUid = req.body.userId;
    console.log(firebaseUid);
  
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
  
    if (!firebaseUid) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }
  
    const user = await User.findOne({ firebaseUid });
  
    if (!user) {
      console.log(user);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
  
    try {
      // Upload the file to your desired storage location
      // For example, using Firebase Storage:
      const fileRef = admin.storage().bucket().file(`uploads/${req.file.originalname}`);
      await fileRef.save(req.file.buffer, { contentType: req.file.mimetype });
      const fileUrl = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });
  
      // Update the user's data usage
      let dataUsage = await DataUsage.findOne({ userId: user._id });
      if (!dataUsage) {
        dataUsage = new DataUsage({ userId: user._id });
      }
  
      dataUsage.totalUsage += req.file.size;
      dataUsage.usageRecords.push({ fileSize: req.file.size });
      await dataUsage.save();
  
      res.status(200).json({ message: 'File uploaded successfully', fileUrl: fileUrl[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to upload file.' });
    }
  });

app.post('/users', async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;

    console.log("email",email, "firebaseUid",firebaseUid)
   

    const customer = await stripe.customers.create({
      email,
      metadata: { firebaseUid },
    });

    console.log("customer",customer)

    const user = new User({
      firebaseUid,
      email,
      stripeCustomerId: customer.id,
    });
    await user.save();

    console.log("mongoUser", user)
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});


/*
  app.post('/upload', upload.single('image'), async (req, res) => {

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
  
    const userId = req.body.userId;
  
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }
  
    const user = await User.findOne({ firebaseUid: userId });
  
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
 
   // const user = await User.findOne({ firebaseUid: req.body.userId }) || '123456'
    const file = req.file;
    const fileSize = file.size; 
   // const userId = user.firebaseUid || '123456';
  
    try {
      let dataUsage = await DataUsage.findOne({ userId });
      if (!dataUsage) {
        dataUsage = new DataUsage({ userId });
      }
  
      // Add the new file size to the total usage and create a new usage record
      dataUsage.totalUsage += fileSize;
      dataUsage.usageRecords.push({ fileSize });
  
      await dataUsage.save();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}${fileExtension}`;
      const fileRef = admin.storage().bucket().file(`uploads/${fileName}`);
      await fileRef.save(file.buffer, { contentType: file.mimetype });
      const imageUrl = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });
  
      res.json({ success: true, image_url: imageUrl[0] });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, message: 'Failed to upload file.' });
    }
  });


  */
async function reportUsageToStripe() {
  try {
   
    const users = await User.find({});

    for (const user of users) {
      const userId = user.firebaseUid
      const totalUsageInBytes = user.totalUsage;
      const subscriptionItemId = user.subscriptionId;
   
      const totalUsageInGB = totalUsageInBytes / (1024 * 1024 * 1024);

      const usageRecord = await stripe.usageRecords.create({
        quantity: Math.round(totalUsageInGB * 100), 
        timestamp: Math.floor(Date.now() / 1000),
        action: 'set', 
        idempotencyKey: `usage-record-${userId}`,
        subscription_item: subscriptionItemId, 
      });
      console.log(`Reported usage for user ${userId}: ${totalUsageInGB} GB  ${usageRecord} to Stripe`);
    }
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
  }
}


cron.schedule('* 2 * * * *', () => {
   console.log('Running usage report billing on each customer');
   reportUsageToStripe();
  });

  
mongoose.connection.once('open',()=>{
    console.log(`Connected Successfully to the Database: ${mongoose.connection.name}`)
    app.listen(port, () => {
      console.log(`app is running at localhost:${port}`);
    });
    })