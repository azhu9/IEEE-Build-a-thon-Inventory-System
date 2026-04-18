import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.type === 'welcome') {
    return handleWelcome(body)
  }

  return handleOrderNotification(body)
}

async function handleWelcome({
  members,
  teamName,
  groupCode,
}: {
  members: { name: string; email: string }[]
  teamName: string
  groupCode: string
}) {
  const memberListHtml = members
    .map(m => `<li style="margin-bottom: 4px;">${m.name}</li>`)
    .join('')

  const emails = members.map(member => ({
    from: 'Hackathon <hello@azhu.dev>',
    to: member.email,
    subject: `Welcome to ${teamName} — Your team code is inside`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="margin-bottom: 8px;">Welcome to the IEEE X RUHART Buildathon! 🎉</h2>
        <p style="color: #374151; margin-bottom: 16px;">Hello <strong>${member.name}</strong>,</p>
        <p style="color: #374151; margin-bottom: 16px;">You've been registered as part of <strong>${teamName}</strong>. Here is your team information:</p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #111827;">Team members</p>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            ${memberListHtml}
          </ul>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Your team code</p>
          <p style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #111827; font-family: monospace;">${groupCode}</p>
          <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280;">Use this code to log in to the component checkout system</p>
        </div>

        <p style="color: #6b7280; font-size: 13px;">Keep this email handy — you'll need your team code every time you check out components.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">This is an automated message from the hackathon component checkout system.</p>
      </div>
    `,
  }))

  const results = await Promise.allSettled(
    emails.map(email => resend.emails.send(email))
  )

  const failed = results.filter(r => r.status === 'rejected')
  if (failed.length > 0) {
    return NextResponse.json({ error: 'Some emails failed to send' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

async function handleOrderNotification({
  email,
  teamName,
  type,
  note,
  orderId,
}: {
  email: string
  teamName: string
  type: 'approved' | 'rejected'
  note?: string
  orderId: string
}) {
  const isApproved = type === 'approved'

  const subject = isApproved
    ? '✅ Your order is ready for pickup!'
    : '❌ There was an issue with your order'

  const message = isApproved
    ? 'Great news! Your component order has been approved and is ready for pickup at the hardware table.'
    : 'Unfortunately your order could not be fulfilled. Please come speak to us at the hardware table.'

  const { data, error } = await resend.emails.send({
    from: 'Hackathon <hello@azhu.dev>',
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