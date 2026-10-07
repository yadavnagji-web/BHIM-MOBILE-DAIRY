export interface SendOtpResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

/**
 * Sends a WhatsApp OTP to the given 10-digit mobile number using Fast2SMS WhatsApp API.
 */
export async function sendWhatsAppOtp(mobile: string): Promise<SendOtpResponse> {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
    return {
      success: false,
      message: 'कृपया सही 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू)।',
    };
  }

  try {
    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile: cleanMobile }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error sending OTP:', err);
    return {
      success: false,
      message: 'नेटवर्क समस्या या सर्वर त्रुटि। कृपया पुनः प्रयास करें।',
    };
  }
}

/**
 * Verifies the WhatsApp OTP entered by the user.
 */
export async function verifyWhatsAppOtp(
  mobile: string,
  otp: string
): Promise<VerifyOtpResponse> {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const cleanOtp = otp.trim();

  if (!cleanMobile || !cleanOtp) {
    return {
      success: false,
      message: 'मोबाइल नंबर और OTP आवश्यक हैं।',
    };
  }

  try {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobile: cleanMobile, otp: cleanOtp }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error verifying OTP:', err);
    return {
      success: false,
      message: 'सत्यापन में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    };
  }
}
