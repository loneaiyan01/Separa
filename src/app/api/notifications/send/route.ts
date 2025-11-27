import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import prisma from '@/lib/prisma';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@separa.app';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidEmail,
    vapidPublicKey,
    vapidPrivateKey
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export async function POST(request: NextRequest) {
  try {
    // Check if VAPID keys are configured
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured. Please set up environment variables.' },
        { status: 500 }
      );
    }

    const { payload, targetEndpoint } = await request.json() as {
      payload: NotificationPayload;
      targetEndpoint?: string;
    };

    // Validate payload
    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      );
    }

    // Get all subscriptions or specific one
    let subscriptions: any[] = [];

    try {
      if (targetEndpoint) {
        // Send to specific subscription
        const sub = await prisma.pushSubscription.findUnique({
          where: { endpoint: targetEndpoint }
        });
        if (sub) subscriptions = [sub];
      } else {
        // Send to all subscriptions
        subscriptions = await prisma.pushSubscription.findMany();
      }
    } catch (error) {
      // Fallback to file-based storage
      const fs = await import('fs/promises');
      const path = await import('path');
      const subscriptionsFile = path.join(process.cwd(), 'data', 'push-subscriptions.json');
      
      try {
        const data = await fs.readFile(subscriptionsFile, 'utf-8');
        const allSubs = JSON.parse(data);
        
        if (targetEndpoint) {
          subscriptions = allSubs.filter((sub: any) => sub.endpoint === targetEndpoint);
        } else {
          subscriptions = allSubs;
        }
      } catch (fileError) {
        console.error('Could not read subscriptions:', fileError);
      }
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({
        message: 'No subscriptions found',
        sent: 0
      });
    }

    // Prepare notification
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      tag: payload.tag,
      data: payload.data,
    });

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          };

          await webpush.sendNotification(pushSubscription, notificationPayload);
          return { success: true, endpoint: subscription.endpoint };
        } catch (error: any) {
          console.error('Failed to send notification:', error);
          
          // If subscription is invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            try {
              await prisma.pushSubscription.delete({
                where: { endpoint: subscription.endpoint }
              });
            } catch {
              // Ignore deletion errors
            }
          }
          
          return { success: false, endpoint: subscription.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      message: 'Notifications sent',
      sent: successful,
      failed: failed,
      total: results.length
    });

  } catch (error: any) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error.message },
      { status: 500 }
    );
  }
}
