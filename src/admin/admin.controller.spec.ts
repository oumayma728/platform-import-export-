import { Test, TestingModule } from '@nestjs/testing';
import { ValidationStatus } from '@prisma/client';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: Record<keyof AdminService, jest.Mock>;

  beforeEach(async () => {
    service = {
      getCompanies: jest.fn(),
      validateCompany: jest.fn(),
      rejectCompany: jest.fn(),
      suspendCompany: jest.fn(),
      ensureCompanyExists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCompanies', () => {
    it('should call adminService.getCompanies', async () => {
      service.getCompanies.mockResolvedValue([]);
      await controller.getCompanies({ status: ValidationStatus.EN_ATTENTE_VALIDATION });
      expect(service.getCompanies).toHaveBeenCalledWith({
        status: ValidationStatus.EN_ATTENTE_VALIDATION,
      });
    });
  });

  describe('validateCompany', () => {
    it('should call adminService.validateCompany', async () => {
      service.validateCompany.mockResolvedValue({ id: 'comp-1' });
      await controller.validateCompany('comp-1');
      expect(service.validateCompany).toHaveBeenCalledWith('comp-1');
    });
  });
});
