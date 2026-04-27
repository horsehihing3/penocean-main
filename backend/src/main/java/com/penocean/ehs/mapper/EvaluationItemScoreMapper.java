package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.EvaluationDetailResponse;
import com.penocean.ehs.model.EvaluationItemScore;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EvaluationItemScoreMapper {

    List<EvaluationItemScore> findByEvaluation(@Param("evaluationId") Long evaluationId);

    List<EvaluationDetailResponse.ItemScoreItem> findByEvaluationWithItem(@Param("evaluationId") Long evaluationId);

    void bulkInsert(@Param("items") List<EvaluationItemScore> items);

    void deleteByEvaluation(@Param("evaluationId") Long evaluationId);
}
