package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationItemReorderRequest {

    private List<Entry> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Entry {
        private Long id;
        private Integer sortOrder;
    }
}
