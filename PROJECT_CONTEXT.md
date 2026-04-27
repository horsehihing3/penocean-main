# PROJECT_CONTEXT.md
팬오션 안전보건 DX 포털 — 세션 컨텍스트

> **Claude에게:** 이 파일은 CLAUDE.md에서 자동 로드됩니다. 새 세션에서 "다음 작업 확인해줘"만 입력하면 바로 이어받을 수 있습니다.
> 완료 항목이 10개 이상 쌓이면 `docs/ARCHIVE.md`로 이동하고 이 파일에서는 삭제하세요.

---

## ⚡ 다음 세션 작업 (우선순위 순)

> 항목은 작업 진행에 따라 직접 업데이트하세요.

### 🔴 최우선 — 다음 세션 시작 시 진행
- [ ] **파일 업로드/다운로드 실제 동작 확인** — `./uploads` 경로, `FileController` 엔드포인트, 프론트 연동 여부
- [ ] **이메일 발송 연결 확인** — Office365 SMTP 환경변수 설정 여부 및 실제 발송 테스트

### 🟡 다음 작업
- [ ] **해상직원 사건사고 프론트 페이지 구현** — 백엔드 SeaCrewIncidentController 존재, 프론트 미구현
- [ ] **PPT vs 현재 메뉴 구조 불일치 정리** — `contractor/improvements`, `contractor/accident` 위치, `daily-safety-log`, `audit-inspection` 노출 여부 결정 (사용자 확인 필요)
- [ ] **안전수칙·보건 HTML → 실제 DB 연동** — safety_rules.html / health_checkup_compare.html 현재 정적 HTML, 추후 API 연동 필요
- [ ] **개선요청 이력·산업재해 백엔드 companyId 필터 확인** — CONTRACTOR가 다른 업체 데이터 조회 불가한지 검증
- [ ] **사업장 메뉴 CONTRACT_DEPT 접근 범위 결정** — 출입신청 목록 조회 허용 여부 기획 확인 필요


---

## 📊 PPT 기준 전체 구현 현황 (2026-04-23, git clone 초기 상태)

> 아래는 파일 구조 분석 기준 추정치입니다. 실제 동작 검증 후 갱신 필요.

