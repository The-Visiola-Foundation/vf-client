import type { RosterRow } from '../types/mis';

export type RosterField = keyof RosterRow;

export interface ColumnDef {
  /** Roster field key, or the derived 'age' pseudo-column. */
  k: RosterField | 'age';
  t: string;
  /** Read-only: locked because the value is sourced or computed elsewhere. */
  ro?: boolean;
  /** Computed at read time from other fields. */
  derived?: boolean;
  w?: string;
}

export const COLS: ColumnDef[] = [
  { k: 'uid', t: 'Student ID', ro: true, w: '110px' },
  { k: 'first', t: 'First name' },
  { k: 'last', t: 'Last name' },
  { k: 'dob', t: 'Date of birth' },
  { k: 'age', t: 'Age', ro: true, derived: true },
  { k: 'email', t: 'E-mail' },
  { k: 'phone', t: 'Cell' },
  { k: 'school', t: 'School' },
  { k: 'match', t: 'Link status', ro: true },
];

/** A fresh, fully blank student row, matching the original "Add student". */
export function registerBlankRow(uid: string): RosterRow {
  return {
    uid,
    legacy: null,
    match: 'unmatched',
    dobFlag: false,
    first: null,
    last: null,
    dob: null,
    email: null,
    phone: null,
    school: null,
    father: null,
    mother: null,
    fatherEdu: null,
    fatherEmp: null,
    motherEdu: null,
    motherEmp: null,
    sis: null,
    bro: null,
    consent: null,
    fav: null,
    diff: null,
    car1: null,
    car2: null,
    t1: null,
    t2: null,
    t3: null,
    band: null,
  };
}
