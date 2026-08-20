import { Test, TestingModule } from '@nestjs/testing';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';

describe('LogisticsController', () => {
  let controller: LogisticsController;
  let service: { calculate_route: jest.Mock };

  beforeEach(async () => {
    service = {
      calculate_route: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogisticsController],
      providers: [
        {
          provide: LogisticsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<LogisticsController>(LogisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates estimate calculation to LogisticsService.calculate_route', async () => {
    const mockResult = {
      origin_country: 'Tunisia',
      destination_country: 'France',
      distance_km: 1780.5,
      estimated_cost_usd: 851.23,
      estimated_days: 5,
    };

    service.calculate_route.mockResolvedValue(mockResult);

    const query = { from: 'Tunisia', to: 'France' };
    const result = await controller.estimate(query);

    expect(result).toEqual(mockResult);
    expect(service.calculate_route).toHaveBeenCalledWith('Tunisia', 'France');
  });
});
