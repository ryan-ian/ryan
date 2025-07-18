// This script simulates cron jobs during local development
const cron = require('node-cron');
const https = require('https');
const http = require('http');
const dotenv = require('dotenv');

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

// Use either the environment variable or a hard-coded development key for testing
// Make sure to use the same value in your .env.local file
const CRON_API_KEY = process.env.CRON_API_KEY || 'dev_cron_api_key_for_testing';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Function to make HTTP/HTTPS requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Schedule the booking reminders cron job to run every minute in development
// In production, this would be every 15 minutes
console.log('🕒 Starting development cron scheduler...');
console.log(`Using API key: ${CRON_API_KEY}`);
console.log(`Make sure this same key is set in your .env.local file and Vercel environment variables`);

cron.schedule('* * * * *', async () => {
  console.log('Running booking reminders cron job...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/cron/booking-reminders?api_key=${CRON_API_KEY}`);
    console.log('Cron job response:', response.data);
  } catch (error) {
    console.error('Error running cron job:', error);
  }
});

console.log('✅ Development cron scheduler started!');
console.log('Press Ctrl+C to stop'); 