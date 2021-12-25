import {Point2d} from "./point";

export class Angle {
  public static RADIANS_PER_DEGREE = Math.PI / 180;
  public static DEGREES_PER_RADIAN = 180 / Math.PI;

  private readonly _radians: number;

  private constructor(radians?: number) {
    this._radians = radians ?? 0;
  }

  public static fromRadians(radians: number) {
    const angle = new Angle(radians);
    return angle;
  }

  public static fromDegrees(degrees: number) {
    return Angle.fromRadians(degrees * Angle.RADIANS_PER_DEGREE);
  }

  public static fromPoints(p1: Point2d, p2: Point2d) {
    return Angle.fromRadians(Math.atan2(p2.y - p1.y, p2.x - p1.x));
  }

  get radians(): number {
    return this._radians;
  }

  get degrees(): number {
    return this.radians * Angle.DEGREES_PER_RADIAN;
  }
}
