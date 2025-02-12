const express = require("express");
const app = express();
const { resolve } = require("path");
const cors = require("cors")

app.use(cors())
// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
});

app.use(express.static(process.env.STATIC_DIR));

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "EUR",
      amount: 1999,
      automatic_payment_methods: { enabled: true },
      metadata: { eventId: "your-event-id", userId: "your-user-id" },
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.post(
  "/webhook",
  express.json({ type: "application/json" }),
  (request, response) => {
    const event = request.body;

    console.dir(event)

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event;
        // Then define and call a method to handle the successful payment intent.
        // handlePaymentIntentSucceeded(paymentIntent);
        console.log(paymentIntent)

        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);
