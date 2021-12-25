export class Random {

  static between(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

}

export class Assert {

  static notNull<T>(value: T | undefined | null, errorMessage: string): T {
    if (!value) {
      throw new Error(errorMessage);
    }
    return value;
  }

}
