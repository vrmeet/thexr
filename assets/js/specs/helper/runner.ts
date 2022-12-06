export type TestResult = {
  message: string;
  status: "ok" | "failed";
  error?: any;
};

export type DescribeResult = {
  message: string;
  testResults: TestResult[];
};

export let describeResults = [];

export function describe(message: string, testFunc: () => void) {
  this.testResults = [] as TestResult[];
  this.beforeEaches = [];
  testFunc.call(this);
  describeResults.push({ message, testResults: this.testResults });
}

export function beforeEach(func: () => void) {
  //
  this.beforeEaches.push(func);
  // func.call(this);
  //
}

export function test(message: string, testfunc: () => void) {
  try {
    this.beforeEaches.forEach((fn) => fn.call(this));
    testfunc.call(this);
    this.testResults.push({ message, status: "ok" });
  } catch (e) {
    console.error(e);
    this.testResults.push({ message, status: "failed", error: e });
  }
}

export const assert = (actual: any, expected: any) => {
  if (actual != expected) {
    throw { actual: actual, expected: expected };
  }
};
