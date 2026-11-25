import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from './client';
import { updateStudent, fetchStudent } from './register';

describe('register.ts student endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateStudent', () => {
    it('dispatches PATCH request to /students/:id with payload', async () => {
      const patchSpy = vi.spyOn(api, 'patch').mockResolvedValueOnce({
        id: 'VF-0001',
        firstName: 'Zainab',
        lastName: 'Ahmed',
        email: 'zainab@example.com',
      });

      const updated = await updateStudent('VF-0001', {
        firstName: 'Zainab',
        lastName: 'Ahmed',
        email: 'zainab@example.com',
      });

      expect(patchSpy).toHaveBeenCalledWith(
        '/students/VF-0001',
        expect.objectContaining({
          firstName: 'Zainab',
          lastName: 'Ahmed',
          email: 'zainab@example.com',
        }),
      );
      expect(updated.first).toBe('Zainab');
      expect(updated.last).toBe('Ahmed');
      expect(updated.email).toBe('zainab@example.com');
    });
  });

  describe('fetchStudent', () => {
    it('fetches student by id and normalizes properties', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce({
        id: 'VF-0002',
        firstName: 'Amina',
        lastName: 'Bello',
        dateOfBirth: '2008-05-12',
        school: 'Government Secondary School',
      });

      const student = await fetchStudent('VF-0002');
      expect(student.id).toBe('VF-0002');
      expect(student.firstName).toBe('Amina');
      expect(student.lastName).toBe('Bello');
    });

    it('correctly handles full backend payload with cbcProfile and cbcParticipation', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce({
        id: 'ffa8e01b-9257-4684-bc56-6664f5b01357',
        firstName: 'Silifat',
        lastName: 'Yusuf',
        email: 'silifatyusuf1511@gmail.com',
        phone: '8095839154',
        dateOfBirth: '2001-12-15',
        address: 'Byazhin Across Kubwa Abuja',
        country: 'Nigeria',
        yearJoined: 2018,
        ascgProfile: null,
        cbcProfile: {
          id: '3abcba52-3407-4613-9a00-3877d2640089',
          studentId: 'ffa8e01b-9257-4684-bc56-6664f5b01357',
          school: 'GSS Kubwa',
          priorTechEducation: 'none',
          priorTechExperience: 'none',
          completedProgram: true,
        },
        ascgParticipation: [],
        cbcParticipation: [
          {
            id: 1261,
            studentId: 'ffa8e01b-9257-4684-bc56-6664f5b01357',
            cohort: 'one',
            trackId: '1',
            year: 2023,
          },
        ],
        scParticipation: [],
        consent: false,
      });

      const student = await fetchStudent('ffa8e01b-9257-4684-bc56-6664f5b01357');
      expect(student.id).toBe('ffa8e01b-9257-4684-bc56-6664f5b01357');
      expect(student.firstName).toBe('Silifat');
      expect(student.lastName).toBe('Yusuf');
      expect(student.consent).toBe(false);
      expect(student.cbcProfile).toBeDefined();
    });
  });
});
