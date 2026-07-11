const twilio = require('twilio');

/**
 * Send a WhatsApp message via Twilio.
 *
 * @param {object} opts
 * @param {string} opts.to   - Recipient phone in E.164 format, e.g. "+919876543210"
 * @param {string} opts.body - Plain-text message body
 */
const sendWhatsApp = async ({ to, body }) => {
  const sendPromise = (async () => {
    try {
      // If any Twilio credential is missing, log and bail gracefully
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !to) {
        console.log(`📱 WhatsApp (no credentials or number configured):`);
        console.log(`   To: ${to || 'N/A'}`);
        console.log(`   Body: ${body}`);
        return;
      }

      const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
      const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const message = await client.messages.create({
        from,
        to: toFormatted,
        body
      });

      console.log(`✅ WhatsApp sent to ${to} (SID: ${message.sid})`);
    } catch (error) {
      console.error(`❌ WhatsApp error: ${error.message}`);
      // Don't throw — WhatsApp failure should never break the request flow
    }
  })();

  if (process.env.VERCEL) {
    // Serverless: await so the lambda doesn't freeze before the message is sent
    await sendPromise;
  } else {
    // Local dev: fire-and-forget for fast responses
    sendPromise.catch(err => console.error('Background WhatsApp sending failed:', err));
  }
};

module.exports = sendWhatsApp;
