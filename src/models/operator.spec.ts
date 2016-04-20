import {Operator, ResultType} from "./operator.model";
import {DataType, DataTypes} from "./datatype.model";
import {Projections} from "./projection.model";
import {Unit, Interpolation} from "./unit.model";

describe("OperatorModel", () => {
  it("trivial", () => {
    let op = new Operator({
      operatorType: "testType",
      resultType: ResultType.RASTER,
      parameters: new Map<string, string | number>(),
      projection: Projections.WGS_84,
      attributes: ["value"],
      dataTypes: new Map<string, DataType>().set("value", DataTypes.Float32),
      units: new Map<string, Unit>().set("value", new Unit({
          measurement: "raw",
          unit: "unknown",
          interpolation: Interpolation.Continuous
      }))
  });
    expect(op.resultType).toBe(ResultType.RASTER);
  });
});
