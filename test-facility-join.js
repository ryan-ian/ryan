// Simple script to test the facility join in the rooms API
async function testRoomsAPI() {
  try {
    console.log('Fetching rooms from API...');
    const response = await fetch('http://localhost:3000/api/rooms', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error(`API returned status ${response.status}: ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }
    
    const rooms = await response.json();
    
    if (!Array.isArray(rooms)) {
      console.error('API did not return an array:', rooms);
      return;
    }
    
    console.log(`Fetched ${rooms.length} rooms`);
    
    // Check if rooms have facility data
    const roomsWithFacility = rooms.filter(room => room.facility && room.facility.name !== 'Unknown Facility');
    const roomsWithoutFacility = rooms.filter(room => !room.facility || room.facility.name === 'Unknown Facility');
    
    console.log(`Rooms with valid facility data: ${roomsWithFacility.length}`);
    console.log(`Rooms with missing or unknown facility: ${roomsWithoutFacility.length}`);
    
    if (roomsWithFacility.length > 0) {
      console.log('\nSample room with facility:');
      console.log(JSON.stringify(roomsWithFacility[0], null, 2));
    }
    
    if (roomsWithoutFacility.length > 0) {
      console.log('\nSample room with missing facility:');
      console.log(JSON.stringify(roomsWithoutFacility[0], null, 2));
    }
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.error('Make sure the development server is running on http://localhost:3000');
  }
}

// Run the test
testRoomsAPI(); 