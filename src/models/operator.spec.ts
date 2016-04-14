import {Operator, ResultType} from "./operator.model";
import {Projections} from "./projection.model";

describe("OperatorModel", () => {
  it("trivial", () => {
    let op = new Operator(
      "testType",
      ResultType.RASTER,
      new Map<string, string | number>(),
      Projections.WGS_84,
      "displayName"
    );
    expect(op.resultType).toBe(ResultType.RASTER);
  });
});
