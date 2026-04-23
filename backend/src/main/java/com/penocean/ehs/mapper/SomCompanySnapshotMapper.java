package com.penocean.ehs.mapper;

import com.penocean.ehs.model.SomCompanySnapshot;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SomCompanySnapshotMapper {

    SomCompanySnapshot findByBusinessNumber(@Param("businessNumber") String businessNumber);

    List<SomCompanySnapshot> findAll(@Param("keyword") String keyword,
                                     @Param("offset") int offset,
                                     @Param("limit") int limit);

    long count(@Param("keyword") String keyword);

    /** MERGE (upsert) by business_number. */
    void upsert(SomCompanySnapshot snapshot);
}
