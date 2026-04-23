# 팬오션 안전보건 DX - Phase 1 ERD

Phase 1 공통 스키마 범위 (V1 기준)의 관계도입니다.
업무 테이블 (안전수칙/협력업체 평가 등) 은 Phase 2 이후 별도 문서로 확장합니다.

## 전체 관계도

```mermaid
erDiagram
    tb_role {
        BIGINT id PK
        VARCHAR code UK
        NVARCHAR name
    }

    tb_user {
        BIGINT id PK
        VARCHAR username UK
        VARCHAR password
        NVARCHAR name
        VARCHAR email
        VARCHAR role_code FK
        BIGINT company_id FK
        BIGINT department_id FK
        VARCHAR status
        BIGINT approved_by FK
    }

    tb_company {
        BIGINT id PK
        VARCHAR business_number UK
        NVARCHAR name
        VARCHAR industry_code
        VARCHAR status
    }

    tb_department {
        BIGINT id PK
        VARCHAR code UK
        NVARCHAR name
        BIGINT parent_id FK
        BIGINT manager_user_id FK
    }

    tb_vessel {
        BIGINT id PK
        VARCHAR code UK
        NVARCHAR name
        VARCHAR imo_number
        VARCHAR vessel_type
        VARCHAR status
    }

    tb_port {
        BIGINT id PK
        VARCHAR code UK
        NVARCHAR name
        VARCHAR country
    }

    tb_code {
        BIGINT id PK
        VARCHAR group_code
        VARCHAR code
        NVARCHAR name
    }

    tb_user_department {
        BIGINT user_id PK,FK
        BIGINT department_id PK,FK
    }

    tb_user_industry {
        BIGINT user_id PK,FK
        VARCHAR industry_code PK
    }

    tb_notification {
        BIGINT id PK
        BIGINT recipient_user_id FK
        VARCHAR channel
        VARCHAR status
    }

    tb_audit_log {
        BIGINT id PK
        BIGINT user_id
        VARCHAR action
        VARCHAR resource_type
        BIGINT resource_id
    }

    tb_role        ||--o{ tb_user            : "role_code -> code"
    tb_company     ||--o{ tb_user            : "CONTRACTOR 소속"
    tb_department  ||--o{ tb_user            : "CONTRACT_DEPT 소속"
    tb_department  ||--o{ tb_department      : "parent_id 자기참조"
    tb_user        ||--o{ tb_department      : "manager_user_id"
    tb_user        ||--o{ tb_user            : "approved_by 자기참조"
    tb_user        ||--o{ tb_user_department : ""
    tb_department  ||--o{ tb_user_department : ""
    tb_user        ||--o{ tb_user_industry   : ""
    tb_user        ||--o{ tb_notification    : "recipient"
```

## 핵심 관계 요약

| 관계 | 설명 |
|------|------|
| tb_user.role_code → tb_role.code | 모든 사용자는 정확히 하나의 role |
| tb_user.company_id → tb_company.id | CONTRACTOR 전용 (NULL 허용) |
| tb_user.department_id → tb_department.id | CONTRACT_DEPT 또는 ADMIN 용 (NULL 허용) |
| tb_user.approved_by → tb_user.id | 승인 처리 관리자 (NULL = 미승인) |
| tb_department.parent_id → tb_department.id | 조직 계층 |
| tb_department.manager_user_id → tb_user.id | 부서장 |
| tb_user_department | N:M 사용자-부서 (한 명이 여러 계약팀 담당) |
| tb_user_industry | N:M 사용자-업종 (tb_code(group_code='INDUSTRY')) |
| tb_notification.recipient_user_id → tb_user.id | 알림 수신자 |

## 설계 노트

- `tb_audit_log.user_id` 는 **soft link** (FK 없음): 계정이 삭제되어도 로그는 보존.
- `industry_code` 는 FK 제약 대신 `tb_code(group_code='INDUSTRY')` 참조 규약. 리포트성 조인은 `LEFT JOIN tb_code c ON c.group_code='INDUSTRY' AND c.code = x.industry_code` 형태로.
- `deleted BIT` = 논리 삭제. 서비스 레이어 모든 SELECT 는 `deleted = 0` 필터 필수.
- 타임스탬프는 **UTC (`SYSUTCDATETIME()`)** 저장. 표시 시 KST 변환.
- Phase 2+ : 업종별 안전수칙(`tb_safety_rule`), 협력업체 14개 항목 평가(`tb_contractor_eval` / `tb_contractor_eval_item`), 선박별 작업계획 등이 추가될 예정.
