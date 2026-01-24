import emailjs from '@emailjs/browser';

interface NotificationConfig {
  email: string;
  phoneNumber: string;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  emailjs: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

const getNotificationConfig = (): NotificationConfig => {
  const saved = localStorage.getItem('notificationConfig');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback to defaults
    }
  }
  return {
    email: '',
    phoneNumber: '',
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    emailjs: {
      serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_l4jlrhr',
      templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_g0mc9fr',
      publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'rA7woIdCuPRzaiuAF',
    },
    twilio: {
      accountSid: '',
      authToken: '',
      fromNumber: '',
    },
  };
};

const initEmailJS = () => {
  const config = getNotificationConfig();
  if (config.emailjs.publicKey) {
    emailjs.init(config.emailjs.publicKey);
  }
};

export interface LoginNotificationData {
  username: string;
  clinicName: string;
  therapistName: string;
  loginTime: string;
  userAgent: string;
  ipAddress?: string;
}

export interface RegistrationNotificationData {
  username: string;
  clinicName: string;
  therapistName: string;
  therapistLicenseNo: string;
  registrationTime: string;
  userAgent: string;
  ipAddress?: string;
}

export const sendLoginNotification = async (data: LoginNotificationData): Promise<boolean> => {
  try {
    const config = getNotificationConfig();
    
    if (!config.enableEmailNotifications) {
      console.log('📧 이메일 알림이 비활성화되어 있습니다.');
      return false;
    }
    
    console.log('🚀 로그인 알림 이메일 발송 시작');
    
    initEmailJS();
    
    const recipientEmail = config.email || 'stjoe1004@gmail.com';
    
    const templateParams = {
      subject: `[환자차트시스템] ${data.username} 로그인 알림`,
      name: data.therapistName,
      email: recipientEmail,
      time: data.loginTime,
      message: `
새로운 로그인이 감지되었습니다.

사용자 정보:
- 사용자명: ${data.username}
- 한의원명: ${data.clinicName}
- 치료사명: ${data.therapistName}
- 로그인 시간: ${data.loginTime}
- IP 주소: ${data.ipAddress || '알 수 없음'}
- 브라우저: ${data.userAgent}
      `.trim()
    };

    if (!config.emailjs.publicKey) {
      console.warn('⚠️ EmailJS가 설정되지 않았습니다.');
      return false;
    }
    
    const response = await emailjs.send(
      config.emailjs.serviceId,
      config.emailjs.templateId,
      templateParams
    );

    console.log('✅ 로그인 알림 이메일 발송 성공:', response);
    return true;
  } catch (error) {
    console.error('❌ 로그인 알림 이메일 발송 실패:', error);
    return false;
  }
};

// IP 주소 가져오기 (간단한 방법)
export const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('IP 주소 가져오기 실패:', error);
    return '알 수 없음';
  }
};

export const sendRegistrationNotification = async (data: RegistrationNotificationData): Promise<boolean> => {
  try {
    const config = getNotificationConfig();
    
    if (!config.enableEmailNotifications) {
      console.log('📧 이메일 알림이 비활성화되어 있습니다.');
      return false;
    }
    
    console.log('🚀 회원가입 알림 이메일 발송 시작');
    
    initEmailJS();
    
    const recipientEmail = config.email || 'stjoe1004@gmail.com';
    
    const templateParams = {
      subject: `[환자차트시스템] 새로운 회원가입 요청 - ${data.username}`,
      name: '관리자',
      email: recipientEmail,
      time: data.registrationTime,
      message: `
새로운 회원가입 요청이 접수되었습니다.

회원가입 정보:
- 사용자명: ${data.username}
- 한의원명: ${data.clinicName}
- 치료사명: ${data.therapistName}
- 면허번호: ${data.therapistLicenseNo}
- 가입 시간: ${data.registrationTime}
- IP 주소: ${data.ipAddress || '알 수 없음'}
- 브라우저: ${data.userAgent}

관리자 페이지에서 승인/거부를 처리해주세요.
      `.trim()
    };

    if (!config.emailjs.publicKey) {
      console.warn('⚠️ EmailJS가 설정되지 않았습니다.');
      return false;
    }
    
    const response = await emailjs.send(
      config.emailjs.serviceId,
      config.emailjs.templateId,
      templateParams
    );

    console.log('✅ 회원가입 알림 이메일 발송 성공:', response);
    return true;
  } catch (error) {
    console.error('❌ 회원가입 알림 이메일 발송 실패:', error);
    return false;
  }
};

// 브라우저 정보 가져오기
export const getBrowserInfo = (): string => {
  return navigator.userAgent;
};

export const sendSMSNotification = async (message: string, phoneNumber?: string): Promise<boolean> => {
  try {
    const config = getNotificationConfig();
    
    if (!config.enableSMSNotifications) {
      console.log('📱 SMS 알림이 비활성화되어 있습니다.');
      return false;
    }
    
    const toNumber = phoneNumber || config.phoneNumber;
    
    if (!toNumber || !config.twilio.accountSid || !config.twilio.authToken || !config.twilio.fromNumber) {
      console.warn('⚠️ Twilio 설정이 완료되지 않았습니다.');
      return false;
    }
    
    console.log('📱 SMS 알림 발송 시작:', { message, toNumber });
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${config.twilio.accountSid}:${config.twilio.authToken}`),
        },
        body: new URLSearchParams({
          To: toNumber,
          From: config.twilio.fromNumber,
          Body: message,
        }),
      }
    );

    if (response.ok) {
      console.log('✅ SMS 알림 발송 성공');
      return true;
    } else {
      const error = await response.json();
      console.error('❌ SMS 발송 실패:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ SMS 알림 발송 실패:', error);
    return false;
  }
};

// 관리자 알림 설정
export interface AdminNotificationSettings {
  email: string;
  phoneNumber: string;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
}

// 통합 알림 발송
export const sendAdminNotification = async (
  type: 'registration' | 'login',
  data: any,
  settings: AdminNotificationSettings
): Promise<{ email: boolean; sms: boolean }> => {
  const results = { email: false, sms: false };
  
  // 이메일 알림
  if (settings.enableEmailNotifications) {
    if (type === 'registration') {
      results.email = await sendRegistrationNotification(data);
    } else {
      results.email = await sendLoginNotification(data);
    }
  }
  
  // SMS 알림
  if (settings.enableSMSNotifications && settings.phoneNumber) {
    const smsMessage = type === 'registration' 
      ? `새 회원가입: ${data.username} (${data.clinicName})`
      : `로그인: ${data.username} (${data.clinicName})`;
    
    results.sms = await sendSMSNotification(smsMessage, settings.phoneNumber);
  }
  
  return results;
};
