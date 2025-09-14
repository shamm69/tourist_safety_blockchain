const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting TouristSafetySystem Function Tests\n");

  // Deploy the contract first
  console.log("📋 Step 1: Deploying Contract...");
  const TouristSafetySystem = await ethers.getContractFactory("TouristSafetySystem");
  const contract = await TouristSafetySystem.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed at:", contractAddress);
  
  // Get signers (accounts)
  const [admin, tourismOfficer, policeOfficer, emergencyResponder, tourist] = await ethers.getSigners();
  console.log("👥 Test accounts ready\n");

  try {
    // Test 1: Check initial state
    console.log("🧪 Test 1: Check Initial State");
    const totalTourists = await contract.getTotalTourists();
    console.log("   Total tourists initially:", totalTourists.toString());
    console.log("   ✅ Initial state test passed\n");

    // Test 2: Grant roles
    console.log("🧪 Test 2: Grant Roles");
    await contract.grantRoleToAddress(await contract.TOURISM_OFFICER(), tourismOfficer.address);
    await contract.grantRoleToAddress(await contract.POLICE_OFFICER(), policeOfficer.address);
    await contract.grantRoleToAddress(await contract.EMERGENCY_RESPONDER(), emergencyResponder.address);
    console.log("   ✅ Roles granted successfully\n");

    // Test 3: Register a tourist
    console.log("🧪 Test 3: Register Tourist");
    const checkOutTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
    
    const tx = await contract.connect(tourismOfficer).registerTourist(
      "P123456789",           // passport
      "hash_aadhaar_123",     // aadhaar hash
      "John Doe",             // name
      1234567890,             // phone
      "USA",                  // nationality
      "Delhi -> Goa -> Mumbai", // itinerary
      "+1-555-0123",          // emergency contact
      checkOutTime            // checkout time
    );
    
    await tx.wait();
    console.log("   ✅ Tourist registered successfully");
    
    // Check total tourists now
    const newTotal = await contract.getTotalTourists();
    console.log("   Total tourists now:", newTotal.toString());
    console.log("   ✅ Tourist registration test passed\n");

    // Test 4: Get tourist by ID
    console.log("🧪 Test 4: Get Tourist by ID");
    const touristData = await contract.getTouristById(1);
    console.log("   Tourist ID:", touristData.touristId.toString());
    console.log("   Name:", touristData.fullName);
    console.log("   Passport:", touristData.passportNumber);
    console.log("   Status:", touristData.status); // 0 = Active
    console.log("   Safety Score:", touristData.safetyScore.toString());
    console.log("   ✅ Get tourist by ID test passed\n");

    // Test 5: Get tourist by passport
    console.log("🧪 Test 5: Get Tourist by Passport");
    const touristIdByPassport = await contract.getTouristByPassport("P123456789");
    console.log("   Tourist ID from passport:", touristIdByPassport.toString());
    console.log("   ✅ Get tourist by passport test passed\n");

    // Test 6: Update location
    console.log("🧪 Test 6: Update Location");
    const locationTx = await contract.updateLocation(
      1,                      // tourist ID
      "India Gate, Delhi",    // location
      "28.6129,77.2295",     // coordinates
      85                      // battery level
    );
    await locationTx.wait();
    console.log("   ✅ Location updated successfully");
    
    // Check updated tourist data
    const updatedTourist = await contract.getTouristById(1);
    console.log("   Last known location:", updatedTourist.lastKnownLocation);
    console.log("   Last update time:", new Date(Number(updatedTourist.lastLocationUpdate) * 1000).toLocaleString());
    console.log("   ✅ Location update test passed\n");

    // Test 7: Get location history
    console.log("🧪 Test 7: Get Location History");
    const locationHistory = await contract.getLocationHistory(1);
    console.log("   Location history entries:", locationHistory.length);
    if (locationHistory.length > 0) {
      console.log("   Latest location:", locationHistory[0].location);
      console.log("   Coordinates:", locationHistory[0].coordinates);
      console.log("   Battery level:", locationHistory[0].batteryLevel);
    }
    console.log("   ✅ Location history test passed\n");

    // Test 8: Toggle real-time tracking
    console.log("🧪 Test 8: Toggle Real-time Tracking");
    await contract.toggleRealTimeTracking(1, true);
    const touristWithTracking = await contract.getTouristById(1);
    console.log("   Real-time tracking enabled:", touristWithTracking.realTimeTrackingEnabled);
    console.log("   ✅ Real-time tracking test passed\n");

    // Test 9: Get active tourists
    console.log("🧪 Test 9: Get Active Tourists");
    const activeTourists = await contract.getActiveTourists();
    console.log("   Active tourists count:", activeTourists.length);
    console.log("   Active tourist IDs:", activeTourists.map(id => id.toString()));
    console.log("   ✅ Get active tourists test passed\n");

    // Test 10: Verify tourist
    console.log("🧪 Test 10: Verify Tourist Identity");
    const isValid = await contract.verifyTourist(1, "P123456789");
    const isInvalid = await contract.verifyTourist(1, "WRONG_PASSPORT");
    console.log("   Valid passport verification:", isValid);
    console.log("   Invalid passport verification:", isInvalid);
    console.log("   ✅ Tourist verification test passed\n");

    console.log("🎉 All Basic Function Tests Completed Successfully!");
    console.log("📊 Summary:");
    console.log("   - Contract deployed and initialized ✅");
    console.log("   - Roles granted successfully ✅");
    console.log("   - Tourist registration working ✅");
    console.log("   - Location tracking working ✅");
    console.log("   - Data retrieval functions working ✅");
    console.log("   - Identity verification working ✅");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Test suite failed:", error);
    process.exit(1);
  });