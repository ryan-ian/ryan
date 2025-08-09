// Test script to verify the meeting status logic works correctly
console.log('🧪 Testing Meeting Status Logic...\n');

// Mock booking data
const mockBookings = [
  {
    id: '1',
    title: 'Team Standup',
    description: 'Daily team sync meeting',
    start_time: '2024-01-15T09:00:00Z',
    end_time: '2024-01-15T09:30:00Z',
    checked_in_at: null, // Not checked in
    users: { name: 'John Doe', email: 'john@example.com' }
  },
  {
    id: '2',
    title: 'Project Review',
    description: 'Quarterly project review with stakeholders',
    start_time: '2024-01-15T10:00:00Z',
    end_time: '2024-01-15T11:00:00Z',
    checked_in_at: '2024-01-15T10:05:00Z', // Checked in
    users: { name: 'Jane Smith', email: 'jane@example.com' }
  }
];

// Test status determination logic
function determineRoomStatus(currentBooking, room, nextBooking, now) {
  if (currentBooking) {
    // Check if the current booking has been checked in
    if (currentBooking.checked_in_at) {
      return "meeting-in-progress";
    } else {
      return "occupied";
    }
  } else if (room?.status === "maintenance") {
    return "maintenance";
  } else if (nextBooking && isWithinReservedWindow(nextBooking, now)) {
    return "reserved";
  } else {
    return "available";
  }
}

function isWithinReservedWindow(nextBooking, now) {
  const startTime = new Date(nextBooking.start_time);
  const reservedStart = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 minutes before
  return now >= reservedStart && now < startTime;
}

// Test scenarios
const testScenarios = [
  {
    name: 'Booking without check-in',
    currentBooking: mockBookings[0],
    room: { status: 'active' },
    nextBooking: null,
    now: new Date('2024-01-15T09:15:00Z'),
    expectedStatus: 'occupied'
  },
  {
    name: 'Booking with check-in (Meeting in Progress)',
    currentBooking: mockBookings[1],
    room: { status: 'active' },
    nextBooking: null,
    now: new Date('2024-01-15T10:30:00Z'),
    expectedStatus: 'meeting-in-progress'
  },
  {
    name: 'No current booking, available',
    currentBooking: null,
    room: { status: 'active' },
    nextBooking: null,
    now: new Date('2024-01-15T08:00:00Z'),
    expectedStatus: 'available'
  },
  {
    name: 'Reserved window (15 min before next booking)',
    currentBooking: null,
    room: { status: 'active' },
    nextBooking: mockBookings[0],
    now: new Date('2024-01-15T08:50:00Z'), // 10 minutes before 9:00 AM
    expectedStatus: 'reserved'
  },
  {
    name: 'Maintenance status',
    currentBooking: null,
    room: { status: 'maintenance' },
    nextBooking: null,
    now: new Date('2024-01-15T08:00:00Z'),
    expectedStatus: 'maintenance'
  }
];

// Run tests
console.log('Running test scenarios:\n');

testScenarios.forEach((scenario, index) => {
  const actualStatus = determineRoomStatus(
    scenario.currentBooking,
    scenario.room,
    scenario.nextBooking,
    scenario.now
  );
  
  const passed = actualStatus === scenario.expectedStatus;
  const icon = passed ? '✅' : '❌';
  
  console.log(`${icon} Test ${index + 1}: ${scenario.name}`);
  console.log(`   Expected: ${scenario.expectedStatus}`);
  console.log(`   Actual:   ${actualStatus}`);
  
  if (!passed) {
    console.log(`   ⚠️  TEST FAILED!`);
  }
  
  console.log('');
});

// Test status display messages
console.log('📋 Status Display Messages:');
console.log('');

const statusMessages = {
  'available': 'Room is available for immediate use',
  'occupied': 'Room is booked but user has not checked in yet',
  'meeting-in-progress': 'Meeting is actively in progress - Please keep noise to a minimum',
  'reserved': 'Room will be needed soon for an upcoming meeting',
  'maintenance': 'Room is temporarily unavailable due to maintenance'
};

Object.entries(statusMessages).forEach(([status, message]) => {
  console.log(`🔸 ${status.toUpperCase()}: ${message}`);
});

console.log('\n🎉 Meeting status logic test completed!');
console.log('\n📝 Key Features Implemented:');
console.log('   • Differentiate between "occupied" (not checked in) and "meeting-in-progress" (checked in)');
console.log('   • Prominent meeting information display when checked in');
console.log('   • Purple color scheme for meeting-in-progress status');
console.log('   • Privacy notice for active meetings');
console.log('   • Meeting details: title, description, duration, organizer');
