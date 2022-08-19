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
  testFunc.call(this);
  describeResults.push({ message, testResults: this.testResults });
}

export function beforeEach(func: () => void) {
  console.log("in before each");
  func.call(this);
  console.log("after bfore each");
}

export function test(message: string, testfunc: () => void) {
  try {
    testfunc.call(this);
    this.testResults.push({ message, status: "ok" });
  } catch (e) {
    this.testResults.push({ message, status: "failed", error: e });
  }
}

export const assert = (actual: any, expected: any) => {
  if (actual != expected) {
    throw { actual: actual, expected: expected };
  }
};
