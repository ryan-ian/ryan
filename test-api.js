// Simple script to test the API and trigger debug logs
async function testAPI() {
  try {
    console.log('Testing facilities API...');
    await fetch('http://localhost:3000/api/facilities');
    
    console.log('\nTesting rooms API...');
    await fetch('http://localhost:3000/api/rooms');
    
    console.log('\nDone! Check the server logs for debug information.');
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testAPI(); 