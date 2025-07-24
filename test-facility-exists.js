// Script to check if a specific facility exists
async function checkFacilityExists() {
  try {
    const facilityId = "a2311611-cb0d-4c1a-b318-eee95f507485";
    console.log(`Checking if facility with ID ${facilityId} exists...`);
    
    // First, fetch all facilities
    const facilitiesResponse = await fetch('http://localhost:3000/api/facilities', {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!facilitiesResponse.ok) {
      console.error(`Facilities API returned status ${facilitiesResponse.status}`);
      return;
    }
    
    const facilities = await facilitiesResponse.json();
    
    if (!Array.isArray(facilities)) {
      console.error('Facilities API did not return an array:', facilities);
      return;
    }
    
    console.log(`Fetched ${facilities.length} facilities`);
    
    // Check if our facility ID exists
    const facility = facilities.find(f => f.id === facilityId);
    
    if (facility) {
      console.log('Facility found:', facility);
    } else {
      console.log('Facility not found with this ID.');
      
      // List all facility IDs for reference
      console.log('\nAll facility IDs:');
      facilities.forEach(f => {
        console.log(`- ${f.id}: ${f.name}`);
      });
    }
  } catch (error) {
    console.error('Error checking facility:', error.message);
  }
}

// Run the check
checkFacilityExists(); 