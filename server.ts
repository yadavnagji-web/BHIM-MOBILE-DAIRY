import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Priority: --port CLI arg -> process.env.PORT -> 3000
const args = process.argv.slice(2);
const portArgIndex = args.indexOf('--port');
const cliPort = portArgIndex !== -1 ? Number(args[portArgIndex + 1]) : null;
const PORT = cliPort || Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

const FAST2SMS_API_KEY =
  process.env.FAST2SMS_API_KEY ||
  '3WHUAVcRdtob3GfQRv9LGlI1V9LU2gMn56ODP799qqwxz0ABSd5j2VTM2fde';
const FAST2SMS_OTP_ID = process.env.FAST2SMS_OTP_ID || 'e39f1cf3ff';

const DB_FILE = path.resolve(__dirname, 'data', 'directory_db.json');

// Ensure DB exists with clean data
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = {
        villages: [
          { id: 'sakodara', name: 'सकोदरा (Sakodara)' },
          { id: 'chitri', name: 'चितरी (Chitri)' },
          { id: 'simalwara', name: 'सीमलवाड़ा (Simalwara)' },
          { id: 'sagwara', name: 'सागवाड़ा (Sagwara)' },
          { id: 'garhi', name: 'गढ़ी (Garhi)' },
          { id: 'aspur', name: 'आसपुर (Aspur)' },
          { id: 'galiyakot', name: 'गलियाकोट (Galiyakot)' },
          { id: 'dungarpur', name: 'डूंगरपुर (Dungarpur)' },
          { id: 'bagidora', name: 'बागीदौरा (Bagidora)' },
          { id: 'banswara', name: 'बांसवाड़ा (Banswara)' },
          { id: 'punali', name: 'पुनाली (Punali)' },
          { id: 'ramsor', name: 'रामसौर (Ramsor)' },
          { id: 'chaurasi', name: 'चौरासी (Chaurasi)' },
          { id: 'dhambola', name: 'धम्बोला (Dhambola)' },
          { id: 'varda', name: 'वरदा (Varda)' }
        ],
        contacts: [],
        approvalRequests: [],
        settings: {
          otpMode: 'with_otp', // 'with_otp' | 'without_otp'
          adsMasterEnabled: true,
          bannerAdEnabled: true,
          interstitialAdEnabled: true,
          bannerAdUnit: 'ca-app-pub-6423718618240244/6735134164',
          interstitialAdUnit: 'ca-app-pub-6423718618240244/1291235796',
          sponsorTitle: 'डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी',
          sponsorContact: '9982151938',
          googleSheetEmail: 'yadavnagji@gmail.com',
          googleSheetName: 'YADAV SAMAJ MOBILE DAIRY'
        }
      };
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return {
      villages: [],
      contacts: [],
      approvalRequests: [],
      settings: {
        otpMode: 'with_otp',
        adsMasterEnabled: true,
        bannerAdEnabled: true,
        interstitialAdEnabled: true,
        bannerAdUnit: 'ca-app-pub-6423718618240244/6735134164',
        interstitialAdUnit: 'ca-app-pub-6423718618240244/1291235796',
        sponsorTitle: 'डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी',
        sponsorContact: '9982151938',
        googleSheetEmail: 'yadavnagji@gmail.com',
        googleSheetName: 'YADAV SAMAJ MOBILE DAIRY'
      }
    };
  }
}

function writeDb(data: any) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database:', err);
  }
}

// -------------------------------------------------------------
// 1. DATA ENDPOINT: GET ALL STATE
// -------------------------------------------------------------
app.get('/api/data', (_req, res) => {
  const db = readDb();
  res.json({
    success: true,
    villages: db.villages || [],
    contacts: db.contacts || [],
    approvalRequests: db.approvalRequests || [],
    settings: db.settings || {}
  });
});

// -------------------------------------------------------------
// 2. CONTACTS CRUD
// -------------------------------------------------------------
app.post('/api/contacts', (req, res) => {
  const db = readDb();
  const contact = req.body;
  if (!contact.name || !contact.mobile) {
    return res.status(400).json({ success: false, message: 'नाम और मोबाइल नंबर अनिवार्य हैं।' });
  }

  const id = contact.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newContact = {
    ...contact,
    id,
    addedWithOtp: contact.addedWithOtp !== undefined ? Boolean(contact.addedWithOtp) : Boolean(contact.remark?.includes('WhatsApp')),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: contact.status || 'approved'
  };

  db.contacts = db.contacts || [];
  db.contacts.unshift(newContact);
  writeDb(db);

  res.json({ success: true, contact: newContact });
});

