package com.penocean.ehs.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageRequest {

    @Builder.Default
    private Integer page = 1;
    @Builder.Default
    private Integer size = 20;
    private String sortBy;
    @Builder.Default
    private String sortDir = "DESC";

    public int getOffset() {
        int p = page == null || page < 1 ? 1 : page;
        int s = size == null || size < 1 ? 20 : size;
        return (p - 1) * s;
    }

    public int getLimit() {
        return size == null || size < 1 ? 20 : size;
    }
}
