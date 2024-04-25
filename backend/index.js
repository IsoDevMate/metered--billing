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
const redisClient = require("./config.js");
const RedisStore = require('connect-redis').default;

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

app.post('/users', async (req, res) => {
    try {
      const { email, firebaseUid } = req.body;
      const existingUser = await User.findOne({ firebaseUid });
      if (existingUser) {
        return res.status(400).json({ error: 'User with the same firebaseUid already exists' });
      }
  
    
      const customer = await stripe.customers.create({
        email,
        metadata: { firebaseUid },
      });
  
     
      const priceId = 'price_1OxfCkCZYEjq9G2uX5EN9FYI';
  

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: priceId,
          },
        ],
        expand: ['latest_invoice.payment_intent', 'items.data.price'],
      });
      
      const subscriptionItemId = subscription.items.data[0].id;
      

      const user = new User({
        firebaseUid,
        email,
        stripeCustomerId: customer.id,
        subscriptionId: subscriptionItemId, 
      });

        await user.save();
      
      // Handle the subscription payment
      const paymentIntent = subscription.latest_invoice?.payment_intent;
      if (paymentIntent && paymentIntent.status === 'requires_action') {
        // Send the client secret to the frontend to handle authentication
        res.json({ requiresAction: true, clientSecret: paymentIntent.client_secret });
      } else {
        res.status(201).json(user);
        console.log("user",user)
      }
    } catch (error) {
      console.error('Error creating user and subscription:', error);
      res.status(500).json({ error: 'Failed to create user and subscription' });
    }
  });

app.get('/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({ firebaseUid: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const dataUsage = await DataUsage.findOne({ userId: user._id });
    const totalUsage = dataUsage ? dataUsage.totalUsage : 0;

    // Fetch outstanding invoices for the user from Stripe
    const outstandingInvoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      status: 'open',
      expand: ['data.customer']
    });

    const abc = outstandingInvoices.data.map((invoice) => {
        return {
          id: invoice.id,
          object: invoice.object,
          account_country: invoice.account_country,
          account_name: invoice.account_name
        }
    });
    console.log("abc",abc)

    console.log("outstandingInvoices",outstandingInvoices)
    // Fetch uploaded files for the user from firebase storage
   /* const uploadedFilesSnapshot = await admin.storage().bucket().getFiles({
      prefix: `uploads/${userId}/`,
    });
    const uploadedFiles = uploadedFilesSnapshot[0].map((file) => ({
      name: path.basename(file.name),
      url: file.metadata.mediaLink,
    }));
    console.log("uploadedFiles",uploadedFiles)
    */
    const uploadedFiles = user.uploadedFiles;
    const usageRecords= dataUsage.usageRecords;
    console.log("usageRecords for the dashboard ",usageRecords)
    
    res.json({ totalUsage, outstandingInvoices: outstandingInvoices.data, uploadedFiles, usageRecords });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/download', async (req, res) => {
  try {
    const fileId = req.query.fileId;
    const fileName = req.query.fileName;
    const firebaseUid = req.query.firebaseUid;

    console.log("fileId",fileId,
    "fileName",fileName,
    "firebaseUid",firebaseUid)

    const user = await User.findOne({ firebaseUid: firebaseUid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const outstandingInvoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      status: 'open',
    });

    console.log("outstandingInvoices",outstandingInvoices)

    if (outstandingInvoices.data.length > 0) {

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer: user.stripeCustomerId,
        line_items: outstandingInvoices.data.map((invoice) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Outstanding Invoice',
            },
            unit_amount: Math.round(invoice.amount_due * 100),
          },
          quantity: 1,
        })),
        success_url: `${process.env.DOMAIN}/success`,
        cancel_url: `${process.env.DOMAIN}/cancel`,
      });
      res.json({ outstandingInvoices: outstandingInvoices.data, checkoutUrl: session.url });
    } else {
      const fileRef = admin.storage().bucket().file(`uploads/${fileName}`);
      const downloadLink = await fileRef.getSignedUrl({ action: 'read', expires: '03-09-2491' });
     
      res.json({ downloadLink: downloadLink[0] });
      console.log("downloadLink",downloadLink)
      // No outstanding invoices, generate download link
     // const downloadLink = `${req.protocol}://${req.get('host')}/download/${fileId}`;
     // res.json({ downloadLink });
    }
  } catch (error) {
    console.error('Error initiating download:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/*
app.get('/download/:fileId', async (req, res) => {
  const firebaseUid = req.query.firebaseUid;
  try {
    const fileId = req.params.fileId;
  
    const user = await User.findOne({ firebaseUid: firebaseUid  });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch outstanding invoices for the user from Stripe
    const outstandingInvoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      status: 'open',
    });

    if (outstandingInvoices.data.length > 0) {
      // Create a Stripe Checkout session for the outstanding invoices
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer: user.stripeCustomerId,
        line_items: outstandingInvoices.data.map((invoice) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Outstanding Invoice',
            },
            unit_amount: Math.round(invoice.amount_due * 100),
          },
          quantity: 1,
        })),
        success_url: `${req.protocol}://${req.get('host')}/success`,
        cancel_url: `${req.protocol}://${req.get('host')}/cancel`,
      });

      // Return the Stripe Checkout session URL to the client
      res.json({ outstandingInvoices: outstandingInvoices.data, checkoutUrl: session.url });
    } else {
      // No outstanding invoices, generate download link
      const downloadLink = `${req.protocol}://${req.get('host')}/download/${fileId}`;
      res.json({ downloadLink });
    }
  } catch (error) {
    console.error('Error initiating download:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
*/
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
      const userId = user.firebaseUid
      const totalUsageInBytes = user.totalUsage;
      const subscriptionItemId = user.subscriptionId;
      console.log('subscriptionItemId:', subscriptionItemId);
      console.log('totalUsageInBytes:', totalUsageInBytes);
      console.log('userId:', userId);
      //change subscription id to a string 
      subscriptionItemId.toString();

      const subscription = await stripe.subscriptions.retrieve(subscriptionItemId);
      if (subscription.status !== 'active') {
        console.log(`Subscription ${subscriptionItemId} is not active (status: ${subscription.status}). Skipping usage reporting.`);
        continue;
      }
     //resume subscription if not active 
     await stripe.subscriptions.retrieve(subscriptionItemId);
    console.log(`Resumed subscription ${subscriptionItemId} for user ${userId}`);


      const totalUsageInGB = totalUsageInBytes / (1024 * 1024 * 1024);

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

      console.log(`Reported usage for user ${userId}: ${totalUsageInGB} GB  ${usageRecord} to Stripe`);
    }
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
  }
}

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