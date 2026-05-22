const { parseSheet } = require('../src/parseSheet');

const SAMPLE_CSV = `Sl no,Projects,Area,Items,Spent (Rs in Crs),Balance (Rs in Crs),Budget Per sft,Projected Pr sft,Impact Per sft,Impact (Rupees in Crs)
1,Motif,,Cost,,,,,,
,,,a. Building,39.77,1.43,2757.23,2459.27,-344.69,-6.25
,,,b. Infra,21.55,0.51,1442.85,1372.9,-92.08,-1.67
2,Octave,,Cost,,,,,,
,,,a. Building,23.77,17.09,2935.43,2918.63,-16.8,-0.23
,,,b. Infra,21.79,12.13,1556.28,1560.38,4.1,0.37`;

describe('parseSheet', () => {
  let result;

  beforeAll(() => {
    result = parseSheet(SAMPLE_CSV);
  });

  test('returns lastUpdated as a date string', () => {
    expect(result.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('returns two internal projects', () => {
    expect(result.internalProjects).toHaveLength(2);
  });

  test('first project is Motif', () => {
    expect(result.internalProjects[0].name).toBe('Motif');
  });

  test('Motif building spent is 39.77', () => {
    expect(result.internalProjects[0].financial.building.spent).toBe(39.77);
  });

  test('Motif building balance is 1.43', () => {
    expect(result.internalProjects[0].financial.building.balance).toBe(1.43);
  });

  test('Motif building budgetPerSft is 2757.23', () => {
    expect(result.internalProjects[0].financial.building.budgetPerSft).toBe(2757.23);
  });

  test('Motif building projectedPerSft is 2459.27', () => {
    expect(result.internalProjects[0].financial.building.projectedPerSft).toBe(2459.27);
  });

  test('Motif building impactPerSft is -344.69', () => {
    expect(result.internalProjects[0].financial.building.impactPerSft).toBe(-344.69);
  });

  test('Motif building impactCr is -6.25', () => {
    expect(result.internalProjects[0].financial.building.impactCr).toBe(-6.25);
  });

  test('Motif infra spent is 21.55', () => {
    expect(result.internalProjects[0].financial.infra.spent).toBe(21.55);
  });

  test('Motif status is green (projected < budget)', () => {
    expect(result.internalProjects[0].status).toBe('green');
  });

  test('Octave building status uses building projected vs budget', () => {
    // Octave building: projected 2918.63 vs budget 2935.43 → green
    expect(result.internalProjects[1].status).toBe('green');
  });

  test('returns empty arrays for externalProjects, initiators', () => {
    expect(result.externalProjects).toEqual([]);
    expect(result.initiators).toEqual([]);
  });

  test('returns null for salesMarketing', () => {
    expect(result.salesMarketing).toBeNull();
  });
});
