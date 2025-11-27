import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">You're Offline</h1>
          <p className="text-gray-300">
            It looks like you've lost your internet connection. Please check your network and try again.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Try Again
          </Button>
          
          <Link href="/">
            <Button variant="outline" className="w-full">
              Go to Home
            </Button>
          </Link>
        </div>

        <div className="pt-6 text-sm text-gray-400">
          <p>Tip: Make sure you're connected to the internet to use Separa.</p>
        </div>
      </div>
    </div>
  );
}
