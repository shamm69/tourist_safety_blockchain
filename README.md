# 🛡️ Tourist Safety Blockchain System

A comprehensive blockchain-based tourist safety monitoring and incident response system built on Ethereum. This system provides digital ID generation, real-time location tracking, emergency alerts, and role-based access control for tourism authorities.

## 🚀 Live Deployment

**Contract Address:** `0xce0e645a373899fc40f52170a3c2c5945b1d2b3b`  
**Network:** Sepolia Testnet  
**Chain ID:** 11155111  
**Status:** ✅ Deployed & Verified  
**Etherscan:** [View Contract](https://sepolia.etherscan.io/address/0xce0e645a373899fc40f52170a3c2c5945b1d2b3b#code)

## 📋 Features

### 🆔 Digital Tourist ID Management
- Secure blockchain-based tourist registration
- KYC integration (Aadhaar/Passport)
- Trip itinerary and emergency contact storage
- Time-bound validity (checkout system)

### 📍 Real-time Location Tracking
- GPS coordinate tracking
- Location history maintenance
- Battery level monitoring
- Optional real-time tracking for families/authorities

### 🚨 Emergency Response System
- Panic button functionality
- Multiple alert types (PANIC, MEDICAL, MISSING)
- Automated alert dispatch to nearest authorities
- Emergency resolution workflow

### 🛡️ Safety Score Management
- Dynamic safety scoring (0-100)
- Color-coded safety levels (Green/Yellow/Orange/Red)
- Behavior-based score adjustments
- Risk assessment automation

### 👮 Authority Dashboard
- Real-time tourist monitoring
- Emergency alert management
- Missing person reporting
- Safety level filtering and analytics

### 🔐 Role-Based Access Control
- Tourism Officer permissions
- Police Officer capabilities
- Emergency Responder access
- Admin role management

## 🛠️ Technical Stack

- **Smart Contract:** Solidity ^0.8.19
- **Framework:** Hardhat
- **Network:** Ethereum (Sepolia Testnet)
- **Libraries:** OpenZeppelin (AccessControl, ReentrancyGuard)
- **Testing:** Comprehensive test suite (26/26 functions tested)

## 📦 Integration Files

### For Mobile App Developers:
- `integration/contract-abi.json` - Contract ABI for frontend integration
- `integration/integration-package.json` - Complete configuration and network details

### Key Contract Functions:
```solidity
// Tourist Management
registerTourist(passport, aadhaar, name, phone, nationality, itinerary, emergency, checkout)
updateLocation(touristId, location, coordinates, batteryLevel)
toggleRealTimeTracking(touristId, enabled)

// Emergency System
triggerEmergencyAlert(touristId, alertType, description, location)
resolveEmergencyAlert(touristId, alertId)

// Data Retrieval
getTouristById(touristId)
getActiveTourists()
getEmergencyAlerts()
getTouristsBySafetyLevel(level)
