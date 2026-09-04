/** @vitest-environment jsdom */
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LogisticsCard from './LogisticsCard';

vi.mock('../../logistics/api/logistics', () => ({
  convertCurrency: vi.fn(),
  estimateLogistics: vi.fn(),
}));

describe('LogisticsCard', () => {
  it('does not show a logistics estimate when origin and destination are the same country', async () => {
    const { estimateLogistics } = await import('../../logistics/api/logistics');
    const { container } = render(
      <LogisticsCard
        originCountry="TN"
        destinationCountry="TN"
      />
    );

    expect(estimateLogistics).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });
});
