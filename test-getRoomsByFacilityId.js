import { getRoomsByFacilityId } from "./lib/supabase-data";

async function test() {
  const facilityId = "a2311611-cb0d-4c1a-b318-eee95f507485";
  try {
    const rooms = await getRoomsByFacilityId(facilityId);
    console.log("Rooms for facility:", JSON.stringify(rooms, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

test(); 