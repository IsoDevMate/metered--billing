const User = require('../../models/schema');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();


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
        const subscriptionpassed = user.subscriptionIdnotforItems;
        console.log('subscriptionItemId:', subscriptionpassed);
        console.log('totalUsageInBytes:', totalUsageInBytes);
        console.log('userId:', userId);
  
      
        console.log('subscriptionItemId in string:', subscriptionpassed);
  
        const subscription = await stripe.subscriptions.retrieve(subscriptionpassed);
        if (subscription.status !== 'active') {
          console.log(`Subscription ${subscriptionpassed} is not active (status: ${subscription.status}). Skipping usage reporting.`);
          continue;
        }
       //resume subscription if not active 
       await stripe.subscriptions.retrieve(subscriptionpassed);
      console.log(`Resumed subscription ${subscriptionpassed} for user ${userId}`);
  
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

  module.exports = reportUsageToStripe;