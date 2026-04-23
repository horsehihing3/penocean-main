package com.penocean.ehs.mapper;

import com.penocean.ehs.model.AccessWorker;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AccessWorkerMapper {

    List<AccessWorker> findByRequest(@Param("accessRequestId") Long accessRequestId);

    AccessWorker findById(@Param("id") Long id);

    void insert(AccessWorker worker);

    void bulkInsert(@Param("list") List<AccessWorker> list);

    int countByRequest(@Param("accessRequestId") Long accessRequestId);

    void deleteByRequest(@Param("accessRequestId") Long accessRequestId);

    void softDelete(@Param("id") Long id);

    void updateEduStatus(@Param("id") Long id,
                         @Param("completed") boolean completed,
                         @Param("certificateUrl") String certificateUrl);

    void updateCheckByShip(@Param("id") Long id,
                           @Param("checked") boolean checked,
                           @Param("userId") Long userId);
}
