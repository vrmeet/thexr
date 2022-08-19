export type TestResult = {
  message: string;
  status: "ok" | "failed";
  error?: any;
};
export type TestToRun = {
  message: string;
  testFunc: () => void;
};
export let results: TestResult[] = [];
export let testsToRun: TestToRun[] = [];

export const runTests = () => {
  testsToRun.forEach(testToRun => {
    try {
      testToRun.testFunc();
      results.push({ message: testToRun.message, status: "ok" });
    } catch (err) {
      console.log(err.stack);
      results.push({
        message: testToRun.message,
        status: "failed",
        error: err,
      });
      //  console.error("Failure", err);
    }
  });
  return results;
};

export const describe = (message: string, testFunc: () => void) => {};

export const it = (message: string, testFunc: () => void) => {
  testsToRun.push({ message, testFunc });
};

export const assert = (actual: any, expected: any) => {
  if (actual != expected) {
    throw { actual: actual, expected: expected };
  }
};
