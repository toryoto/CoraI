import { prisma } from '@/lib/prisma'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    const { id } = evt.data
    if (!id) {
      console.error('Webhook payload missing ID')
      return new Response('Invalid webhook payload: missing ID', { status: 400 })
    }

    const eventType = evt.type
    console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
    console.log('Webhook payload:', evt.data)

    if (eventType === 'user.created') {
      const emailObj = evt.data.email_addresses?.[0]
      const email = emailObj?.email_address ?? null
      const username = evt.data.first_name ?? null
      const image_url = evt.data.image_url ?? null

      let emailVerified: Date | null = null
      if (emailObj?.verification?.status === 'verified') {
        emailVerified = new Date()
      }

      if (email) {
        await prisma.user.upsert({
          where: { clerkId: id },
          update: {
            email,
            name: username,
            image: image_url,
            emailVerified,
          },
          create: {
            clerkId: id,
            email,
            name: username ?? null,
            image: image_url ?? null,
            emailVerified,
          },
        })
        console.log('User saved to DB:', { id, email })
      } else {
        console.warn('Email not found in webhook payload')
      }
    }

    return new Response('Webhook received', { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
