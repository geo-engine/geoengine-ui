import {Operator, ResultType} from "./operator.model";

describe("OperatorModel", () => {
  it("trivial", () => {
    let op = new Operator(
      "testType",
      ResultType.RASTER,
      new Map<string, string | number>(),
      "emptyProjection",
      "displayName"
    );
    expect(op.resultType).toBe(ResultType.RASTER);
  });
});
