import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ValidationStatus } from '@prisma/client';

import { AdminRepository } from './admin.repository';
import { GetCompaniesFilterDto } from './dto/get-companies-filter.dto';
import { NotificationsService } from '../integrations/notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getCompanies(filterDto: GetCompaniesFilterDto) {
    return this.adminRepository.findCompanies(filterDto.status);
  }

  async validateCompany(id: string) {
    this.ensureValidCompanyId(id);
    await this.ensureCompanyExists(id);
    const updated = await this.adminRepository.updateCompanyStatus(
      id,
      ValidationStatus.VALIDE,
    );

    // Notify company users about validation
    for (const user of updated.users || []) {
      await this.notificationsService
        .sendCompanyValidationNotification(
          { id: user.id, email: user.email, name: user.name },
          updated.name,
          ValidationStatus.VALIDE,
        )
        .catch(() => {});
    }

    return updated;
  }

  async rejectCompany(id: string) {
    this.ensureValidCompanyId(id);
    await this.ensureCompanyExists(id);
    const updated = await this.adminRepository.updateCompanyStatus(
      id,
      ValidationStatus.REJETE,
    );

    // Notify company users about rejection
    for (const user of updated.users || []) {
      await this.notificationsService
        .sendCompanyValidationNotification(
          { id: user.id, email: user.email, name: user.name },
          updated.name,
          ValidationStatus.REJETE,
        )
        .catch(() => {});
    }

    return updated;
  }

  async suspendCompany(id: string) {
    this.ensureValidCompanyId(id);
    await this.ensureCompanyExists(id);
    return this.adminRepository.updateCompanyStatus(
      id,
      ValidationStatus.SUSPENDU,
    );
  }

  private ensureValidCompanyId(id: string) {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new BadRequestException('Company ID is required.');
    }
  }

  private async ensureCompanyExists(id: string) {
    const company = await this.adminRepository.findCompanyById(id);
    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found.`);
    }
    return company;
  }
}
