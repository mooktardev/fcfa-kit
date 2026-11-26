import { normalizeText } from '../core/text';
import citiesJson from './data/cities.json';
import departmentsJson from './data/departments.json';
import regionsJson from './data/regions.json';

/** ISO 3166-2:CM subdivision suffix (`CM-CE` -> `CE`). */
export type RegionCode = 'AD' | 'CE' | 'ES' | 'EN' | 'LT' | 'NO' | 'NW' | 'OU' | 'SU' | 'SW';

export interface Region {
  readonly code: RegionCode;
  /** ISO 3166-2 code, e.g. `"CM-CE"`. */
  readonly iso: string;
  readonly name: string;
  readonly nameEn: string;
  /** Chef-lieu. */
  readonly capital: string;
}

export interface Department {
  /** Stable slug, e.g. `"mfoundi"`. */
  readonly id: string;
  readonly name: string;
  readonly regionCode: RegionCode;
  /** Chef-lieu. */
  readonly capital: string;
}

export interface City {
  /** Stable slug, e.g. `"yaounde"`. */
  readonly id: string;
  readonly name: string;
  readonly departmentId: string;
  readonly regionCode: RegionCode;
  readonly isDepartmentCapital: boolean;
  readonly isRegionCapital: boolean;
}

/** The 10 regions. */
export const regions: readonly Region[] = regionsJson as readonly Region[];
/** The 58 departments. */
export const departments: readonly Department[] = departmentsJson as readonly Department[];
/**
 * The 58 department capitals, plus a few other large towns.
 * Not an exhaustive list of localities.
 */
export const cities: readonly City[] = citiesJson as readonly City[];

/** Finds a region by ISO code (`"CE"`, `"CM-CE"`) or by name, ignoring accents and case. */
export function getRegion(codeOrName: string): Region | undefined {
  const key = normalizeText(codeOrName);
  return regions.find(
    (r) =>
      normalizeText(r.code) === key ||
      normalizeText(r.iso) === key ||
      normalizeText(r.name) === key ||
      normalizeText(r.nameEn) === key,
  );
}

/** Finds a department by id or name, ignoring accents and case. */
export function getDepartment(idOrName: string): Department | undefined {
  const key = normalizeText(idOrName);
  return departments.find((d) => normalizeText(d.id) === key || normalizeText(d.name) === key);
}

export function getDepartmentsByRegion(regionCode: RegionCode): readonly Department[] {
  return departments.filter((d) => d.regionCode === regionCode);
}

export function getCitiesByDepartment(departmentId: string): readonly City[] {
  return cities.filter((c) => c.departmentId === departmentId);
}

/**
 * Searches cities by name, ignoring accents and case. Names that start with
 * the query come first.
 *
 * @example
 * findCities('yaounde')[0]?.name; // "Yaoundé"
 */
export function findCities(query: string, options: { limit?: number } = {}): readonly City[] {
  const key = normalizeText(query);
  if (!key) return [];
  const starts: City[] = [];
  const contains: City[] = [];
  for (const city of cities) {
    const name = normalizeText(city.name);
    if (name.startsWith(key)) starts.push(city);
    else if (name.includes(key)) contains.push(city);
  }
  return [...starts, ...contains].slice(0, options.limit ?? Infinity);
}
