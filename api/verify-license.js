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
        error: 'Vui lòng cung cấp mã bản quyền (licenseKey).' 
      });
    }

    const db = await getDb();
    const licenseRef = doc(db, 'licenses', cleanKey);
    const snap = await getDoc(licenseRef);

    if (!snap.exists()) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Mã bản quyền không tồn tại trên hệ thống. Vui lòng kiểm tra lại email xác nhận từ Whop.' 
      });
    }

    const data = snap.data();

    // Check expiration for monthly plans
    if (data.status === 'active' && data.expiresAt) {
      // Whop timestamp can be seconds or milliseconds
      const expiresMs = data.expiresAt > 10000000000 ? data.expiresAt : data.expiresAt * 1000;
      if (Date.now() > expiresMs) {
        await updateDoc(licenseRef, { status: 'expired', lastVerifiedAt: Date.now() });
        return res.status(403).json({
          valid: false,
          status: 'expired',
          error: 'Gói đăng ký hàng tháng đã hết hạn. Vui lòng gia hạn trên Whop.'
        });
      }
    }

    if (data.status !== 'active') {
      return res.status(403).json({
        valid: false,
        status: data.status,
        error: `Mã bản quyền đang ở trạng thái không khả dụng (${data.status}).`
      });
    }

    // Update last verified timestamp asynchronously
    updateDoc(licenseRef, { lastVerifiedAt: Date.now() }).catch(() => {});

    return res.status(200).json({
      valid: true,
      licenseKey: cleanKey,
      planType: data.planType || 'lifetime',
      email: data.email || '',
      expiresAt: data.expiresAt || null,
      status: 'active'
    });

  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json({ 
      valid: false, 
      error: 'Lỗi máy chủ khi xác thực bản quyền.',
      details: error.message 
    });
  }
}
