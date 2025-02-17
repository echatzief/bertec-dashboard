import { LineChartSeries, StepsDataForAverageMetrics, AverageMetrics, StepsDataForMetrics, NormalMetrics, StepDurationsPerFoot, StepDuration } from "./Interfaces";
import { Calculus } from './Calculus';
import moment from "moment";

class Metrics {

  static removeNoizyData(arr: Array<number>, rate: number): Array<number> {
    const average = arr.reduce((a, b) => a + b, 0) / arr.length || 0;
    const limit = average + rate * average;
    for (var i = 0; i < arr.length; i++){
      if (arr[i] > limit || arr[i] < limit) {
        arr.splice(i, 1);
      }
    }
    return arr;
  }

  static generateAsymmetries(sd: StepDurationsPerFoot) {
    
    let stance = 0;
    let step = 0;
    
    for (var i = 0; i < sd.length; i++){
      if (
        sd.right[i].startTimestamp != sd.right[i].endTimestamp &&
        sd.left[i].startTimestamp != sd.left[i].endTimestamp
      ) {
        if ( (Number(sd.right[i].endTimestamp) - Number(sd.right[i].startTimestamp) ) > ( Number(sd.left[i].endTimestamp) - Number(sd.left[i].startTimestamp)) ) {
          stance += (Number(sd.left[i].endTimestamp) - Number(sd.left[i].startTimestamp))/(Number(sd.right[i].endTimestamp)- Number(sd.right[i].startTimestamp))
          step += (Number(sd.left[i].endTimestamp) - Number(sd.left[i].startTimestamp) + Math.abs(Number(sd.right[i].endTimestamp) - Number(sd.left[i].startTimestamp)))/(Number(sd.right[i].endTimestamp)- Number(sd.right[i].startTimestamp) + Math.abs(Number(sd.left[i].endTimestamp) - Number(sd.right[i].startTimestamp)))

        } else {
          stance += (Number(sd.right[i].endTimestamp) - Number(sd.right[i].startTimestamp))/(Number(sd.left[i].endTimestamp)- Number(sd.left[i].startTimestamp))
          step += (Number(sd.right[i].endTimestamp) - Number(sd.right[i].startTimestamp) + Math.abs(Number(sd.left[i].endTimestamp) - Number(sd.right[i].startTimestamp)))/(Number(sd.left[i].endTimestamp)- Number(sd.left[i].startTimestamp) + Math.abs(Number(sd.right[i].endTimestamp) - Number(sd.left[i].startTimestamp)))
        }
      }
    }

    return {
      stance,
      step
    }
  }

  static generate(steps: StepsDataForMetrics, frequency: number, sd: StepDurationsPerFoot) {
    
    const metrics = {
      left: {
        fx: {
          ...this.calculateMetricsPerFoot(steps.fx.left, frequency),
          ...this.calculateLateralMetrics(steps.fx.left, frequency,true)
        },
        fy: {
          ...this.calculateMetricsPerFoot(steps.fy.left, frequency),
          ...this.calculateBrakingMetrics(steps.fy.left, frequency),
          ...this.calculatePropulsiveMetrics(steps.fy.left, frequency),
        },
        fz: {
          ...this.calculateMetricsPerFoot(steps.fz.left, frequency),
          ...this.calculateStepDurations(steps.fz.left, frequency),
          ...this.calculateStrideDuration(sd.left)
        },
      },
      right: {
        fx: {
          ...this.calculateMetricsPerFoot(steps.fx.right, frequency),
          ...this.calculateLateralMetrics(steps.fx.right, frequency,false)
        },
        fy: {
          ...this.calculateMetricsPerFoot(steps.fy.right, frequency),
          ...this.calculateBrakingMetrics(steps.fy.right, frequency),
          ...this.calculatePropulsiveMetrics(steps.fy.right, frequency),
        },
        fz: {
          ...this.calculateMetricsPerFoot(steps.fz.right, frequency),
          ...this.calculateStepDurations(steps.fz.right, frequency),
          ...this.calculateStrideDuration(sd.right)
        },
      }
    };

    return {
      ...metrics,
      length: Math.max(...[
        steps.fz.left.length,
        steps.fz.right.length,
      ])
    }
  }
  
