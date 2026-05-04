# PROJECT_CONTEXT.md
팬오션 안전보건 DX 포털 — 세션 컨텍스트

> **Claude에게:** 이 파일은 CLAUDE.md에서 자동 로드됩니다. 새 세션에서 "다음 작업 확인해줘"만 입력하면 바로 이어받을 수 있습니다.
> 완료 항목이 10개 이상 쌓이면 `docs/ARCHIVE.md`로 이동하고 이 파일에서는 삭제하세요.

---

## ⚡ 다음 세션 작업 (우선순위 순)

### 🟡 다음 작업
- [ ] **비로그인 업로드 링크 모바일 실 테스트** — /?upload=TOKEN 패턴으로 ngrok 인터스티셜 우회 수정됨, 모바일에서 링크 재생성 후 동작 최종 확인 필요
- [ ] **업체평가 반려→재제출 절차 실 사용 검증** — CONTRACT_DEPT 반려수정 재제출 → ADMIN 재검토 전체 플로우 현장 확인
- [ ] **보건파트 NHIS 파서 실제 PDF 테스트** — NhisHealthCheckupParser.java 동작 검증 (파일 업로드 → 수치 파싱 확인). 이름/검진일 파싱 정확도 검증 후 정규식 보완 필요
- [ ] **보건파트 이미지 파서 활성화** — ANTHROPIC_API_KEY 발급 후 `application-local.yml`에 설정, `이미지(JPG) 선택` 버튼 실제 동작 전환 (현재 준비중 메시지)
- [ ] **보건파트 추가 병원 PDF 파서** — 우리원/하나로/중앙/강북삼성 PDF 양식 확보 시 HealthCheckupParser 구현체 추가
- [ ] **해상직원 사건사고 프론트 페이지 구현** — 백엔드 SeaCrewIncidentController 존재, 프론트 미구현
- [ ] **이메일 팬오션 SMTP 전환** — 현재 Gmail App Password 임시 사용. 팬오션 IT팀에서 SMTP 서버/계정 정보 받은 후 `application-local.yml`만 수정
- [ ] **개선요청 이력·산업재해 백엔드 companyId 필터 확인** — CONTRACTOR가 다른 업체 데이터 조회 불가한지 검증

### ⛔ 착수 보류 — 외부 확인 필요
> 아래 항목은 고객/기획 확인 전 착수 시 롤백 위험 있음

- [ ] **안전보건실적(해상) 화면 고객 의견 수렴 후 재개발** — SafetyPerformanceSeaPage PPT 기준 재설계 완료 상태로 대기. `/admin/sea-budget` 현재 준비중 화면, 고객 확인 후 전환
- [ ] **PPT vs 현재 메뉴 구조 불일치 정리** — `daily-safety-log`, `audit-inspection` 노출 여부 결정 (사용자 확인 필요)
- [ ] **사업장 메뉴 CONTRACT_DEPT 접근 범위 결정** — 출입신청 목록 조회 허용 여부 기획 확인 필요

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

> 모든 완료 항목 → `docs/ARCHIVE.md` 참조

### [2026-05-04] 오늘 완료
- [x] **반려 재가입 무한루프 수정** — index.html redirect 스크립트에 `/register` 경로 guard 추가
- [x] **재가입 시 기타업종 미반영 수정** — `reapplyExistingUser()`에서 기존 company `industryOther` 업데이트, `CompanyMapper.xml` update에 `industry_other` 추가
- [x] **출입신청 신규작성 회사명·업종·안전담당자 자동채움** — `UserResponse`에 `companyName`·`industryName` 추가, `/auth/me` 응답에서 company JOIN, 프론트 defaultValues에 user 정보 적용
- [x] **출입신청 목록·방문허가 기타업종 표시** — `AccessRequestMapper.xml`, `VisitPermitMapper.xml`에 `COALESCE(ic.name, c.industry_other)` 적용
- [x] **사업장 출입신청 허가 UI 개선**
  - 테이블 헤더 "회사" → "업체명"
  - 서류 팝업 위험성평가 없음 체크 시 회색 "위험성평가 없음" 표시 (빨간 미제출 → 회색)
  - SUBMITTED 상태 "검토시작" 버튼 추가 (누락으로 상태 변경 불가했던 버그)
  - 검토완료/반려 시 검토중·개선요청 체크박스 숨김
- [x] **업체정보 팝업 필드 추가** — 사업자등록번호·기타업종·안전담당자 직책 (`AccessRequestDetailResponse` + SQL JOIN 추가)
- [x] **서류 열기/인쇄 JWT 인증 수정** — `href` 직접 링크 → `axiosInstance` blob fetch 후 새 탭 열기

---

## 🐛 알려진 에러 & 해결책

| 에러 | 원인 | 해결 |
|------|------|------|
| SQL Server null 파라미터 오류 | MyBatis가 null을 VARBINARY(0)으로 전송 | `application.yml` `jdbc-type-for-null: NULL` 설정 (이미 적용됨) |
| JDBC DB 연결 실패 (HikariPool) | SQL Server TCP/IP 비활성화 | SQL Config Manager에서 TCP/IP 활성화, 포트 1433 고정 |
| 백엔드 Mapper XML 변경 후 반영 안됨 | 캐시된 build/ 사용 | `./gradlew clean bootRun` 으로 강제 재빌드 |
| MyBatis foreach null 파라미터 오류 | foreach 내 null은 `jdbc-type-for-null` 전역 설정 미적용 | 각 파라미터에 직접 `jdbcType=DATE/TIMESTAMP/NVARCHAR` 명시 |
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
| admin | `/admin/access-approval` | ✅ (사업장 출입신청 허가) |

---

## 세션 종료 체크리스트

- [ ] 완료 항목 `[x]` 처리 후 `✅ 완료된 작업` 섹션으로 이동
- [ ] 신규 에러·해결책 `🐛 에러 & 해결책` 테이블에 추가
- [ ] 새 API / 라우트 현황 테이블 갱신
- [ ] 완료 항목 10개 이상이면 → `docs/ARCHIVE.md` 이동 후 삭제
- [ ] `git add . && git commit -m "..." && git push origin {브랜치}`
- [ ] `/clear`