app.put('/api/contacts/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const updates = req.body;

  const idx = (db.contacts || []).findIndex((c: any) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'संपर्क नहीं मिला।' });
  }

  db.contacts[idx] = {
    ...db.contacts[idx],
    ...updates,
    updatedAt: Date.now()
  };
  writeDb(db);

  res.json({ success: true, contact: db.contacts[idx] });
});

app.delete('/api/contacts/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;

  db.contacts = (db.contacts || []).filter((c: any) => c.id !== id);
  writeDb(db);

  res.json({ success: true, message: 'संपर्क हटा दिया गया।' });
});

// -------------------------------------------------------------
// 3. VILLAGES CRUD
// -------------------------------------------------------------
app.post('/api/villages', (req, res) => {
  const db = readDb();
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'गाँव का नाम आवश्यक है।' });
  }

  const id = req.body.id || `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newVillage = { id, name: name.trim() };

  db.villages = db.villages || [];
  const exists = db.villages.find((v: any) => v.name.toLowerCase() === name.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: 'यह गाँव पहले से मौजूद है।' });
  }

  db.villages.push(newVillage);
  writeDb(db);

  res.json({ success: true, village: newVillage });
});

app.put('/api/villages/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { name } = req.body;

  const idx = (db.villages || []).findIndex((v: any) => v.id === id);
  if (idx !== -1 && name) {
    db.villages[idx].name = name.trim();
    // Also update contact villageName
    (db.contacts || []).forEach((c: any) => {
      if (c.villageId === id) {
        c.villageName = name.trim();
      }
    });
    writeDb(db);
    return res.json({ success: true, village: db.villages[idx] });
  }

  res.status(404).json({ success: false, message: 'गाँव नहीं मिला।' });
});

app.delete('/api/villages/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;

  db.villages = (db.villages || []).filter((v: any) => v.id !== id);
  writeDb(db);

  res.json({ success: true, message: 'गाँव हटा दिया गया।' });
});

// -------------------------------------------------------------
// 4. APPROVAL REQUESTS & BULK APPROVE
// -------------------------------------------------------------
app.post('/api/approvals', (req, res) => {
  const db = readDb();
  const approval = req.body;

  const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newReq = {
    ...approval,
    id,
    createdAt: Date.now(),
    status: 'pending'
  };

  db.approvalRequests = db.approvalRequests || [];
  db.approvalRequests.unshift(newReq);
  writeDb(db);

  res.json({ success: true, request: newReq });
});

app.post('/api/approvals/:id/approve', (req, res) => {
  const db = readDb();
  const { id } = req.params;

  const reqObj = (db.approvalRequests || []).find((r: any) => r.id === id);
  if (!reqObj) {
    return res.status(404).json({ success: false, message: 'अनुरोध नहीं मिला।' });
  }

  if (reqObj.type === 'new_contact' && reqObj.contactData) {
    const contactId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newContact = {
      ...reqObj.contactData,
      id: contactId,
      status: 'approved',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    db.contacts = db.contacts || [];
    db.contacts.unshift(newContact);
  } else if (reqObj.type === 'delete_contact' && reqObj.targetContactId) {
    db.contacts = (db.contacts || []).filter((c: any) => c.id !== reqObj.targetContactId);
  } else if (reqObj.type === 'edit_contact' && reqObj.targetContactId && reqObj.contactData) {
    const idx = (db.contacts || []).findIndex((c: any) => c.id === reqObj.targetContactId);
    if (idx !== -1) {
      db.contacts[idx] = {
        ...db.contacts[idx],
        ...reqObj.contactData,
        updatedAt: Date.now()
      };
    }
  }

  db.approvalRequests = (db.approvalRequests || []).filter((r: any) => r.id !== id);
  writeDb(db);

  res.json({ success: true, message: 'अनुरोध स्वीकृत किया गया!' });
});

app.post('/api/approvals/:id/reject', (req, res) => {
  const db = readDb();
  const { id } = req.params;

  db.approvalRequests = (db.approvalRequests || []).filter((r: any) => r.id !== id);
  writeDb(db);

  res.json({ success: true, message: 'अनुरोध अस्वीकृत कर दिया गया।' });
});

// BULK APPROVE ALL
app.post('/api/approvals/bulk-approve', (_req, res) => {
  const db = readDb();
  const pending = db.approvalRequests || [];
  let count = 0;

  pending.forEach((reqObj: any) => {
    if (reqObj.type === 'new_contact' && reqObj.contactData) {
      const contactId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      db.contacts.unshift({
        ...reqObj.contactData,
        id: contactId,
        status: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      count++;
    } else if (reqObj.type === 'delete_contact' && reqObj.targetContactId) {
      db.contacts = db.contacts.filter((c: any) => c.id !== reqObj.targetContactId);
      count++;
    } else if (reqObj.type === 'edit_contact' && reqObj.targetContactId && reqObj.contactData) {
      const idx = db.contacts.findIndex((c: any) => c.id === reqObj.targetContactId);
      if (idx !== -1) {
        db.contacts[idx] = { ...db.contacts[idx], ...reqObj.contactData, updatedAt: Date.now() };
        count++;
      }
    }
  });

  db.approvalRequests = [];
  writeDb(db);

  res.json({ success: true, count, message: `${count} अनुरोध एक साथ स्वीकृत कर दिए गए!` });
});

// BULK VERIFY ALL BINA OTP CONTACTS
app.post('/api/contacts/bulk-verify', (_req, res) => {
  const db = readDb();
  let count = 0;
  db.contacts = (db.contacts || []).map((c: any) => {
    if (c.addedWithOtp === false || !c.remark?.includes('WhatsApp')) {
      count++;
      return {
        ...c,
        addedWithOtp: true,
        remark: 'WhatsApp Verified (एडमिन सत्यापित)',
        updatedAt: Date.now()
      };
    }
    return c;
  });
  writeDb(db);

  res.json({ success: true, count, message: `${count} संपर्क एक साथ स्वीकृत व सत्यापित कर दिए गए!` });
});

// -------------------------------------------------------------
// 5. SETTINGS (OTP MODE, ADS CORNER)
// -------------------------------------------------------------
app.get('/api/settings', (_req, res) => {
  const db = readDb();
  res.json({ success: true, settings: db.settings });
});

app.post('/api/settings', (req, res) => {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  writeDb(db);

  res.json({ success: true, settings: db.settings });
});

// -------------------------------------------------------------
// 6. ADMIN AUTHENTICATION (NO FIREBASE)
// -------------------------------------------------------------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const cleanUser = String(username || '').trim().toLowerCase().replace(/\s+/g, '');
  const cleanPass = String(password || '').trim();

  const isUserValid =
    cleanUser === 'nagjiyadav' ||
    cleanUser === 'nagji' ||
    cleanUser === 'yadavnagji' ||
    cleanUser === 'yadavnagji@gmail.com' ||
    cleanUser === 'admin';

  if (isUserValid && (cleanPass === '12345' || cleanPass === '123456' || cleanPass === 'nagji12345')) {
    return res.json({
      success: true,
      admin: {
        name: 'NAGJI YADAV',
        email: 'yadavnagji@gmail.com',
        role: 'master_admin',
        token: `adm_${Date.now()}`
      }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'गलत यूज़रनेम या पासवर्ड। केवल मुख्य एडमिन (NAGJI YADAV / 12345) मान्य है।'
  });
});

// -------------------------------------------------------------
// 7. FAST2SMS WHATSAPP OTP API
// -------------------------------------------------------------
app.post('/api/otp/send', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^[6-9]\d{9}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: 'कृपया वैध 10-अंकों का मोबाइल नंबर दर्ज करें (Invalid 10-digit mobile number).'
      });
    }

    const cleanMobile = String(mobile).trim();
    const response = await fetch('https://www.fast2sms.com/dev/otp/send', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        otp_id: FAST2SMS_OTP_ID,
        mobile: cleanMobile
      })
    });

    const data: any = await response.json();
    if (data.return === true || data.status_code === 200) {
      return res.json({
        success: true,
        message: `व्हाट्सएप OTP (+91 ${cleanMobile}) पर भेज दिया गया है।`,
        requestId: data.request_id
      });
    } else {
      return res.status(400).json({
        success: false,
        message: data.message || 'Fast2SMS द्वारा OTP नहीं भेजा जा सका।'
      });
    }
  } catch (error: any) {
    console.error('Fast2SMS send error:', error);
    return res.status(500).json({
      success: false,
      message: 'सर्वर त्रुटि: OTP नहीं भेजा जा सका। कृपया बाद में प्रयास करें।'
    });
  }
});

app.post('/api/otp/verify', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'मोबाइल नंबर और OTP आवश्यक हैं।'
      });
    }

    const cleanMobile = String(mobile).trim();
    const cleanOtp = String(otp).trim();

    const response = await fetch('https://www.fast2sms.com/dev/otp/verify', {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mobile: cleanMobile,
        otp: cleanOtp
      })
    });

    const data: any = await response.json();
    if (data.return === true || data.status_code === 200) {
      return res.json({
        success: true,
        message: 'WhatsApp OTP सफलतापूर्वक सत्यापित हुआ!'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: data.message || 'अमान्य OTP (Invalid OTP)। कृपया पुनः प्रयास करें।'
      });
    }
  } catch (error: any) {
    console.error('Fast2SMS verify error:', error);
    return res.status(500).json({
      success: false,
      message: 'सर्वर त्रुटि: OTP सत्यापित नहीं किया जा सका।'
    });
  }
});

// -------------------------------------------------------------
// 8. VITE MIDDLEWARE & SPA HOSTING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
