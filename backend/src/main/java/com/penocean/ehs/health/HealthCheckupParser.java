// [2026-04-28] 건강검진 PDF 파서 인터페이스 — 병원/기관별 구현 추가 가능
package com.penocean.ehs.health;

public interface HealthCheckupParser {

    /** 이 파서가 해당 파일을 처리할 수 있는지 여부 */
    boolean supports(String filename, byte[] pdfBytes);

    /** PDF 파싱 결과 반환. explicitPassword가 null이면 파서가 자동 추론 */
    ParsedHealthData parse(String filename, byte[] pdfBytes, String explicitPassword);

    /** 파서 식별자 (예: "NHIS") */
    String getType();
}
