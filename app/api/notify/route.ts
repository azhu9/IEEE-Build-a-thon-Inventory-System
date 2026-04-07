import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email, teamName, type, note, orderId } = await req.json()

  const isApproved = type === 'approved'

  const subject = isApproved
    ? '✅ Your order is ready for pickup!'
    : '❌ There was an issue with your order'

  const message = isApproved
    ? `Great news! Your component order has been approved and is ready for pickup at the hardware table.`
    : `Unfortunately your order could not be fulfilled. Please come speak to us at the hardware table.`

  const { data, error } = await resend.emails.send({
    from: 'Hackathon <onboarding@resend.dev>',
    to: email,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="margin-bottom: 8px;">${subject}</h2>
        <p style="color: #374151; margin-bottom: 16px;">Hi <strong>${teamName}</strong>,</p>
        <p style="color: #374151; margin-bottom: 16px;">${message}</p>
        ${note ? `
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; color: #374151;"><strong>Note from admin:</strong> ${note}</p>
          </div>
        ` : ''}
        <p style="color: #6b7280; font-size: 14px;">Order ID: ${orderId}</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">This is an automated message from the hackathon component checkout system.</p>
      </div>
    `,
  })

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ data })
}