# PROJECT_CONTEXT.md
팬오션 안전보건 DX 포털 — 세션 컨텍스트

> **Claude에게:** 이 파일은 CLAUDE.md에서 자동 로드됩니다. 새 세션에서 "다음 작업 확인해줘"만 입력하면 바로 이어받을 수 있습니다.
> 완료 항목이 10개 이상 쌓이면 `docs/ARCHIVE.md`로 이동하고 이 파일에서는 삭제하세요.

---

## ⚡ 다음 세션 작업 (우선순위 순)

### 🟡 다음 작업
- [ ] **보건파트 NHIS 파서 실제 PDF 테스트** — NhisHealthCheckupParser.java 동작 검증 (파일 업로드 → 수치 파싱 확인). 이름/검진일 파싱 정확도 검증 후 정규식 보완 필요
- [ ] **보건파트 이미지 파서 활성화** — ANTHROPIC_API_KEY 발급 후 `application-local.yml`에 설정, `이미지(JPG) 선택` 버튼 실제 동작 전환 (현재 준비중 메시지)
- [ ] **보건파트 추가 병원 PDF 파서** — 우리원/하나로/중앙/강북삼성 PDF 양식 확보 시 HealthCheckupParser 구현체 추가
- [ ] **해상직원 사건사고 프론트 페이지 구현** — 백엔드 SeaCrewIncidentController 존재, 프론트 미구현
- [ ] **안전보건실적(해상) 화면 고객 의견 수렴 후 재개발** — SafetyPerformanceSeaPage PPT 기준 재설계 완료 상태로 대기. `/admin/sea-budget` 현재 준비중 화면, 고객 확인 후 전환
- [ ] **이메일 팬오션 SMTP 전환** — 현재 Gmail App Password 임시 사용. 팬오션 IT팀에서 SMTP 서버/계정 정보 받은 후 `application-local.yml`만 수정
- [ ] **PPT vs 현재 메뉴 구조 불일치 정리** — `daily-safety-log`, `audit-inspection` 노출 여부 결정 (사용자 확인 필요)
- [ ] **개선요청 이력·산업재해 백엔드 companyId 필터 확인** — CONTRACTOR가 다른 업체 데이터 조회 불가한지 검증
- [ ] **사업장 메뉴 CONTRACT_DEPT 접근 범위 결정** — 출입신청 목록 조회 허용 여부 기획 확인 필요
- [ ] **출입신청 첨부파일 다운로드 원본 파일명** — 서식함과 동일하게 `/access-requests/{id}/attachments/{attId}/download` 엔드포인트 추가 검토

---

## 📊 PPT 기준 전체 구현 현황

