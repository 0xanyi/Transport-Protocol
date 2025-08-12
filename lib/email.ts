import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('=== EMAIL NOTIFICATION (RESEND NOT CONFIGURED) ===')
      console.log('To:', emailData.to)
      console.log('Subject:', emailData.subject)
      console.log('Content:')
      console.log(emailData.text || emailData.html)
      console.log('=================================================')
      return true
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'STPPL Transport <noreply@stppl.org>',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    })

    if (error) {
      console.error('Resend email error:', error)
      return false
    }

    console.log('Email sent successfully:', data?.id)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export function createAssignmentNotificationEmail(
  driverName: string, 
  driverEmail: string, 
  assignmentDetails: {
    vipName?: string
    vehicleInfo: string
    startTime: string
    endTime?: string
    pickupLocation?: string
    dropoffLocation?: string
    specialInstructions?: string
  }
): EmailData {
  const subject = 'STPPL Transport - New Assignment Notification'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .assignment-details { background-color: #e0f2fe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .button { background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
            .important { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Assignment Notification</h1>
            </div>
            
            <div class="content">
                <h2>Hello ${driverName},</h2>
                <p>You have been assigned a new transport task. Please review the details below:</p>
                
                <div class="assignment-details">
                    <h3>Assignment Details:</h3>
                    ${assignmentDetails.vipName ? `<p><strong>VIP:</strong> ${assignmentDetails.vipName}</p>` : ''}
                    <p><strong>Vehicle:</strong> ${assignmentDetails.vehicleInfo}</p>
                    <p><strong>Start Time:</strong> ${assignmentDetails.startTime}</p>
                    ${assignmentDetails.endTime ? `<p><strong>End Time:</strong> ${assignmentDetails.endTime}</p>` : ''}
                    ${assignmentDetails.pickupLocation ? `<p><strong>Pickup Location:</strong> ${assignmentDetails.pickupLocation}</p>` : ''}
                    ${assignmentDetails.dropoffLocation ? `<p><strong>Dropoff Location:</strong> ${assignmentDetails.dropoffLocation}</p>` : ''}
                    ${assignmentDetails.specialInstructions ? `<p><strong>Special Instructions:</strong> ${assignmentDetails.specialInstructions}</p>` : ''}
                </div>
                
                <div class="important">
                    <p><strong>Important Reminders:</strong></p>
                    <ul>
                        <li>Please arrive 15 minutes before the scheduled start time</li>
                        <li>Ensure your mobile device is charged for location tracking</li>
                        <li>Contact the coordination team if you have any questions</li>
                        <li>Check in through the driver portal when you begin your assignment</li>
                    </ul>
                </div>
                
                <p>You can view full assignment details and check in through the driver portal:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/assignments" class="button">
                    View Assignment
                </a>
                
                <p>If you have any questions or concerns about this assignment, please contact the transport coordination team immediately.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from STPPL Transport System.</p>
                <p>Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `
  
  const text = `
    New Assignment Notification

    Hello ${driverName},
    
    You have been assigned a new transport task.

    Assignment Details:
    ${assignmentDetails.vipName ? `VIP: ${assignmentDetails.vipName}` : ''}
    Vehicle: ${assignmentDetails.vehicleInfo}
    Start Time: ${assignmentDetails.startTime}
    ${assignmentDetails.endTime ? `End Time: ${assignmentDetails.endTime}` : ''}
    ${assignmentDetails.pickupLocation ? `Pickup Location: ${assignmentDetails.pickupLocation}` : ''}
    ${assignmentDetails.dropoffLocation ? `Dropoff Location: ${assignmentDetails.dropoffLocation}` : ''}
    ${assignmentDetails.specialInstructions ? `Special Instructions: ${assignmentDetails.specialInstructions}` : ''}

    Important Reminders:
    - Please arrive 15 minutes before the scheduled start time
    - Ensure your mobile device is charged for location tracking
    - Contact the coordination team if you have any questions
    - Check in through the driver portal when you begin your assignment

    View assignment details at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/assignments

    If you have any questions, please contact the transport coordination team.
  `

  return {
    to: driverEmail,
    subject,
    html,
    text
  }
}

export function createDriverLoginEmail(name: string, email: string, password: string): EmailData {
  const subject = 'STPPL Transport - Your Driver Account is Approved'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .credentials { background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to STPPL Transport</h1>
            </div>
            
            <div class="content">
                <h2>Congratulations ${name}!</h2>
                <p>Your driver application has been approved. You can now access the STPPL Transport System using the credentials below:</p>
                
                <div class="credentials">
                    <h3>Your Login Credentials:</h3>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Password:</strong> ${password}</p>
                </div>
                
                <p><strong>Important Security Notes:</strong></p>
                <ul>
                    <li>Please change your password after your first login</li>
                    <li>Do not share your credentials with anyone</li>
                    <li>Keep your password secure and confidential</li>
                </ul>
                
                <p>You can access the driver portal at:</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="button">
                    Access Driver Portal
                </a>
                
                <p>Once logged in, you will be able to:</p>
                <ul>
                    <li>View your assignments</li>
                    <li>Update your location during trips</li>
                    <li>Manage your profile</li>
                    <li>Access trip details and VIP information</li>
                </ul>
                
                <p>If you have any questions or need assistance, please contact the transport coordination team.</p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from STPPL Transport System.</p>
                <p>Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `
  
  const text = `
    Welcome to STPPL Transport!

    Congratulations ${name}!
    Your driver application has been approved.

    Your Login Credentials:
    Email: ${email}
    Password: ${password}

    Important: Please change your password after your first login.

    Access the driver portal at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

    If you have any questions, please contact the transport coordination team.
  `

  return {
    to: email,
    subject,
    html,
    text
  }
}