  static generateAverage(steps: StepsDataForAverageMetrics, frequency: number, sd: StepDurationsPerFoot) {
    const averageMetrics = {
      left: {
        fx: {
          ...this.calculateAverageMetricsPerFoot(steps.fx.left, frequency),
          ...this.calculateAverageLateralMetrics(steps.fx.left, frequency, true),
        },
        fy: {
          ...this.calculateAverageMetricsPerFoot(steps.fy.left, frequency),
          ...this.calculateAverageBrakingMetrics(steps.fy.left, frequency),
          ...this.calculateAveragePropulsiveMetrics(steps.fy.left, frequency),
        },
        fz: {
          ...this.calculateAverageMetricsPerFoot(steps.fz.left, frequency),
          ...this.calculateAverageStepDurations(steps.fz.left, frequency),
          ...this.calculateAverageStrideDuration(sd.left)
        }
      },
      right: {
        fx: {
          ...this.calculateAverageMetricsPerFoot(steps.fx.right, frequency),
          ...this.calculateAverageLateralMetrics(steps.fx.right, frequency, false),
        },
        fy: {
          ...this.calculateAverageMetricsPerFoot(steps.fy.right, frequency),
          ...this.calculateAverageBrakingMetrics(steps.fy.right, frequency),
          ...this.calculateAveragePropulsiveMetrics(steps.fy.right, frequency),
        },
        fz: {
          ...this.calculateAverageMetricsPerFoot(steps.fz.right, frequency),
          ...this.calculateAverageStepDurations(steps.fz.right, frequency),
          ...this.calculateAverageStrideDuration(sd.right)
        }
      }
    };

    return {
      ...averageMetrics,
      length: Math.max(...[
        steps.fz.left.length,
        steps.fz.right.length,
      ])
    }
  }

  static calculateAverageMetricsPerFoot(rows: Array<LineChartSeries>, frequency: number ): AverageMetrics {
    let impulses: Array<number> = [];
    let impactPeakForces: Array<number> = [];
    let loadingRates: Array<number> = [];
    let timeToImpactPeaks: Array<number> = [];
    let activePeakForces: Array<number> = [];
    let timeToActivePeaks: Array<number> = [];
    let pushOffRates: Array<number> = [];  

    for (var i = 0; i < rows.length; i++){

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = this.removeNoizyData(rows[i].data, 0.1);

      // Calculate the vertical impulse of every step
      impulses.push(this.calculateImpulse(x, y))
      
      // Calculate the loading rate of every step
      loadingRates.push(this.calculateLoadingRate(y, frequency));

      // Calculate the impact peak force rate of every step
      impactPeakForces.push(this.calculateImpactPeakForce(y));

      // Calculate the time to impact peak of every step
      timeToImpactPeaks.push(this.calculateTimeToImpactPeak(y, frequency));

      // Calculate the active peak force of every step
      activePeakForces.push(this.calculateActivePeakForce(y));

      // Calculate the time of active peak force of every step
      timeToActivePeaks.push(this.calculateTimeToActivePeak(y, frequency));

      // Calculate the push off rate of every step
      pushOffRates.push(this.calculatePushOffRate(y, frequency));
    }

    return {
      impulses,
      impactPeakForces,
      loadingRates,
      timeToImpactPeaks,
      activePeakForces,
      timeToActivePeaks,
      pushOffRates,
    }
  }

