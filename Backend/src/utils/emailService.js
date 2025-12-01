// Email service for collaboration notifications
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  // Check if email configuration exists
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email credentials not configured. Emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

export const sendCollaborationEmail = async (toEmail, fromEmail, projectName) => {
  const transporter = createTransporter();
  
  // If no transporter (no credentials), just log to console
  if (!transporter) {
    console.log(`
    📧 Collaboration Invitation Email (MOCK)
    To: ${toEmail}
    From: ${fromEmail}
    Subject: You've been invited to collaborate on "${projectName}"
    
    Hi,
    
    ${fromEmail} has invited you to collaborate on the project "${projectName}" in Cloud IDE.
    
    Log in to your account to start collaborating!
    
    Best regards,
    Cloud IDE Team
  `);
    return true;
  }

  // Send real email
  try {
    await transporter.sendMail({
      from: `"Cloud IDE" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `You've been invited to collaborate on "${projectName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #667eea; margin-bottom: 20px;">🎉 Collaboration Invitation</h2>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              <strong>${fromEmail}</strong> has invited you to collaborate on the project 
              <strong>"${projectName}"</strong> in Cloud IDE.
            </p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Log in to your Cloud IDE account to start collaborating and working together on this project!
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px;">
                Best regards,<br>
                Cloud IDE Team
              </p>
            </div>
          </div>
        </div>
      `
    });
    
    console.log(`✅ Collaboration invitation email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${toEmail}:`, error.message);
    // Don't fail the request if email fails, just log it
    return false;
  }
};

export const sendChangeNotificationEmail = async (toEmail, changedBy, projectName, changeMessage) => {
  const transporter = createTransporter();
  
  // If no transporter (no credentials), just log to console
  if (!transporter) {
    console.log(`
    📧 Project Change Notification (MOCK)
    To: ${toEmail}
    Subject: "${projectName}" was updated by ${changedBy}
    
    Hi,
    
    ${changedBy} has made changes to the project "${projectName}".
    
    Change Description:
    ${changeMessage}
    
    Log in to view the changes!
    
    Best regards,
    Cloud IDE Team
  `);
    return true;
  }

  // Send real email
  try {
    await transporter.sendMail({
      from: `"Cloud IDE" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `"${projectName}" was updated by ${changedBy}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #667eea; margin-bottom: 20px;">📝 Project Update Notification</h2>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              <strong>${changedBy}</strong> has made changes to <strong>"${projectName}"</strong>.
            </p>
            <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="color: #667eea; margin: 0 0 10px 0; font-size: 16px;">Change Description:</h3>
              <p style="color: #555; margin: 0; white-space: pre-wrap;">${changeMessage}</p>
            </div>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Log in to Cloud IDE to view the changes!
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 14px;">
                Best regards,<br>
                Cloud IDE Team
              </p>
            </div>
          </div>
        </div>
      `
    });
    
    console.log(`✅ Change notification email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${toEmail}:`, error.message);
    // Don't fail the request if email fails, just log it
    return false;
  }
};
