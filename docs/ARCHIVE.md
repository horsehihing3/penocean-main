# ARCHIVE.md
팬오션 안전보건 DX 포털 — 완료 작업 아카이브

> PROJECT_CONTEXT.md 완료 항목이 10개 초과 시 이 파일로 이동합니다.

---

## 2026-04-30 (UI·절차서·메뉴·그리드 개선 세션)

- **사이드바 메뉴 글자 크기 통일** — 1단계 16px(1rem), 2·3단계 14px(0.875rem)
- **사이드바 색상 개선** — 선택 메뉴 배경 `#1d6fcf`(밝은 파랑), 비선택 글자 `#cbd5e1`(밝은 회색)
- **출입신청 → 사업장 출입신청** — 메뉴명·화면 타이틀·ko.json pageTitle 모두 수정
- **작업유형 필수→선택 전환** — zod optional, UI required 제거, DB `work_type` NULL 허용(ALTER TABLE), Mapper jdbcType=NVARCHAR 추가
- **사업장 출입절차 화면 전면 재작성** — PPT 슬라이드 10 기준 플로우차트(7단계), 반응형 flex-wrap, 글자 1.3배, 절차서 등재 버튼(ADMIN 전용)
- **전체 페이지 좌상단 여백 통일** — maxWidth/mx:auto 제거, 외부 Box p:3→flex gap:2, 타이틀 mb 제거 (6개 페이지)
- **절차서 등재·다운로드 구현** — `tb_procedure_doc` 테이블(V26 Flyway), 백엔드 API(`/procedure-docs`), 프론트 실제 업로드·다운로드·삭제 (ADMIN 전용 등재/삭제, 전체 다운로드)
- **위험성평가 절차 메뉴 제거** — 사이드바·App.tsx 라우트 삭제
- **출입절차 절차서 카드 UI 정리** — 파일명 숨김, 중복 다운로드 아이콘 제거, 버튼 한 행 배치
- **방문허가서 상세 팝업 출입신청 통합** — `VisitPermitDetailDialog` 컴포넌트 분리, 출입신청 상세 "방문허가서 보기" 클릭 시 팝업 표시
- **방문허가서 메뉴·목록 제거** — 사이드바·App.tsx route·import 삭제
- **반기평가 메뉴 추가** — 사업장 안전보건 > 사업장 출입신청 아래, 클릭 시 준비중 화면
- **DataGrid 가로·세로 구획선** — 테마 전역 설정(`showCellVerticalBorder`, `showColumnVerticalBorder`, `borderRight/Bottom`) 10개 페이지 일괄 적용

### 아카이브 에러 (재발 가능성 낮음)

| 에러 | 원인 | 해결 |
|------|------|------|
| admin 로그인 실패 (Bad credentials) | V3 시드 bcrypt 해시 불일치 | DB UPDATE로 올바른 해시 적용 완료 |
| gradle-wrapper.jar 없음 | git clone 시 jar 파일 누락 | GitHub에서 직접 다운로드: `Invoke-WebRequest` 사용 |
| tb_form_template.code NOT NULL 오류 | code 필드 제거 후 DB 컬럼 제약 잔존 | `DROP CONSTRAINT UQ_tb_form_template_code` 후 `ALTER COLUMN code NULL` |
| ngrok MSIX 버전 panic | `disabled updater should never run` 런타임 패닉 | `C:\Users\user\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe` 사용 |

---

## 2026-04-30 (이메일·회원가입 기능·해상 통계 세션)

- **Gmail SMTP 이메일 발송 연결** — `application.yml` Gmail 설정, `application-local.yml` App Password 적용, `NotificationService.notifyRegistrationRequestToAdmins`에 `notifyTeam()` 추가로 관리자 이메일 알림 실 동작
- **회원가입 아이디 중복확인** — `GET /auth/check-username`, `AuthController·AuthService·UserMapper` 연동, 프론트 중복확인 버튼 + ✅/❌ 아이콘
- **회원가입 사업자번호 중복확인** — `GET /auth/check-business-number`, `CompanyMapper.findByBusinessNumber` 활용
- **회원가입 우편번호 검색** — Kakao Postcode API (`index.html` 스크립트 추가), 우편번호 자동 입력
- **해상직원 질병/부상 통계 실 API 연결** — `SeaCrewStatsPage` 하드코딩 제거, `GET /safety-performance/sea/yearly-stats?years=N` 신규 엔드포인트 구현, `SeaYearlyStatsResponse` DTO 추가
- **해상 안전보건실적 null 파라미터 오류 수정** — `SafetyPerformanceSeaMapper.xml` insert/update의 `posSmSyncedAt(TIMESTAMP)`, `excelUploadId/comment(NVARCHAR)`, `uploadedBy(BIGINT)` jdbcType 명시
- **해상 안전보건실적 화면 PPT 기준 재설계** — 선박 선택 + 연도 조회 + 12개월 인라인 편집 테이블 + 임시저장/최종제출 레이아웃 (현재는 `/admin/sea-budget` 준비중 화면 유지, 고객 의견 수렴 후 전환 예정)

