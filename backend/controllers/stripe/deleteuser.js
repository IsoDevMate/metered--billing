const User = require('../../models/schema');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();

async function deleteStripeCustomer(firebaseUid) {
    try {
      const user = await User.findOne({ firebaseUid });
  
      if (!user) {
        console.log(`No user found with Firebase UID: ${firebaseUid}`);
        return;
      }
     
      const stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        console.log(`No Stripe customer found for Firebase UID: ${firebaseUid}`);
        return;
      }
     
      await stripe.customers.del(stripeCustomerId);
      console.log(`Stripe customer ${stripeCustomerId} deleted for Firebase UID: ${firebaseUid}`);
      
     const remainingcustomers = await stripe.customers.list({
       limit: 20,
     });
  
      console.log("remaining customers",remainingcustomers)
      const mongoUser= await User.deleteOne({ firebaseUid });
      console.log("mongoUser deleted",mongoUser)
    } catch (error) {
      console.error(`Error deleting Stripe customer for Firebase UID ${firebaseUid}:`, error);
    }
  }

  module.exports = deleteStripeCustomer;