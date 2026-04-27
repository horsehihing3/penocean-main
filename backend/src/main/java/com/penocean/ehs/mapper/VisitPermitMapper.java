package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.VisitPermitResponse;
import com.penocean.ehs.model.VisitPermit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface VisitPermitMapper {

    VisitPermit findById(@Param("id") Long id);

    VisitPermitResponse findDetailById(@Param("id") Long id);

    VisitPermitResponse findByPermitNo(@Param("permitNo") String permitNo);

    VisitPermitResponse findByAccessRequestId(@Param("accessRequestId") Long accessRequestId);

    List<VisitPermitResponse> findPage(@Param("companyId") Long companyId,
                                       @Param("vesselId") Long vesselId,
                                       @Param("validDateFrom") LocalDate validDateFrom,
                                       @Param("validDateTo") LocalDate validDateTo,
                                       @Param("revoked") Boolean revoked,
                                       @Param("offset") int offset,
                                       @Param("limit") int limit);

    long count(@Param("companyId") Long companyId,
               @Param("vesselId") Long vesselId,
               @Param("validDateFrom") LocalDate validDateFrom,
               @Param("validDateTo") LocalDate validDateTo,
               @Param("revoked") Boolean revoked);

    void insert(VisitPermit permit);

    void revoke(@Param("id") Long id,
                @Param("reason") String reason);

    Integer findMaxPermitNoSeq(@Param("dateYmd") String dateYmd);
}