  static calculateMetricsPerFoot(rows: Array<LineChartSeries>, frequency: number ): NormalMetrics {
    var impulses: Array<number> = [];
    var impactPeakForces: Array<number> = [];
    var loadingRates: Array<number> = [];
    var timeToImpactPeaks: Array<number> = [];
    var activePeakForces: Array<number> = [];
    var timeToActivePeaks: Array<number> = [];
    var pushOffRates: Array<number> = [];

    for (var i = 0; i < rows.length; i++){

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = this.removeNoizyData(rows[i].data, 0.1);

      // Calculate the vertical impulse of every step
      impulses.push(this.calculateImpulse(x, y))
      
      // Calculate the loading rate of every step
      loadingRates.push(this.calculateLoadingRate(y, frequency));

      // Calculate the impact peak force rate of every step
      impactPeakForces.push(this.calculateImpactPeakForce(y));

      // Calculate the time to impact peak of every step
      timeToImpactPeaks.push(this.calculateTimeToImpactPeak(y, frequency));

      // Calculate the active peak force of every step
      activePeakForces.push(this.calculateActivePeakForce(y));

      // Calculate the time of active peak force of every step
      timeToActivePeaks.push(this.calculateTimeToActivePeak(y, frequency));

      // Calculate the push off rate of every step
      pushOffRates.push(this.calculatePushOffRate(y, frequency));

    }

    return {
      impulse: (impulses.reduce((a,c) => a + c)/impulses.map(i => i!=0).length),
      impactPeakForce: (impactPeakForces.reduce((a,c) => a + c)/impactPeakForces.map(i => i!=0).length),
      loadingRate: (loadingRates.reduce((a,c) => a + c)/loadingRates.map(i => i!=0).length),
      timeToImpactPeak: (timeToImpactPeaks.reduce((a,c) => a + c)/timeToImpactPeaks.map(i => i!=0).length),
      activePeakForce: (activePeakForces.reduce((a,c) => a + c)/activePeakForces.map(i => i!=0).length),
      timeToActivePeak: (timeToActivePeaks.reduce((a,c) => a + c)/timeToActivePeaks.map(i => i!=0).length),
      pushOffRate: (pushOffRates.reduce((a, c) => a + c) / pushOffRates.map(i => i != 0).length),
      brakingImpulse: 0,
      brakingPeakForce: 0,
      timeToBrakingPeak: 0,
      timeToBPTransition: 0,
      propulsiveImpulse: 0,
      propulsivePeakForce: 0,
      timeToPropulsivePeak: 0,
      lateralStrikeImpulse: 0,
      lateralStrikePeakForce: 0,
      lateralPushImpulse: 0,
      lateralPushPeakForce: 0,
      contactDuration: 0,
      stepDuration: 0,
      doubleSupportDuration: 0,
      singleSupportDuration: 0,
      strideDuration: 0,
    }
  }

  static calculateImpulse(x: Array<number>, y: Array<number>): number {
    return Calculus.integral(x, y);
  }

