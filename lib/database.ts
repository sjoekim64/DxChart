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
  private version = 4; // 버전 증가: userId_fileNo_date 인덱스의 unique 제약 제거
  private db: IDBDatabase | null = null;

  async initialize(forceReopen: boolean = false): Promise<void> {
    // forceReopen이 true이면 기존 연결을 닫고 다시 열기 (크롬 호환성)
    if (forceReopen && this.db) {
      console.log('🔄 IndexedDB 연결 강제 재오픈...');
      this.db.close();
      this.db = null;
    }
    
    // 이미 초기화되어 있고 연결이 유효한 경우 바로 반환
    if (this.db && this.db.objectStoreNames.length > 0) {
      console.log('✅ IndexedDB 이미 초기화됨, 재사용');
      return Promise.resolve();
    }
    
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
        
        // 크롬 호환성을 위해 연결이 닫히지 않도록 이벤트 리스너 추가
        this.db.onclose = () => {
          console.warn('⚠️ IndexedDB 연결이 닫혔습니다. 재초기화가 필요할 수 있습니다.');
          this.db = null;
        };
        
        this.db.onerror = () => {
          console.error('❌ IndexedDB 오류 발생');
        };
        
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
          chartStore.createIndex('userId_fileNo', ['userId', 'fileNo'], { unique: false }); // unique 제거: 같은 fileNo의 여러 차트 저장 가능
          chartStore.createIndex('userId_fileNo_date', ['userId', 'fileNo', 'date'], { unique: false }); // unique 제거: 같은 날짜의 여러 차트도 저장 가능
        } else {
          // 기존 테이블이 있으면 인덱스 수정
          const transaction = (event.target as IDBOpenDBRequest).transaction!;
          const chartStore = transaction.objectStore('patientCharts');
          // 기존 unique 인덱스 삭제 후 재생성
          if (chartStore.indexNames.contains('userId_fileNo')) {
            chartStore.deleteIndex('userId_fileNo');
          }
          if (!chartStore.indexNames.contains('userId_fileNo')) {
            chartStore.createIndex('userId_fileNo', ['userId', 'fileNo'], { unique: false });
          }
          if (chartStore.indexNames.contains('userId_fileNo_date')) {
            // 기존 unique 인덱스가 있으면 삭제 후 재생성
            chartStore.deleteIndex('userId_fileNo_date');
          }
          if (!chartStore.indexNames.contains('userId_fileNo_date')) {
            chartStore.createIndex('userId_fileNo_date', ['userId', 'fileNo', 'date'], { unique: false });
          }
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
    
    // 대소문자 구분 없이 검색 - getAll()을 사용하여 iPad Safari 호환성 개선
    const normalizedUsername = username.toLowerCase();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('데이터베이스가 초기화되지 않았습니다.'));
        return;
      }
      
      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();
      
      request.onsuccess = () => {
        try {
          const users = request.result as User[];
          const foundUser = users.find(user => user.username.toLowerCase() === normalizedUsername);
          resolve(foundUser || null);
        } catch (error) {
          console.error('❌ 사용자 조회 중 오류:', error);
          reject(new Error('사용자 조회 중 오류가 발생했습니다.'));
        }
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
    
    // "admin" 사용자명 금지
    if (userData.username.toLowerCase() === 'admin') {
      console.error('❌ "admin"은 사용할 수 없는 사용자명입니다.');
      throw new Error('"admin"은 사용할 수 없는 사용자명입니다.');
    }
    
    // 먼저 사용자명 중복 체크
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      console.error('❌ 사용자명이 이미 존재합니다:', userData.username);
      throw new Error('이미 존재하는 사용자명입니다.');
    }
    
    const userId = this.generateId();
    const passwordHash = await this.hashPassword(userData.password);
    console.log('🔐 생성된 비밀번호 해시:', {
      length: passwordHash.length,
      preview: passwordHash.substring(0, 20) + '...',
      fullHash: passwordHash
    });
    
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
    console.log('👤 생성된 사용자 객체:', {
      ...user,
      passwordHash: user.passwordHash.substring(0, 20) + '...'
    });

    const store = await this.getStore('users', 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.add(user);
      
      request.onsuccess = () => {
        console.log('✅ 사용자 데이터베이스 저장 성공');
        console.log('🔐 저장된 비밀번호 해시 확인:', {
          length: user.passwordHash.length,
          preview: user.passwordHash.substring(0, 20) + '...'
        });
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
    // 크롬 호환성: 로그인 전에 데이터베이스 연결을 새로고침하여 최신 데이터 보장
    console.log('🔄 로그인 전 데이터베이스 연결 새로고침...');
    await this.initialize(true); // forceReopen = true로 최신 데이터 보장
    
    // 대소문자 구분 없이 검색 - getAll()을 사용하여 iPad Safari 호환성 개선
    const normalizedUsername = credentials.username.toLowerCase();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('데이터베이스가 초기화되지 않았습니다.'));
        return;
      }
      
      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();
      
      // 크롬 호환성: 트랜잭션 완료를 명시적으로 대기
      let usersData: User[] | null = null;
      let transactionCompleted = false;
      
      request.onsuccess = () => {
        usersData = request.result as User[];
        console.log('📦 사용자 데이터 로드 완료:', usersData.length, '명');
        console.log('📦 트랜잭션 완료 대기 중...');
      };
      
      request.onerror = (event) => {
        console.error('❌ 사용자 데이터 로드 실패:', event);
        reject(new Error('사용자 데이터를 로드하는데 실패했습니다.'));
      };
      
      transaction.oncomplete = async () => {
        console.log('✅ 트랜잭션 완료, 로그인 처리 시작...');
        transactionCompleted = true;
        try {
          if (!usersData) {
            console.error('❌ 사용자 데이터를 가져오지 못했습니다.');
            reject(new Error('사용자 데이터를 가져오는데 실패했습니다.'));
            return;
          }
          
          console.log('🔍 전체 사용자 목록:', usersData.map(u => ({ username: u.username, hashLength: u.passwordHash?.length || 0 })));
          
          const foundUser = usersData.find(user => user.username.toLowerCase() === normalizedUsername);
          
          if (!foundUser) {
            console.error('❌ 사용자를 찾을 수 없습니다:', credentials.username);
            console.error('  - 검색한 사용자명 (소문자):', normalizedUsername);
            console.error('  - 전체 사용자명 목록:', usersData.map(u => u.username));
            reject(new Error('사용자를 찾을 수 없습니다. 사용자명을 확인해주세요.'));
            return;
          }

          console.log('✅ 사용자 찾음:', {
            username: foundUser.username,
            id: foundUser.id,
            storedHashLength: foundUser.passwordHash?.length || 0,
            storedHashPreview: foundUser.passwordHash ? foundUser.passwordHash.substring(0, 30) + '...' : 'NULL',
            storedHashFull: foundUser.passwordHash || 'NULL'
          });

          // 비밀번호 검증
          console.log('🔐 비밀번호 검증 시작:', {
            username: foundUser.username,
            inputPasswordLength: credentials.password.length,
            storedHashLength: foundUser.passwordHash?.length || 0,
            storedHashPreview: foundUser.passwordHash ? foundUser.passwordHash.substring(0, 30) + '...' : 'NULL'
          });
          
          const isValidPassword = await this.verifyPassword(credentials.password, foundUser.passwordHash);
          if (!isValidPassword) {
            console.error('❌ 비밀번호가 올바르지 않습니다.');
            console.error('  - 사용자명:', foundUser.username);
            console.error('  - 입력 비밀번호 길이:', credentials.password.length);
            console.error('  - 저장된 해시 전체 길이:', foundUser.passwordHash?.length || 0);
            console.error('  - 저장된 해시 전체:', foundUser.passwordHash || 'NULL');
            reject(new Error('비밀번호가 올바르지 않습니다.'));
            return;
          }

          if (!foundUser.isApproved) {
            console.warn('⚠️ 사용자가 아직 승인되지 않았습니다:', foundUser.username);
            reject(new Error('관리자 승인을 기다리고 있습니다. 승인 후 로그인할 수 있습니다.'));
            return;
          }

          const token = this.generateToken(foundUser);
          console.log('✅ 로그인 성공:', foundUser.username);
          resolve({ user: foundUser, token });
        } catch (error) {
          console.error('❌ 로그인 처리 중 오류:', error);
          reject(new Error('로그인 처리 중 오류가 발생했습니다.'));
        }
      };
      
      request.onerror = (event) => {
        console.error('❌ 로그인 실패:', event);
        reject(new Error('로그인 중 오류가 발생했습니다. 데이터베이스를 확인해주세요.'));
      };
      
      transaction.onerror = (event) => {
        console.error('❌ 트랜잭션 오류:', event);
        console.error('❌ 트랜잭션 오류 상세:', {
          error: (event.target as IDBTransaction)?.error,
          message: (event.target as IDBTransaction)?.error?.message
        });
        reject(new Error('데이터베이스 트랜잭션 오류가 발생했습니다.'));
      };
      
      // 크롬 호환성: 트랜잭션이 완료되지 않으면 타임아웃 처리
      setTimeout(() => {
        if (!transactionCompleted && usersData === null) {
          console.error('❌ 트랜잭션 타임아웃: 트랜잭션이 완료되지 않았습니다.');
          reject(new Error('데이터베이스 트랜잭션이 시간 초과되었습니다. 다시 시도해주세요.'));
        }
      }, 5000); // 5초 타임아웃
    });
  }

  // 토큰 검증
  async verifyToken(token: string): Promise<User> {
    // Admin 토큰 특별 처리
    if (token.startsWith('admin_token_')) {
      const adminUser: User = {
        id: 'admin',
        username: 'admin',
        passwordHash: '',
        clinicName: 'Admin Dashboard',
        therapistName: 'Administrator',
        therapistLicenseNo: 'ADMIN',
        createdAt: new Date().toISOString(),
        isApproved: true,
      };
      return adminUser;
    }
    
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

  // 환자 차트 저장 (기존 차트가 있으면 업데이트, 없으면 새로 생성)
  async savePatientChart(userId: string, patientData: any): Promise<PatientChart> {
    const chartData = JSON.stringify(patientData);
    const now = new Date().toISOString();

    // 기존 차트가 있는지 확인 (같은 fileNo와 date 조합)
    const existingCharts = await this.getPatientCharts(userId);
    const existingChart = existingCharts.find(chart => 
      chart.fileNo === patientData.fileNo && chart.date === patientData.date
    );

    const store = await this.getStore('patientCharts', 'readwrite');
    
    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      
      if (existingChart) {
        // 같은 fileNo와 date가 있으면 업데이트
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
      
      request.onerror = (event) => {
        const error = (event.target as IDBRequest).error;
        const errorMessage = error ? `환자 차트 저장 실패: ${error.message} (Code: ${error.code})` : '환자 차트 저장 실패';
        console.error('IndexedDB 저장 에러:', error);
        reject(new Error(errorMessage));
      };
    });
  }

  // 환자 차트를 항상 새로운 차트로 저장 (기존 차트는 덮어쓰지 않음)
  async savePatientChartAsNew(userId: string, patientData: any): Promise<PatientChart> {
    const chartData = JSON.stringify(patientData);
    const now = new Date().toISOString();

    const store = await this.getStore('patientCharts', 'readwrite');
    
    return new Promise((resolve, reject) => {
      // 항상 새로운 차트로 저장
      const newChart: PatientChart = {
        fileNo: patientData.fileNo,
        userId,
        chartType: patientData.chartType,
        chartData,
        date: patientData.date,
        createdAt: now,
        updatedAt: now,
      };
      const request = store.add(newChart);
      
      request.onsuccess = () => {
        const chart: PatientChart = {
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
      
      request.onerror = (event) => {
        const error = (event.target as IDBRequest).error;
        const errorMessage = error ? `환자 차트 저장 실패: ${error.message} (Code: ${error.code})` : '환자 차트 저장 실패';
        console.error('IndexedDB 저장 에러 (savePatientChartAsNew):', error);
        reject(new Error(errorMessage));
      };
    });
  }

  // 환자 차트 삭제 (chart ID로 삭제)
  async deletePatientChartById(userId: string, chartId: number): Promise<void> {
    const store = await this.getStore('patientCharts', 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(chartId);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('환자 차트 삭제 실패'));
      };
    });
  }

  // 환자 차트 삭제 (fileNo와 date로 특정 차트 삭제)
  async deletePatientChart(userId: string, fileNo: string, date?: string): Promise<void> {
    const charts = await this.getPatientCharts(userId);
    let chartToDelete;
    
    if (date) {
      // fileNo와 date로 특정 차트 찾기
      chartToDelete = charts.find(chart => chart.fileNo === fileNo && chart.date === date);
    } else {
      // fileNo만으로 첫 번째 차트 찾기 (기존 동작 유지)
      chartToDelete = charts.find(chart => chart.fileNo === fileNo);
    }
    
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
    if (!hash || hash.length === 0) {
      console.error('❌ 저장된 해시가 비어있습니다!');
      return false;
    }
    
    const passwordHash = await this.hashPassword(password);
    const isMatch = passwordHash === hash;
    
    // 디버깅을 위한 상세 로그
    console.log('🔐 비밀번호 검증 상세:');
    console.log('  - 입력 비밀번호 길이:', password.length);
    console.log('  - 입력 비밀번호 해시 길이:', passwordHash.length);
    console.log('  - 저장된 해시 길이:', hash.length);
    console.log('  - 입력 해시 (처음 30자):', passwordHash.substring(0, 30));
    console.log('  - 저장 해시 (처음 30자):', hash.substring(0, 30));
    console.log('  - 입력 해시 (전체):', passwordHash);
    console.log('  - 저장 해시 (전체):', hash);
    console.log('  - 해시 일치 여부:', isMatch);
    
    if (!isMatch) {
      console.error('❌ 비밀번호 검증 실패!');
      // 해시의 각 문자를 비교하여 어디서 다른지 확인
      if (passwordHash.length === hash.length) {
        let diffCount = 0;
        const diffPositions: number[] = [];
        for (let i = 0; i < Math.min(passwordHash.length, hash.length); i++) {
          if (passwordHash[i] !== hash[i]) {
            diffCount++;
            if (diffCount <= 10) {
              diffPositions.push(i);
              console.error(`  - 위치 ${i}: 입력='${passwordHash[i]}', 저장='${hash[i]}'`);
            }
          }
        }
        console.error(`  - 총 ${diffCount}개 위치에서 차이 발견`);
        if (diffPositions.length > 0) {
          console.error('  - 차이 위치:', diffPositions.slice(0, 10));
        }
      } else {
        console.error('  - 해시 길이가 다릅니다!');
        console.error('    입력 해시 길이:', passwordHash.length);
        console.error('    저장 해시 길이:', hash.length);
      }
    } else {
      console.log('✅ 비밀번호 검증 성공');
    }
    
    return isMatch;
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

  // 사용자 프로필 업데이트
  async updateUserProfile(userId: string, profileData: {
    clinicName?: string;
    therapistName?: string;
    therapistLicenseNo?: string;
  }): Promise<User> {
    if (!this.db) {
      await this.initialize();
    }

    const store = await this.getStore('users', 'readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.get(userId);
      
      request.onsuccess = () => {
        const user = request.result as User;
        if (!user) {
          reject(new Error('사용자를 찾을 수 없습니다.'));
          return;
        }

        const updatedUser: User = {
          ...user,
          ...(profileData.clinicName !== undefined && { clinicName: profileData.clinicName }),
          ...(profileData.therapistName !== undefined && { therapistName: profileData.therapistName }),
          ...(profileData.therapistLicenseNo !== undefined && { therapistLicenseNo: profileData.therapistLicenseNo }),
        };

        const updateRequest = store.put(updatedUser);
        updateRequest.onsuccess = () => {
          resolve(updatedUser);
        };
        updateRequest.onerror = () => {
          reject(new Error('사용자 프로필 업데이트 실패'));
        };
      };
      
      request.onerror = () => {
        reject(new Error('사용자 조회 실패'));
      };
    });
  }

  // 사용자 비밀번호 업데이트 (테스트 사용자용)
  async updateUserPassword(username: string, newPassword: string): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
    
    // 먼저 비밀번호 해시 생성
    const newPasswordHash = await this.hashPassword(newPassword);
    console.log('🔐 새 비밀번호 해시 생성 완료:', username);
    
    // 대소문자 구분 없이 사용자 검색
    const normalizedUsername = username.toLowerCase();
    
    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.getAll();
      
      request.onsuccess = () => {
        try {
          const users = request.result as User[];
          const foundUser = users.find(user => user.username.toLowerCase() === normalizedUsername);
          
          if (!foundUser) {
            console.error('❌ 사용자를 찾을 수 없습니다:', username);
            reject(new Error('사용자를 찾을 수 없습니다.'));
            return;
          }
          
          console.log('👤 기존 사용자 찾음:', foundUser.username);
          console.log('🔐 기존 비밀번호 해시:', foundUser.passwordHash.substring(0, 20) + '...');
          
          // 새 비밀번호 해시로 업데이트
          foundUser.passwordHash = newPasswordHash;
          console.log('🔐 새 비밀번호 해시로 업데이트:', newPasswordHash.substring(0, 20) + '...');
          
          const updateRequest = store.put(foundUser);
          updateRequest.onsuccess = () => {
            console.log('✅ 사용자 비밀번호가 업데이트되었습니다:', foundUser.username);
            console.log('🔐 업데이트된 해시:', newPasswordHash.substring(0, 30) + '...');
            // 확인은 transaction.oncomplete에서 수행
          };
          
          updateRequest.onerror = (event) => {
            console.error('❌ 비밀번호 업데이트 실패:', event);
            reject(new Error('비밀번호 업데이트에 실패했습니다.'));
          };
        } catch (error) {
          console.error('❌ 비밀번호 업데이트 처리 중 오류:', error);
          reject(new Error('비밀번호 업데이트 처리 중 오류가 발생했습니다.'));
        }
      };
      
      request.onerror = () => {
        reject(new Error('사용자 정보를 가져오는데 실패했습니다.'));
      };
      
      // 트랜잭션이 완전히 완료된 후 확인
      transaction.oncomplete = () => {
        console.log('✅ 비밀번호 업데이트 트랜잭션 완료');
        
        // 트랜잭션 완료 후 약간의 지연을 두고 확인 (IndexedDB 커밋 보장)
        setTimeout(() => {
          const verifyTransaction = this.db!.transaction(['users'], 'readonly');
          const verifyStore = verifyTransaction.objectStore('users');
          const verifyRequest = verifyStore.getAll();
          
          verifyRequest.onsuccess = () => {
            const users = verifyRequest.result as User[];
            const updatedUser = users.find(user => user.username.toLowerCase() === normalizedUsername);
            
            if (updatedUser && updatedUser.passwordHash === newPasswordHash) {
              console.log('✅ 비밀번호 업데이트 확인 완료');
              console.log('🔐 확인된 해시:', updatedUser.passwordHash.substring(0, 30) + '...');
              resolve();
            } else {
              console.error('❌ 비밀번호 업데이트 확인 실패');
              console.error('❌ 예상 해시:', newPasswordHash.substring(0, 30) + '...');
              if (updatedUser) {
                console.error('❌ 실제 해시:', updatedUser.passwordHash ? updatedUser.passwordHash.substring(0, 30) + '...' : 'NULL');
                console.error('❌ 실제 해시 전체:', updatedUser.passwordHash || 'NULL');
              } else {
                console.error('❌ 사용자를 찾을 수 없습니다');
              }
              reject(new Error('비밀번호 업데이트 확인에 실패했습니다.'));
            }
          };
          
          verifyRequest.onerror = () => {
            console.error('❌ 비밀번호 업데이트 확인 중 오류 발생');
            reject(new Error('비밀번호 업데이트 확인 중 오류가 발생했습니다.'));
          };
        }, 100); // 100ms 지연으로 IndexedDB 커밋 보장
      };
      
      transaction.onerror = () => {
        reject(new Error('트랜잭션 오류가 발생했습니다.'));
      };
    });
  }
}

// 싱글톤 인스턴스
export const database = new IndexedDBDatabase();
