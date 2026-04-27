# Guardian 프로젝트 협업 규칙 (Agent Rules)

본 문서는 프로젝트의 일관성을 유지하고 원활한 협업을 위해 준수해야 할 규칙을 정의합니다.

## 1. 기술 스택 준수
프로젝트에 정의된 공식 기술 스택 외의 다른 라이브러리나 프레임워크 도입 시 반드시 사전 논의가 필요합니다.
- **Frontend**: React, TypeScript, Vite
- **Backend**: Python, FastAPI, Pydantic
- **AI**: Google GenAI (Gemini 2.0 Flash)
- **Environment**: Conda (Backend), npm (Frontend)

## 2. 파일 구조 준수
정해진 디렉토리 구조를 엄격히 준수하여 코드의 파편화를 방지합니다.
- **백엔드 로직 분리**: 새로운 API 추가 시 `backend/routes/`에 새 파일을 생성하고 `main.py`에 등록합니다.
- **프론트엔드 페이지**: 각 페이지 컴포넌트는 `frontend/src/pages/` 내에 `.tsx` 확장자로 작성합니다.

## 3. 최소 편집 규칙 및 Git 반영
코드 수정은 요청된 기능을 구현하거나 버그를 수정하는 데 필요한 최소 범위로 제한합니다.
- **불필요한 수정 금지**: 기능과 무관한 스타일 수정이나 변수명 변경 등은 지양합니다.
- **Git 워크플로우**:
    - 새로운 작업은 반드시 `main` 브랜치에서 최신 코드를 pull 받은 후 새 branch를 생성하여 진행합니다.
    - 작업 완료 후 반드시 Pull Request(PR)를 통해 코드 리뷰를 거칩니다.
