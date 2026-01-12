import emailjs from '@emailjs/browser';

// EmailJS 설정 (환경 변수에서 가져오기)
// Vite에서는 VITE_ 접두사가 있는 환경 변수만 클라이언트에 노출됩니다
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_l4jlrhr';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_g0mc9fr';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'rA7woIdCuPRzaiuAF';

// EmailJS 초기화
emailjs.init(EMAILJS_PUBLIC_KEY);

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
    console.log('🚀 로그인 알림 이메일 발송 시작');
    console.log('=== EmailJS 설정 확인 ===');
    console.log('EMAILJS_SERVICE_ID:', EMAILJS_SERVICE_ID);
    console.log('EMAILJS_TEMPLATE_ID:', EMAILJS_TEMPLATE_ID);
    console.log('EMAILJS_PUBLIC_KEY:', EMAILJS_PUBLIC_KEY ? '설정됨' : '설정되지 않음');
    console.log('========================');
    console.log('📧 전송할 데이터:', data);
    
    const templateParams = {
      subject: `[환자차트시스템] ${data.username} 로그인 알림`,
      name: data.therapistName,
      email: 'stjoe1004@gmail.com',
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

로그인이 감지되었습니다.
      `.trim()
    };

    // EmailJS 설정이 제대로 되지 않은 경우 경고
    if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'your_emailjs_public_key') {
      console.warn('⚠️ EmailJS가 설정되지 않았습니다. .env.local 파일에 EMAILJS_PUBLIC_KEY를 설정해주세요.');
      console.log('📧 로그인 알림 데이터:', data);
      return false;
    }

    console.log('📧 전송할 템플릿 파라미터:', templateParams);
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ 로그인 알림 이메일 발송 성공:', response);
    return true;
  } catch (error) {
    console.error('❌ 로그인 알림 이메일 발송 실패:', error);
    console.error('오류 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: (error as any)?.status,
      text: (error as any)?.text,
      response: (error as any)?.response
    });
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

// 회원가입 알림 이메일 발송
export const sendRegistrationNotification = async (data: RegistrationNotificationData): Promise<boolean> => {
  try {
    console.log('🚀 회원가입 알림 이메일 발송 시작');
    console.log('📧 전송할 데이터:', data);
    
    const templateParams = {
      subject: `[환자차트시스템] 새로운 회원가입 요청 - ${data.username}`,
      name: '관리자',
      email: 'stjoe1004@gmail.com',
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

    // EmailJS 설정이 제대로 되지 않은 경우 경고
    if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'your_emailjs_public_key') {
      console.warn('⚠️ EmailJS가 설정되지 않았습니다. .env.local 파일에 EMAILJS_PUBLIC_KEY를 설정해주세요.');
      console.log('📧 회원가입 알림 데이터:', data);
      // 이메일 발송 실패해도 회원가입은 성공으로 처리
      return false;
    }

    console.log('📧 전송할 템플릿 파라미터:', templateParams);
    
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ 회원가입 알림 이메일 발송 성공:', response);
    return true;
  } catch (error) {
    console.error('❌ 회원가입 알림 이메일 발송 실패:', error);
    console.error('오류 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: (error as any)?.status,
      text: (error as any)?.text,
      response: (error as any)?.response
    });
    return false;
  }
};

// 브라우저 정보 가져오기
export const getBrowserInfo = (): string => {
  return navigator.userAgent;
};

// SMS 알림 발송 (Twilio 사용)
export const sendSMSNotification = async (message: string, phoneNumber: string): Promise<boolean> => {
  try {
    console.log('📱 SMS 알림 발송 시작:', { message, phoneNumber });
    
    // Twilio API 호출 (서버 사이드에서 처리해야 함)
    // 현재는 클라이언트 사이드이므로 실제 SMS 발송은 서버에서 처리
    console.log('📱 SMS 알림 데이터:', { message, phoneNumber });
    
    // 실제 구현 시에는 서버 API를 호출하여 SMS 발송
    // fetch('/api/send-sms', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message, phoneNumber })
    // });
    
    return true;
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
