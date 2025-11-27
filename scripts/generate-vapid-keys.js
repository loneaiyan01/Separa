/**
 * Generate VAPID Keys for Web Push Notifications
 * Run: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔑 VAPID Keys Generated!\n');
console.log('Add these to your .env file:\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY="' + vapidKeys.publicKey + '"');
console.log('VAPID_PRIVATE_KEY="' + vapidKeys.privateKey + '"');
console.log('VAPID_EMAIL="mailto:admin@separa.app"');
console.log('\n⚠️  Keep the private key secret and never commit it to version control!\n');
