const FAST2SMS_API_KEY =
  process.env.FAST2SMS_API_KEY ||
  '3WHUAVcRdtob3GfQRv9LGlI1V9LU2gMn56ODP799qqwxz0ABSd5j2VTM2fde';
const FAST2SMS_OTP_ID = process.env.FAST2SMS_OTP_ID || 'e39f1cf3ff';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { mobile } = req.body || {};
    if (!mobile || !/^[6-9]\d{9}$/.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: 'कृपया वैध 10-अंकों का मोबाइल नंबर दर्ज करें (Invalid 10-digit mobile number).'
      });
    }

    const cleanMobile = String(mobile).trim().slice(-10);
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
      return res.status(200).json({
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
    console.error('Vercel API Fast2SMS send error:', error);
    return res.status(500).json({
      success: false,
      message: 'सर्वर त्रुटि: OTP नहीं भेजा जा सका। कृपया बाद में प्रयास करें।'
    });
  }
}
