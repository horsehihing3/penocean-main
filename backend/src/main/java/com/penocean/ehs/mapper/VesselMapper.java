package com.penocean.ehs.mapper;

import com.penocean.ehs.model.Vessel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface VesselMapper {

    Vessel findById(@Param("id") Long id);

    List<Vessel> findAll();
}
