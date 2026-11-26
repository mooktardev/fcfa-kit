import { describe, expect, it } from 'vitest';
import {
  cities,
  departments,
  findCities,
  getCitiesByDepartment,
  getDepartment,
  getDepartmentsByRegion,
  getRegion,
  regions,
  type RegionCode,
} from '../../src/cm';

describe('reference data integrity', () => {
  it('has 10 regions and 58 departments', () => {
    expect(regions).toHaveLength(10);
    expect(departments).toHaveLength(58);
  });

  it('has the expected number of departments per region', () => {
    const expected: Record<RegionCode, number> = {
      AD: 5, CE: 10, ES: 4, EN: 6, LT: 4, NO: 4, NW: 7, OU: 8, SU: 4, SW: 6,
    };
    for (const [code, count] of Object.entries(expected)) {
      expect(getDepartmentsByRegion(code as RegionCode), code).toHaveLength(count);
    }
  });

  it('uses unique ids', () => {
    for (const list of [regions.map((r) => r.code), departments.map((d) => d.id), cities.map((c) => c.id)]) {
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it('links every department to an existing region', () => {
    const codes = new Set(regions.map((r) => r.code));
    for (const d of departments) expect(codes.has(d.regionCode), d.id).toBe(true);
  });

  it('links every city to a department of the same region', () => {
    for (const c of cities) {
      const department = getDepartment(c.departmentId);
      expect(department, c.id).toBeDefined();
      expect(department?.regionCode, c.id).toBe(c.regionCode);
    }
  });

  it('has a city for every department capital, inside that department', () => {
    for (const d of departments) {
      const capital = cities.find((c) => c.isDepartmentCapital && c.departmentId === d.id);
      expect(capital?.name, d.id).toBe(d.capital);
    }
  });

  it('has exactly one region-capital city per region, matching the region record', () => {
    for (const r of regions) {
      const flagged = cities.filter((c) => c.isRegionCapital && c.regionCode === r.code);
      expect(flagged.map((c) => c.name), r.code).toEqual([r.capital]);
    }
  });

  it('uses ISO 3166-2 codes', () => {
    for (const r of regions) expect(r.iso).toBe(`CM-${r.code}`);
  });
});

describe('lookups', () => {
  it('finds a region by code, ISO code or name, ignoring accents and case', () => {
    expect(getRegion('CE')?.name).toBe('Centre');
    expect(getRegion('CM-CE')?.name).toBe('Centre');
    expect(getRegion('extreme-nord')?.code).toBe('EN');
    expect(getRegion('Far North')?.code).toBe('EN');
    expect(getRegion('Nord')?.code).toBe('NO');
    expect(getRegion('Nord-Ouest')?.code).toBe('NW');
    expect(getRegion('atlantis')).toBeUndefined();
  });

  it('finds a department by id or name', () => {
    expect(getDepartment('mfoundi')?.capital).toBe('Yaoundé');
    expect(getDepartment('Nyong-et-Kelle')?.capital).toBe('Éséka');
    expect(getDepartment("Nyong-et-So'o")?.id).toBe('nyong-et-so-o');
    expect(getDepartment('nope')).toBeUndefined();
  });

  it('lists the cities of a department', () => {
    expect(getCitiesByDepartment('fako').map((c) => c.name).sort()).toEqual(['Buéa', 'Limbé', 'Tiko']);
  });

  it('searches cities, ignoring accents and case, prefix matches first', () => {
    expect(findCities('yaounde')[0]?.name).toBe('Yaoundé');
    expect(findCities('ESEKA')[0]?.name).toBe('Éséka');
    expect(findCities('')).toEqual([]);
    expect(findCities('zzzz')).toEqual([]);
    const results = findCities('ba').map((c) => c.name);
    expect(results.length).toBeGreaterThan(2);
    expect(results[0]?.toLowerCase().startsWith('ba')).toBe(true);
    expect(findCities('ba', { limit: 2 })).toHaveLength(2);
  });
});
