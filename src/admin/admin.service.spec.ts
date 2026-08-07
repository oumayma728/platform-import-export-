import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationStatus } from '@prisma/client';

import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let repository: Record<keyof AdminRepository, jest.Mock>;

  beforeEach(async () => {
    repository = {
      findCompanies: jest.fn(),
      findCompanyById: jest.fn(),
      updateCompanyStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: AdminRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCompanies', () => {
    it('should call findCompanies with given status filter', async () => {
      repository.findCompanies.mockResolvedValue([]);
      await service.getCompanies({ status: ValidationStatus.EN_ATTENTE_VALIDATION });
      expect(repository.findCompanies).toHaveBeenCalledWith(
        ValidationStatus.EN_ATTENTE_VALIDATION,
      );
    });
  });

  describe('validateCompany', () => {
    it('should update validationStatus to VALIDE', async () => {
      repository.findCompanyById.mockResolvedValue({ id: 'comp-1' });
      repository.updateCompanyStatus.mockResolvedValue({
        id: 'comp-1',
        validationStatus: ValidationStatus.VALIDE,
      });

      const res = await service.validateCompany('comp-1');
      expect(repository.updateCompanyStatus).toHaveBeenCalledWith(
        'comp-1',
        ValidationStatus.VALIDE,
      );
      expect(res.validationStatus).toBe(ValidationStatus.VALIDE);
    });

    it('should throw a bad request when the company id is missing', async () => {
      await expect(service.validateCompany('   ')).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findCompanyById).not.toHaveBeenCalled();
    });
  });
});
