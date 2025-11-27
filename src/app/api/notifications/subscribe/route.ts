import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // Validate subscription object
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription object' },
        { status: 400 }
      );
    }

    // Extract endpoint for uniqueness check
    const endpoint = subscription.endpoint;

    // Store subscription in database (or file-based storage for now)
    // Check if subscription already exists
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    }).catch(() => null); // Handle case where table doesn't exist yet

    if (existingSubscription) {
      return NextResponse.json({
        message: 'Subscription already exists',
        subscription: existingSubscription
      });
    }

    // Create new subscription
    const newSubscription = await prisma.pushSubscription.create({
      data: {
        endpoint: endpoint,
        keys: subscription.keys,
        expirationTime: subscription.expirationTime || null,
      }
    }).catch(async (error) => {
      // Fallback to file-based storage if Prisma fails
      console.warn('Prisma unavailable, using file-based storage:', error.message);
      
      const fs = await import('fs/promises');
      const path = await import('path');
      const subscriptionsFile = path.join(process.cwd(), 'data', 'push-subscriptions.json');
      
      try {
        // Ensure data directory exists
        await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
        
        // Read existing subscriptions
        let subscriptions = [];
        try {
          const data = await fs.readFile(subscriptionsFile, 'utf-8');
          subscriptions = JSON.parse(data);
        } catch {
          // File doesn't exist yet, start with empty array
        }
        
        // Add new subscription
        const newSub = {
          id: Date.now().toString(),
          endpoint,
          keys: subscription.keys,
          expirationTime: subscription.expirationTime || null,
          createdAt: new Date().toISOString(),
        };
        
        subscriptions.push(newSub);
        
        // Write back to file
        await fs.writeFile(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
        
        return newSub;
      } catch (fileError) {
        console.error('File storage also failed:', fileError);
        throw fileError;
      }
    });

    return NextResponse.json({
      message: 'Subscription saved successfully',
      subscription: newSubscription
    });

  } catch (error: any) {
    console.error('Error saving subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription', details: error.message },
      { status: 500 }
    );
  }
}
