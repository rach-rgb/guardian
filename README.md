# Guardian 프로젝트

Guardian은 React/TypeScript 프론트엔드와 Google GenAI (Gemini)가 통합된 FastAPI 백엔드로 구성된 시장 분석 대시보드 프로젝트입니다.

## 1. 환경 설정

### 백엔드 (Conda)
Conda를 사용하여 Python 환경을 설정하는 방법입니다:
```bash
cd backend
conda env create -f environment.yaml # conda env update -f environment.yaml --prune
conda activate guardian-backend
```

### 프론트엔드 (npm)
React/TypeScript 환경을 설정하는 방법입니다:
```bash
cd frontend
npm install
```

## 2. 프로젝트 구조

```text
guardian/
├── backend/                # FastAPI 백엔드
│   ├── routes/             # 모듈화된 API 엔드포인트 (risk, pattern 등)
│   ├── services/           # 비즈니스 로직 (Gemini, YFinance, Stock)
│   └── main.py             # 애플리케이션 진입점
├── frontend/               # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── pages/          # 대시보드, Ambient, Pattern, Personal 페이지
│   └── vite.config.ts      # Vite 설정 파일
├── scripts/                # 디버깅 및 환경 확인 스크립트
├── environment.yaml        # Conda 환경 설정 파일
└── .env                    # 환경 변수 (API 키 등)
```

## 3. 스크립트 실행

환경 설정이 잘 되었는지 확인하려면 루트 디렉토리에서 다음 스크립트를 실행하세요:

**백엔드 확인:**
```bash
python scripts/check_backend.py
```

**프론트엔드 확인:**
```bash
node scripts/check_frontend.js
```

## 4. Git 워크플로우

### main 브랜치로부터 새로운 브랜치 생성
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 커밋 및 Push 후 PR 생성
```bash
git add .
git commit -m "feat: 새로운 시장 분석 로직 추가"
git push origin feature/your-feature-name
```
*Push 완료 후, GitHub 저장소 페이지에서 Pull Request(PR)를 생성하세요.*

## 5. 로컬 테스트 방법

### 백엔드 구동
1. **환경 활성화**: `conda activate guardian-backend`
2. **환경 변수 설정**: `.env` 파일을 자신의 자격 증명 정보로 업데이트합니다.
3. **서버 시작**:
   ```bash
   python backend/main.py
   ```
   *API 서버 주소: http://localhost:8000*

### 프론트엔드 구동
1. **폴더 이동**: `cd frontend`
2. **개발 서버 시작**:
   ```bash
   npm run dev
   ```
   *프론트엔드 주소: http://localhost:5173*
