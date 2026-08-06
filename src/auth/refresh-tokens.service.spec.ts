import { RefreshTokensRepository } from './refresh-tokens.repository';
import { RefreshTokensService } from './refresh-tokens.service';

describe('RefreshTokensService', () => {
  let service: RefreshTokensService;
  let repository: jest.Mocked<RefreshTokensRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokensRepository>;
    service = new RefreshTokensService(repository);
  });

  it.each([undefined, null, '', '   ', 42, {}])(
    'does not query Prisma for an invalid token id: %p',
    async (id) => {
      await expect(service.findById(id)).resolves.toBeNull();

      expect(repository.findById.mock.calls).toHaveLength(0);
    },
  );

  it('does not try to revoke an invalid token id', async () => {
    await expect(service.revoke(undefined)).resolves.toBe(false);

    expect(repository.revoke.mock.calls).toHaveLength(0);
  });

  it('returns whether a valid token was revoked', async () => {
    repository.revoke.mockResolvedValue(true);

    await expect(service.revoke('refresh-token-id')).resolves.toBe(true);

    expect(repository.revoke.mock.calls).toEqual([['refresh-token-id']]);
  });

  it('looks up a valid token id', async () => {
    repository.findById.mockResolvedValue(null);

    await service.findById('refresh-token-id');

    expect(repository.findById.mock.calls).toEqual([['refresh-token-id']]);
  });
});
