// [2026-04-28] 건강검진 결과 Mapper
package com.penocean.ehs.mapper;

import com.penocean.ehs.model.HealthCheckupResult;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface HealthCheckupResultMapper {

    void insert(HealthCheckupResult result);

    List<HealthCheckupResult> findAll(@Param("year") Integer year,
                                      @Param("keyword") String keyword);

    HealthCheckupResult findById(@Param("id") Long id);

    void updateNote(@Param("id") Long id,
                    @Param("followupOpinion") String followupOpinion,
                    @Param("workFitness") String workFitness,
                    @Param("note") String note,
                    @Param("department") String department,
                    @Param("bpMed") Boolean bpMed,
                    @Param("dmMed") Boolean dmMed,
                    @Param("dlMed") Boolean dlMed,
                    @Param("empName") String empName);

    void softDelete(@Param("id") Long id);

    // [2026-04-28] 동일 성명 최근 N건 조회 (3개년 비교용)
    List<HealthCheckupResult> findRecentByEmpName(@Param("empName") String empName,
                                                  @Param("limit") int limit);
}