---

## 2026-04-27 ~ 04-28 (보건파트 + QR + 공지사항 세션)

- **공지사항 대상역할 제거·저장 버그 수정·조회수 1회 제한·Flyway 활성화**
- **CONTRACTOR 역할 격리** — `contractor/*` RoleRoute 가드, 사이드바 숨김
- **미사용 health 페이지 제거** — `/health/checkup`, `/health/trend`
- **출입신청 수정 버그** — `WorkerItem.workerBirth` LocalDate→String(YYMMDD)
- **QR 안전교육 전면 개선** — Singleton QR, cascading 콤보, 이수증 출력, 로그인 화면 QR 표시
- **보건파트 PDF 업로드** — V25 마이그레이션, NhisHealthCheckupParser, HealthCheckupParserRegistry, AdminHealthPage 실 API 연동
- **보건파트 3개년 비교 팝업 재설계** — HTML 템플릿 스타일, 연도당 최신 1건 dedupe(`ROW_NUMBER OVER PARTITION BY checkup_year`)
- **병원 앱 스크린샷 파서** — `HospitalAppImageParser`(Claude Vision API), `POST /upload-images`, 이미지 버튼 준비중 처리
- **보건파트 수작업 편집** — 전체 필드 편집 다이얼로그, `updateAll` mapper·service, 카테고리 자동 재계산

---

## 2026-04-25 (관리자 UI 개선 세션)

- 회사 원격 DB(211.171.152.242:51084, penocean) 연결 전환 — Flyway 비활성화
- 가입신청 3건(ID 2,3,4) PENDING 상태로 DB 직접 수정
- SafetyRulePage: safety_rules.html iframe 방식으로 전면 교체
- AdminHealthPage: 행 클릭 시 health_checkup_compare.html iframe 팝업 표시
- CompanyManagePage: 첨부파일 컬럼 추가 및 샘플 이미지 미리보기 다이얼로그
- AdminAccessApprovalPage: Excel/인쇄/업체List다운로드/검색 버튼, 비고 컬럼, 안전보건서약서 추가, 개선요청 팝업
- AdminEvaluationReviewPage: PPT 기준 검색조건 2줄·버튼·테이블 정렬, 개선요청 팝업
- WebMvcConfig: /files/** 정적 파일 서빙 핸들러 추가
- public/: health_checkup_compare.html, safety_rules.html, sample-attachment.png 추가
- PPT vs 현재 구현 전면 비교 분석 — 메뉴 구조·화면 구성 차이 전체 도출
- AdminHealthPage 최초 생성 (임직원 건강검진 사후관리)
- 사이드바 공지사항 하위 보건파트 단일 메뉴 제거
- vessel/access-permit 중복 메뉴·라우트 제거 (visit-permit으로 통일)
- 절차서 PDF 다운로드 404 에러 → 준비중 다이얼로그로 수정
- .claudeignore 개선 / CLAUDE.md VS Code 세션 주의사항 추가
- PageRequest @Builder.Default 추가 / WebMvcConfig deprecated 경고 제거

---

## 2026-04-23 (초기 환경 구성)

- gradle-wrapper.jar 다운로드 및 백엔드 빌드 성공
- SQL Server 2025 Express 설치
- PANOCEAN_EHS DB 생성 (Korean_Wansung_CI_AS collation)
- SA 계정 활성화 및 비밀번호 설정 (`Panocean!2026`)
- SQL Server 혼합 인증 모드 활성화 + 서비스 재시작
- SQL Server Express TCP/IP 활성화 (포트 1433) + DB_URL 환경변수 수정
- 환경변수 설정 — `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` (Machine 레벨)
- Flyway 활성화 (V1~V17 마이그레이션 완료) + 인증 로그인 동작 검증
- V3 시드 bcrypt 해시 수정 (`password123` 올바른 해시로 교체)
- Git 초기화 및 본인 저장소 연결 — https://github.com/horsehihing3/penocean-main
- CLAUDE.md / PROJECT_CONTEXT.md / .claudeignore 최초 작성

## 2026-04-24 (PPT 기준 화면 재작성)

- V18 마이그레이션 — `tb_access_request`에 안전담당자 3개 컬럼 추가 (PPT 슬라이드 14)
- V19 마이그레이션 — 평가항목 14개→21개 전체 교체 (PPT 슬라이드 20)
- AccessRequestCreatePage PPT 슬라이드 14 기준 전면 재작성 (안전담당자·테이블형 작업자·첨부파일 UI)
- WorkerVoicePage / ApprovalPage / EvaluationCreatePage/DetailDialog PPT 기준 재작성
- GoalPage — safety-goal-2025.html iframe 교체
