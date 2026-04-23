package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.EvaluationDetailResponse;
import com.penocean.ehs.dto.response.EvaluationListItem;
import com.penocean.ehs.model.Evaluation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface EvaluationMapper {

    Evaluation findById(@Param("id") Long id);

    EvaluationDetailResponse findByIdWithDetail(@Param("id") Long id);

    List<EvaluationListItem> findPage(@Param("status") String status,
                                      @Param("companyId") Long companyId,
                                      @Param("periodYear") Integer periodYear,
                                      @Param("periodHalf") String periodHalf,
                                      @Param("evaluationType") String evaluationType,
                                      @Param("keyword") String keyword,
                                      @Param("offset") int offset,
                                      @Param("limit") int limit);

    long count(@Param("status") String status,
               @Param("companyId") Long companyId,
               @Param("periodYear") Integer periodYear,
               @Param("periodHalf") String periodHalf,
               @Param("evaluationType") String evaluationType,
               @Param("keyword") String keyword);

    void insert(Evaluation evaluation);

    void updateScores(@Param("id") Long id,
                      @Param("totalScore") BigDecimal totalScore,
                      @Param("maxTotalScore") BigDecimal maxTotalScore,
                      @Param("scorePercentage") BigDecimal scorePercentage,
                      @Param("qualified") Boolean qualified,
                      @Param("comment") String comment,
                      @Param("qualificationThreshold") BigDecimal qualificationThreshold);

    void updateStatus(@Param("id") Long id, @Param("status") String status);

    void submit(@Param("id") Long id);

    void approve(@Param("id") Long id, @Param("approverUserId") Long approverUserId);

    void reject(@Param("id") Long id,
                @Param("approverUserId") Long approverUserId,
                @Param("reason") String reason);

    void softDelete(@Param("id") Long id);

    Integer findMaxSeqByYearHalf(@Param("periodYear") Integer periodYear,
                                 @Param("periodHalf") String periodHalf);

    int countByCompanyAndPeriod(@Param("companyId") Long companyId,
                                @Param("periodYear") Integer periodYear,
                                @Param("periodHalf") String periodHalf,
                                @Param("evaluationType") String evaluationType);
}
