package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.IndustrialAccidentDetailResponse;
import com.penocean.ehs.dto.response.IndustrialAccidentListItem;
import com.penocean.ehs.model.IndustrialAccident;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface IndustrialAccidentMapper {

    IndustrialAccident findById(@Param("id") Long id);

    IndustrialAccidentDetailResponse findByIdWithDetail(@Param("id") Long id);

    List<IndustrialAccidentListItem> findPage(@Param("companyId") Long companyId,
                                              @Param("businessNumber") String businessNumber,
                                              @Param("severity") String severity,
                                              @Param("accidentType") String accidentType,
                                              @Param("dateFrom") LocalDate dateFrom,
                                              @Param("dateTo") LocalDate dateTo,
                                              @Param("offset") int offset,
                                              @Param("limit") int limit);

    long count(@Param("companyId") Long companyId,
               @Param("businessNumber") String businessNumber,
               @Param("severity") String severity,
               @Param("accidentType") String accidentType,
               @Param("dateFrom") LocalDate dateFrom,
               @Param("dateTo") LocalDate dateTo);

    void insert(IndustrialAccident accident);

    void update(IndustrialAccident accident);

    void updateReportFileUrl(@Param("id") Long id, @Param("reportFileUrl") String reportFileUrl);

    void softDelete(@Param("id") Long id);

    Integer findMaxSeqByDate(@Param("dateStr") String dateStr);
}
