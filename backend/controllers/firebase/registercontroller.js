const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();
const User = require('../../models/schema');

exports.registerusers = async (req, res) => { 
        try {
          const { email, firebaseUid } = req.body;
          const existingUser = await User.findOne({ firebaseUid });
          if (existingUser) {
            return res.status(400).json({ error: 'User with the same firebaseUid already exists' });
          }
      
          try {
            const customer = await stripe.customers.create({
              email,
              metadata: { firebaseUid },
            });
      
            try {
              const priceId = 'price_1PHRy706X2LgIaPO7YB9AGkW';
              const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: [
                  {
                    price: priceId,
                  },
                ],
                expand: ['latest_invoice.payment_intent', 'items.data.price'],
              });
      
              const subscriptioncreated = subscription?.id;
              console.log("subscriptionItemId", subscriptioncreated);
      
              const subscriptionItemId = await stripe.subscriptionItems.create({
                subscription: subscriptioncreated,
                price: subscription.items?.data[0].price.id,
              });
      
              const user = new User({
                firebaseUid,
                email,
                stripeCustomerId: customer.id,
                subscriptionId: subscriptionItemId,
                subscriptionIdnotforItems: subscriptioncreated
              });
      
              await user.save();
      
              // Handle the subscription payment
              const paymentIntent = subscription.latest_invoice?.payment_intent;
              if (paymentIntent && paymentIntent.status === 'requires_action') {
                // Send the client secret to the frontend to handle authentication
                res.json({ requiresAction: true, clientSecret: paymentIntent.client_secret });
              } else {
                res.status(201).json(user);
                console.log("user", user);
              }
            } catch (stripeError) {
              console.error('Error creating Stripe subscription or subscription item:', stripeError);
              res.status(500).json({ error: 'Failed to create Stripe subscription or subscription item' });
            }
          } catch (customerError) {
            console.error('Error creating Stripe customer:', customerError);
            res.status(500).json({ error: 'Failed to create Stripe customer' });
          }
        } catch (error) {
          console.error('Error creating user and subscription:', error);
          res.status(500).json({ error: 'Failed to create user and subscription' });
        }
      }