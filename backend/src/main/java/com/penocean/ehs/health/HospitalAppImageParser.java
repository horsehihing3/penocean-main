// [2026-04-28] 병원 앱 검사결과 스크린샷(JPG/PNG) 파서 — Claude Vision API 사용
package com.penocean.ehs.health;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.penocean.ehs.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Component
public class HospitalAppImageParser implements HealthCheckupParser {

    @Value("${anthropic.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public HospitalAppImageParser(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    @Override
    public boolean supports(String filename, byte[] bytes) {
        if (filename == null) return false;
        String lower = filename.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png");
    }

    @Override
    public ParsedHealthData parse(String filename, byte[] imageBytes, String password) {
        return parseImages(List.of(imageBytes), List.of(filename != null ? filename : "image.jpg"));
    }

    /** 다중 이미지(여러 페이지) 를 하나의 Claude 호출로 파싱 */
    @SuppressWarnings("unchecked")
    public ParsedHealthData parseImages(List<byte[]> imagesBytesList, List<String> filenames) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BadRequestException("ANTHROPIC_API_KEY가 설정되지 않아 이미지 파싱이 불가합니다. 환경변수를 확인해주세요.");
        }

        List<Map<String, Object>> content = new ArrayList<>();

        for (int i = 0; i < imagesBytesList.size(); i++) {
            String name = (i < filenames.size() && filenames.get(i) != null) ? filenames.get(i) : "image.jpg";
            String mediaType = name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
            String base64 = Base64.getEncoder().encodeToString(imagesBytesList.get(i));

            content.add(Map.of(
                "type", "image",
                "source", Map.of(
                    "type", "base64",
                    "media_type", mediaType,
                    "data", base64
                )
            ));
        }
        content.add(Map.of("type", "text", "text", PROMPT));

        Map<String, Object> body = Map.of(
            "model", "claude-haiku-4-5-20251001",
            "max_tokens", 1024,
            "messages", List.of(Map.of("role", "user", "content", content))
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-api-key", apiKey);
        headers.set("anthropic-version", "2023-06-01");
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            log.info("HospitalAppImageParser: Claude Vision API 호출 (이미지 {}장)", imagesBytesList.size());
            ResponseEntity<Map> response = restTemplate.postForEntity(
                "https://api.anthropic.com/v1/messages",
                new HttpEntity<>(body, headers), Map.class);

            List<Map<String, Object>> respContent = (List<Map<String, Object>>) response.getBody().get("content");
            if (respContent == null || respContent.isEmpty()) {
                throw new BadRequestException("Claude 응답이 비어있습니다.");
            }
            String json = (String) respContent.get(0).get("text");
            // 마크다운 코드블록 제거
            String cleaned = json.trim().replaceAll("(?s)```[a-z]*\\n?(.*?)```", "$1").trim();
            log.debug("HospitalAppImageParser: Claude 응답 JSON = {}", cleaned);
            return parseJson(cleaned);

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Claude Vision API 오류: {}", e.getMessage());
            throw new BadRequestException("이미지 분석 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private ParsedHealthData parseJson(String json) {
        try {
            Map<String, Object> d = objectMapper.readValue(json, Map.class);
            return ParsedHealthData.builder()
                .parserType(getType())
                .checkupDate(toDate(d.get("checkupDate")))
                .empName(str(d.get("empName")))
                .bst(toInt(d.get("bst")))
                .hemoglobin(toBd(d.get("hemoglobin")))
                .ast(toInt(d.get("ast")))
                .alt(toInt(d.get("alt")))
                .ggt(toInt(d.get("ggt")))
                .creatinine(toBd(d.get("creatinine")))
                .egfr(toInt(d.get("egfr")))
                .bpSystolic(toInt(d.get("bpSystolic")))
                .bpDiastolic(toInt(d.get("bpDiastolic")))
                .tc(toInt(d.get("tc")))
                .hdl(toInt(d.get("hdl")))
                .ldl(toInt(d.get("ldl")))
                .tg(toInt(d.get("tg")))
                .height(toBd(d.get("height")))
                .weight(toBd(d.get("weight")))
                .bmi(toBd(d.get("bmi")))
                .build();
        } catch (Exception e) {
            log.error("Claude 응답 JSON 파싱 실패: {}", json);
            throw new BadRequestException("이미지 분석 결과를 파싱할 수 없습니다.");
        }
    }

    @Override
    public String getType() { return "HOSPITAL_APP_IMAGE"; }

    // ── helpers ──────────────────────────────────────────────────

    private String str(Object v) { return v instanceof String s && !s.isBlank() ? s : null; }

    private Integer toInt(Object v) {
        if (v == null) return null;
        if (v instanceof Integer i) return i;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
    }

    private BigDecimal toBd(Object v) {
        if (v == null) return null;
        try { return new BigDecimal(v.toString()); } catch (Exception e) { return null; }
    }

    private LocalDate toDate(Object v) {
        if (!(v instanceof String s) || s.isBlank()) return null;
        try { return LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s); } catch (Exception e) { return null; }
    }

    private static final String PROMPT = """
        이 이미지(들)는 병원 검사결과 화면입니다.
        보이는 항목에서 아래 JSON 필드를 추출하여 JSON 객체만 응답하세요.
        값이 이미지에 없으면 null로 설정하고, 숫자는 숫자형, 날짜는 "YYYY-MM-DD" 형식으로 반환하세요.
        마크다운 코드블록 없이 JSON 객체만 응답하세요.

        {
          "checkupDate": "검사일자 (YYYY-MM-DD)",
          "empName": "환자명/성명 (없으면 null)",
          "bst": 혈당 수치(정수),
          "hemoglobin": 혈색소(소수),
          "ast": AST 또는 아스파르트아미노전달효소(정수),
          "alt": ALT 또는 알라닌아미노전달효소(정수),
          "ggt": GGT 또는 감마글루타밀전이효소(정수),
          "creatinine": 크레아티닌(소수),
          "egfr": eGFR 또는 사구체여과율(정수),
          "bpSystolic": 수축기혈압(정수),
          "bpDiastolic": 이완기혈압(정수),
          "tc": 총콜레스테롤(정수),
          "hdl": HDL콜레스테롤(정수),
          "ldl": LDL콜레스테롤(정수),
          "tg": 중성지방/트리글리세라이드(정수),
          "height": 신장/키 cm(소수),
          "weight": 체중 kg(소수),
          "bmi": BMI(소수)
        }
        """;
}