  static calculateLoadingRate(y: Array<number>, frequency: number): number {
    let mx = Calculus.findFirstlocalMax(y);
    const closest = (array: Array<number>, goal: number) => array.reduce((prev, curr) => Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
    
    if (mx !== 0) {
      const from = (0.2 * mx);
      const fromId = y.indexOf(closest(y, from)) / frequency;
      const to = (0.8 * mx);
      const toId = y.indexOf(closest(y, to)) / frequency;
      return Calculus.slope(fromId, from, toId, to);
    }

    return 0;
  }
  
  static calculateImpactPeakForce(y: Array<number>): number {
    return Calculus.findFirstlocalMax(y);
  }

  static calculateTimeToImpactPeak(y: Array<number>, frequency: number): number {
    return Calculus.findIndexOfFirstlocalMax(y) / frequency;
  }

  static calculateActivePeakForce(y: Array<number>): number {
    return Calculus.findMaxFromLocalMaxs(y);
  }

  static calculateTimeToActivePeak(y: Array<number>, frequency: number): number {
    return Calculus.findIndexOfMaxFromLocalMaxs(y) / frequency;
  }

  static calculatePushOffRate(y: Array<number>, frequency: number): number {

    let mx = Calculus.findIndexOfMaxFromLocalMaxs(y);
    const closest = (array: Array<number>, goal: number) => array.reduce((prev, curr) => Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
    
    if (mx !== 0) {
       const from = (0.2 * mx);
      const fromId = y.indexOf(closest(y, from)) / frequency;
      const to = (0.8 * mx);
      const toId = y.indexOf(closest(y, to)) / frequency;
      return Calculus.slope(fromId, from, toId, to);
    }

    return 0;
  }

  static calculateAverageBrakingMetrics(rows: Array<LineChartSeries>, frequency: number) {

    var brakingImpulses: Array<number> = [];
    var brakingPeakForces: Array<number> = [];
    var timeToBrakingPeaks: Array<number> = [];
    var timeToBPTransitions: Array<number> = [];

    for (var i = 0; i < rows.length; i++) {

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = rows[i].data;

      const xPos = [];
      const yPos = [];
      for (var j = 0; j < y.length; j++) {
        if (y[j] > 0) {
          yPos.push(y[j]);
          xPos.push(x[j]);
        }
      }

      if (yPos.length === 0 || xPos.length == 0) {
        brakingImpulses.push(0);
        brakingPeakForces.push(0);
        timeToBrakingPeaks.push(0);
      } else {
        brakingImpulses.push(Calculus.integral(xPos, yPos));
        brakingPeakForces.push(Calculus.findFirstlocalMax(yPos));
        timeToBrakingPeaks.push(x[Calculus.findIndexOfFirstlocalMax(y)]);
      }

      timeToBPTransitions.push(x[Calculus.findIndexOfSignChange(y)]);
    }

    return {
      brakingImpulses,
      brakingPeakForces,
      timeToBrakingPeaks,
      timeToBPTransitions,
    };
  }

  static calculateBrakingMetrics(rows: Array<LineChartSeries>, frequency: number) {

    var brakingImpulses: Array<number> = [];
    var brakingPeakForces: Array<number> = [];
    var timeToBrakingPeaks: Array<number> = [];
    var timeToBPTransitions: Array<number> = [];
    
    for (var i = 0; i < rows.length; i++) {

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = rows[i].data;

      const xPos = [];
      const yPos = [];
      for (var j = 0; j < y.length; j++) {
        if (y[j] > 0) {
          yPos.push(y[j]);
          xPos.push(x[j]);
        }
      }

      if (yPos.length === 0 || xPos.length == 0) {
        brakingImpulses.push(0);
        brakingPeakForces.push(0);
        timeToBrakingPeaks.push(0);
      } else {
        brakingImpulses.push(Calculus.integral(xPos, yPos));
        brakingPeakForces.push(Calculus.findFirstlocalMax(yPos));
        timeToBrakingPeaks.push(x[Calculus.findIndexOfFirstlocalMax(y)]);
      }

      timeToBPTransitions.push(x[Calculus.findIndexOfSignChange(y)]);
    }
    
    return {
      brakingImpulse: (brakingImpulses.reduce((a, c) => a + c) / brakingImpulses.map(i => i != 0).length),
      brakingPeakForce: (brakingPeakForces.reduce((a, c) => a + c) / brakingPeakForces.map(i => i != 0).length),
      timeToBrakingPeak: (timeToBrakingPeaks.reduce((a, c) => a + c) / timeToBrakingPeaks.map(i => i != 0).length),
      timeToBPTransition: (timeToBPTransitions.reduce((a, c) => a + c) / timeToBPTransitions.map(i => i != 0).length)
    };
  }

  static calculateAveragePropulsiveMetrics(rows: Array<LineChartSeries>, frequency: number) {

    var propulsiveImpulses = [];
    var propulsivePeakForces = [];
    var timeToPropulsivePeaks = [];

    for (var i = 0; i < rows.length; i++){

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = rows[i].data;

      const xNeg = [];
      const yNeg = [];
      for (var j = 0; j < y.length; j++) {
        if (y[j] < 0) {
          yNeg.push(y[j]);
          xNeg.push(x[j]);
        }
      }
      
      if (xNeg.length === 0 || yNeg.length === 0) {
        propulsiveImpulses.push(0);
        propulsivePeakForces.push(0);
        timeToPropulsivePeaks.push(0);
      } else {
        propulsiveImpulses.push(Calculus.integral(xNeg, yNeg));
        propulsivePeakForces.push(Calculus.findFirstlocalMax(yNeg));
        timeToPropulsivePeaks.push(xNeg[Calculus.findIndexOfFirstlocalMax(yNeg)]);
      }
    }

    return {
      propulsiveImpulses,
      propulsivePeakForces,
      timeToPropulsivePeaks
    }
  }

  static calculatePropulsiveMetrics(rows: Array<LineChartSeries>, frequency: number) {

    var propulsiveImpulses: Array<number> = [];
    var propulsivePeakForces: Array<number> = [];
    var timeToPropulsivePeaks: Array<number>= [];

    for (var i = 0; i < rows.length; i++){

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = rows[i].data;

      const xNeg = [];
      const yNeg = [];
      for (var j = 0; j < y.length; j++) {
        if (y[j] < 0) {
          yNeg.push(y[j]);
          xNeg.push(x[j]);
        }
      }
      
      if (xNeg.length === 0 || yNeg.length === 0) {
        propulsiveImpulses.push(0);
        propulsivePeakForces.push(0);
        timeToPropulsivePeaks.push(0);
      } else {
        propulsiveImpulses.push(Calculus.integral(xNeg, yNeg));
        propulsivePeakForces.push(Calculus.findFirstlocalMax(yNeg));
        timeToPropulsivePeaks.push(xNeg[Calculus.findIndexOfFirstlocalMax(yNeg)]);
      }
    }

    return {
      propulsiveImpulse: (propulsiveImpulses.reduce((a, c) => a + c) / propulsiveImpulses.map(i => i != 0).length),
      propulsivePeakForce: (propulsivePeakForces.reduce((a, c) => a + c) / propulsivePeakForces.map(i => i != 0).length),
      timeToPropulsivePeak: (timeToPropulsivePeaks.reduce((a, c) => a + c) / timeToPropulsivePeaks.map(i => i != 0).length),
    }
  }
  
  static calculateAverageLateralMetrics(rows: Array<LineChartSeries>, frequency: number, isLeftFoot: boolean) {

    var lateralStrikeImpulses: Array<number> = [];
    var lateralStrikePeakForces: Array<number> = [];
    var lateralPushImpulses: Array<number> = [];
    var lateralPushPeakForces: Array<number> = [];

    for (var i = 0; i < rows.length; i++){

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = rows[i].data;

      const firstCurveX = [];
      const firstCurveY = [];

      const secondCurveX = [];
      const secondCurveY = [];

      if (isLeftFoot) {
        for (var j = 0; j < y.length; j++) {
          if (y[j] < 0) {
            firstCurveY.push(y[j]);
            firstCurveX.push(x[j]);
          }

          if (y[j] > 0) {
            secondCurveY.push(y[j]);
            secondCurveX.push(x[j]);
          }
        }
      } else {
        for (var j = 0; j < y.length; j++) {
          if (y[j] > 0) {
            firstCurveY.push(y[j]);
            firstCurveX.push(x[j]);
          }

          if (y[j] < 0) {
            secondCurveY.push(y[j]);
            secondCurveX.push(x[j]);
          }
        }
        console.log(secondCurveY)
      }

      if (firstCurveX.length === 0 || firstCurveY.length === 0) {
        lateralStrikeImpulses.push(0);
        lateralStrikePeakForces.push(0);
      } else {
        lateralStrikeImpulses.push(Calculus.integral(firstCurveX, firstCurveY));
        lateralStrikePeakForces.push(Calculus.findFirstlocalMax(firstCurveY));
      }

      if (secondCurveX.length === 0 || secondCurveY.length === 0) {
        lateralPushImpulses.push(0);
        lateralPushPeakForces.push(0);
      } else {
        lateralPushImpulses.push(Calculus.integral(secondCurveX, secondCurveY));
        lateralPushPeakForces.push((Calculus.findFirstlocalMax(secondCurveY)));
      }

    }

    return {
      lateralStrikeImpulses,
      lateralStrikePeakForces,
      lateralPushImpulses,
      lateralPushPeakForces,
    }
  }

  static calculateLateralMetrics(rows: Array<LineChartSeries>, frequency: number, isLeftFoot: boolean) {
    
    var lateralStrikeImpulses: Array<number> = [];
    var lateralStrikePeakForces: Array<number> = [];
    var lateralPushImpulses: Array<number> = [];
    var lateralPushPeakForces: Array<number> = [];

    for (var i = 0; i < rows.length; i++){

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = rows[i].data;

      const firstCurveX = [];
      const firstCurveY = [];

      const secondCurveX = [];
      const secondCurveY = [];

      if (isLeftFoot) {
        for (var j = 0; j < y.length; j++) {
          if (y[j] < 0) {
            firstCurveY.push(y[j]);
            firstCurveX.push(x[j]);
          }

          if (y[j] > 0) {
            secondCurveY.push(y[j]);
            secondCurveX.push(x[j]);
          }
        }
      } else {
        for (var j = 0; j < y.length; j++) {
          if (y[j] > 0) {
            firstCurveY.push(y[j]);
            firstCurveX.push(x[j]);
          }

          if (y[j] < 0) {
            secondCurveY.push(y[j]);
            secondCurveX.push(x[j]);
          }
        }
      }

      if (firstCurveX.length === 0 || firstCurveY.length === 0) {
        lateralStrikeImpulses.push(0);
        lateralStrikePeakForces.push(0);
      } else {
        lateralStrikeImpulses.push(Calculus.integral(firstCurveX, firstCurveY));
        lateralStrikePeakForces.push(Calculus.findFirstlocalMax(firstCurveY));
      }
      

      if (secondCurveX.length === 0 || secondCurveY.length === 0) {
        lateralPushImpulses.push(0);
        lateralPushPeakForces.push(0);
      } else {
        lateralPushImpulses.push(Calculus.integral(secondCurveX, secondCurveY));
        lateralPushPeakForces.push((Calculus.findFirstlocalMax(secondCurveY)));
      }
    }

    return {
      lateralStrikeImpulse: (lateralStrikeImpulses.reduce((a, c) => a + c) / lateralStrikeImpulses.map(i => i != 0).length),
      lateralStrikePeakForce: (lateralStrikePeakForces.reduce((a, c) => a + c) / lateralStrikePeakForces.map(i => i != 0).length),
      lateralPushImpulse: (lateralPushImpulses.reduce((a, c) => a + c) / lateralPushImpulses.map(i => i != 0).length),
      lateralPushPeakForce:  (lateralPushPeakForces.reduce((a, c) => a + c) / lateralPushPeakForces.map(i => i != 0).length),
    }
  }
  
  static calculateAverageStepDurations(rows: Array<LineChartSeries>, frequency: number) {

    var contactDurations: Array<number> = [];
    var stepDurations: Array<number> = [];
    var doubleSupportDurations: Array<number> = [];
    var singleSupportDurations: Array<number> = [];

    for (var i = 0; i < rows.length; i++) {

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = rows[i].data;
      
      if (x.length > 0) {
        contactDurations.push(x[x.length - 1]);
        stepDurations.push(x[Calculus.findIndexOfSecondLocalMax(y)]);
        doubleSupportDurations.push(x[Calculus.findIndexOfFirstlocalMax(y)]);
        singleSupportDurations.push(x[Calculus.findIndexOfSecondLocalMax(y)] - x[Calculus.findIndexOfFirstlocalMax(y)]);
      } else {
        contactDurations.push(0);
        stepDurations.push(0);
        doubleSupportDurations.push(0);
        singleSupportDurations.push(0);
      }
    }

    return {
      contactDurations,
      stepDurations,
      doubleSupportDurations,
      singleSupportDurations,
    }
  }
  
  static calculateStepDurations(rows: Array<LineChartSeries>, frequency: number) {

    var contactDurations: Array<number> = [];
    var stepDurations: Array<number> = [];
    var doubleSupportDurations: Array<number> = [];
    var singleSupportDurations: Array<number> = [];

    for (var i = 0; i < rows.length; i++) {

      let x: Array<number> = rows[i].data.map((_, idx) => idx / frequency);
      let y: Array<number> = rows[i].data;

      if (x.length > 0) {
        contactDurations.push(x[x.length - 1]);
        stepDurations.push(x[Calculus.findIndexOfSecondLocalMax(y)]);
        doubleSupportDurations.push(x[Calculus.findIndexOfFirstlocalMax(y)]);
        singleSupportDurations.push(x[Calculus.findIndexOfSecondLocalMax(y)] - x[Calculus.findIndexOfFirstlocalMax(y)]);
      } else {
        contactDurations.push(0);
        stepDurations.push(0);
        doubleSupportDurations.push(0);
        singleSupportDurations.push(0);
      }
    }

    return {
      contactDuration: (contactDurations.reduce((a, c) => a + c) / contactDurations.map(i => i != 0).length),
      stepDuration: (stepDurations.reduce((a, c) => a + c) / stepDurations.map(i => i != 0).length),
      doubleSupportDuration: (doubleSupportDurations.reduce((a, c) => a + c) / doubleSupportDurations.map(i => i != 0).length),
      singleSupportDuration: (singleSupportDurations.reduce((a, c) => a + c) / singleSupportDurations.map(i => i != 0).length),
    }
  }

  static calculateStrideDuration(sd: Array<StepDuration>) { 
    var strideDurations: Array<number> = [];

    for (var i = 1; i < sd.length - 1; i++) {
      const diff = moment(new Date(parseInt(sd[i + 1].startTimestamp, 10) / 1000)).diff(new Date(parseInt(sd[i].startTimestamp, 10) / 1000),'seconds')
      strideDurations.push(diff);
    }

    return {
      strideDuration: (strideDurations.reduce((a, c) => a + c) / strideDurations.map(i => i != 0).length),
    }
  }

  static calculateAverageStrideDuration(sd: Array<StepDuration>) {
    var strideDurations: Array<number> = [];

    for (var i = 1; i < sd.length - 1; i++) {
      const diff = moment(new Date(parseInt(sd[i + 1].startTimestamp, 10) / 1000)).diff(new Date(parseInt(sd[i].startTimestamp, 10) / 1000),'seconds')
      strideDurations.push(diff);
    }

    return {
      strideDurations,
    }
  }
}

export { Metrics }