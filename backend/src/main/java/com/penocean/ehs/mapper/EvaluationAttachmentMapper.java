package com.penocean.ehs.mapper;

import com.penocean.ehs.model.EvaluationAttachment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EvaluationAttachmentMapper {

    List<EvaluationAttachment> findByEvaluation(@Param("evaluationId") Long evaluationId);

    EvaluationAttachment findById(@Param("id") Long id);

    void insert(EvaluationAttachment attachment);

    void softDelete(@Param("id") Long id);
}
