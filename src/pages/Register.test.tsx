import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Register } from './Register';

const registerHooks = vi.hoisted(() => ({
  useRegisterPage: vi.fn(),
  useSaveCell: vi.fn(),
}));

vi.mock('../queries/useRegister', () => registerHooks);

describe('Register', () => {
  it('shows the register scaffold and skeleton while the first page loads', () => {
    registerHooks.useSaveCell.mockReturnValue({ error: null });
    registerHooks.useRegisterPage.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isFetching: true,
      isLoading: true,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Student register' })).toBeTruthy();
    expect(screen.getByRole('searchbox')).toBeTruthy();
    expect(screen.getByRole('status')).toHaveTextContent('Loading student register…');
  });

  it('renders the loaded register page', () => {
    registerHooks.useSaveCell.mockReturnValue({ error: null });
    registerHooks.useRegisterPage.mockReturnValue({
      data: {
        data: [
          {
            id: 'VF-123',
            firstName: 'Ada',
            lastName: 'Lovelace',
            dateOfBirth: '2009-05-10',
            yearJoined: 2024,
            email: 'ada@example.com',
            phone: '555-0001',
            school: 'North Hill',
            country: 'Nigeria',
          },
        ],
        totalCount: 1,
        page: 1,
        page_size: 20,
        totalPages: 1,
      },
      error: null,
      isError: false,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    expect(screen.getByText('Showing 1 of 1 students')).toBeTruthy();
    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('Page 1 of 1')).toBeTruthy();
  });
});
