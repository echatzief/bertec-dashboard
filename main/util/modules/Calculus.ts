class Calculus {
  static integral(x: Array<number>, y: Array<number>): number {
    let area: number = 0;

    for (var i = 0; i < y.length - 1; i++){
      area += (x[i + 1] - x[i])*(y[i] + y[i + 1]);
    }

    return area / 2;
  }

  static slope(x1: number, y1: number, x2: number, y2: number): number{
    if ((x2 - x1) == 0) {
      return 0;
    }
    return (y2 - y1)/(x2 - x1);
  }

  static findFirstlocalMax(x: Array<number>): number {
    let lm = 0;

    for (var i = 1; i < x.length - 1; ++i) {
      if (x[i - 1] < x[i] && x[i] > x[i + 1]) {
        lm = x[i];
        break;
      }
    }

    return lm;
  }

  static findIndexOfFirstlocalMax(x: Array<number>): number {
    let ilm = 0;

    for (var i = 1; i < x.length - 1; ++i) {
      if (x[i - 1] < x[i] && x[i] > x[i + 1]) {
        ilm = i;
        break;
      }
    }

    return ilm;
  }

  static findMaxFromLocalMaxs(x: Array<number>): number {
    let lms = [];

    for (var i = 1; i < x.length - 1; ++i) {
      if (x[i - 1] < x[i] && x[i] > x[i + 1]) {
        lms.push(x[i]);
      }
    }

    return lms.length > 0 ? Math.max(...lms): 0;
  }

  static findIndexOfMaxFromLocalMaxs(x: Array<number>): number {
    let lms = [];

    for (var i = 1; i < x.length - 1; ++i) {
      if (x[i - 1] < x[i] && x[i] > x[i + 1]) {
        lms.push(x[i]);
      }
    }

    return lms.length > 0 ? x.indexOf(Math.max(...lms)): 0;
  }

  static findIndexOfSignChange(x: Array<number>): number {
    let ilm = 0;

    for (var i = 1; i < x.length - 1; ++i) {
      if (x[i - 1] >= 0 && x[i] <= 0 && x[i+1] <= 0) {
        ilm = i+1;
        break;
      }
    }

    return ilm;
  }

  static findIndexOfSecondLocalMax(x: Array<number>): number {
    let ilm = 0;

    for (var i = 1; i < x.length - 1; ++i) {
      if (x[i - 1] < x[i] && x[i] > x[i + 1]) {
        ilm = i;
      }
    }

    return ilm;
  }
}

export { Calculus }