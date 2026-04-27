# ARCHIVE.md
팬오션 안전보건 DX 포털 — 완료 작업 아카이브

> PROJECT_CONTEXT.md 완료 항목이 10개 초과 시 이 파일로 이동합니다.

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
