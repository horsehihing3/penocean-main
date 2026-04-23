# CLAUDE.md

> **이 파일은 불변 규칙만 담습니다. 100줄 이내를 목표로 유지합니다.**
> 세션 진행 상황 → `PROJECT_CONTEXT.md` / DB 문서 → `backend/docs/db/`

---

## 프로젝트 개요

팬오션 안전보건 DX 웹 포털 (선박·해상 중심).
협력업체의 선박 출입·평가·재해·안전보건실적을 통합 관리합니다.

| 항목 | 내용 |
|------|------|
| Backend | Java 17 + Spring Boot 3.2.2 + MyBatis / `http://localhost:4001/api` |
| Frontend | React 18 + Vite + TypeScript + MUI / `http://localhost:4000` |
| DB | Microsoft SQL Server 2019+ `localhost:1433` / DB명: `PANOCEAN_EHS` |
| ORM | MyBatis (XML Mapper) — JPA 아님 |
| 파일저장 | 로컬 디스크 `./uploads` (Apache POI · OpenPDF 활용) |
| 이메일 | Spring Mail + Office365 SMTP (또는 Microsoft Graph) |
| 역할 | `CONTRACTOR`(협력업체) / `ADMIN`(안전경영팀) / `CONTRACT_DEPT`(계약부서) |

---

## 명령어

```bash
# Backend (Gradle)
cd backend && ./gradlew bootRun          # port 4001
./gradlew build                          # 빌드·테스트
./gradlew build -x test                  # 테스트 제외 빌드

# Frontend
cd frontend && npm run dev               # port 4000
npm run build
```

---

## 아키텍처

```
Controller → Service → Mapper(MyBatis XML) → SQL Server

frontend/src/pages/
  vessel/        # 협력업체·선원 — 출입신청·방문허가·근로자의견
  contractor/    # 계약부서 — 평가·개선이력·산업재해
  admin/         # 관리자 — 승인·안전실적·보건·코드관리 등
  health/        # 보건파트
  notice/        # 공지·서식함
  introduction/  # 소개 (방침·목표·인증)
frontend/src/context/AuthContext.tsx     # 인증 상태 (React Context)
frontend/src/api/axiosInstance.ts        # axios 공통 인스턴스
```

- API 응답: `ApiResponse<T>` 공통 래퍼 (`common/ApiResponse.java`)
- 예외: `GlobalExceptionHandler` + `BadRequestException` / `ResourceNotFoundException` / `UnauthorizedException`
- 인증: JWT Access Token 24시간 / Refresh Token 7일 (Spring Security + jjwt 0.12.3)
- DB 마이그레이션: Flyway (현재 `enabled: false` — 수동 DDL 적용 중)

---

## 절대 규칙

- DB 스키마 변경은 `backend/docs/db/` 문서와 반드시 동기화
- `.env` / 환경변수 파일 커밋 금지 / 시크릿 하드코딩 금지
- MyBatis Mapper XML 수정 후 반드시 서버 재시작 (핫리로드 미지원)
- 기존 `ApiResponse` 구조 무단 변경 금지 (프론트 호환 깨짐)
- SQL Server 특성: `null` 파라미터는 `jdbc-type-for-null: NULL` 설정으로 처리 (변경 금지)

## 보안 규칙

- BCrypt 해시 / 평문 비밀번호 저장·로그 절대 금지
- `@PreAuthorize` 또는 `SecurityConfig` 역할 검사 누락 금지
- 민감정보(비밀번호 해시 등) API 응답 포함 금지

---

## 코딩 컨벤션

- Java: 패키지 `com.penocean.ehs.{controller|service|mapper|model|dto}`
- MyBatis Mapper XML: `backend/src/main/resources/mapper/**/*.xml`
- 테이블명 접두사 `tb_` 유지 / 컬럼명 snake_case
- 프론트 컴포넌트 파일명 PascalCase (`AccessRequestPage.tsx`)
- 신규 페이지 추가 시 `App.tsx` RoleRoute 가드 필수
- 코드 변경 시 날짜 주석: `// [YYYY-MM-DD] 변경 이유`

---

## 세션 루틴

**시작:**
1. "다음 작업 확인해줘" — PROJECT_CONTEXT.md는 자동 로드됨
2. `git status` 로 현재 브랜치·변경 파일 확인

**종료:**
1. `PROJECT_CONTEXT.md` 업데이트 — 완료 `[x]`, 신규 이슈 추가
2. 완료 항목 10개 이상 누적 시 → `docs/ARCHIVE.md` 로 이동 후 삭제
3. `git add . && git commit -m "{feat|fix|refactor|docs|chore}: {요약}"`
4. `/clear`

---

## 참조 문서

@PROJECT_CONTEXT.md

| 파일 | 내용 |
|------|------|
| `PROJECT_CONTEXT.md` | 현재 TODO · 완료 이력 · 진척도 · 이슈 (위에서 자동 로드) |
| `backend/docs/db/ERD.md` | 테이블 관계도 |
| `backend/docs/db/database-setup.md` | DB 초기 설정·계정 생성 가이드 |
| `backend/src/main/resources/application.yml` | 전체 환경변수 목록 |
| `팬오션 안전보건Dx_최종안.pptx` | **원본 기획서** |
