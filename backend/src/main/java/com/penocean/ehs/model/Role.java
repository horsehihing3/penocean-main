package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    private Long id;
    private String code;   // ADMIN / CONTRACTOR / CONTRACT_DEPT
    private String name;   // 표시명
}