| 카테고리 | 관련 파일 | 상태 |
|---------|-----------|------|
| 인증 (로그인·회원가입·JWT) | AuthController, AuthContext | ✅ |
| 가입 승인 플로우 | ApprovalController, ApprovalPage | ✅ |
| 소개 (방침·목표·인증) | introduction/ | ✅ |
| 선박 출입신청 CRUD | AccessRequestController, vessel/access-request | ✅ |
| 선박 출입 방문허가서 | VisitPermitController, vessel/visit-permit | ✅ |
| 근로자 의견조회 | WorkerVoiceController, vessel/worker-voice | ✅ |
| 절차서 (출입·위험성평가) | vessel/procedure/* | ✅ |
| 협력업체 평가 CRUD | EvaluationController, contractor/evaluation | ✅ |
| 평가 개선요청 이력 | EvaluationImprovementController, contractor/improvements | ✅ |
| 산업재해 | IndustrialAccidentController, contractor/accident | ✅ |
| 공지사항 | NoticeController, notice/board | ✅ |
| 서식함 | FormTemplateController, notice/forms | ✅ 실 동작 |
| 보건파트 (PDF업로드·파싱·3개년비교·편집) | HealthCheckupPdfController, AdminHealthPage | ✅ 실 동작 |
| 안전보건실적 (육상) | SafetyPerformanceLandController | ✅ |
| 안전보건실적 (해상) | SafetyPerformanceSeaController | ✅ API, 화면 준비중 |
| 해상직원 질병/부상 통계 | SeaCrewStatsPage, yearly-stats API | ✅ 실 동작 |
| 해상직원 사건사고 | SeaCrewIncidentController | ⚠ 백엔드만, 프론트 미구현 |
| 일일안전일지 | DailySafetyLogController | ✅ |
| 안전수칙 관리 | SafetyRuleController | ✅ |
| 감사·점검 | AuditInspectionController | ✅ |
| 업체 관리 | CompanyAdminController | ✅ |
| 코드 마스터 관리 | CodeMasterController | ✅ |
| 평가 항목 관리 | EvaluationItemController | ✅ |
| 대시보드 | DashboardController, Dashboard.tsx | ✅ |
| QR 안전교육 | SafetyQrController, QrEducationPage | ✅ 실 동작 |
| SOM 연동 | SomLookupController | ⚠ 백엔드만 |

---

## ✅ 완료된 작업

> 이전 완료 항목 전부 → `docs/ARCHIVE.md` 참조

### [2026-04-30] UI 전반 개선
- [x] **사이드바 메뉴 글자 크기 통일** — 1단계 16px(1rem), 2·3단계 14px(0.875rem)
- [x] **사이드바 색상 개선** — 선택 메뉴 배경 `#1d6fcf`(밝은 파랑), 비선택 글자 `#cbd5e1`(밝은 회색)
- [x] **출입신청 → 사업장 출입신청** — 메뉴명·화면 타이틀·ko.json pageTitle 모두 수정
- [x] **작업유형 필수→선택 전환** — zod optional, UI required 제거, DB `work_type` NULL 허용(ALTER TABLE), Mapper jdbcType=NVARCHAR 추가
- [x] **사업장 출입절차 화면 전면 재작성** — PPT 슬라이드 10 기준 플로우차트(7단계), 반응형 flex-wrap, 글자 1.3배, 절차서 등재 버튼(ADMIN 전용)
- [x] **전체 페이지 좌상단 여백 통일** — maxWidth/mx:auto 제거, 외부 Box p:3→flex gap:2, 타이틀 mb 제거 (6개 페이지)

### [2026-04-30] 절차서·메뉴·그리드 개선
- [x] **절차서 등재·다운로드 구현** — `tb_procedure_doc` 테이블(V26 Flyway), 백엔드 API(`/procedure-docs`), 프론트 실제 업로드·다운로드·삭제 (ADMIN 전용 등재/삭제, 전체 다운로드)
- [x] **위험성평가 절차 메뉴 제거** — 사이드바·App.tsx 라우트 삭제
- [x] **출입절차 절차서 카드 UI 정리** — 파일명 숨김, 중복 다운로드 아이콘 제거, 버튼 한 행 배치
- [x] **방문허가서 상세 팝업 출입신청 통합** — `VisitPermitDetailDialog` 컴포넌트 분리, 출입신청 상세 "방문허가서 보기" 클릭 시 팝업 표시
- [x] **방문허가서 메뉴·목록 제거** — 사이드바·App.tsx route·import 삭제
- [x] **반기평가 메뉴 추가** — 사업장 안전보건 > 사업장 출입신청 아래, 클릭 시 준비중 화면
- [x] **DataGrid 가로·세로 구획선** — 테마 전역 설정(`showCellVerticalBorder`, `showColumnVerticalBorder`, `borderRight/Bottom`) 10개 페이지 일괄 적용

---

## 🐛 알려진 에러 & 해결책

| 에러 | 원인 | 해결 |
|------|------|------|
| SQL Server null 파라미터 오류 | MyBatis가 null을 VARBINARY(0)으로 전송 | `application.yml` `jdbc-type-for-null: NULL` 설정 (이미 적용됨) |
| JDBC DB 연결 실패 (HikariPool) | SQL Server TCP/IP 비활성화 | SQL Config Manager에서 TCP/IP 활성화, 포트 1433 고정 |
| admin 로그인 실패 (Bad credentials) | V3 시드 bcrypt 해시 불일치 | DB UPDATE로 올바른 해시 적용 완료 |
| gradle-wrapper.jar 없음 | git clone 시 jar 파일 누락 | GitHub에서 직접 다운로드: `Invoke-WebRequest` 사용 |
| 백엔드 Mapper XML 변경 후 반영 안됨 | 캐시된 build/ 사용 | `./gradlew clean bootRun` 으로 강제 재빌드 |
| tb_form_template.code NOT NULL 오류 | code 필드 제거 후 DB 컬럼 제약 잔존 | `DROP CONSTRAINT UQ_tb_form_template_code` 후 `ALTER COLUMN code NULL` |
| MyBatis foreach null 파라미터 오류 | foreach 내 null은 `jdbc-type-for-null` 전역 설정 미적용 | 각 파라미터에 직접 `jdbcType=DATE/TIMESTAMP/NVARCHAR` 명시 |
| ngrok MSIX 버전 panic | `disabled updater should never run` 런타임 패닉 | `C:\Users\user\Downloads\ngrok-v3-stable-windows-amd64\ngrok.exe` 사용 |
| SafetyPerformanceSea 저장 시 varbinary→datetime2 변환 오류 | `posSmSyncedAt` null 전달 시 VARBINARY(0)으로 전송됨 | `SafetyPerformanceSeaMapper.xml` insert/update에 `jdbcType=TIMESTAMP/NVARCHAR/BIGINT` 명시 |

---

## ⚠️ 결정 보류 / 미확인 사항

- **이메일 SMTP 전환** — 현재 Gmail(horsehihing3@gmail.com) 임시 사용. 팬오션 IT팀 SMTP 정보 확보 후 `application-local.yml`만 수정하면 됨
- **SOM 연동 범위** — 외부 SOM 시스템 접근 방식 미확인
- **파일 저장소** — 현재 로컬 디스크(`./uploads`), 향후 Azure Blob / S3 전환 여부 미결
- **ANTHROPIC_API_KEY** — 발급 후 `application-local.yml`에 설정하면 이미지 파서 즉시 활성화
- **tb_safety_qr_record.gender 컬럼** — 코드에서 제거됨, DB 컬럼은 nullable로 잔존. 필요시 `ALTER TABLE tb_safety_qr_record DROP COLUMN gender`
- **tb_form_template.code 컬럼** — nullable로 변경됨, 완전 삭제 시 `ALTER TABLE tb_form_template DROP COLUMN code`
- **안전보건실적(해상) 화면** — SafetyPerformanceSeaPage PPT 기준 재설계 대기, `/admin/sea-budget` 현재 준비중

---

## 환경 & 스택

| 항목 | 내용 |
|------|------|
| OS / IDE | Windows · VS Code + Claude Code CLI |
| 프로젝트 경로 | `C:\claude\penocean-main` (Git Bash: `/c/claude/penocean-main`) |
| Backend 포트 | 4001 (context-path: `/api`) |
| Frontend 포트 | 4000 |
| DB | SQL Server `211.171.152.242:51084` / DB: `penocean` (회사 원격 DB) |
| 빌드 | Gradle (`./gradlew bootRun`) |

### 환경변수 목록 (application.yml 기준)

```
DB_URL              # jdbc:sqlserver://...
DB_USERNAME         # DB 계정
DB_PASSWORD         # DB 비밀번호
JWT_SECRET          # 32자 이상 랜덤 문자열
MAIL_HOST           # smtp.gmail.com (임시) / 향후 팬오션 SMTP
MAIL_PORT           # 587
MAIL_USERNAME       # 발신 이메일 (현재 horsehihing3@gmail.com)
MAIL_PASSWORD       # Gmail App Password (현재 적용됨)
AZURE_CLIENT_ID     # Microsoft Graph 앱 ID (미사용 시 공란)
AZURE_CLIENT_SECRET # Microsoft Graph 시크릿
AZURE_TENANT_ID     # Azure 테넌트 ID
APP_PORTAL_URL      # http://localhost:4000
APP_TEAM_EMAILS     # 팀메일 주소 (쉼표 구분)
FILE_UPLOAD_DIR     # 파일 업로드 경로 (기본: ./uploads)
ANTHROPIC_API_KEY   # Claude Vision API 키 — 이미지 파서 활성화 시 필요
```

### 명령어 규칙
- 파일 탐색·수정·git → **bash** 문법
- Windows 환경변수 설정 → **PowerShell** 문법 (`&&` 대신 `;` 사용)

---

## 프론트엔드 라우트 현황

| 역할 | 경로 | 상태 |
|------|------|------|
| 공통 | `/login` | ✅ |
| 공통 | `/register` | ✅ (중복확인·우편번호 검색 포함) |
| 공통 | `/` (Dashboard) | ✅ |
| 공통 | `/profile` | ✅ |
| 공통 | `/qr/:token` | ✅ |
| 소개 | `/introduction/policy` | ✅ |
| 소개 | `/introduction/goal` | ✅ |
| 소개 | `/introduction/certificate` | ✅ |
| vessel | `/vessel/procedure/access` | ✅ |
| vessel | `/vessel/access-request` (목록·생성·상세·수정) | ✅ |
| vessel | `/vessel/worker-voice` | ✅ |
| contractor | `/contractor/half-year-eval` | ⏳ 준비중 화면 |
| contractor | `/contractor/procedure` | ✅ |
| contractor | `/contractor/evaluation` (목록·생성) | ✅ |
| contractor | `/contractor/improvements` | ✅ |
| contractor | `/contractor/accident` | ✅ |
| notice | `/notice/board` | ✅ |
| notice | `/notice/forms` | ✅ |
| admin | `/admin/approval` | ✅ |
| admin | `/admin/health` | ✅ 실 동작 |
| admin | `/admin/qr-education` | ✅ |
| admin | `/admin/daily-safety-log` | ✅ |
| admin | `/admin/company` | ✅ |
| admin | `/admin/code-masters` | ✅ |
| admin | `/admin/eval-item` | ✅ |
| admin | `/admin/safety-rule` | ✅ |
| admin | `/admin/audit-inspection` | ✅ |
| admin | `/admin/safety-performance/land` | ✅ |
| admin | `/admin/safety-performance/sea` | ✅ (해상 안전보건실적 월간 편집) |
| admin | `/admin/sea-budget` | ⏳ 준비중 화면 |
| admin | `/admin/sea-crew-stats` | ✅ 실 동작 (해상직원 질병/부상 통계) |

---

## 세션 종료 체크리스트

- [ ] 완료 항목 `[x]` 처리 후 `✅ 완료된 작업` 섹션으로 이동
- [ ] 신규 에러·해결책 `🐛 에러 & 해결책` 테이블에 추가
- [ ] 새 API / 라우트 현황 테이블 갱신
- [ ] 완료 항목 10개 이상이면 → `docs/ARCHIVE.md` 이동 후 삭제
- [ ] `git add . && git commit -m "..." && git push origin {브랜치}`
- [ ] `/clear`
