const User = require('../../models/schema');
const { createStripeCustomer, createSubscription } = require('../../services/registerservices');

exports.registerusers = async (req, res) => {
  try {
    const { email, firebaseUid } = req.body;
    if(!email || !firebaseUid) {
        return res.status(400).json({ error: 'Email and firebaseUid are required' });
        }
    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) {
      return res.status(400).json({ error: 'User with the same firebaseUid already exists' });
    }

    const customer = await createStripeCustomer(email, firebaseUid);
    const priceId = 'price_1PHRy706X2LgIaPO7YB9AGkW';
    const subscription = await createSubscription(customer.id, priceId);
     console.log('subscription', subscription	)
     console.log('customer', customer)
    const user = new User({
      firebaseUid,
      email,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
    });

    await user.save();

    // Handle the subscription payment
    const paymentIntent = subscription.latest_invoice?.payment_intent;
    if (paymentIntent && paymentIntent.status === 'requires_action') {
      // Send the client secret to the frontend to handle authentication
      res.json({ requiresAction: true, clientSecret: paymentIntent.client_secret });
    } else {
      res.status(201).json(user);
      console.log('user', user);
    }
  } catch (error) {
    console.error('Error creating user and subscription:', error);
    res.status(500).json({ error: 'Failed to create user and subscription' });
  }
};