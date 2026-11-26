import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RegisterTable } from './RegisterTable';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

describe('RegisterTable', () => {
  it('shows a student detail action and hides the removed columns', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/register?name=Ada&page=2&limit=20']}>
        <RegisterTable
          rows={[
            {
              id: 'VF-123',
              uid: 'VF-123',
              first: 'Ada',
              last: 'Lovelace',
              dob: '2009-05-10',
              age: 16,
              email: 'ada@example.com',
              phone: '555-0001',
              school: 'North Hill',
              match: 'confirmed',
              legacy: null,
              dobFlag: false,
              father: null,
              mother: null,
              fatherEdu: null,
              fatherEmp: null,
              motherEdu: null,
              motherEmp: null,
              sis: null,
              bro: null,
              consent: true,
              fav: null,
              diff: null,
              car1: null,
              car2: null,
              t1: null,
              t2: null,
              t3: null,
              band: null,
            },
          ]}
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Student ID')).toBeNull();
    expect(screen.queryByText('Link status')).toBeNull();

    const viewButton = screen.getByRole('button', { name: 'View student details' });
    expect(viewButton).toBeTruthy();
    await user.click(viewButton);
    expect(screen.getByTestId('location').textContent).toBe(
      '/students/VF-123?name=Ada&page=2&limit=20',
    );
  });
});
