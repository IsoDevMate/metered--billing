const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeCustomer(email, firebaseUid) {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: { firebaseUid },
    });
    return customer;
  } catch (error) {
    throw new Error('Failed to create Stripe customer');
  }
}

async function createSubscription(customerId, priceId) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  } catch (error) {
    throw new Error('Failed to create Stripe subscription');
  }
}

module.exports = {
  createStripeCustomer,
  createSubscription,
};