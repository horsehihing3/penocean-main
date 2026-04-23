package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.EvaluationImprovementResponse;
import com.penocean.ehs.model.EvaluationImprovement;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EvaluationImprovementMapper {

    List<EvaluationImprovementResponse> findPage(@Param("evaluationId") Long evaluationId,
                                                 @Param("status") String status,
                                                 @Param("companyId") Long companyId,
                                                 @Param("offset") int offset,
                                                 @Param("limit") int limit);

    long count(@Param("evaluationId") Long evaluationId,
               @Param("status") String status,
               @Param("companyId") Long companyId);

    EvaluationImprovement findById(@Param("id") Long id);

    EvaluationImprovementResponse findByIdDetail(@Param("id") Long id);

    void insert(EvaluationImprovement improvement);

    void respond(@Param("id") Long id,
                 @Param("responseContent") String responseContent,
                 @Param("responseUserId") Long responseUserId);

    void close(@Param("id") Long id);
}
