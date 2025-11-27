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

    const endpoint = subscription.endpoint;

    // Remove subscription from database
    await prisma.pushSubscription.delete({
      where: { endpoint }
    }).catch(async (error: any) => {
      // Fallback to file-based storage
      console.warn('Prisma unavailable, using file-based storage:', error.message);
      
      const fs = await import('fs/promises');
      const path = await import('path');
      const subscriptionsFile = path.join(process.cwd(), 'data', 'push-subscriptions.json');
      
      try {
        const data = await fs.readFile(subscriptionsFile, 'utf-8');
        let subscriptions = JSON.parse(data);
        
        // Filter out the subscription
        subscriptions = subscriptions.filter((sub: any) => sub.endpoint !== endpoint);
        
        // Write back to file
        await fs.writeFile(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
      } catch (fileError) {
        console.error('File storage operation failed:', fileError);
        // Don't throw - unsubscribe should succeed client-side even if server fails
      }
    });

    return NextResponse.json({
      message: 'Subscription removed successfully'
    });

  } catch (error: any) {
    console.error('Error removing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription', details: error.message },
      { status: 500 }
    );
  }
}