| 카테고리 | 관련 파일 | 추정 상태 |
|---------|-----------|----------|
| 인증 (로그인·회원가입·JWT) | AuthController, AuthContext | ✅ 스캐폴딩 완료 |
| 가입 승인 플로우 | ApprovalController, ApprovalPage | ✅ 스캐폴딩 완료 |
| 소개 (방침·목표·인증) | introduction/ | ✅ 스캐폴딩 완료 |
| 선박 출입신청 CRUD | AccessRequestController, vessel/access-request | ✅ 스캐폴딩 완료 |
| 선박 출입 방문허가서 | VisitPermitController, vessel/visit-permit | ✅ 스캐폴딩 완료 |
| 근로자 의견조회 | WorkerVoiceController, vessel/worker-voice | ✅ 스캐폴딩 완료 |
| 절차서 (출입·위험성평가) | vessel/procedure/* | ✅ 스캐폴딩 완료 |
| 협력업체 평가 CRUD | EvaluationController, contractor/evaluation | ✅ 스캐폴딩 완료 |
| 평가 개선요청 이력 | EvaluationImprovementController, contractor/improvements | ✅ 스캐폴딩 완료 |
| 산업재해 | IndustrialAccidentController, contractor/accident | ✅ 스캐폴딩 완료 |
| 공지사항 | NoticeController, notice/board | ✅ 스캐폴딩 완료 |
| 서식함 | FormTemplateController, notice/forms | ✅ 스캐폴딩 완료 |
| 보건 (검진·추이) | HealthCheckupController, health/ | ✅ 스캐폴딩 완료 |
| 안전보건실적 (육상) | SafetyPerformanceLandController, admin/safety-performance/land | ✅ 스캐폴딩 완료 |
| 안전보건실적 (해상) | SafetyPerformanceSeaController, admin/safety-performance/sea | ✅ 스캐폴딩 완료 |
| 해상직원 사건사고 | SeaCrewIncidentController | ✅ 스캐폴딩 완료 |
| 일일안전일지 | DailySafetyLogController, admin/daily-safety-log | ✅ 스캐폴딩 완료 |
| 안전수칙 관리 | SafetyRuleController, admin/safety-rule | ✅ 스캐폴딩 완료 |
| 감사·점검 | AuditInspectionController, admin/audit-inspection | ✅ 스캐폴딩 완료 |
| 업체 관리 | CompanyAdminController, admin/company | ✅ 스캐폴딩 완료 |
| 코드 마스터 관리 | CodeMasterController, admin/code-masters | ✅ 스캐폴딩 완료 |
| 평가 항목 관리 | EvaluationItemController, admin/eval-item | ✅ 스캐폴딩 완료 |
| 대시보드 | DashboardController, Dashboard.tsx | ✅ 스캐폴딩 완료 |
| SOM 연동 | SomLookupController | ⚠ 백엔드만 존재, 프론트 미확인 |
| 엑셀 업로드 (근로자 일괄) | WorkerExcelService, WorkerBulkUploadRequest | ⚠ 서비스만 존재, UI 미확인 |

**전체 완료율: 스캐폴딩 ~100%, 실제 동작 검증 미완 (2026-04-23 현재)**

---

## ✅ 완료된 작업

> 항목이 10개 이상 쌓이면 `docs/ARCHIVE.md`로 이동 후 여기서 삭제
> 이전 완료 항목(2026-04-23 ~ 04-25)은 `docs/ARCHIVE.md` 참조

### 2026-04-27
- [x] **관리자 사이드바 보건파트 메뉴명 수정** — "보건파트 — 임직원 건강검진 사후관리" → "보건파트" (`ko.json`)
- [x] **CONTRACTOR 역할 메뉴 격리** — 사이드바에서 "협력업체 안전보건(계약부서용)" 숨김 + `contractor/*` 라우트 전체 RoleRoute 가드 추가 (URL 직접 접근 차단)
- [x] **미사용 health 페이지 제거** — `/health/checkup`, `/health/trend` 라우트·페이지·API·타입 파일 삭제 (다른 기능 영향 없음 확인)
- [x] **공지사항 대상역할 기능 제거** — `targetRoles` 필드 프론트/백엔드 전체 제거, 모든 역할에 공통 노출, 작성 권한 ADMIN 전용으로 변경
- [x] **공지사항 저장 오류 수정** — `expiresAt` 타입 불일치(`LocalDateTime` → `LocalDate`) 수정, 서비스에서 `LocalDateTime` 변환
- [x] **공지 조회수 사용자당 1회 제한** — `tb_notice_view` 테이블 생성(V21 Flyway), 사용자·공지 조합 중복 방지
- [x] **공지 조회수 실시간 반영** — 상세 조회 시 목록 캐시 즉시 업데이트 (새로고침 불필요), 백엔드 응답에도 증가된 값 반영
- [x] **Flyway 활성화** — `baseline-version: 20` 설정으로 기존 스키마 건너뛰고 V21부터 자동 적용

---

## 🐛 알려진 에러 & 해결책

| 에러 | 원인 | 해결 |
|------|------|------|
| SQL Server null 파라미터 오류 | MyBatis가 null을 VARBINARY(0)으로 전송 | `application.yml` `jdbc-type-for-null: NULL` 설정 (이미 적용됨) |
| JDBC DB 연결 실패 (HikariPool) | SQL Server Express TCP/IP 비활성화 + Named Instance 접속 시 Browser 서비스 필요 | SQL Config Manager에서 TCP/IP 활성화, 포트 1433 고정. DB_URL을 `localhost\SQLEXPRESS` → `localhost:1433` 변경 |
| admin 로그인 실패 (Bad credentials) | V3 시드 bcrypt 해시가 `password123`과 불일치 | DB UPDATE로 올바른 해시 적용, V3 SQL 파일도 수정 완료 |
| gradle-wrapper.jar 없음 | git clone 시 jar 파일 누락 | GitHub에서 직접 다운로드: `Invoke-WebRequest` 사용 |

---

## ⚠️ 결정 보류 / 미확인 사항

- **Flyway 활성화** — ✅ `enabled: true`, `baseline-version: 20` 적용 완료 (V21 자동 마이그레이션 확인)
- **Microsoft Graph vs SMTP** — 이메일 발송 방식 중 실제 사용할 것 결정 필요 (Azure 앱 등록 여부 확인)
- **SOM 연동 범위** — `SomLookupController` 존재하나 외부 SOM 시스템 접근 방식 미확인
- **파일 저장소** — 현재 로컬 디스크(`./uploads`), 향후 Azure Blob / S3 전환 여부 미결

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
DB_URL          # jdbc:sqlserver://localhost:1433;databaseName=PANOCEAN_EHS;...
DB_USERNAME     # DB 계정
DB_PASSWORD     # DB 비밀번호
JWT_SECRET      # 32자 이상 랜덤 문자열
MAIL_HOST       # smtp.office365.com
MAIL_PORT       # 587
MAIL_USERNAME   # 발신 이메일
MAIL_PASSWORD   # 이메일 비밀번호
AZURE_CLIENT_ID     # Microsoft Graph 앱 ID (미사용 시 공란)
AZURE_CLIENT_SECRET # Microsoft Graph 시크릿
AZURE_TENANT_ID     # Azure 테넌트 ID
APP_PORTAL_URL      # http://localhost:4000
APP_TEAM_EMAILS     # 팀메일 주소 (쉼표 구분)
FILE_UPLOAD_DIR     # 파일 업로드 경로 (기본: ./uploads)
```

### 명령어 규칙
- 파일 탐색·수정·git → **bash** 문법
- Windows 환경변수 설정 → **PowerShell** 문법 (`&&` 대신 `;` 사용)

---

## 프론트엔드 라우트 현황

| 역할 | 경로 | 상태 |
|------|------|------|
| 공통 | `/login` | ✅ |
| 공통 | `/register` | ✅ |
| 공통 | `/` (Dashboard) | ✅ |
| 공통 | `/profile` | ✅ |
| 소개 | `/introduction/policy` | ✅ |
| 소개 | `/introduction/goal` | ✅ |
| 소개 | `/introduction/certificate` | ✅ |
| vessel | `/vessel/procedure/access` | ✅ |
| vessel | `/vessel/procedure/risk-assessment` | ✅ |
| vessel | `/vessel/access-request` (목록·생성·상세·수정) | ✅ |
| vessel | `/vessel/visit-permit` | ✅ |
| vessel | `/vessel/worker-voice` | ✅ |
| contractor | `/contractor/procedure` | ✅ |
| contractor | `/contractor/evaluation` (목록·생성) | ✅ |
| contractor | `/contractor/improvements` | ✅ |
| contractor | `/contractor/accident` | ✅ |
| notice | `/notice/board` | ✅ |
| notice | `/notice/forms` | ✅ |
| health | `/health/checkup` | ✅ |
| health | `/health/trend` | ✅ |
| admin | `/admin/approval` | ✅ |
| admin | `/admin/daily-safety-log` | ✅ |
| admin | `/admin/company` | ✅ |
| admin | `/admin/code-masters` | ✅ |
| admin | `/admin/eval-item` | ✅ |
| admin | `/admin/safety-rule` | ✅ |
| admin | `/admin/audit-inspection` | ✅ |
| admin | `/admin/safety-performance/land` | ✅ |
| admin | `/admin/safety-performance/sea` | ✅ |

---

## 세션 종료 체크리스트

- [ ] 완료 항목 `[x]` 처리 후 `✅ 완료된 작업` 섹션으로 이동
- [ ] 신규 에러·해결책 `🐛 에러 & 해결책` 테이블에 추가
- [ ] 새 API / 라우트 현황 테이블 갱신
- [ ] 완료 항목 10개 이상이면 → `docs/ARCHIVE.md` 이동 후 삭제
- [ ] `git add . && git commit -m "..." && git push origin {브랜치}"`
- [ ] `/clear`
