const nodemailer = require("nodemailer");

let transporter = null;
let etherealAccount = null;
let isEmailEnabled = false;

async function initializeEthereal() {
  try {
    // Generate test SMTP account
    const testAccount = await nodemailer.createTestAccount();

    console.log("📧 ===== ETHEREAL EMAIL SETUP =====");
    console.log(`📧 User: ${testAccount.user}`);
    console.log(`📧 Pass: ${testAccount.pass}`);
    console.log(`📧 SMTP: ${testAccount.smtp.host}:${testAccount.smtp.port}`);
    console.log("📧 =================================");

    etherealAccount = testAccount;

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Verify connection
    await transporter.verify();
    isEmailEnabled = true;
    console.log("✅ Ethereal email ready!");
    console.log(`📧 User: ${testAccount.user}`);
    return transporter;
  } catch (error) {
    console.error("❌ Ethereal setup failed:", error);
    console.log("📧 Email features will be disabled (demo mode)");
    isEmailEnabled = false;
    return null;
  }
}

// ✅ Send email function
async function sendEmail({ to, subject, html }) {
  if (isEmailEnabled && transporter) {
    try {
      // if (!transporter) {
      //   await initializeEthereal();
      // }

      const mailOptions = {
        from: '"Car Rental" <noreply@carrental.com>',
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);

      // ✅ Get preview URL (CRITICAL for demo!)
      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log("📧 Email sent via Ethereal!");
      console.log(`📧 To: ${to}`);
      console.log(`📧 Subject: ${subject}`);
      console.log(`📧 Preview: ${previewUrl}`);
      console.log("📧 ================================");

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl,
        provider: "ethereal",
      };
    } catch (error) {
      console.error("❌ Email send error:", error);
      // throw error;
    }
  }

  // ✅ Fallback: Mock email (always works!)
  console.log("📧 ===== MOCK EMAIL =====");
  console.log(`📧 To: ${to}`);
  console.log(`📧 Subject: ${subject}`);
  console.log(`📧 Body: ${html?.substring(0, 200)}...`);
  console.log("📧 =====================");

  // ✅ Generate a fake preview URL for demo
  const mockPreviewUrl = `${process.env.CLIENT_URL}/demo-email?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}`;

  return {
    success: true,
    messageId: "mock-" + Date.now(),
    previewUrl: mockPreviewUrl,
    provider: "mock",
    message: "Mock email (demo mode)",
  };
}

// ✅ For development - preview email without sending
async function previewEmail({ to, subject, html }) {
  console.log("📧 ===== EMAIL PREVIEW =====");
  console.log(`📧 To: ${to}`);
  console.log(`📧 Subject: ${subject}`);
  console.log(`📧 HTML: ${html.substring(0, 200)}...`);
  console.log("📧 ========================");

  return {
    success: true,
    preview: true,
  };
}

