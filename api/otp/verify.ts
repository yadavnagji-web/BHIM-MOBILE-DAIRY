const FAST2SMS_API_KEY =
  process.env.FAST2SMS_API_KEY ||
  '3WHUAVcRdtob3GfQRv9LGlI1V9LU2gMn56ODP799qqwxz0ABSd5j2VTM2fde';

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
    const { mobile, otp } = req.body || {};
    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'मोबाइल नंबर और OTP आवश्यक हैं।'
      });
    }

    const cleanMobile = String(mobile).trim().slice(-10);
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
      return res.status(200).json({
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
    console.error('Vercel API Fast2SMS verify error:', error);
    return res.status(500).json({
      success: false,
      message: 'सर्वर त्रुटि: OTP सत्यापित नहीं किया जा सका।'
    });
  }
}
