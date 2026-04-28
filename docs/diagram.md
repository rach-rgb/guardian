
# Guardian Project - Call Sequence Diagram

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Frontend as 프론트엔드 (React)
    participant Backend as 백엔드 (FastAPI)
    participant YahooFinance as Yahoo Finance API
    participant GeminiAPI as Gemini API

    User->>Frontend: 애플리케이션 실행
    Frontend-->>User: 기본 UI 렌더링

    par "데이터 병렬 요청 (Parallel Requests)"
        Frontend->>Backend: GET /risk 요청
        activate Backend
        Backend->>YahooFinance: 시장 데이터 요청 (SPY, VIX 등)
        YahooFinance-->>Backend: 시장 데이터 응답
        Backend->>GeminiAPI: 리스크 데이터 분석 요청
        GeminiAPI-->>Backend: 리스크 분석 결과 응답
        Backend-->>Frontend: 리스크 데이터 응답
        deactivate Backend
    and
        Frontend->>Backend: GET /sector 요청
        activate Backend
        Backend->>YahooFinance: 섹터 주식 데이터 요청
        YahooFinance-->>Backend: 주식 데이터 응답
        Backend->>GeminiAPI: 섹터 데이터 분석 요청
        GeminiAPI-->>Backend: 섹터 인사이트 응답
        Backend-->>Frontend: 섹터 데이터 응답
        deactivate Backend
    and
        Frontend->>Backend: GET /stock/{ticker} 요청
        activate Backend
        Backend->>YahooFinance: 개별 주식 데이터 요청
        YahooFinance-->>Backend: 주식 데이터 응답
        Backend->>GeminiAPI: 차트 패턴 분석 요청
        GeminiAPI-->>Backend: 차트 분석 결과 응답
        Backend-->>Frontend: 개별 주식 데이터 응답
        deactivate Backend
    end

    Frontend-->>User: 전체 대시보드 정보 표시
```

### 다이어그램 설명

1.  **사용자**가 애플리케이션을 실행하면 **프론트엔드**는 기본 UI를 먼저 보여줍니다.
2.  그 후, 프론트엔드는 `Risk`, `Sector`, `Stock` 데이터를 얻기 위해 백엔드 API에 **동시에 (병렬적으로)** 데이터 요청을 보냅니다.
3.  **백엔드**는 각 요청에 따라 필요한 외부 API(Yahoo Finance, Gemini)를 호출하여 데이터를 가져오고 가공/분석합니다.
4.  백엔드는 처리가 완료된 데이터를 각각 프론트엔드로 응답합니다.
5.  모든 데이터가 수신되면 **프론트엔드**는 화면의 모든 정보를 최종적으로 표시하여 사용자에게 완전한 대시보드를 보여줍니다.


## Ambient 화면 음성 인식 및 홈 화면 전환

```mermaid
sequenceDiagram
    actor User
    participant A as Ambient.tsx
    participant B as Browser Media API
    participant C as Backend API (/wakeup)
    participant R as React Router
    participant H as Home.tsx

    User->>A: 마이크 버튼 클릭 또는 스페이스바 누름
    A->>B: 마이크 접근 및 녹음 요청 (getUserMedia, MediaRecorder)
    B-->>A: 오디오 스트림 제공
    A->>A: 녹음 시작 (isRecording = true)

    User->>A: (음성으로 "가디언즈" 말함)

    User->>A: 마이크 버튼 클릭 또는 스페이스바 누름
    A->>B: 녹음 중지
    B-->>A: 녹음된 오디오 데이터 (Blob) 반환
    A->>A: 오디오 처리 시작 (isProcessing = true)
    
    A->>C: 오디오 데이터(Base64) 전송

    Note over A,C: 데모 모드: 백엔드 응답과 관계없이 진행

    C-->>A: (응답)
    A->>A: 인식된 텍스트를 "가디언즈"로 강제 설정
    A->>A: 1.5초 타이머 시작

    loop 1.5초 후
        A->>R: 홈('/')으로 화면 전환 요청 (navigate)
        Note right of A: 'voiceIntent' 데이터를 state에 담아 전달
    end

    R->>A: Ambient.tsx 언마운트
    R->>H: Home.tsx 마운트 및 'voiceIntent' 데이터 전달
    H->>User: 홈 화면 표시

```

### 다이어그램 설명

1.  **사용자**가 Ambient 화면에서 마이크 버튼을 클릭하거나 스페이스바를 눌러 음성 인식을 시작합니다.
2.  **Ambient.tsx** 컴포넌트는 브라우저의 Media API를 통해 사용자의 음성을 녹음합니다.
3.  녹음이 완료되면, 음성 데이터는 백엔드 API로 전송되지만, **데모 모드**에서는 백엔드 응답과 관계없이 인식된 텍스트가 "가디언즈"로 고정됩니다.
4.  잠시 후, **React Router**를 통해 홈 화면으로 자동 전환되며, 이때 음성 인식과 관련된 데이터(`voiceIntent`)가 **Home.tsx** 컴포넌트로 전달됩니다.
5.  **Home.tsx** 컴포넌트는 전달받은 데이터를 사용하여 관련 정보를 화면에 표시할 수 있습니다.
