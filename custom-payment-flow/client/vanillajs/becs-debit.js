document.addEventListener('DOMContentLoaded', async () => {
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  const {publishableKey} = await fetch('/config').then(r => r.json());
  if(!publishableKey) {
    addMessage('No publishable key returned from the server. Please check `.env` and try again');
    alert('Please set your Stripe publishable API key in the .env file');
  }

  const stripe = Stripe(publishableKey);
  const elements = stripe.elements();
  const auBankAccount = elements.create('auBankAccount');
  auBankAccount.mount('#au-bank-account-element');


  // When the form is submitted...
  var form = document.getElementById('payment-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Make a call to the server to create a new
    // payment intent and store its client_secret.
    const resp = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: 'aud',
        paymentMethodType: 'au_becs_debit',
      }),
    }).then(r => r.json());

    if(resp.error) {
      addMessage(resp.error.message);
      return;
    }

    addMessage(`Client secret returned.`);

    const nameInput = document.querySelector('#name');
    const emailInput = document.querySelector('#email');

    // Confirm the card payment given the clientSecret
    // from the payment intent that was just created on
    // the server.
    const {error, paymentIntent} = await stripe.confirmAuBecsDebitPayment(resp.clientSecret, {
      payment_method: {
        au_becs_debit: auBankAccount,
        billing_details: {
          name: nameInput.value,
          email: emailInput.value
        }
      }
    })

    if(error) {
      addMessage(error.message);
    }

    addMessage(`Payment ${paymentIntent.status}: ${paymentIntent.id}`);
  });
});

// Helper for displaying status messages.
const addMessage = (message) => {
  const messagesDiv = document.querySelector('#messages')
  messagesDiv.innerHTML += `${message}<br>`;
  console.log(`Debug: ${message}`);
}
