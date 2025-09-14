const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying TouristSafetySystem to Sepolia...");

  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
      throw new Error("Insufficient balance for deployment");
    }

    // Get contract factory
    const TouristSafetySystem = await ethers.getContractFactory("TouristSafetySystem");
    
    console.log("📋 Contract factory created");
    console.log("⏳ Deploying contract...");

    // Deploy with explicit gas settings
    const contract = await TouristSafetySystem.deploy({
      gasLimit: 5000000, // Set explicit gas limit
    });

    console.log("✅ Deployment transaction sent");
    console.log("Transaction hash:", contract.deploymentTransaction().hash);
    
    // Get contract address immediately (available before confirmation)
    const contractAddress = await contract.getAddress();
    console.log("📍 Contract will be deployed to:", contractAddress);
    
    // Wait for confirmation with timeout
    console.log("⏳ Waiting for confirmation...");
    
    // Simple wait approach - just wait for the contract to be available
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const code = await ethers.provider.getCode(contractAddress);
        if (code !== "0x") {
          console.log("✅ Contract deployed successfully!");
          break;
        }
      } catch (error) {
        // Continue waiting
      }
      
      attempts++;
      console.log(`⏳ Waiting... (${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Deployment timeout - contract may still be deploying");
    }

    // Test the contract
    console.log("🧪 Testing contract...");
    const totalTourists = await contract.getTotalTourists();
    console.log("Total tourists:", totalTourists.toString());

    // Final summary
    console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("=====================================");
    console.log("Contract Address:", contractAddress);
    console.log("Network: Sepolia Testnet");
    console.log("Deployer:", deployer.address);
    console.log("View on Etherscan:");
    console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log("=====================================");

    return contractAddress;

  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error("Error:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("💡 Solution: Get more test ETH from Sepolia faucet");
    } else if (error.message.includes("yParity")) {
      console.log("💡 This is a known ethers v6 issue, but deployment may still succeed");
      console.log("💡 Check Sepolia Etherscan for your transaction");
    }
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment script failed:", error.message);
    process.exit(1);
  });