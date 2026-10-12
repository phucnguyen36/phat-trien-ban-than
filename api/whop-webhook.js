/**
 * Whop Webhook Handler — DeepFocus OS
 * Receives payment & membership events from Whop,
 * generates license keys, and saves records into Firebase Firestore.
 */

import { 
  getDb, 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from './_firebase.js';

// DeepFocus OS Whop Plan IDs
const PLAN_LIFETIME_ID = 'plan_vrUwKeR11Yh0T'; // $99 Lifetime Buyout
const PLAN_MONTHLY_ID = 'plan_6rzHyaaNhKAaU';  // $29.99/mo Membership
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET || 'ws_935ab20eae1ba25bfabfef7c5517f49e7ed18eafffcaf4f7c0d94f2f3bbee0be';

/**
 * Generate human-friendly, uppercase alphanumeric license key
 * Format: DFOS-LIFE-XXXX-XXXX or DFOS-PASS-XXXX-XXXX
 */
function generateKey(prefix = 'LIFE') {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const getChunk = (len = 4) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };
  return `DFOS-${prefix}-${getChunk(4)}-${getChunk(4)}`;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-whop-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check / info via GET
  if (req.method === 'GET') {
    return res.status(200).json({ 
      service: 'DeepFocus OS Whop Webhook',
      status: 'active',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Missing webhook payload' });
    }

    const action = payload.action || payload.type || payload.event || '';
    const data = payload.data || payload || {};
    const membershipId = data.id || data.membership_id || `mem_${Date.now()}`;
    const planId = data.plan_id || '';
    const email = data.email || (data.user && data.user.email) || (data.customer && data.customer.email) || 'customer@whop.com';
    const userId = data.user_id || (data.user && data.user.id) || '';
    const username = (data.user && data.user.username) || '';

    const db = await getDb();
    const licensesCol = collection(db, 'licenses');

    // 1. Membership activated / renewed / valid
    if (action === 'membership.went_valid' || action === 'membership.activated' || action === 'payment.succeeded') {
      if (!membershipId && !email) {
        return res.status(400).json({ error: 'Invalid membership or user data' });
      }

      // Check for existing membership record (idempotency)
      if (membershipId) {
        const existingQuery = query(licensesCol, where('whopMembershipId', '==', membershipId));
        const existingSnap = await getDocs(existingQuery);

        if (!existingSnap.empty) {
          const existingDoc = existingSnap.docs[0];
          const existingData = existingDoc.data();
          await updateDoc(doc(db, 'licenses', existingDoc.id), {
            status: 'active',
            expiresAt: data.expires_at || null,
            lastVerifiedAt: Date.now()
          });

          return res.status(200).json({
            success: true,
            message: 'Existing license reactivated',
            licenseKey: existingData.key || existingDoc.id,
            planType: existingData.planType
          });
        }
      }

      // Generate new license key
      const isLifetime = planId === PLAN_LIFETIME_ID;
      const planType = isLifetime ? 'lifetime' : 'monthly';
      const keyPrefix = isLifetime ? 'LIFE' : 'PASS';
      const licenseKey = generateKey(keyPrefix);

      const licenseData = {
        key: licenseKey,
        email: email,
        planId: planId,
        planType: planType,
        whopMembershipId: membershipId,
        whopUserId: userId,
        whopUsername: username,
        status: 'active',
        expiresAt: data.expires_at ? Number(data.expires_at) : null,
        createdAt: Date.now(),
        lastVerifiedAt: Date.now()
      };

      await setDoc(doc(db, 'licenses', licenseKey), licenseData);

      return res.status(200).json({
        success: true,
        message: 'New license key generated and stored',
        licenseKey: licenseKey,
        planType: planType,
        email: email
      });
    }

    // 2. Membership canceled / payment expired
    if (action === 'membership.went_invalid' || action === 'membership.deactivated') {
      if (membershipId) {
        const queryExisting = query(licensesCol, where('whopMembershipId', '==', membershipId));
        const snap = await getDocs(queryExisting);

        if (!snap.empty) {
          const targetDoc = snap.docs[0];
          await updateDoc(doc(db, 'licenses', targetDoc.id), {
            status: 'expired',
            invalidatedAt: Date.now()
          });

          return res.status(200).json({
            success: true,
            message: 'License status updated to expired',
            licenseKey: targetDoc.id
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'No matching license found to invalidate'
      });
    }

    // Default response for unhandled webhook events
    return res.status(200).json({
      success: true,
      message: `Event ${action || 'unknown'} received`,
      ignored: true
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.message 
    });
  }
}
