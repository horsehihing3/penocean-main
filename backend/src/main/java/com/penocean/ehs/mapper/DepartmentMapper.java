package com.penocean.ehs.mapper;

import com.penocean.ehs.model.Department;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DepartmentMapper {

    List<Department> findAll();

    Department findById(@Param("id") Long id);

    Department findByCode(@Param("code") String code);

    void insert(Department d);

    void update(Department d);

    void softDelete(@Param("id") Long id);
}
