// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title TouristSafetySystem
 * @dev Main contract for managing tourist digital IDs and safety monitoring
 */
contract TouristSafetySystem is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant TOURISM_OFFICER = keccak256("TOURISM_OFFICER");
    bytes32 public constant POLICE_OFFICER = keccak256("POLICE_OFFICER");
    bytes32 public constant EMERGENCY_RESPONDER = keccak256("EMERGENCY_RESPONDER");
    
    // Counter for unique tourist IDs
    Counters.Counter private _touristIdCounter;
    
    // Tourist Status Enum
    enum TouristStatus {
        Active,
        CheckedOut,
        Missing,
        Emergency,
        Suspended
    }
    
    // Safety Score Levels
    enum SafetyLevel {
        Green,    // 80-100
        Yellow,   // 60-79
        Orange,   // 40-59
        Red       // 0-39
    }
    
    // Tourist Digital ID Structure
    struct TouristID {
        uint256 touristId;
        string passportNumber;
        string aadhaarHash; // Hashed for privacy
        string fullName;
        uint256 phoneNumber;
        string nationality;
        uint256 checkInTime;
        uint256 checkOutTime;
        string plannedItinerary;
        string emergencyContact;
        TouristStatus status;
        uint8 safetyScore;
        SafetyLevel safetyLevel;
        string lastKnownLocation;
        uint256 lastLocationUpdate;
        bool realTimeTrackingEnabled;
        bool isActive;
    }
    
    // Emergency Alert Structure
    struct EmergencyAlert {
        uint256 alertId;
        uint256 touristId;
        uint256 timestamp;
        string location;
        string alertType; // "PANIC", "ANOMALY", "MISSING", "MEDICAL"
        string description;
        bool isResolved;
        address responderAddress;
        uint256 responseTime;
    }
    
    // Location Update Structure
    struct LocationUpdate {
        uint256 touristId;
        string location;
        uint256 timestamp;
        string coordinates;
        uint8 batteryLevel;
        bool isEmergency;
    }
    
    // Mappings
    mapping(uint256 => TouristID) public tourists;
    mapping(string => uint256) public passportToTouristId;
    mapping(string => uint256) public aadhaarToTouristId;
    mapping(uint256 => EmergencyAlert[]) public touristAlerts;
    mapping(uint256 => LocationUpdate[]) public locationHistory;
    mapping(address => uint256[]) public officerAssignments;
    
    // Arrays for enumeration
    uint256[] public activeTourists;
    uint256[] public emergencyAlerts;
    
    // Events
    event TouristRegistered(uint256 indexed touristId, string passportNumber, address registeredBy);
    event EmergencyAlertTriggered(uint256 indexed touristId, uint256 indexed alertId, string alertType);
    event LocationUpdated(uint256 indexed touristId, string location, uint256 timestamp);
    event SafetyScoreUpdated(uint256 indexed touristId, uint8 newScore, SafetyLevel newLevel);
    event TouristStatusChanged(uint256 indexed touristId, TouristStatus newStatus);
    event EmergencyResolved(uint256 indexed touristId, uint256 indexed alertId, address responder);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TOURISM_OFFICER, msg.sender);
        _grantRole(POLICE_OFFICER, msg.sender);
        _grantRole(EMERGENCY_RESPONDER, msg.sender);
    }
    
    /**
     * @dev Register a new tourist with digital ID
     */
    function registerTourist(
        string memory _passportNumber,
        string memory _aadhaarHash,
        string memory _fullName,
        uint256 _phoneNumber,
        string memory _nationality,
        string memory _plannedItinerary,
        string memory _emergencyContact,
        uint256 _checkOutTime
    ) external onlyRole(TOURISM_OFFICER) returns (uint256) {
        require(bytes(_passportNumber).length > 0, "Passport number required");
        require(passportToTouristId[_passportNumber] == 0, "Tourist already registered");
        require(_checkOutTime > block.timestamp, "Invalid checkout time");
        
        _touristIdCounter.increment();
        uint256 newTouristId = _touristIdCounter.current();
        
        TouristID memory newTourist = TouristID({
            touristId: newTouristId,
            passportNumber: _passportNumber,
            aadhaarHash: _aadhaarHash,
            fullName: _fullName,
            phoneNumber: _phoneNumber,
            nationality: _nationality,
            checkInTime: block.timestamp,
            checkOutTime: _checkOutTime,
            plannedItinerary: _plannedItinerary,
            emergencyContact: _emergencyContact,
            status: TouristStatus.Active,
            safetyScore: 100, // Start with perfect score
            safetyLevel: SafetyLevel.Green,
            lastKnownLocation: "",
            lastLocationUpdate: 0,
            realTimeTrackingEnabled: false,
            isActive: true
        });
        
        tourists[newTouristId] = newTourist;
        passportToTouristId[_passportNumber] = newTouristId;
        if (bytes(_aadhaarHash).length > 0) {
            aadhaarToTouristId[_aadhaarHash] = newTouristId;
        }
        activeTourists.push(newTouristId);
        
        emit TouristRegistered(newTouristId, _passportNumber, msg.sender);
        return newTouristId;
    }
    
    /**
     * @dev Update tourist location
     */
    function updateLocation(
        uint256 _touristId,
        string memory _location,
        string memory _coordinates,
        uint8 _batteryLevel
    ) external {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        require(tourists[_touristId].isActive, "Tourist not active");
        
        LocationUpdate memory update = LocationUpdate({
            touristId: _touristId,
            location: _location,
            timestamp: block.timestamp,
            coordinates: _coordinates,
            batteryLevel: _batteryLevel,
            isEmergency: false
        });
        
        locationHistory[_touristId].push(update);
        tourists[_touristId].lastKnownLocation = _location;
        tourists[_touristId].lastLocationUpdate = block.timestamp;
        
        // Update safety score based on location patterns
        _updateSafetyScore(_touristId, _location);
        
        emit LocationUpdated(_touristId, _location, block.timestamp);
    }
    
    /**
     * @dev Trigger emergency alert
     */
    function triggerEmergencyAlert(
        uint256 _touristId,
        string memory _alertType,
        string memory _description,
        string memory _currentLocation
    ) external returns (uint256) {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        require(tourists[_touristId].isActive, "Tourist not active");
        
        uint256 alertId = touristAlerts[_touristId].length;
        
        EmergencyAlert memory alert = EmergencyAlert({
            alertId: alertId,
            touristId: _touristId,
            timestamp: block.timestamp,
            location: _currentLocation,
            alertType: _alertType,
            description: _description,
            isResolved: false,
            responderAddress: address(0),
            responseTime: 0
        });
        
        touristAlerts[_touristId].push(alert);
        emergencyAlerts.push(_touristId);
        
        // Update tourist status to Emergency
        tourists[_touristId].status = TouristStatus.Emergency;
        tourists[_touristId].lastKnownLocation = _currentLocation;
        tourists[_touristId].lastLocationUpdate = block.timestamp;
        
        // Drastically reduce safety score for emergency
        tourists[_touristId].safetyScore = 0;
        tourists[_touristId].safetyLevel = SafetyLevel.Red;
        
        emit EmergencyAlertTriggered(_touristId, alertId, _alertType);
        emit TouristStatusChanged(_touristId, TouristStatus.Emergency);
        
        return alertId;
    }
    
    /**
     * @dev Resolve emergency alert
     */
    function resolveEmergencyAlert(
        uint256 _touristId,
        uint256 _alertId
    ) external onlyRole(EMERGENCY_RESPONDER) {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        require(_alertId < touristAlerts[_touristId].length, "Invalid alert ID");
        require(!touristAlerts[_touristId][_alertId].isResolved, "Alert already resolved");
        
        touristAlerts[_touristId][_alertId].isResolved = true;
        touristAlerts[_touristId][_alertId].responderAddress = msg.sender;
        touristAlerts[_touristId][_alertId].responseTime = block.timestamp;
        
        // Update tourist status back to Active
        tourists[_touristId].status = TouristStatus.Active;
        
        // Restore safety score partially
        tourists[_touristId].safetyScore = 60;
        tourists[_touristId].safetyLevel = SafetyLevel.Yellow;
        
        emit EmergencyResolved(_touristId, _alertId, msg.sender);
        emit TouristStatusChanged(_touristId, TouristStatus.Active);
    }
    
    /**
     * @dev Enable/disable real-time tracking for a tourist
     */
    function toggleRealTimeTracking(uint256 _touristId, bool _enabled) external {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        require(tourists[_touristId].isActive, "Tourist not active");
        
        tourists[_touristId].realTimeTrackingEnabled = _enabled;
    }
    
    /**
     * @dev Check out tourist (end of visit)
     */
    function checkOutTourist(uint256 _touristId) external onlyRole(TOURISM_OFFICER) {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        require(tourists[_touristId].isActive, "Tourist not active");
        
        tourists[_touristId].status = TouristStatus.CheckedOut;
        tourists[_touristId].isActive = false;
        tourists[_touristId].checkOutTime = block.timestamp;
        
        emit TouristStatusChanged(_touristId, TouristStatus.CheckedOut);
    }
    
    /**
     * @dev Mark tourist as missing
     */
    function markTouristMissing(uint256 _touristId) external onlyRole(POLICE_OFFICER) {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        require(tourists[_touristId].isActive, "Tourist not active");
        
        tourists[_touristId].status = TouristStatus.Missing;
        tourists[_touristId].safetyScore = 0;
        tourists[_touristId].safetyLevel = SafetyLevel.Red;
        
        emit TouristStatusChanged(_touristId, TouristStatus.Missing);
    }
    
    /**
     * @dev Internal function to update safety score based on location and behavior
     */
    function _updateSafetyScore(uint256 _touristId, string memory /*_location*/) internal {
        TouristID storage tourist = tourists[_touristId];
        
        // Simple scoring logic - can be enhanced based on requirements
        uint8 currentScore = tourist.safetyScore;
        
        // Check if location update is timely (within last 6 hours)
        if (block.timestamp - tourist.lastLocationUpdate < 21600) {
            if (currentScore < 95) currentScore += 5; // Reward regular updates
        } else {
            if (currentScore > 10) currentScore -= 10; // Penalize delayed updates
        }
        
        // Update safety level based on score
        SafetyLevel newLevel;
        if (currentScore >= 80) newLevel = SafetyLevel.Green;
        else if (currentScore >= 60) newLevel = SafetyLevel.Yellow;
        else if (currentScore >= 40) newLevel = SafetyLevel.Orange;
        else newLevel = SafetyLevel.Red;
        
        tourist.safetyScore = currentScore;
        tourist.safetyLevel = newLevel;
        
        emit SafetyScoreUpdated(_touristId, currentScore, newLevel);
    }
    
    /**
     * @dev Get tourist information by ID
     */
    function getTouristById(uint256 _touristId) external view returns (TouristID memory) {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        return tourists[_touristId];
    }
    
    /**
     * @dev Get tourist ID by passport number
     */
    function getTouristByPassport(string memory _passportNumber) external view returns (uint256) {
        return passportToTouristId[_passportNumber];
    }
    
    /**
     * @dev Get all emergency alerts for a tourist
     */
    function getTouristAlerts(uint256 _touristId) external view returns (EmergencyAlert[] memory) {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        return touristAlerts[_touristId];
    }
    
    /**
     * @dev Get location history for a tourist
     */
    function getLocationHistory(uint256 _touristId) external view returns (LocationUpdate[] memory) {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        return locationHistory[_touristId];
    }
    
    /**
     * @dev Get all active tourists (for dashboard)
     */
    function getActiveTourists() external view returns (uint256[] memory) {
        return activeTourists;
    }
    
    /**
     * @dev Get tourists with emergency alerts
     */
    function getEmergencyAlerts() external view returns (uint256[] memory) {
        return emergencyAlerts;
    }
    
    /**
     * @dev Get total number of registered tourists
     */
    function getTotalTourists() external view returns (uint256) {
        return _touristIdCounter.current();
    }
    
    /**
     * @dev Verify tourist identity
     */
    function verifyTourist(uint256 _touristId, string memory _passportNumber) external view returns (bool) {
        require(_touristId > 0 && _touristId <= _touristIdCounter.current(), "Invalid tourist ID");
        return keccak256(bytes(tourists[_touristId].passportNumber)) == keccak256(bytes(_passportNumber));
    }
    
    /**
     * @dev Get tourists by safety level (for monitoring)
     */
    function getTouristsBySafetyLevel(SafetyLevel _level) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](activeTourists.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < activeTourists.length; i++) {
            uint256 touristId = activeTourists[i];
            if (tourists[touristId].isActive && tourists[touristId].safetyLevel == _level) {
                result[count] = touristId;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            finalResult[j] = result[j];
        }
        
        return finalResult;
    }
    
    /**
     * @dev Grant role to address (Admin only)
     */
    function grantRoleToAddress(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(role, account);
    }
    
    /**
     * @dev Revoke role from address (Admin only)
     */
    function revokeRoleFromAddress(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(role, account);
    }
}