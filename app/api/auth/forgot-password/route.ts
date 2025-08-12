import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, status')
      .eq('email', email)
      .eq('status', 'active')
      .single()

    // Always return success to prevent email enumeration
    if (error || !user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      })
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '1h' }
    )

    // Create reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    // Send password reset email
    const emailData = {
      to: user.email,
      subject: 'STPPL Transport - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                
                <div class="content">
                    <h2>Hello ${user.name},</h2>
                    <p>We received a request to reset your password for your STPPL Transport account.</p>
                    
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetLink}" class="button">Reset Password</a>
                    
                    <div class="warning">
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This link will expire in 1 hour</li>
                            <li>If you didn't request this reset, please ignore this email</li>
                            <li>For security, this link can only be used once</li>
                        </ul>
                    </div>
                    
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #666;">${resetLink}</p>
                </div>
                
                <div class="footer">
                    <p>This is an automated message from STPPL Transport System.</p>
                    <p>Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request

        Hello ${user.name},
        
        We received a request to reset your password for your STPPL Transport account.
        
        Click this link to reset your password: ${resetLink}
        
        Important:
        - This link will expire in 1 hour
        - If you didn't request this reset, please ignore this email
        - For security, this link can only be used once
        
        If you have any questions, please contact the transport coordination team.
      `
    }

    await sendEmail(emailData)

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}