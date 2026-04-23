# 팬오션 안전보건 DX - DB Setup Guide

Target: **Microsoft SQL Server 2019+**
Migration tool: **Flyway** (community, `flyway-mssqlserver` 또는 `flyway-sqlserver`)

---

## 1. 데이터베이스 / 로그인 / 사용자 생성

SA 또는 sysadmin 권한으로 실행.

```sql
-- 1) DB
IF DB_ID('PANOCEAN_EHS') IS NULL
    CREATE DATABASE PANOCEAN_EHS
        COLLATE Korean_Wansung_CI_AS;
GO

ALTER DATABASE PANOCEAN_EHS SET READ_COMMITTED_SNAPSHOT ON;
ALTER DATABASE PANOCEAN_EHS SET ALLOW_SNAPSHOT_ISOLATION ON;
GO

-- 2) 서버 로그인
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'panocean_app')
    CREATE LOGIN panocean_app
        WITH PASSWORD   = 'ChangeMe!Now#2026',
             DEFAULT_DATABASE = PANOCEAN_EHS,
             CHECK_POLICY  = ON;
GO

-- 3) DB 사용자
USE PANOCEAN_EHS;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'panocean_app')
    CREATE USER panocean_app FOR LOGIN panocean_app;
GO

-- 4) 최소 권한 (runtime)
ALTER ROLE db_datareader ADD MEMBER panocean_app;
ALTER ROLE db_datawriter ADD MEMBER panocean_app;
GO

-- 5) Flyway 마이그레이션용 별도 계정 (DDL 권한)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'panocean_ddl')
    CREATE LOGIN panocean_ddl
        WITH PASSWORD = 'ChangeMe!Ddl#2026',
             DEFAULT_DATABASE = PANOCEAN_EHS;
GO

USE PANOCEAN_EHS;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'panocean_ddl')
    CREATE USER panocean_ddl FOR LOGIN panocean_ddl;
ALTER ROLE db_ddladmin      ADD MEMBER panocean_ddl;
ALTER ROLE db_datareader    ADD MEMBER panocean_ddl;
ALTER ROLE db_datawriter    ADD MEMBER panocean_ddl;
GO
```

---

## 2. Flyway 설정 (application.yml 예시)

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=PANOCEAN_EHS;encrypt=true;trustServerCertificate=true
    username: panocean_app
    password: ChangeMe!Now#2026
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver

  flyway:
    enabled: true
    url: jdbc:sqlserver://localhost:1433;databaseName=PANOCEAN_EHS;encrypt=true;trustServerCertificate=true
    user: panocean_ddl
    password: ChangeMe!Ddl#2026
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 0
    validate-on-migrate: true
    default-schema: dbo
```

---

## 3. 실행 순서

Flyway 는 파일명 버전 순으로 자동 실행하므로 `./gradlew flywayMigrate` (또는 Spring Boot 기동) 만 하면 됩니다.

수동 실행(예: `sqlcmd`) 시 순서:

```
V1__init_common_schema.sql
V2__seed_code_masters.sql
V3__seed_dummy_data.sql
V4__seed_dev_extra.sql        # dev 프로파일에서만 권장
```

### `sqlcmd` 수동 실행 예

```powershell
$SERVER = "localhost"
$DB     = "PANOCEAN_EHS"
$USER   = "panocean_ddl"
$PASS   = "ChangeMe!Ddl#2026"

Get-ChildItem "backend/src/main/resources/db/migration/V*.sql" |
  Sort-Object Name |
  ForEach-Object {
    Write-Host "==> $($_.Name)"
    sqlcmd -S $SERVER -d $DB -U $USER -P $PASS -i $_.FullName -b
    if ($LASTEXITCODE -ne 0) { throw "FAILED on $($_.Name)" }
  }
```

---

## 4. 환경 프로파일 전략

| 프로파일 | 포함 파일 | 비고 |
|----------|-----------|------|
| `local` / `dev` | V1 ~ V4 | 로그인/화면 검증용 더미 전량 |
| `qa` | V1 ~ V3 | 감사 로그 더미(V4) 제외 |
| `prod` | V1 ~ V2 | 코드 마스터까지만 (V3/V4 제외) |

Flyway `locations` 를 `classpath:db/migration, classpath:db/migration-dev` 식으로 분리하는 방법 권장.
현재는 단순화를 위해 V3/V4 를 전체 migration 폴더에 둠.

---

## 5. 더미 로그인 계정 (V3 기준)

비밀번호는 모두 `password123` (admin 포함, BCrypt 동일 해시 사용 - **개발 전용**).

| username | role | status | 소속 |
|----------|------|--------|------|
| admin        | ADMIN         | APPROVED | 안전경영팀 |
| contractor1  | CONTRACTOR    | APPROVED | 대한검수 |
| contractor2  | CONTRACTOR    | APPROVED | 서울고박 |
| contractor3  | CONTRACTOR    | APPROVED | 부산하역 |
| contractor4  | CONTRACTOR    | PENDING  | 오션검정 |
| contractor5  | CONTRACTOR    | PENDING  | 한라선용품 |
| contract1    | CONTRACT_DEPT | APPROVED | 구매팀 |
| contract2    | CONTRACT_DEPT | APPROVED | 운영팀 |
| contract3    | CONTRACT_DEPT | APPROVED | 선박관리팀 |

---

## 6. 롤백 / 초기화

개발 중 DB 를 싹 지우고 다시 만드는 경우:

```sql
USE master;
ALTER DATABASE PANOCEAN_EHS SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE PANOCEAN_EHS;
```

그 후 위 1번부터 재실행. Flyway `flyway_schema_history` 테이블도 함께 초기화됩니다.

---

## 7. 주의사항

- 모든 NVARCHAR 리터럴은 `N'...'` 접두어 필수.
- 시간은 UTC(`SYSUTCDATETIME()`) 저장. 애플리케이션에서 KST 로 변환.
- `deleted` 컬럼은 논리 삭제. SELECT 에 반드시 `deleted = 0` 필터.
- BCrypt 해시는 **반드시 운영 투입 전 교체** (모든 계정이 동일 비번).
- `business_number` 포맷은 `999-99-99999` (하이픈 포함 12자). SOM 연동 시 하이픈 제거 로직 필요.
