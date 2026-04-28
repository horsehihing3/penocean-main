// [2026-04-28] 건강검진 PDF 파서 레지스트리 — supports() 로 자동 선택
package com.penocean.ehs.health;

import com.penocean.ehs.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class HealthCheckupParserRegistry {

    private final List<HealthCheckupParser> parsers;

    /** filename/bytes 기반으로 적합한 파서를 반환. 없으면 첫 번째 파서를 fallback으로 사용 */
    public HealthCheckupParser find(String filename, byte[] pdfBytes) {
        return parsers.stream()
                .filter(p -> p.supports(filename, pdfBytes))
                .findFirst()
                .orElseGet(() -> {
                    if (!parsers.isEmpty()) return parsers.get(0);
                    throw new BadRequestException("등록된 건강검진 PDF 파서가 없습니다.");
                });
    }
}
