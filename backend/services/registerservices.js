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
      expand: ['latest_invoice.payment_intent', 'items.data.price'],
    });
    return subscription;
  } catch (error) {
    throw new Error('Failed to create Stripe subscription');
  }
}

async function createSubscriptionItem(subscriptionId, priceId) {
  try {
    const subscriptionItem = await stripe.subscriptionItems.create({
      subscription: subscriptionId,
      price: priceId,
    });
    return subscriptionItem;
  } catch (error) {
    throw new Error('Failed to create Stripe subscription item');
  }
}

module.exports = {
  createStripeCustomer,
  createSubscription,
  createSubscriptionItem,
};