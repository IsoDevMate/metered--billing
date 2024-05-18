const admin = require('firebase-admin');
const User = require('../../models/schema');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();
//const path = require('path');

exports.downloadpaidfile = async (req, res) => {
        try {
          const fileId = req.query.fileId;
          const fileName = req.query.fileName;
          const firebaseUid = req.query.firebaseUid;
      
          const user = await User.findOne({ firebaseUid: firebaseUid });
          if (!user) {
            return res.status(404).json({ message: 'User not found' });
          }
      
          let outstandingInvoices = await stripe.invoices.list({
            customer: user.stripeCustomerId,
            status: 'open',
          });
      
      
          const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
            customer: user.stripeCustomerId,
       
          });
          console.log("upcomingInvoice",upcomingInvoice)
       
          if (upcomingInvoice.total > 0) {
            const newInvoice = await stripe.invoices.create({
              customer: user.stripeCustomerId,
            });
            outstandingInvoices.data.push(newInvoice);
          }
      
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
          }
        } catch (error) {
          console.error('Error initiating download:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      }