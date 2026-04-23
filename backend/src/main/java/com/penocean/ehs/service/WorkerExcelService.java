package com.penocean.ehs.service;

import com.penocean.ehs.dto.request.AccessRequestCreateRequest.WorkerItem;
import com.penocean.ehs.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 출입신청 작업자 엑셀 업로드/양식 다운로드.
 * PPT 슬라이드 14 컬럼: 작업자명 / 직책·직위 / 생년월일(yymmdd) / 핸드폰 번호 / (교육이수일자)
 * 첫 행은 헤더, 두 번째 행부터 작업자 데이터. 데이터의 첫 행 사람 = 승선대표자.
 */
@Slf4j
@Service
public class WorkerExcelService {

    private static final String[] HEADERS = {
            "작업자명", "직책/직위", "생년월일(yymmdd 또는 YYYY-MM-DD)", "핸드폰 번호"
    };

    private static final DateTimeFormatter YYMMDD = DateTimeFormatter.ofPattern("yyMMdd");
    private static final DateTimeFormatter YYYY_MM_DD = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public List<WorkerItem> parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("엑셀 파일이 비어있습니다");
        }
        List<WorkerItem> workers = new ArrayList<>();
        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(file.getBytes()))) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null) {
                throw new BadRequestException("시트를 찾을 수 없습니다");
            }
            DataFormatter fmt = new DataFormatter();
            int last = sheet.getLastRowNum();
            for (int i = 1; i <= last; i++) { // 첫 행(0)은 헤더 skip
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String name = readString(row.getCell(0), fmt);
                if (name == null || name.isBlank()) continue; // 빈 행 skip
                String role = readString(row.getCell(1), fmt);
                LocalDate birth = readDate(row.getCell(2), fmt);
                String phone = readString(row.getCell(3), fmt);
                workers.add(WorkerItem.builder()
                        .workerName(name.trim())
                        .workerRole(role == null ? null : role.trim())
                        .workerBirth(birth)
                        .workerPhone(phone == null ? null : phone.trim())
                        .build());
            }
        } catch (IOException e) {
            log.warn("Failed to parse worker excel", e);
            throw new BadRequestException("엑셀 파일을 읽을 수 없습니다: " + e.getMessage());
        }
        if (workers.isEmpty()) {
            throw new BadRequestException("엑셀에서 작업자 데이터를 찾을 수 없습니다");
        }
        return workers;
    }

    public byte[] buildTemplate() {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("작업자명단");

            CellStyle header = wb.createCellStyle();
            Font bold = wb.createFont();
            bold.setBold(true);
            header.setFont(bold);
            header.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            header.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
            header.setAlignment(HorizontalAlignment.CENTER);

            Row head = sheet.createRow(0);
            for (int c = 0; c < HEADERS.length; c++) {
                Cell cell = head.createCell(c);
                cell.setCellValue(HEADERS[c]);
                cell.setCellStyle(header);
                sheet.setColumnWidth(c, 22 * 256);
            }

            // 예시 두 행 (승선대표자 1명 + 일반 작업자 1명)
            Row s1 = sheet.createRow(1);
            s1.createCell(0).setCellValue("홍길동");
            s1.createCell(1).setCellValue("과장");
            s1.createCell(2).setCellValue("811101");
            s1.createCell(3).setCellValue("010-1234-5678");

            Row s2 = sheet.createRow(2);
            s2.createCell(0).setCellValue("김두한");
            s2.createCell(1).setCellValue("대리");
            s2.createCell(2).setCellValue("1992-02-12");
            s2.createCell(3).setCellValue("010-2222-3333");

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("엑셀 템플릿 생성 실패", e);
        }
    }

    private String readString(Cell cell, DataFormatter fmt) {
        if (cell == null) return null;
        return fmt.formatCellValue(cell);
    }

    private LocalDate readDate(Cell cell, DataFormatter fmt) {
        if (cell == null) return null;
        // 숫자 셀 + 날짜 포맷
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            java.util.Date d = cell.getDateCellValue();
            return d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
        }
        String s = fmt.formatCellValue(cell);
        if (s == null || s.isBlank()) return null;
        s = s.trim();
        // YYYY-MM-DD
        try {
            return LocalDate.parse(s, YYYY_MM_DD);
        } catch (Exception ignored) {
        }
        // yymmdd
        if (s.length() == 6 && s.chars().allMatch(Character::isDigit)) {
            try {
                LocalDate d = LocalDate.parse(s, YYMMDD);
                // 2자리 연도 → 현재 이후면 19XX 로 판단
                if (d.isAfter(LocalDate.now())) {
                    d = d.minusYears(100);
                }
                return d;
            } catch (Exception ignored) {
            }
        }
        log.warn("Unrecognized birth date format: {}", s);
        return null;
    }
}
