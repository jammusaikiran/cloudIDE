# Email Notification Setup Guide

This guide will help you set up real email notifications for collaboration features in Cloud IDE.

## Prerequisites
- A Gmail account
- Node.js and npm installed

## Step-by-Step Setup

### 1. Generate Gmail App Password

Since Gmail requires App Passwords for third-party applications, follow these steps:

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/apppasswords
   - Sign in with your Gmail account

2. **Enable 2-Step Verification** (if not already enabled)
   - Go to: https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Follow the setup process

3. **Create App Password**
   - Return to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and name it "Cloud IDE"
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again)

### 2. Configure Environment Variables

Open `Backend/.env` file and add your email credentials:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `your-16-character-app-password` with the App Password from step 1
- Do NOT use your regular Gmail password
- Keep these credentials secure and never commit them to version control

### 3. Restart Backend Server

After adding the credentials, restart your backend server:

```bash
cd Backend
npm start
```

### 4. Test Email Notifications

1. **Create a Collaborative Project**
   - Log in to Cloud IDE
   - Go to "Collaboration Development"
   - Click "New Collaborative Project"
   - Add collaborators using their registered emails

2. **Send Change Notification**
   - Open a collaborative project
   - Make some changes to a file
   - Click "Notify Collaborators" button
   - Enter a change message
   - Click "Send Notification"

3. **Check Emails**
   - All collaborators should receive emails at their registered addresses
   - Check spam folder if emails don't appear in inbox

## Email Features

The system sends two types of emails:

### 1. Collaboration Invitation Email
Sent when a user is added as a collaborator to a project.

**Recipients:** New collaborators  
**Trigger:** When project owner adds collaborators

### 2. Change Notification Email
Sent when a collaborator notifies others about project changes.

**Recipients:** All collaborators (except the one who made changes)  
**Trigger:** When user clicks "Notify Collaborators" button

## Troubleshooting

### Emails Not Being Sent

1. **Check Console Logs**
   - Look for `✅ Email sent to...` messages
   - Or `❌ Error sending email...` messages

2. **Verify Credentials**
   - Ensure EMAIL_USER and EMAIL_PASSWORD are set correctly in .env
   - Make sure you're using App Password, not regular password
   - Check for extra spaces in the .env file

3. **Gmail Security**
   - Ensure 2-Step Verification is enabled
   - Generate a fresh App Password if needed
   - Check if Gmail is blocking the app (check your Gmail security alerts)

4. **Test with Console Logs**
   - If credentials are not set, emails will be logged to console
   - This is useful for testing without actual email sending

### Emails Going to Spam

If emails are going to spam folder:

1. **Add Sender to Contacts**
   - Add the EMAIL_USER address to your contacts

2. **Mark as Not Spam**
   - Move emails from spam to inbox
   - Mark them as "Not Spam"

3. **SPF/DKIM Records** (Advanced)
   - For production, consider setting up proper email authentication

## Alternative Email Services

While this setup uses Gmail, you can also use other email services:

### SendGrid
```javascript
// In emailService.js, change transporter to:
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

### Custom SMTP Server
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.yourdomain.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Security Best Practices

1. **Never Commit Credentials**
   - Add `.env` to `.gitignore`
   - Never share your App Password

2. **Use Environment Variables**
   - Always use process.env for sensitive data
   - Never hardcode credentials in source code

3. **Rotate Passwords Regularly**
   - Generate new App Passwords periodically
   - Revoke old App Passwords you're not using

4. **Monitor Usage**
   - Check Gmail security activity regularly
   - Look for suspicious login attempts

## Production Deployment

For production environments:

1. **Use Environment Variables**
   - Set EMAIL_USER and EMAIL_PASSWORD in your hosting platform
   - Examples: Heroku Config Vars, AWS Secrets Manager, etc.

2. **Consider Dedicated Email Service**
   - SendGrid (free tier: 100 emails/day)
   - Mailgun (free tier: 5000 emails/month)
   - Amazon SES (cost-effective for high volume)

3. **Implement Rate Limiting**
   - Prevent email spam
   - Add delays between bulk notifications

4. **Add Email Queue**
   - Use Bull or similar for background job processing
   - Prevents blocking API responses

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all setup steps were followed correctly
3. Test with mock emails first (no credentials set)
4. Check Gmail security settings and alerts

---

**Note:** The system works with or without email credentials. If credentials are not configured, notifications will be logged to the console instead of sending actual emails.
