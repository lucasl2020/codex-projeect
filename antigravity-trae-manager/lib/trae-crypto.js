const https = require('https');
const { URL } = require('url');
const { webcrypto } = require('crypto');
const crypto = webcrypto;

// Trae ByteCrypto constants reversed from out-build/vs/base/common/byteCrypto.js
const CO = 16, EO = CO, bh = 64, lv = 32, kO = 64, qm = 6, AO = 116, DO = 99, TO = 5, xO = 16, IO = 0, PO = 0, Doe = 18, Toe = 57, xoe = 32, Ioe = 32, Poe = 2, Noe = 3;
const Enums = { AES: 1, AES_PRIVATE: 2, UNKNOWN: 8 };
const Ooe = new Uint8Array([191,192,216,250,122,246,220,97,31,254,98,27,8,72,71,176,135,99,96,18,127,101,203,104,211,102,191,125,37,72,150,156,51,229,121,35,17,153,141,177,110,131,150,128,172,255,254,6,18,140,55,62,236,249,135,64,135,12,117,4,89,149,168,209]);
const Roe = new Uint8Array([246,204,26,232,232,70,129,109,223,146,169,242,23,241,105,145,50,196,165,42,254,120,3,54,244,207,209,85,53,6,138,106,175,148,31,204,186,186,165,182,87,142,49,10,39,110,26,154,86,56,173,125,18,64,198,225,99,99,83,82,191,134,76,170]);
const O_oe = Uint8Array.from([82,9,106,213,48,54,165,56,191,64,163,158,129,243,215,251,124,227,57,130,155,47,255,135,52,142,67,68,196,222,233,203,84,123,148,50,166,194,35,61,238,76,149,11,66,250,195,78,8,46,161,102,40,217,36,178,118,91,162,73,109,139,209,37]);
const Moe = Uint8Array.from([31,221,168,51,136,7,199,49,177,18,16,89,39,128,236,95,96,81,127,169,25,181,74,13,45,229,122,159,147,201,156,239,160,224,59,77,174,42,245,176,200,235,187,60,131,83,153,97,23,43,4,126,186,119,214,38,225,105,20,99,85,33,12,125]);

async function sha512(buf) {
  const digest = await crypto.subtle.digest('SHA-512', buf);
  return new Uint8Array(digest);
}

function deriveKeyBytes(t, e = Enums.AES) {
  const res = new Uint8Array(t);
  if (e === Enums.AES_PRIVATE) {
    for (let r = 0; r < t; r++) res[r] = Ooe[r] ^ Roe[r];
  } else if (e === Enums.AES) {
    for (let r = 0; r < t; r++) res[r] = O_oe[r] ^ Moe[r];
  }
  return res;
}

async function deriveAesAndIv(keyBytes, keyLen, ivLen, version = Enums.AES) {
  const combined = new Uint8Array(bh + kO);
  const hashKey = await sha512(keyBytes);
  const derivedXor = deriveKeyBytes(kO, version);
  combined.set(hashKey, 0);
  combined.set(derivedXor, bh);
  const hashCombined = await sha512(combined);
  combined.set(hashCombined, 0);
  return {
    aesKey: combined.slice(0, keyLen),
    iv: combined.slice(keyLen, keyLen + ivLen)
  };
}

async function aesCbcDecrypt(aesKey, iv, cipherBytes) {
  if (cipherBytes.length % CO !== 0) return new Uint8Array(0);
  try {
    const importedKey = await crypto.subtle.importKey('raw', aesKey, { name: 'AES-CBC' }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, importedKey, cipherBytes);
    return new Uint8Array(decrypted);
  } catch (err) {
    return new Uint8Array(0);
  }
}

function detectVersion(header) {
  if (header[2] === xoe && header[3] === Ioe && header[4] === Poe && header[5] === Noe && header[0] === Doe && header[1] === Toe) {
    return Enums.AES_PRIVATE;
  }
  if (header[0] !== AO || header[1] !== DO) return Enums.UNKNOWN;
  if (header[2] === TO && header[3] === xO && header[4] === IO && header[5] === PO) return Enums.AES;
  return Enums.UNKNOWN;
}

async function decryptTraeBuffer(rawBytes) {
  const version = detectVersion(rawBytes);
  if (version !== Enums.AES && version !== Enums.AES_PRIVATE) return new Uint8Array(0);
  const keyBytes = rawBytes.slice(qm, qm + lv);
  if (keyBytes.length !== lv) return new Uint8Array(0);

  const { aesKey, iv } = await deriveAesAndIv(keyBytes, 16, EO, version);
  const cipherBytes = rawBytes.slice(lv + qm);
  const plainWithHash = await aesCbcDecrypt(aesKey, iv, cipherBytes);

  if (plainWithHash.length > 0) {
    const payload = plainWithHash.slice(bh);
    const expectedHash = await sha512(payload);
    for (let i = 0; i < bh; i++) {
      if (expectedHash[i] !== plainWithHash[i]) return new Uint8Array(0);
    }
    return payload;
  }
  return new Uint8Array(0);
}

/**
 * Decrypt Trae base64 string from storage.json
 */
async function decryptTraeBase64(base64Str) {
  if (!base64Str || typeof base64Str !== 'string') return null;
  try {
    const buf = Buffer.from(base64Str, 'base64');
    const decryptedBytes = await decryptTraeBuffer(new Uint8Array(buf));
    if (decryptedBytes.length === 0) return null;
    const text = new TextDecoder('utf-8').decode(decryptedBytes);
    return JSON.parse(text);
  } catch (err) {
    console.warn('[TraeCrypto] Decryption error:', err.message);
    return null;
  }
}

/**
 * Perform an authenticated POST request to Trae API
 */
function sendTraeRequest(apiPath, token, deviceId, payload = { req_source: 1 }) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const url = new URL(apiPath, 'https://api.trae.cn');

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Cloud-IDE-JWT ${token}`,
        'x-device-id': deviceId,
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Trae/2.3.82597'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Trae API Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Real Check-in Status
 */
async function fetchTraeCheckinStatus(token, deviceId) {
  try {
    const res = await sendTraeRequest('/trae/api/v2/ug/checkin_credits/status', token, deviceId, { req_source: 1 });
    if (res.data && res.data.code === 0) {
      return {
        success: true,
        checkedIn: Boolean(res.data.checked_in),
        didCheckedIn: Boolean(res.data.did_checked_in),
        credits: res.data.credits || 0,
        extraCredits: res.data.extra_credits || 0,
        totalCheckinCredits: res.data.credits || 0,
        enable: Boolean(res.data.enable),
        raw: res.data
      };
    }
    return {
      success: false,
      error: res.data?.message || `HTTP ${res.statusCode}`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Claim Real Daily Check-in on Trae API
 */
async function claimTraeCheckin(token, deviceId) {
  try {
    const res = await sendTraeRequest('/trae/api/v2/ug/checkin_credits/claim', token, deviceId, { req_source: 1 });
    if (res.data && res.data.code === 0) {
      // Fetch latest status after claiming
      const latest = await fetchTraeCheckinStatus(token, deviceId);
      return {
        success: true,
        claimed: true,
        rewardPoints: latest.success ? latest.credits : null,
        latestStatus: latest,
        message: '🎉 字节跳动 Trae 官方接口签到成功！'
      };
    }
    return {
      success: false,
      error: res.data?.message || `HTTP ${res.statusCode}`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  decryptTraeBase64,
  fetchTraeCheckinStatus,
  claimTraeCheckin
};
