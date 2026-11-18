import {
  INHALATION_RATES,
  INFILTRATION_RATIOS,
  MASK_EFFICIENCY,
  VEHICLE_INFILTRATION,
  BoundedParameter,
} from "../parameters";

describe("data/parameters", () => {
  function validateParam(name: string, param: BoundedParameter) {
    expect(param.low).toBeDefined();
    expect(param.central).toBeDefined();
    expect(param.high).toBeDefined();
    expect(param.low).toBeLessThanOrEqual(param.central);
    expect(param.central).toBeLessThanOrEqual(param.high);
    expect(param.unit.length).toBeGreaterThan(0);
    expect(param.source.length).toBeGreaterThan(0);
    expect(param.year).toBeGreaterThan(2000);
    expect(param.note.length).toBeGreaterThan(0);
  }

  it("ensures all inhalation rate entries are valid and bounded", () => {
    for (const [group, exertions] of Object.entries(INHALATION_RATES)) {
      for (const [exertion, param] of Object.entries(exertions)) {
        validateParam(`${group}.${exertion}`, param);
      }
    }
  });

  it("ensures infiltration ratios are valid and bounded", () => {
    for (const [key, param] of Object.entries(INFILTRATION_RATIOS)) {
      validateParam(key, param);
    }
  });

  it("ensures mask efficiencies are valid and bounded", () => {
    for (const [key, param] of Object.entries(MASK_EFFICIENCY)) {
      validateParam(key, param);
    }
  });

  it("ensures vehicle infiltration values are valid and bounded", () => {
    for (const [key, param] of Object.entries(VEHICLE_INFILTRATION)) {
      validateParam(key, param);
    }
  });
});
