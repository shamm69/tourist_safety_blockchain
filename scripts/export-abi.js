const fs = require('fs');
const path = require('path');

async function main() {
  console.log("📄 Exporting contract ABI...");
  
  try {
    // Get the contract artifact
    const artifact = await hre.artifacts.readArtifact("TouristSafetySystem");
    
    // Create integration folder if it doesn't exist
    const integrationDir = path.join(__dirname, '..', 'integration');
    if (!fs.existsSync(integrationDir)) {
      fs.mkdirSync(integrationDir);
      console.log("📁 Created integration folder");
    }
    
    // Export ABI only
    const abiPath = path.join(integrationDir, 'contract-abi.json');
    fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
    console.log("✅ ABI exported to:", abiPath);
    
    // Export complete contract info
    const contractInfo = {
      contractAddress: "0xce0e645a373899fc40f52170a3c2c5945b1d2b3b",
      network: {
        name: "sepolia",
        chainId: 11155111,
        rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
        blockExplorer: "https://sepolia.etherscan.io"
      },
      roles: {
        TOURISM_OFFICER: "0x2841745a47e80081fb8621f01a21e95680bb2d4ca2ab3ea5a5359fd5de0a26e7",
        POLICE_OFFICER: "0x6e8f2016dfffba9828675e1d1ad5dffe94f7fb482f67ff14979af590bfda950d",
        EMERGENCY_RESPONDER: "0x9c970ec92ab9cdbb82793d6c1b0d367f91f85e69e38c39af836793b901da8613"
      },
      abi: artifact.abi
    };
    
    const infoPath = path.join(integrationDir, 'integration-package.json');
    fs.writeFileSync(infoPath, JSON.stringify(contractInfo, null, 2));
    console.log("✅ Integration package exported to:", infoPath);
    
    console.log("\n🎉 Export complete! Share these files with your team:");
    console.log("📄 contract-abi.json");
    console.log("📦 integration-package.json");
    console.log("🔗 Contract Address: 0xce0e645a373899fc40f52170a3c2c5945b1d2b3b");
    
  } catch (error) {
    console.error("❌ Export failed:", error.message);
  }
}

main().catch(console.error);