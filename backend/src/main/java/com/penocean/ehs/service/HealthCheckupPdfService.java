// [2026-04-28] 건강검진 PDF 업로드 → 파싱 → 저장 서비스
package com.penocean.ehs.service;

import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.health.HealthCheckupParser;
import com.penocean.ehs.health.HealthCheckupParserRegistry;
import com.penocean.ehs.health.ParsedHealthData;
import com.penocean.ehs.mapper.HealthCheckupResultMapper;
import com.penocean.ehs.model.HealthCheckupResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthCheckupPdfService {

    private final HealthCheckupResultMapper mapper;
    private final HealthCheckupParserRegistry registry;

    @Transactional(readOnly = true)
    public List<HealthCheckupResult> list(Integer year, String keyword) {
        return mapper.findAll(year, keyword);
    }

    @Transactional(readOnly = true)
    public List<HealthCheckupResult> recentByEmpName(String empName, int limit) {
        return mapper.findRecentByEmpName(empName, limit);
    }

    // [2026-04-28] 파싱만 수행 — DB 저장 없이 파싱 결과 반환
    public HealthCheckupResult parseOnly(MultipartFile file, String password, String createdBy) {
        if (file == null || file.isEmpty()) throw new BadRequestException("PDF 파일이 비어있습니다.");
        String filename = file.getOriginalFilename();
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("파일을 읽을 수 없습니다: " + e.getMessage());
        }

        HealthCheckupParser parser = registry.find(filename, bytes);
        log.info("HealthCheckupPdf: using parser={} for file={}", parser.getType(), filename);

        ParsedHealthData parsed = parser.parse(filename, bytes, password);
        return toEntity(parsed, filename, createdBy);
    }

    // [2026-04-28] 파싱된 결과를 DB에 저장
    @Transactional
    public HealthCheckupResult save(HealthCheckupResult result) {
        mapper.insert(result);
        log.info("HealthCheckupResult saved: id={}, name={}", result.getId(), result.getEmpName());
        return result;
    }

    @Transactional
    public void updateMutable(Long id, String empName, String followupOpinion, String workFitness,
                               String note, String department,
                               Boolean bpMed, Boolean dmMed, Boolean dlMed) {
        if (mapper.findById(id) == null) throw new BadRequestException("존재하지 않는 검진 결과입니다: " + id);
        mapper.updateNote(id, followupOpinion, workFitness, note, department,
                bpMed == null ? false : bpMed,
                dmMed == null ? false : dmMed,
                dlMed == null ? false : dlMed,
                empName);
    }

    @Transactional
    public void delete(Long id) {
        mapper.softDelete(id);
    }

    // ── helpers ──────────────────────────────────────────────────

    private HealthCheckupResult toEntity(ParsedHealthData d, String filename, String createdBy) {
        LocalDate checkupDate = d.getCheckupDate();
        Integer year = checkupDate != null ? checkupDate.getYear() : null;

        return HealthCheckupResult.builder()
                .checkupYear(year)
                .checkupDate(checkupDate)
                .hospitalName(d.getHospitalName())
                .empName(d.getEmpName() != null ? d.getEmpName() : "미확인")
                .birthDate(d.getBirthDate())
                .gender(d.getGender())
                .age(d.getAge())
                .height(d.getHeight())
                .weight(d.getWeight())
                .bmi(d.getBmi())
                .waist(d.getWaist())
                .visionRight(d.getVisionRight())
                .visionLeft(d.getVisionLeft())
                .bpSystolic(d.getBpSystolic())
                .bpDiastolic(d.getBpDiastolic())
                .bpCategory(deriveBpCategory(d.getBpSystolic(), d.getBpDiastolic()))
                .bpMed(false)
                .hemoglobin(d.getHemoglobin())
                .bst(d.getBst())
                .dmCategory(deriveDmCategory(d.getBst()))
                .dmMed(false)
                .tc(d.getTc())
                .hdl(d.getHdl())
                .tg(d.getTg())
                .ldl(d.getLdl())
                .dlCategory(deriveDlCategory(d.getTc(), d.getLdl()))
                .dlMed(false)
                .creatinine(d.getCreatinine())
                .egfr(d.getEgfr())
                .ast(d.getAst())
                .alt(d.getAlt())
                .ggt(d.getGgt())
                .followupOpinion("미작성")
                .workFitness("가")
                .parserType(d.getParserType())
                .sourceFile(filename)
                .createdBy(createdBy)
                .build();
    }

    /** 혈압 판정: A(<120/80) B(120-139/80-89) C(140-159/90-99) D(≥160/≥100) */
    private String deriveBpCategory(Integer sys, Integer dia) {
        if (sys == null || dia == null) return null;
        if (sys >= 160 || dia >= 100) return "D";
        if (sys >= 140 || dia >= 90)  return "C";
        if (sys >= 120 || dia >= 80)  return "B";
        return "A";
    }

    /** 혈당 판정: A(<100) B(100-125) C(≥126) */
    private String deriveDmCategory(Integer bst) {
        if (bst == null) return null;
        if (bst >= 126) return "C";
        if (bst >= 100) return "B";
        return "A";
    }

    /** 이상지질 판정: A(TC<200, LDL<130) B(TC 200-239 또는 LDL 130-159) C(TC≥240 또는 LDL≥160) */
    private String deriveDlCategory(Integer tc, Integer ldl) {
        if (tc == null && ldl == null) return null;
        boolean cond = (tc != null && tc >= 240) || (ldl != null && ldl >= 160);
        if (cond) return "C";
        boolean condB = (tc != null && tc >= 200) || (ldl != null && ldl >= 130);
        if (condB) return "B";
        return "A";
    }
}
