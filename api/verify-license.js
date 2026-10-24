/**
 * License Verification Endpoint — DeepFocus OS
 * Validates license keys against Firebase Firestore.
 * Supports both GET (?key=...) and POST ({ licenseKey: "..." }).
 */

import { 
  getDb, 
  doc, 
  getDoc, 
  updateDoc 
} from './_firebase.js';

export default async function handler(req, res) {
  // CORS Headers for seamless cross-domain & Desktop Electron verification
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let key = '';

    if (req.method === 'GET') {
      key = req.query.key || req.query.licenseKey || '';
    } else if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      key = body?.licenseKey || body?.key || '';
    } else {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Clean and normalize key
    const cleanKey = String(key || '').trim().toUpperCase();

    if (!cleanKey) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Please provide a valid license key (licenseKey).' 
      });
    }

    const db = await getDb();
    const licenseRef = doc(db, 'licenses', cleanKey);
    const snap = await getDoc(licenseRef);

    if (!snap.exists()) {
      return res.status(404).json({ 
        valid: false, 
        error: 'License key not found. Please check your Whop confirmation email or dashboard.' 
      });
    }

    const data = snap.data();

    // Check expiration for time-based plans (monthly / 6-month pass)
    if (data.status === 'active' && data.expiresAt) {
      // Whop timestamp can be seconds or milliseconds
      const expiresMs = data.expiresAt > 10000000000 ? data.expiresAt : data.expiresAt * 1000;
      if (Date.now() > expiresMs) {
        await updateDoc(licenseRef, { status: 'expired', lastVerifiedAt: Date.now() });
        return res.status(403).json({
          valid: false,
          status: 'expired',
          error: 'Your pass has expired. Please renew your subscription on Whop to continue Pro access.'
        });
      }
    }

    if (data.status !== 'active') {
      return res.status(403).json({
        valid: false,
        status: data.status,
        error: `This license key is currently ${data.status}.`
      });
    }

    // Update last verified timestamp asynchronously
    updateDoc(licenseRef, { lastVerifiedAt: Date.now() }).catch(() => {});

    return res.status(200).json({
      valid: true,
      licenseKey: cleanKey,
      planType: data.planType || '6months',
      email: data.email || '',
      expiresAt: data.expiresAt || null,
      status: 'active'
    });

  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json({ 
      valid: false, 
      error: 'Server error while verifying license key.',
      details: error.message 
    });
  }
}
