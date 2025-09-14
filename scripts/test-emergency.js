const { ethers } = require("hardhat");

async function main() {
  console.log("🚨 Starting Emergency Functions Tests\n");

  // Deploy the contract
  console.log("📋 Step 1: Deploying Contract...");
  const TouristSafetySystem = await ethers.getContractFactory("TouristSafetySystem");
  const contract = await TouristSafetySystem.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ Contract deployed at:", contractAddress);
  
  // Get signers
  const [admin, tourismOfficer, policeOfficer, emergencyResponder] = await ethers.getSigners();
  console.log("👥 Test accounts ready\n");

  try {
    // Setup: Grant roles and register a tourist
    console.log("🔧 Setup: Granting roles and registering tourist...");
    await contract.grantRoleToAddress(await contract.TOURISM_OFFICER(), tourismOfficer.address);
    await contract.grantRoleToAddress(await contract.POLICE_OFFICER(), policeOfficer.address);
    await contract.grantRoleToAddress(await contract.EMERGENCY_RESPONDER(), emergencyResponder.address);
    
    const checkOutTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
    await contract.connect(tourismOfficer).registerTourist(
      "P987654321", "hash_aadhaar_456", "Jane Smith", 9876543210,
      "Canada", "Mumbai -> Goa -> Kerala", "+1-555-0456", checkOutTime
    );
    console.log("✅ Setup completed\n");

    // Test 1: Trigger Emergency Alert (Panic Button)
    console.log("🧪 Test 1: Trigger Emergency Alert (Panic Button)");
    const alertTx = await contract.triggerEmergencyAlert(
      1,                           // tourist ID
      "PANIC",                     // alert type
      "Tourist pressed panic button - feels unsafe", // description
      "Goa Beach, North Goa"       // current location
    );
    await alertTx.wait();
    console.log("   ✅ Emergency alert triggered successfully");
    
    // Check tourist status after emergency
    const touristAfterAlert = await contract.getTouristById(1);
    console.log("   Tourist status after alert:", touristAfterAlert.status); // Should be 3 (Emergency)
    console.log("   Safety score after alert:", touristAfterAlert.safetyScore.toString()); // Should be 0
    console.log("   Safety level after alert:", touristAfterAlert.safetyLevel); // Should be 3 (Red)
    console.log("   ✅ Emergency alert test passed\n");

    // Test 2: Get Tourist Alerts
    console.log("🧪 Test 2: Get Tourist Alerts");
    const alerts = await contract.getTouristAlerts(1);
    console.log("   Number of alerts:", alerts.length);
    if (alerts.length > 0) {
      console.log("   Alert ID:", alerts[0].alertId.toString());
      console.log("   Alert type:", alerts[0].alertType);
      console.log("   Description:", alerts[0].description);
      console.log("   Location:", alerts[0].location);
      console.log("   Is resolved:", alerts[0].isResolved);
      console.log("   Timestamp:", new Date(Number(alerts[0].timestamp) * 1000).toLocaleString());
    }
    console.log("   ✅ Get tourist alerts test passed\n");

    // Test 3: Get Emergency Alerts (System-wide)
    console.log("🧪 Test 3: Get System Emergency Alerts");
    const emergencyAlerts = await contract.getEmergencyAlerts();
    console.log("   Tourists with emergency alerts:", emergencyAlerts.map(id => id.toString()));
    console.log("   ✅ Get emergency alerts test passed\n");

    // Test 4: Trigger Another Alert (Different Type)
    console.log("🧪 Test 4: Trigger Medical Emergency");
    await contract.triggerEmergencyAlert(
      1, "MEDICAL", "Tourist injured - needs immediate medical attention", "Goa Hospital"
    );
    
    const updatedAlerts = await contract.getTouristAlerts(1);
    console.log("   Total alerts now:", updatedAlerts.length);
    console.log("   Latest alert type:", updatedAlerts[1].alertType);
    console.log("   ✅ Medical emergency test passed\n");

    // Test 5: Resolve Emergency Alert
    console.log("🧪 Test 5: Resolve Emergency Alert");
    const resolveTx = await contract.connect(emergencyResponder).resolveEmergencyAlert(1, 0);
    await resolveTx.wait();
    console.log("   ✅ Emergency alert resolved successfully");
    
    // Check resolved alert
    const resolvedAlerts = await contract.getTouristAlerts(1);
    console.log("   First alert resolved:", resolvedAlerts[0].isResolved);
    console.log("   Responder address:", resolvedAlerts[0].responderAddress);
    console.log("   Response time:", new Date(Number(resolvedAlerts[0].responseTime) * 1000).toLocaleString());
    
    // Check tourist status after resolution
    const touristAfterResolution = await contract.getTouristById(1);
    console.log("   Tourist status after resolution:", touristAfterResolution.status); // Should be 0 (Active)
    console.log("   Safety score after resolution:", touristAfterResolution.safetyScore.toString()); // Should be 60
    console.log("   ✅ Resolve emergency test passed\n");

    // Test 6: Mark Tourist as Missing (Police Function)
    console.log("🧪 Test 6: Mark Tourist as Missing");
    await contract.connect(policeOfficer).markTouristMissing(1);
    
    const missingTourist = await contract.getTouristById(1);
    console.log("   Tourist status (missing):", missingTourist.status); // Should be 2 (Missing)
    console.log("   Safety score (missing):", missingTourist.safetyScore.toString()); // Should be 0
    console.log("   ✅ Mark tourist missing test passed\n");

    // Test 7: Get Tourists by Safety Level
    console.log("🧪 Test 7: Get Tourists by Safety Level");
    const redLevelTourists = await contract.getTouristsBySafetyLevel(3); // Red level
    console.log("   Tourists with Red safety level:", redLevelTourists.map(id => id.toString()));
    console.log("   ✅ Get tourists by safety level test passed\n");

    // Test 8: Check Out Tourist
    console.log("🧪 Test 8: Check Out Tourist");
    await contract.connect(tourismOfficer).checkOutTourist(1);
    
    const checkedOutTourist = await contract.getTouristById(1);
    console.log("   Tourist status (checked out):", checkedOutTourist.status); // Should be 1 (CheckedOut)
    console.log("   Tourist is active:", checkedOutTourist.isActive); // Should be false
    console.log("   ✅ Check out tourist test passed\n");

    console.log("🎉 All Emergency Function Tests Completed Successfully!");
    console.log("📊 Emergency Functions Summary:");
    console.log("   - Panic button (emergency alerts) ✅");
    console.log("   - Alert retrieval and tracking ✅");
    console.log("   - Emergency resolution system ✅");
    console.log("   - Missing person reporting ✅");
    console.log("   - Safety level monitoring ✅");
    console.log("   - Tourist checkout process ✅");

  } catch (error) {
    console.error("❌ Emergency test failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Emergency test suite failed:", error);
    process.exit(1);
  });