// ✅ Email templates
const emailTemplates = {
  // Verification Email
  verification: (name, verificationLink) => ({
    subject: "🔐 Verify Your Email Address",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f6f9;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f6f9; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚗 Car Rental</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Your Trusted Car Rental Service</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 20px;">Verify Your Email</h2>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 10px;">Hi ${name},</p>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">Thanks for signing up! Please verify your email address by clicking the button below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${verificationLink}" style="background: #4a90d9; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Verify Email</a>
                    </div>
                    <p style="color: #888; font-size: 12px; margin: 0 0 5px;">🔒 This link expires in <strong>24 hours</strong>.</p>
                    <p style="color: #888; font-size: 12px; margin: 0;">If you didn't create an account, please ignore this email.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Car Rental. All rights reserved.
                    </p>
                    <p style="color: #888; font-size: 12px; margin: 5px 0 0;">
                      Built with ❤️ for demo purposes
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),

  // Password Reset Email
  passwordReset: (name, resetLink) => ({
    subject: "🔑 Reset Your Password",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f6f9;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f6f9; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚗 Car Rental</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Your Trusted Car Rental Service</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 20px;">Reset Your Password</h2>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 10px;">Hi ${name},</p>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">We received a request to reset your password. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetLink}" style="background: #e67e22; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reset Password</a>
                    </div>
                    <p style="color: #888; font-size: 12px; margin: 0 0 5px;">🔒 This link expires in <strong>1 hour</strong>.</p>
                    <p style="color: #888; font-size: 12px; margin: 0;">If you didn't request this, please ignore this email.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Car Rental. All rights reserved.
                    </p>
                    <p style="color: #888; font-size: 12px; margin: 5px 0 0;">
                      Built with ❤️ for demo purposes
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),

  // Booking Confirmation
  bookingConfirmation: (booking) => ({
    subject: "✅ Booking Confirmed - Car Rental",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f6f9;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f6f9; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Booking Confirmed!</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Your ride is ready</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 20px;">Booking Details</h2>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">Hi ${booking.user?.fullName || "Customer"},</p>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">Your booking has been confirmed! Here are the details:</p>
                    
                    <table width="100%" cellpadding="10" style="background: #f8f9fa; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef;">
                      <tr>
                        <td style="border-bottom: 1px solid #e9ecef;"><strong>🚗 Vehicle</strong></td>
                        <td style="border-bottom: 1px solid #e9ecef;">${booking.vehicleId?.brand} ${booking.vehicleId?.model}</td>
                      </tr>
                      <tr>
                        <td style="border-bottom: 1px solid #e9ecef;"><strong>📅 Pickup</strong></td>
                        <td style="border-bottom: 1px solid #e9ecef;">${new Date(booking.bookingDate).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style="border-bottom: 1px solid #e9ecef;"><strong>📅 Return</strong></td>
                        <td style="border-bottom: 1px solid #e9ecef;">${new Date(booking.handOverDate).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style="border-bottom: 1px solid #e9ecef;"><strong>⏰ Duration</strong></td>
                        <td style="border-bottom: 1px solid #e9ecef;">${booking.duration} days</td>
                      </tr>
                      <tr>
                        <td style="border-bottom: 1px solid #e9ecef;"><strong>📍 Destination</strong></td>
                        <td style="border-bottom: 1px solid #e9ecef;">${booking.destination || "Not specified"}</td>
                      </tr>
                      <tr>
                        <td style="border-bottom: 1px solid #e9ecef;"><strong>💰 Total</strong></td>
                        <td style="border-bottom: 1px solid #e9ecef; font-weight: 600; color: #2ecc71;">$${booking.totalPrice}</td>
                      </tr>
                      <tr>
                        <td><strong>💳 Deposit Paid</strong></td>
                        <td style="font-weight: 600; color: #4a90d9;">$${booking.depositAmount}</td>
                      </tr>
                    </table>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.CLIENT_URL}/booking/${booking._id}" style="background: #2ecc71; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Booking</a>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Car Rental. All rights reserved.
                    </p>
                    <p style="color: #888; font-size: 12px; margin: 5px 0 0;">
                      Built with ❤️ for demo purposes
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),

  // Booking Reminder
  bookingReminder: (booking) => ({
    subject: "⏰ Upcoming Booking Reminder",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Reminder</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f6f9;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f6f9; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Booking Reminder</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Your ride starts tomorrow!</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: #1a1a1a; margin: 0 0 20px;">Your Booking is Tomorrow!</h2>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 10px;">Hi ${booking.user?.fullName || "Customer"},</p>
                    <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">This is a reminder that your car booking starts tomorrow. Please arrive on time with your driver's license and ID.</p>
                    
                    <table width="100%" cellpadding="10" style="background: #f8f9fa; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef;">
                      <tr>
                        <td style="border-bottom: 1px solid #e9ecef;"><strong>🚗 Vehicle</strong></td>
                        <td style="border-bottom: 1px solid #e9ecef;">${booking.vehicleId?.brand} ${booking.vehicleId?.model}</td>
                      </tr>
                      <tr>
                        <td style="border-bottom: 1px solid #e9ecef;"><strong>📅 Pickup</strong></td>
                        <td style="border-bottom: 1px solid #e9ecef;">${new Date(booking.bookingDate).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td><strong>📍 Location</strong></td>
                        <td>${booking.pickupLocation || "Our Office"}</td>
                      </tr>
                    </table>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.CLIENT_URL}/booking/${booking._id}" style="background: #4a90d9; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Booking</a>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Car Rental. All rights reserved.
                    </p>
                    <p style="color: #888; font-size: 12px; margin: 5px 0 0;">
                      Built with ❤️ for demo purposes
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),
};

// ✅ Initialize on startup
initializeEthereal();

module.exports = {
  sendEmail,
  previewEmail,
  emailTemplates,
  initializeEthereal,
  getTransporter: () => transporter,
  getEtherealAccount: () => etherealAccount,
};
