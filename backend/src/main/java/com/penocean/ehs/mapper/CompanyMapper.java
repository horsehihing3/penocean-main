package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.CompanyListItem;
import com.penocean.ehs.model.Company;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CompanyMapper {

    Company findById(@Param("id") Long id);

    Company findByBusinessNumber(@Param("businessNumber") String businessNumber);

    List<Company> findAll(@Param("keyword") String keyword,
                          @Param("industryCode") String industryCode);

    List<CompanyListItem> findPage(@Param("keyword") String keyword,
                                   @Param("status") String status,
                                   @Param("industryCode") String industryCode,
                                   @Param("offset") int offset,
                                   @Param("limit") int limit);

    long countPage(@Param("keyword") String keyword,
                   @Param("status") String status,
                   @Param("industryCode") String industryCode);

    void inactivate(@Param("id") Long id);

    void insert(Company company);

    void update(Company company);
}
