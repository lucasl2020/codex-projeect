const crypto = require('crypto');

/**
 * Device Profile Generator and Validator for VSCode/Trae/Antigravity
 * Generates realistic machine identifiers matching standard VSCode telemetry schemas.
 */

function generateSha256Hex() {
  return crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex').toLowerCase();
}

function generateUuidV4() {
  return crypto.randomUUID().toLowerCase();
}

function generateSqmId() {
  return `{${crypto.randomUUID().toUpperCase()}}`;
}

/**
 * Generate a complete fresh device profile
 */
function generateDeviceProfile() {
  return {
    machine_id: generateSha256Hex(),
    mac_machine_id: generateSha256Hex(),
    dev_device_id: generateUuidV4(),
    sqm_id: generateSqmId(),
    generated_at: Date.now()
  };
}

/**
 * Validate device profile format
 */
function validateDeviceProfile(profile) {
  if (!profile || typeof profile !== 'object') return false;
  const hex64Regex = /^[a-f0-9]{64}$/i;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const sqmRegex = /^\{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}$/i;

  return (
    typeof profile.machine_id === 'string' && hex64Regex.test(profile.machine_id) &&
    typeof profile.mac_machine_id === 'string' && hex64Regex.test(profile.mac_machine_id) &&
    typeof profile.dev_device_id === 'string' && uuidRegex.test(profile.dev_device_id) &&
    typeof profile.sqm_id === 'string' && sqmRegex.test(profile.sqm_id)
  );
}

module.exports = {
  generateSha256Hex,
  generateUuidV4,
  generateSqmId,
  generateDeviceProfile,
  validateDeviceProfile
};
