package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.SeaCrewIncidentResponse;
import com.penocean.ehs.model.SeaCrewIncident;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SeaCrewIncidentMapper {

    SeaCrewIncident findById(@Param("id") Long id);

    List<SeaCrewIncidentResponse> findPage(@Param("vesselId") Long vesselId,
                                           @Param("year") Integer year,
                                           @Param("month") Integer month,
                                           @Param("incidentType") String incidentType,
                                           @Param("offset") int offset,
                                           @Param("limit") int limit);

    long count(@Param("vesselId") Long vesselId,
               @Param("year") Integer year,
               @Param("month") Integer month,
               @Param("incidentType") String incidentType);

    void insert(SeaCrewIncident incident);

    void bulkInsert(@Param("list") List<SeaCrewIncident> list);

    void softDelete(@Param("id") Long id);
}
