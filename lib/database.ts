// IndexedDB 기반 로컬 데이터베이스
export interface User {
  id: string;
  username: string;
  passwordHash: string;
  clinicName: string;
  therapistName: string;
  therapistLicenseNo: string;
  createdAt: string;
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
}

export interface PatientChart {
  id?: number;
  fileNo: string;
  userId: string;
  chartType: 'new' | 'follow-up';
  chartData: string; // JSON string
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicInfo {
  id?: number;
  userId: string;
  clinicName: string;
  clinicLogo: string;
  therapistName: string;
  therapistLicenseNo: string;
  updatedAt: string;
}

export class IndexedDBDatabase {
  private dbName = 'PatientChartDB';
  private version = 2; // 버전 증가로 스키마 재생성
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🗄️ IndexedDB 초기화 시작...');
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error('❌ IndexedDB 열기 실패:', event);
        reject(new Error('IndexedDB 열기 실패'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB 초기화 완료');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('🔄 IndexedDB 스키마 업그레이드 시작...');
        const db = (event.target as IDBOpenDBRequest).result;

        // Users 테이블
        if (!db.objectStoreNames.contains('users')) {
          console.log('📝 Users 테이블 생성 중...');
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
          console.log('✅ Users 테이블 생성 완료');
        } else {
          console.log('✅ Users 테이블 이미 존재');
        }

        // Patient Charts 테이블
        if (!db.objectStoreNames.contains('patientCharts')) {
          const chartStore = db.createObjectStore('patientCharts', { keyPath: 'id', autoIncrement: true });
          chartStore.createIndex('userId', 'userId', { unique: false });
          chartStore.createIndex('fileNo', 'fileNo', { unique: false });
          chartStore.createIndex('userId_fileNo', ['userId', 'fileNo'], { unique: true });
        }

        // Clinic Info 테이블
        if (!db.objectStoreNames.contains('clinicInfo')) {
          const clinicStore = db.createObjectStore('clinicInfo', { keyPath: 'id', autoIncrement: true });
          clinicStore.createIndex('userId', 'userId', { unique: true });
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) {
      await this.initialize();
    }
    
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // 사용자명으로 사용자 조회
  async getUserByUsername(username: string): Promise<User | null> {
    if (!this.db) {
      console.warn('⚠️ 데이터베이스가 초기화되지 않음, 초기화 시도...');
      await this.initialize();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('username');
      const request = index.get(username);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error('사용자 조회 실패'));
      };
    });
  }

  // 사용자 등록
  async registerUser(userData: {
    username: string;
    password: string;
    clinicName: string;
    therapistName: string;
    therapistLicenseNo: string;
  }): Promise<{ user: User; token: string }> {
    console.log('🗄️ 데이터베이스 회원가입 시작:', userData.username);
    
    // 데이터베이스 초기화 보장
    if (!this.db) {
      console.log('🗄️ 데이터베이스 초기화 필요, 초기화 중...');
      await this.initialize();
    }
    
    // 먼저 사용자명 중복 체크
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      console.error('❌ 사용자명이 이미 존재합니다:', userData.username);
      throw new Error('이미 존재하는 사용자명입니다.');
    }
    
    const userId = this.generateId();
    const passwordHash = await this.hashPassword(userData.password);
    
    const user: User = {
      id: userId,
      username: userData.username,
      passwordHash,
      clinicName: userData.clinicName,
      therapistName: userData.therapistName,
      therapistLicenseNo: userData.therapistLicenseNo,
      createdAt: new Date().toISOString(),
      isApproved: false, // 승인 대기 상태
    };
    console.log('👤 생성된 사용자 객체:', user);

