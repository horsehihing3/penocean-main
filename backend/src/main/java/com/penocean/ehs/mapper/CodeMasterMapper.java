package com.penocean.ehs.mapper;

import com.penocean.ehs.model.CodeMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CodeMasterMapper {

    List<CodeMaster> findByGroup(@Param("groupCode") String groupCode,
                                 @Param("activeOnly") Boolean activeOnly);

    CodeMaster findById(@Param("id") Long id);

    CodeMaster findByGroupAndCode(@Param("groupCode") String groupCode,
                                  @Param("code") String code);

    void insert(CodeMaster cm);

    void update(CodeMaster cm);

    void softDelete(@Param("id") Long id);
}
