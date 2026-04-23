package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vessel {

    private Long id;
    private String code;
    private String name;          // PAN BONA 등
    private String imoNumber;     // IMO number (tb_vessel.imo_number)
    private String flag;          // 선적국가
    private String vesselType;    // 선종 (벌크선/컨테이너선 등)
    private Long dwt;
    private String status;        // ACTIVE / INACTIVE
    private String currentPort;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
