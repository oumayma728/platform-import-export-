import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesRepository } from './companies.repository';

@Injectable()
export class CompaniesService {
  constructor(private readonly companiesRepository: CompaniesRepository) {}

  async create(createCompanyDto: CreateCompanyDto) {
    const data: any = {
      name: createCompanyDto.name,
      isExporter: createCompanyDto.isExporter,
      isImporter: createCompanyDto.isImporter,
      country: createCompanyDto.country,
      description: createCompanyDto.description,
      website: createCompanyDto.website,
      logoUrl: createCompanyDto.logoUrl,
      registrationNumber: createCompanyDto.registrationNumber,
    };

    if (createCompanyDto.certificationDocs !== undefined) {
      data.certificationDocs = createCompanyDto.certificationDocs;
    }

    return this.companiesRepository.create(data);
  }

  async findAll() {
    return this.companiesRepository.findAll();
  }

  async findOne(id: string) {
    const company = await this.companiesRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const existing = await this.companiesRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    const data: any = {
      ...updateCompanyDto,
    };

    if (updateCompanyDto.certificationDocs !== undefined) {
      data.certificationDocs = updateCompanyDto.certificationDocs;
    }

    return this.companiesRepository.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.companiesRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    await this.companiesRepository.remove(id);

    return true;
  }
}
