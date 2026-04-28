## TODO

### 1. 기획 (1h)
- [ ] 데모 시나리오
- [ ] UI 확정

### 2. 개발 환경 설정 (1h)
- [ ] 환경 설정 (패키지 설치, Credential 설정 등)
- [ ] 로컬 실행
- [ ] 아키텍처 설명

### 3. Risk Card 구현 (2h, 담당자)
#### 연관 파일
  * `frontend/src/components/home/RiskCard.tsx`
  * `backend/routes/risk.py`  
#### 참고 파일  
  * `example/guardians_risk_sector/src/server/dsri.ts`: `getDashboardData`
#### Task
- [ ] 3.1 yfinance 활용 데이터 수집 및 지표 계산
- [ ] 3.2 Gemini 활용 응답 생성
  - [ ] 3.2.1 Prompt Tuning
- [ ] 3.3 UI 구현
- [ ] 3.4 Risk 가 Limit 이상일 때 알림

### 4. Sector Card 구현 (2h, 담당자)
#### 연관 파일
  * `frontend/src/components/home/SectorCard.tsx`
  * `backend/routes/sector.py`  
#### 참고 파일  
  * `example/guardians_risk_sector/src/server/dsri.ts`: `getTickerData`
#### Task
- [ ] 4.1 yfinance 활용 데이터 수집
- [ ] 4.2 Gemini 활용 응답 생성
  - [ ] 4.2.1 Prompt Tuning
- [ ] 4.3 UI 구현

### 5. Stock Card 구현 (default) (2h, 담당자)
#### 연관 파일
  * `frontend/src/components/home/StockCard.tsx`
  * `backend/routes/stock.py`  
#### 참고 파일  
  * `example/guardians_risk_sector/src/server/gemini.ts`: `getTickerAnalysis`
#### Task
- [ ] 5.1 yfiance 활용 데이터 수집
- [ ] 5.2 yfiance/Gemini 활용 패턴 분석
- [ ] 5.3 Gemini 활용 응답 생성
  - [ ] 5.3.1 Prompt Tuning
- [ ] 5.4 UI 구현

-----------------

### 6. 개인화 구현 (선행: 3, 5) (1h, 담당자)
#### 연관 파일
  * `frontend\src\components\home\SettingsModal.tsx`
  * `backend\routes\settings.py`
#### Task
- [ ] 6.1 사용자 설정 조회 기능 구현
- [ ] 6.2 설정 기반 Risk Threshold 구현
- [ ] 6.3 설정 기반 Stock Card 구현

### 7. Ambient 구현 (0.5h, 담당자)
#### 연관 파일
  * `frontend\src\pages\Ambient.tsx`
  * `backend\routes\wakeup.py`
#### 참고 파일
  * `example\voice-recognition.py`
#### Task
- [ ] 7.1 Ambient UI 구현
- [ ] 7.2 Gemini 활용 음성 인식 및 의도 추출 구현

### 8. 음성 검색 구현 (0.5h, 담당자)
#### 연관 파일
  * `backend\routes\search.py`
#### 참고 파일
  * `example\voice-recognition.py`
#### Task
- [ ] 8.1 Gemini 활용 음성 검색 구현

### 9. 발표
- [ ] 9.1 발표 영상 촬영 및 편집
- [ ] 9.2 발표 슬라이드 생성
  - [ ] 9.2.1 Gemini 활용 Risk Metric 도출 과정 정리

-----------------

### 10. 성능 개선 (1h, @rach-rgb)
- [ ] 10.1 Gemini 응답 Cache 기능 구현
- [ ] 10.2 Refactor