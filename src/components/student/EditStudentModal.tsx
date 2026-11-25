import { useState, type FormEvent } from 'react';
import type { RosterRow } from '../../types/mis';
import { useUpdateStudent } from '../../queries/useRegister';
import { Notice } from '../ui/primitives';

interface EditStudentModalProps {
  student: RosterRow;
  isOpen: boolean;
  onClose: () => void;
}

export function EditStudentModal({ student, isOpen, onClose }: EditStudentModalProps) {
  const updateMutation = useUpdateStudent();

  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'academic'>('personal');

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    school: string;
    country: string;
    address: string;
    father: string;
    fatherPhone: string;
    fatherEdu: string;
    mother: string;
    motherPhone: string;
    motherEdu: string;
    consent: boolean;
    fav: string;
    diff: string;
    car1: string;
    car2: string;
  }>({
    firstName: String(student.first ?? student.firstName ?? ''),
    lastName: String(student.last ?? student.lastName ?? ''),
    dateOfBirth: String(student.dob ?? student.dateOfBirth ?? ''),
    email: String(student.email ?? ''),
    phone: String(student.phone ?? ''),
    school: String(student.school ?? ''),
    country: String(student.country ?? ''),
    address: String(student.address ?? ''),
    father: String(student.father ?? ''),
    fatherPhone: String(student.fatherPhone ?? ''),
    fatherEdu: String(student.fatherEdu ?? ''),
    mother: String(student.mother ?? ''),
    motherPhone: String(student.motherPhone ?? ''),
    motherEdu: String(student.motherEdu ?? ''),
    consent: Boolean(student.consent),
    fav: String(student.fav ?? ''),
    diff: String(student.diff ?? ''),
    car1: String(student.car1 ?? ''),
    car2: String(student.car2 ?? ''),
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleChange(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await updateMutation.mutateAsync({
        id: String(student.uid),
        payload: {
          firstName: formData.firstName.trim() || null,
          lastName: formData.lastName.trim() || null,
          dateOfBirth: formData.dateOfBirth || null,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          school: formData.school.trim() || null,
          country: formData.country.trim() || null,
          address: formData.address.trim() || null,
          father: formData.father.trim() || null,
          fatherPhone: formData.fatherPhone.trim() || null,
          fatherEdu: formData.fatherEdu.trim() || null,
          mother: formData.mother.trim() || null,
          motherPhone: formData.motherPhone.trim() || null,
          motherEdu: formData.motherEdu.trim() || null,
          consent: formData.consent,
          fav: formData.fav.trim() || null,
          diff: formData.diff.trim() || null,
          car1: formData.car1.trim() || null,
          car2: formData.car2.trim() || null,
        },
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update student.');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-student-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-[620px] flex-col rounded-card border border-line bg-card shadow-xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 id="edit-student-title" className="text-[17px] font-semibold text-ink">
              Edit student record
            </h2>
            <p className="text-[12.5px] text-muted">ID: {String(student.uid)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-ink"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-line bg-paper px-6">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              activeTab === 'personal'
                ? 'border-vf-blue text-vf-blue'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Personal & Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('family')}
            className={`border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              activeTab === 'family'
                ? 'border-vf-blue text-vf-blue'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Family & Guardians
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              activeTab === 'academic'
                ? 'border-vf-blue text-vf-blue'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Academic & Career
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {errorMsg ? (
              <div className="mb-4">
                <Notice variant="err" title="Update failed">
                  <p>{errorMsg}</p>
                </Notice>
              </div>
            ) : null}

            {activeTab === 'personal' && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                    First name
                  </span>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                    Last name
                  </span>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                    Date of birth (YYYY-MM-DD)
                  </span>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">School</span>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => handleChange('school', e.target.value)}
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">Email</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">Phone</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>

                <label className="col-span-2 block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                    Country of origin
                  </span>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>
              </div>
            )}

            {activeTab === 'family' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                      Father name
                    </span>
                    <input
                      type="text"
                      value={formData.father}
                      onChange={(e) => handleChange('father', e.target.value)}
                      className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                      Father phone
                    </span>
                    <input
                      type="tel"
                      value={formData.fatherPhone}
                      onChange={(e) => handleChange('fatherPhone', e.target.value)}
                      className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                      Father education
                    </span>
                    <input
                      type="text"
                      value={formData.fatherEdu}
                      onChange={(e) => handleChange('fatherEdu', e.target.value)}
                      className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                      Mother name
                    </span>
                    <input
                      type="text"
                      value={formData.mother}
                      onChange={(e) => handleChange('mother', e.target.value)}
                      className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                      Mother phone
                    </span>
                    <input
                      type="tel"
                      value={formData.motherPhone}
                      onChange={(e) => handleChange('motherPhone', e.target.value)}
                      className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                      Mother education
                    </span>
                    <input
                      type="text"
                      value={formData.motherEdu}
                      onChange={(e) => handleChange('motherEdu', e.target.value)}
                      className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                    />
                  </label>
                </div>

                <div className="rounded-[8px] border border-line bg-paper p-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.consent}
                      onChange={(e) => handleChange('consent', e.target.checked)}
                      className="h-4 w-4 rounded border-line-2 text-vf-blue"
                    />
                    <span className="text-[13px] font-semibold text-ink">
                      Parental consent on file
                    </span>
                  </label>
                  <p className="mt-1 text-[11.5px] text-muted">
                    Required for compliance with the Nigeria Data Protection Act (NDPA).
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                    Favorite STEM subject
                  </span>
                  <input
                    type="text"
                    value={formData.fav}
                    onChange={(e) => handleChange('fav', e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                    Most difficult subject
                  </span>
                  <input
                    type="text"
                    value={formData.diff}
                    onChange={(e) => handleChange('diff', e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                    Career choice 1
                  </span>
                  <input
                    type="text"
                    value={formData.car1}
                    onChange={(e) => handleChange('car1', e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-ink-2">
                    Career choice 2
                  </span>
                  <input
                    type="text"
                    value={formData.car2}
                    onChange={(e) => handleChange('car2', e.target.value)}
                    placeholder="e.g. Data Scientist"
                    className="w-full rounded-[6px] border border-line-2 bg-card px-2.5 py-1.5 text-[13px]"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-line bg-paper px-6 py-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="rounded-[7px] border border-line-2 bg-card px-3.5 py-1.5 text-[13px] font-semibold text-ink-2 hover:bg-paper"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-[7px] bg-vf-blue px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-vf-blue/90 disabled:opacity-60"
            >
              {updateMutation.isPending ? 'Saving changes…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
