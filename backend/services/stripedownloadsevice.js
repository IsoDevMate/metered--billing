const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();
async function listOutstandingInvoices(customerId) {
  try {
    const outstandingInvoices = await stripe.invoices.list({
      customer: customerId,
      status: 'open',
    });
    return outstandingInvoices;
  } catch (error) {
    throw new Error('Failed to list outstanding invoices');
  }
}

async function retrieveUpcomingInvoice(customerId) {
  try {
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
    return upcomingInvoice;
  } catch (error) {
    throw new Error('Failed to retrieve upcoming invoice');
  }
}

async function createInvoice(customerId) {
  try {
    const newInvoice = await stripe.invoices.create({
      customer: customerId,
    });
    return newInvoice;
  } catch (error) {
    throw new Error('Failed to create invoice');
  }
}

async function createCheckoutSession(customerId, outstandingInvoices) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customerId,
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
    return session;
  } catch (error) {
    throw new Error('Failed to create checkout session');
  }
}

module.exports = {
  listOutstandingInvoices,
  retrieveUpcomingInvoice,
  createInvoice,
  createCheckoutSession,
};