import {Operator} from "./operator.model";
import {ResultTypes} from "./result-type.model";
import {DataType, DataTypes} from "./datatype.model";
import {Projections} from "./projection.model";
import {Unit, Interpolation} from "./unit.model";
import {ExpressionType} from "./operator-type.model";

describe("OperatorModel", () => {
  it("trivial", () => {
    let op = new Operator({
      operatorType: new ExpressionType({
          expression: "1*A",
          datatype: DataTypes.Float32,
          unit: new Unit({
              measurement: "raw",
              unit: "unknown",
              interpolation: Interpolation.Continuous
          }),
      }),
      resultType: ResultTypes.RASTER,
      projection: Projections.WGS_84,
      attributes: ["value"],
      dataTypes: new Map<string, DataType>().set("value", DataTypes.Float32),
      units: new Map<string, Unit>().set("value", new Unit({
          measurement: "raw",
          unit: "unknown",
          interpolation: Interpolation.Continuous
      }))
  });
    expect(op.resultType).toBe(ResultTypes.RASTER);
  });
});
