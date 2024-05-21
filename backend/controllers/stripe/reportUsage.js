const User = require('../../models/schema');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();

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

      console.log(`Reported usage for user ${userId}: ${totalUsageInGB} GB ${usageRecord} to Stripe`);
    }
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
  }
}


module.exports = reportUsageToStripe;