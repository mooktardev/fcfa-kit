import type { CountryModule } from '../core/country';
import type { CmOperator } from './operators';
import {
  CM_DIAL_CODE,
  formatPhone,
  getPhoneOperator,
  isValidPhone,
  maskPhone,
  normalizePhone,
  parsePhone,
} from './phone';

export {
  CM_DIAL_CODE,
  PHONE_MASKS,
  formatPhone,
  getPhoneOperator,
  isValidPhone,
  maskPhone,
  normalizePhone,
  parsePhone,
} from './phone';
export type { CmParsedPhone, ValidateOptions } from './phone';

export { PREFIX_RULES, findPrefixRule } from './operators';
export type { CmOperator, CmPhoneKind, PrefixRule } from './operators';

export {
  cities,
  departments,
  findCities,
  getCitiesByDepartment,
  getDepartment,
  getDepartmentsByRegion,
  getRegion,
  regions,
} from './geo';
export type { City, Department, Region, RegionCode } from './geo';

/** Cameroon, as a generic country module (what the React package consumes). */
export const cameroon = {
  iso2: 'CM',
  name: 'Cameroun',
  zone: 'XAF',
  dialCode: CM_DIAL_CODE,
  phone: {
    normalize: normalizePhone,
    isValid: (input) => isValidPhone(input),
    getOperator: (input) => getPhoneOperator(input),
    parse: parsePhone,
    format: formatPhone,
    mask: (input) => maskPhone(input),
  },
} as const satisfies CountryModule<CmOperator>;
