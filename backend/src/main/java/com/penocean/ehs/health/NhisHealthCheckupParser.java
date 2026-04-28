// [2026-04-28] 국민건강보험공단(NHIS) 표준 건강검진 결과통보서 파서
// 비밀번호: 파일명 앞 6자리 우선 시도, 없으면 explicitPassword 사용
package com.penocean.ehs.health;

import com.penocean.ehs.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class NhisHealthCheckupParser implements HealthCheckupParser {

    private static final String TYPE = "NHIS";
    // [2026-04-28] 한글 날짜형식(2024년 11월 09일) 및 구분자 형식(2024.11.09) 모두 지원
    private static final Pattern DATE_PATTERN   = Pattern.compile(
            "(\\d{4})(?:[.\\-/](\\d{1,2})[.\\-/](\\d{1,2})|년\\s*(\\d{1,2})월\\s*(\\d{1,2})일)");
    private static final Pattern DECIMAL_PATTERN = Pattern.compile("(\\d+\\.\\d+|\\d+)");
    private static final Pattern BP_PATTERN      = Pattern.compile("(\\d{2,3})\\s*/\\s*(\\d{2,3})");
    // [2026-04-28] 주민등록번호 앞 7자리: YYMMDD-[1-4] (뒷자리는 *로 마스킹되어 있어도 동작)
    private static final Pattern RRNO_PATTERN    = Pattern.compile("(\\d{2})(\\d{2})(\\d{2})-([1-4])");

    // [2026-04-28] 파일명 기반 → PDF 내용 기반으로 변경
    // 비밀번호 없이 첫 페이지 텍스트를 추출해 NHIS 고유 키워드 확인.
    // 비밀번호 보호 PDF는 내용 확인 불가 → true 반환 후 parse()에서 비밀번호로 재시도.
    @Override
    public boolean supports(String filename, byte[] pdfBytes) {
        try (PDDocument doc = Loader.loadPDF(pdfBytes, "")) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setEndPage(1);
            String text = stripper.getText(doc);
            boolean isNhis = text.contains("국민건강보험")
                    || text.contains("건강검진결과통보서")
                    || text.contains("건강검진 결과통보서");
            log.info("NhisParser.supports({}): NHIS={}", filename, isNhis);
            return isNhis;
        } catch (InvalidPasswordException e) {
            log.info("NhisParser.supports({}): password-protected, deferring to parse()", filename);
            return true;
        } catch (IOException e) {
            log.warn("NhisParser.supports({}): IO error - {}", filename, e.getMessage());
            return false;
        }
    }

    @Override
    public String getType() { return TYPE; }

    @Override
    public ParsedHealthData parse(String filename, byte[] pdfBytes, String explicitPassword) {
        String text = extractText(pdfBytes, filename, explicitPassword);
        if (text == null || text.isBlank()) {
            log.warn("NhisParser: extracted empty text from {}", filename);
            return ParsedHealthData.builder().parserType(TYPE).build();
        }
        // [2026-04-28] 파싱 전 추출 텍스트 로그 출력 — 파서 정합성 확인용
        log.info("NhisParser: ===== PDF TEXT START [{}] =====\n{}\n===== PDF TEXT END =====",
                filename, text.length() > 3000 ? text.substring(0, 3000) + "...(truncated)" : text);
        List<String> lines = Arrays.asList(text.split("\\r?\\n"));
        return parseLines(lines, filename);
    }

    // ── private helpers ──────────────────────────────────────────

    /**
     * 시도 순서: 파일명 파생 비밀번호 → explicitPassword → 빈 문자열
     * InvalidPasswordException 발생 시 다음 시도로 넘어감.
     * 모든 시도 실패 시:
     *   - explicitPassword가 제공된 경우 → "비밀번호가 올바르지 않습니다" (400)
     *   - 미제공인 경우 → "PDF_PASSWORD_REQUIRED" (400, 프론트에서 다이얼로그 트리거)
     */
    private String extractText(byte[] pdfBytes, String filename, String explicitPassword) {
        // 중복 없이 시도 목록 구성
        LinkedHashSet<String> attempts = new LinkedHashSet<>();
        String derived = derivePasswordFromFilename(filename);
        if (!derived.isEmpty()) attempts.add(derived);
        if (explicitPassword != null && !explicitPassword.isBlank()) attempts.add(explicitPassword.trim());
        attempts.add(""); // 비밀번호 없는 PDF

        boolean allFailedWithPassword = false;
        for (String pwd : attempts) {
            try (PDDocument doc = Loader.loadPDF(pdfBytes, pwd)) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(doc);
            } catch (InvalidPasswordException e) {
                log.debug("NhisParser: InvalidPassword for '{}' (pwd hint length={})", filename, pwd.length());
                allFailedWithPassword = true;
            } catch (IOException e) {
                log.error("NhisParser: IO error reading PDF '{}': {}", filename, e.getMessage());
                throw new BadRequestException("PDF 파일을 읽을 수 없습니다: " + e.getMessage());
            }
        }

        // 모든 비밀번호 실패 → 프론트에게 적절한 메시지 전달
        if (allFailedWithPassword) {
            boolean passwordWasProvided = (explicitPassword != null && !explicitPassword.isBlank());
            if (passwordWasProvided) {
                throw new BadRequestException("PDF 비밀번호가 올바르지 않습니다.");
            } else {
                throw new BadRequestException("PDF_PASSWORD_REQUIRED");
            }
        }
        return null;
    }

    private String derivePasswordFromFilename(String filename) {
        if (filename == null) return "";
        String digits = filename.replaceAll("[^0-9]", "");
        return digits.length() >= 6 ? digits.substring(0, 6) : digits;
    }

    private ParsedHealthData parseLines(List<String> lines, String filename) {
        ParsedHealthData.ParsedHealthDataBuilder b = ParsedHealthData.builder().parserType(TYPE);

        b.empName(findAfterKeyword(lines, "성명", "이름"));

        // [2026-04-28] 주민등록번호에서 생년월일·성별·만나이 파싱 (숫자는 PDF 인코딩 무관하게 추출됨)
        ParsedRrno rrno = findRrno(lines);
        if (rrno != null) {
            b.birthDate(rrno.birthDate);
            b.gender(rrno.gender);
            b.age(rrno.age);
        } else {
            String birthStr = findAfterKeyword(lines, "생년월일", "주민등록번호");
            b.birthDate(birthStr != null ? parseDate(birthStr) : parseBirthFromFilename(filename));
        }

        // [2026-04-28] findAfterKeyword는 첫 토큰만 반환하므로 날짜는 전용 메서드로 탐색
        b.checkupDate(findDate(lines, "검진일", "검사일", "검진일자"));

        // [2026-04-28] 검진기관명 키워드 우선, 없으면 **보건소 패턴으로 fallback
        b.hospitalName(findHospitalName(lines));

        b.height(findDecimal(lines, "키(cm)", "신장(cm)", "신장 (cm)"));
        b.weight(findDecimal(lines, "체중(kg)", "몸무게(kg)", "체중 (kg)"));
        b.bmi(findDecimal(lines, "체질량지수", "BMI", "체지방"));
        b.waist(findDecimal(lines, "허리둘레", "복부둘레"));
        b.visionLeft(findDecimal(lines, "시력(좌)", "시력좌", "좌시력"));
        b.visionRight(findDecimal(lines, "시력(우)", "시력우", "우시력"));

        int[] bp = findBp(lines);
        if (bp != null) { b.bpSystolic(bp[0]); b.bpDiastolic(bp[1]); }

        b.hemoglobin(findDecimal(lines, "혈색소", "헤모글로빈", "Hb"));
        b.bst(findInt(lines, "공복혈당", "혈당(mg", "BST", "FBS"));
        b.tc(findInt(lines, "총콜레스테롤", "T.C", "T-C"));
        b.hdl(findInt(lines, "HDL", "고밀도", "HDL-콜레스테롤"));
        b.tg(findInt(lines, "중성지방", "TG", "트리글리세라이드"));
        b.ldl(findInt(lines, "LDL", "저밀도", "LDL-콜레스테롤"));
        b.creatinine(findDecimal(lines, "혈청크레아티닌", "크레아티닌", "Creatinine"));
        b.egfr(findInt(lines, "신사구체여과율", "e-GFR", "eGFR", "GFR"));
        b.ast(findInt(lines, "AST(SGOT)", "AST", "GOT"));
        b.alt(findInt(lines, "ALT(SGPT)", "ALT", "GPT"));
        b.ggt(findInt(lines, "γGTP", "GTP", "감마GTP", "γ-GTP"));

        return b.build();
    }

    // [2026-04-28] 주민등록번호 파싱 결과 컨테이너
    private record ParsedRrno(LocalDate birthDate, String gender, int age) {}

    /**
     * 주민등록번호(YYMMDD-[1-4]) 패턴 탐색 → 생년월일·성별·만나이 반환
     * 성별코드: 1·3=남, 2·4=여 / 세기: 1·2→1900s, 3·4→2000s
     */
    private ParsedRrno findRrno(List<String> lines) {
        for (String line : lines) {
            Matcher m = RRNO_PATTERN.matcher(line);
            if (m.find()) {
                try {
                    int yy = Integer.parseInt(m.group(1));
                    int mm = Integer.parseInt(m.group(2));
                    int dd = Integer.parseInt(m.group(3));
                    int genderCode = Integer.parseInt(m.group(4));
                    int century = (genderCode <= 2) ? 1900 : 2000;
                    LocalDate birth = LocalDate.of(century + yy, mm, dd);
                    String gender = (genderCode % 2 == 1) ? "남" : "여";
                    LocalDate today = LocalDate.now();
                    int age = today.getYear() - birth.getYear();
                    if (today.getMonthValue() < birth.getMonthValue() ||
                        (today.getMonthValue() == birth.getMonthValue() && today.getDayOfMonth() < birth.getDayOfMonth())) {
                        age--;
                    }
                    log.info("NhisParser: RRNO parsed birth={}, gender={}, age={}", birth, gender, age);
                    return new ParsedRrno(birth, gender, age);
                } catch (Exception e) {
                    log.warn("NhisParser: RRNO parse error: {}", e.getMessage());
                }
            }
        }
        return null;
    }

    private String findAfterKeyword(List<String> lines, String... keywords) {
        for (String line : lines) {
            for (String kw : keywords) {
                int idx = line.indexOf(kw);
                if (idx >= 0) {
                    String rest = line.substring(idx + kw.length()).trim().replaceAll("^[:\\s]+", "").trim();
                    if (!rest.isBlank()) {
                        String[] parts = rest.split("\\s+");
                        if (parts.length > 0 && !parts[0].isBlank()) return parts[0];
                    }
                }
            }
        }
        return null;
    }

    private BigDecimal findDecimal(List<String> lines, String... keywords) {
        for (String line : lines) {
            for (String kw : keywords) {
                if (line.toLowerCase().contains(kw.toLowerCase())) {
                    String after = line.substring(line.toLowerCase().indexOf(kw.toLowerCase()) + kw.length());
                    Matcher m = DECIMAL_PATTERN.matcher(after);
                    if (m.find()) {
                        try { return new BigDecimal(m.group(1)); } catch (NumberFormatException ignored) {}
                    }
                }
            }
        }
        return null;
    }

    private int[] findBp(List<String> lines) {
        for (String line : lines) {
            // [2026-04-28] "혈압"·"BP" 외에 "mmHg" 포함 줄도 탐색 — 한글 인코딩 깨진 PDF 대응
            if (line.contains("혈압") || line.contains("BP") || line.contains("mmHg")) {
                Matcher m = BP_PATTERN.matcher(line);
                if (m.find()) {
                    try { return new int[]{Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2))}; }
                    catch (NumberFormatException ignored) {}
                }
            }
        }
        return null;
    }

    private Integer findInt(List<String> lines, String... keywords) {
        BigDecimal d = findDecimal(lines, keywords);
        return d == null ? null : d.intValue();
    }

    // [2026-04-28] 병원명 탐색: "검진기관명" 키워드만 사용 (상단 20줄)
    // - "검진기관" 단독 키워드 제외 — "검진기관별 비교" 등 문서 본문에서 오매칭 방지
    // - 키워드가 줄 끝에 단독으로 있으면 다음 줄에서 값을 가져옴
    private String findHospitalName(List<String> lines) {
        int limit = Math.min(20, lines.size());
        for (int i = 0; i < limit; i++) {
            String line = lines.get(i);
            int idx = line.indexOf("검진기관명");
            if (idx < 0) continue;
            String rest = line.substring(idx + "검진기관명".length()).trim().replaceAll("^[:\\s()]+", "").trim();
            if (!rest.isBlank()) {
                String[] parts = rest.split("\\s+");
                if (parts.length > 0 && !parts[0].isBlank()) return parts[0];
            }
            // 값이 없으면 다음 줄 확인
            if (i + 1 < limit) {
                String next = lines.get(i + 1).trim();
                if (!next.isBlank()) return next;
            }
        }
        return null;
    }

    // [2026-04-28] 키워드가 포함된 라인 전체에 DATE_PATTERN 적용 — 한글 날짜(2024년 11월 09일) 대응
    private LocalDate findDate(List<String> lines, String... keywords) {
        for (String line : lines) {
            for (String kw : keywords) {
                if (line.contains(kw)) {
                    String rest = line.substring(line.indexOf(kw) + kw.length());
                    LocalDate d = parseDate(rest);
                    if (d != null) return d;
                }
            }
        }
        return null;
    }

    private LocalDate parseDate(String text) {
        if (text == null || text.isBlank()) return null;
        Matcher m = DATE_PATTERN.matcher(text.trim());
        if (m.find()) {
            try {
                int year  = Integer.parseInt(m.group(1));
                // 구분자 형식(group 2,3) 또는 한글 형식(group 4,5)
                String mg = m.group(2) != null ? m.group(2) : m.group(4);
                String dg = m.group(3) != null ? m.group(3) : m.group(5);
                return LocalDate.of(year, Integer.parseInt(mg), Integer.parseInt(dg));
            } catch (Exception ignored) {}
        }
        return null;
    }

    private LocalDate parseBirthFromFilename(String filename) {
        if (filename == null) return null;
        String digits = filename.replaceAll("[^0-9]", "");
        if (digits.length() < 6) return null;
        try {
            int yy = Integer.parseInt(digits.substring(0, 2));
            int mm = Integer.parseInt(digits.substring(2, 4));
            int dd = Integer.parseInt(digits.substring(4, 6));
            return LocalDate.of((yy < 30 ? 2000 : 1900) + yy, mm, dd);
        } catch (Exception e) { return null; }
    }
}