    const store = await this.getStore('users', 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.add(user);
      
      request.onsuccess = () => {
        console.log('✅ 사용자 데이터베이스 저장 성공');
        const token = this.generateToken(user);
        console.log('🔑 생성된 토큰:', token);
        resolve({ user, token });
      };
      
      request.onerror = (event) => {
        console.error('❌ 사용자 등록 실패:', event);
        console.error('❌ 오류 상세:', {
          error: event.target?.error,
          message: event.target?.error?.message,
          name: event.target?.error?.name
        });
        reject(new Error(`사용자 등록 실패: ${event.target?.error?.message || '알 수 없는 오류'}`));
      };
    });
  }

  // 사용자 로그인
  async loginUser(credentials: { username: string; password: string }): Promise<{ user: User; token: string }> {
    // 데이터베이스 초기화 보장
    if (!this.db) {
      console.log('🗄️ 로그인 시 데이터베이스 초기화 중...');
      await this.initialize();
    }
    
    const store = await this.getStore('users');
    
    return new Promise((resolve, reject) => {
      const index = store.index('username');
      const request = index.get(credentials.username);
      
      request.onsuccess = async () => {
        const user = request.result as User;
        
        if (!user) {
          console.error('❌ 사용자를 찾을 수 없습니다:', credentials.username);
          reject(new Error('사용자를 찾을 수 없습니다. 사용자명을 확인해주세요.'));
          return;
        }

        const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          console.error('❌ 비밀번호가 올바르지 않습니다.');
          reject(new Error('비밀번호가 올바르지 않습니다.'));
          return;
        }

        if (!user.isApproved) {
          console.warn('⚠️ 사용자가 아직 승인되지 않았습니다:', user.username);
          reject(new Error('관리자 승인을 기다리고 있습니다. 승인 후 로그인할 수 있습니다.'));
          return;
        }

        const token = this.generateToken(user);
        console.log('✅ 로그인 성공:', user.username);
        resolve({ user, token });
      };
      
      request.onerror = (event) => {
        console.error('❌ 로그인 실패:', event);
        reject(new Error('로그인 중 오류가 발생했습니다. 데이터베이스를 확인해주세요.'));
      };
    });
  }

  // 토큰 검증
  async verifyToken(token: string): Promise<User> {
    try {
      const payload = this.verifyTokenPayload(token);
      const store = await this.getStore('users');
      
      return new Promise((resolve, reject) => {
        const request = store.get(payload.userId);
        
        request.onsuccess = () => {
          const user = request.result as User;
          
          if (!user) {
            reject(new Error('사용자를 찾을 수 없습니다.'));
            return;
          }

          resolve(user);
        };
        
        request.onerror = () => {
          reject(new Error('토큰 검증 실패'));
        };
      });
    } catch (error) {
      throw new Error('유효하지 않은 토큰입니다.');
    }
  }

  // 환자 차트 조회
  async getPatientCharts(userId: string): Promise<PatientChart[]> {
    const store = await this.getStore('patientCharts');
    
    return new Promise((resolve, reject) => {
      const index = store.index('userId');
      const request = index.getAll(userId);
      
      request.onsuccess = () => {
        const charts = request.result as PatientChart[];
        // 최신 순으로 정렬
        charts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(charts);
      };
      
      request.onerror = () => {
        reject(new Error('환자 차트 조회 실패'));
      };
    });
  }

  // 같은 fileNo를 가진 모든 차트 조회 (이전 차트 참조용)
  async getPatientChartsByFileNo(userId: string, fileNo: string): Promise<PatientChart[]> {
    const store = await this.getStore('patientCharts');
    
    return new Promise((resolve, reject) => {
      const index = store.index('fileNo');
      const request = index.getAll(fileNo);
      
      request.onsuccess = () => {
        const charts = request.result as PatientChart[];
        // userId로 필터링 (다른 사용자의 차트 제외)
        const userCharts = charts.filter(chart => chart.userId === userId);
        // 날짜 순으로 정렬 (오래된 것부터)
        userCharts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        resolve(userCharts);
      };
      
      request.onerror = () => {
        reject(new Error('환자 차트 조회 실패'));
      };
    });
  }

  // 환자 차트 저장
  async savePatientChart(userId: string, patientData: any): Promise<PatientChart> {
    const chartData = JSON.stringify(patientData);
    const now = new Date().toISOString();

    // 기존 차트가 있는지 확인
    const existingCharts = await this.getPatientCharts(userId);
    const existingChart = existingCharts.find(chart => chart.fileNo === patientData.fileNo);

    const store = await this.getStore('patientCharts', 'readwrite');
    
    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      
      if (existingChart) {
        // 업데이트
        const updatedChart: PatientChart = {
          ...existingChart,
          chartData,
          date: patientData.date,
          updatedAt: now,
        };
        request = store.put(updatedChart);
      } else {
        // 새로 생성
        const newChart: PatientChart = {
          fileNo: patientData.fileNo,
          userId,
          chartType: patientData.chartType,
          chartData,
          date: patientData.date,
          createdAt: now,
          updatedAt: now,
        };
        request = store.add(newChart);
      }
      
      request.onsuccess = () => {
        const chart: PatientChart = existingChart ? {
          ...existingChart,
          chartData,
          date: patientData.date,
          updatedAt: now,
        } : {
          id: request.result as number,
          fileNo: patientData.fileNo,
          userId,
          chartType: patientData.chartType,
          chartData,
          date: patientData.date,
          createdAt: now,
          updatedAt: now,
        };
        resolve(chart);
      };
      
      request.onerror = () => {
        reject(new Error('환자 차트 저장 실패'));
      };
    });
  }

  // 환자 차트 삭제
  async deletePatientChart(userId: string, fileNo: string): Promise<void> {
    const charts = await this.getPatientCharts(userId);
    const chartToDelete = charts.find(chart => chart.fileNo === fileNo);
    
    if (!chartToDelete) {
      throw new Error('삭제할 차트를 찾을 수 없습니다.');
    }

    const store = await this.getStore('patientCharts', 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(chartToDelete.id!);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('환자 차트 삭제 실패'));
      };
    });
  }

  // 클리닉 정보 조회
  async getClinicInfo(userId: string): Promise<ClinicInfo | null> {
    const store = await this.getStore('clinicInfo');
    
    return new Promise((resolve, reject) => {
      const index = store.index('userId');
      const request = index.get(userId);
      
      request.onsuccess = () => {
        const result = request.result as ClinicInfo;
        resolve(result || null);
      };
      
      request.onerror = () => {
        reject(new Error('클리닉 정보 조회 실패'));
      };
    });
  }

  // 클리닉 정보 저장
  async saveClinicInfo(userId: string, clinicInfo: any): Promise<ClinicInfo> {
    const now = new Date().toISOString();
    const existingInfo = await this.getClinicInfo(userId);

    const store = await this.getStore('clinicInfo', 'readwrite');
    
    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      
      if (existingInfo) {
        // 업데이트
        const updatedInfo: ClinicInfo = {
          ...existingInfo,
          clinicName: clinicInfo.clinicName,
          clinicLogo: clinicInfo.clinicLogo,
          therapistName: clinicInfo.therapistName,
          therapistLicenseNo: clinicInfo.therapistLicenseNo,
          updatedAt: now,
        };
        request = store.put(updatedInfo);
      } else {
        // 새로 생성
        const newInfo: ClinicInfo = {
          userId,
          clinicName: clinicInfo.clinicName,
          clinicLogo: clinicInfo.clinicLogo,
          therapistName: clinicInfo.therapistName,
          therapistLicenseNo: clinicInfo.therapistLicenseNo,
          updatedAt: now,
        };
        request = store.add(newInfo);
      }
      
      request.onsuccess = () => {
        const info: ClinicInfo = existingInfo ? {
          ...existingInfo,
          clinicName: clinicInfo.clinicName,
          clinicLogo: clinicInfo.clinicLogo,
          therapistName: clinicInfo.therapistName,
          therapistLicenseNo: clinicInfo.therapistLicenseNo,
          updatedAt: now,
        } : {
          id: request.result as number,
          userId,
          clinicName: clinicInfo.clinicName,
          clinicLogo: clinicInfo.clinicLogo,
          therapistName: clinicInfo.therapistName,
          therapistLicenseNo: clinicInfo.therapistLicenseNo,
          updatedAt: now,
        };
        resolve(info);
      };
      
      request.onerror = () => {
        reject(new Error('클리닉 정보 저장 실패'));
      };
    });
  }

  // 백업 생성 (JSON 파일로 다운로드)
  async createBackup(userId: string): Promise<string> {
    const [charts, clinicInfo] = await Promise.all([
      this.getPatientCharts(userId),
      this.getClinicInfo(userId)
    ]);

    const backupData = {
      userId,
      charts,
      clinicInfo,
      timestamp: new Date().toISOString(),
      version: this.version
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient_chart_backup_${userId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return `백업 파일이 다운로드되었습니다: ${a.download}`;
  }

  // 백업 복원
  async restoreBackup(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);
          
          // 데이터 검증
          if (!backupData.userId || !backupData.charts) {
            throw new Error('유효하지 않은 백업 파일입니다.');
          }

          // 기존 데이터 삭제 (선택사항)
          // await this.clearUserData(backupData.userId);

          // 데이터 복원
          const store = await this.getStore('patientCharts', 'readwrite');
          
          for (const chart of backupData.charts) {
            await new Promise<void>((resolveChart, rejectChart) => {
              const request = store.add(chart);
              request.onsuccess = () => resolveChart();
              request.onerror = () => rejectChart(new Error('차트 복원 실패'));
            });
          }

          if (backupData.clinicInfo) {
            await this.saveClinicInfo(backupData.userId, backupData.clinicInfo);
          }

          resolve();
        } catch (error) {
          reject(new Error('백업 복원 실패: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };
      
      reader.readAsText(file);
    });
  }

  // 유틸리티 함수들
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async hashPassword(password: string): Promise<string> {
    // 간단한 해시 함수 (실제로는 더 강력한 해시 사용 권장)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  private generateToken(user: User): string {
    // 간단한 토큰 생성 (실제로는 JWT 사용 권장)
    const payload = {
      userId: user.id,
      username: user.username,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7일
    };
    return btoa(JSON.stringify(payload));
  }

  private verifyTokenPayload(token: string): { userId: string; username: string; exp: number } {
    try {
      const payload = JSON.parse(atob(token));
      if (payload.exp < Date.now()) {
        throw new Error('토큰이 만료되었습니다.');
      }
      return payload;
    } catch (error) {
      throw new Error('유효하지 않은 토큰입니다.');
    }
  }

  // 관리자 승인 관련 함수들
  async getPendingUsers(): Promise<User[]> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const users = request.result.filter((user: User) => !user.isApproved);
        resolve(users);
      };
      
      request.onerror = () => {
        reject(new Error('대기 중인 사용자 목록을 가져오는데 실패했습니다.'));
      };
    });
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(new Error('사용자 목록을 가져오는데 실패했습니다.'));
      };
    });
  }

  async approveUser(userId: string, approvedBy: string): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.get(userId);
      
      request.onsuccess = () => {
        const user = request.result;
        if (!user) {
          reject(new Error('사용자를 찾을 수 없습니다.'));
          return;
        }
        
        user.isApproved = true;
        user.approvedAt = new Date().toISOString();
        user.approvedBy = approvedBy;
        
        const updateRequest = store.put(user);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(new Error('사용자 승인에 실패했습니다.'));
      };
      
      request.onerror = () => {
        reject(new Error('사용자 정보를 가져오는데 실패했습니다.'));
      };
    });
  }

  async rejectUser(userId: string): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.delete(userId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('사용자 거부에 실패했습니다.'));
    });
  }

  async deleteUser(userId: string): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.delete(userId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('사용자 삭제에 실패했습니다.'));
    });
  }

  // 사용자 비밀번호 업데이트 (테스트 사용자용)
  async updateUserPassword(username: string, newPassword: string): Promise<void> {
    if (!this.db) throw new Error('데이터베이스가 초기화되지 않았습니다.');
    
    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const index = store.index('username');
      const request = index.get(username);
      
      request.onsuccess = async () => {
        const user = request.result;
        if (!user) {
          reject(new Error('사용자를 찾을 수 없습니다.'));
          return;
        }
        
        // 새 비밀번호 해시 생성
        const newPasswordHash = await this.hashPassword(newPassword);
        user.passwordHash = newPasswordHash;
        
        const updateRequest = store.put(user);
        updateRequest.onsuccess = () => {
          console.log('✅ 사용자 비밀번호가 업데이트되었습니다:', username);
          resolve();
        };
        updateRequest.onerror = () => reject(new Error('비밀번호 업데이트에 실패했습니다.'));
      };
      
      request.onerror = () => {
        reject(new Error('사용자 정보를 가져오는데 실패했습니다.'));
      };
    });
  }
}

// 싱글톤 인스턴스
export const database = new IndexedDBDatabase();
