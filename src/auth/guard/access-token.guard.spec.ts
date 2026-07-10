import { AcessTokenGuard } from './access-token.guard';

describe('AcessTokenGuard', () => {
  it('should be defined', () => {
    expect(new AcessTokenGuard()).toBeDefined();
  });
});
