package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.ProcedureDocResponse;
import com.penocean.ehs.model.ProcedureDoc;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ProcedureDocMapper {

    ProcedureDoc findById(@Param("id") Long id);

    /** procType 별 최신 1건 */
    ProcedureDocResponse findLatestByProcType(@Param("procType") String procType);

    void insert(ProcedureDoc doc);

    void softDelete(@Param("id") Long id);
}
