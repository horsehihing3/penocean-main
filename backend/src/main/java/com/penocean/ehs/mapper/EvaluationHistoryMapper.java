package com.penocean.ehs.mapper;

import com.penocean.ehs.model.EvaluationHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EvaluationHistoryMapper {

    void insert(EvaluationHistory history);

    List<EvaluationHistory> findByEvaluation(@Param("evaluationId") Long evaluationId);

    List<EvaluationHistory> findByImprovement(@Param("improvementId") Long improvementId);
}
