import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';


/**
 * Guard that will protect listing routes from any forigen requests
 * Only users that work for that company allowed to do CUD listing requests
 */
@Injectable()
export class CompanyWorkersGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    const companyId = (request as any)?.body?.companyId;
    const userId = (request as any).user?.id;

    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId }
    }) 

    if (!user) {
      throw new ForbiddenException("You are not allowed to manage this company");
    }

    return true;
  }
}
