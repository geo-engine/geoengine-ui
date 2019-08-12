import { getTestBed, TestBed, ComponentFixture } from '@angular/core/testing';
import { } from 'jasmine'; // get beforeAll, beforeEach, afterAll, afterEach environments

/**
 * The main computational workload of tests comes from resetting the TestBed.
 * When it is possible to reuse the TestBed in all described tests (f.e. you create a describe environment in which all tests
 * use the same dependencies) one should not reload the TestBed on every test (i.e. it environment).
 * By calling this function on the start of the describe environment one disables this resetting at the beginning of the tests and
 * re-enables it at the end.
 *
 * Example:
 * describe("Component: TestComponent", () => {
 *  describe("All the Tests depending on X", () => {
 *      configureWaveTests();
 *
 *      beforeEach(() => {
 *          TestBed.configureTestingModule({
 *             providers: [X]
 *          }).compileComponents()
 *      })
 *
 *      it();
 *      .
 *      .   // all the tests that use X as a dependency
 *      .
 *      it();
 *  })
 *  describe("All the Tests depending on Y", () => {
 *      configureWaveTests();
 *
 *      beforeEach(() => {
 *          TestBed.configureTestingModule({
 *             providers: [Y]
 *          }).compileComponents()
 *      })
 *
 *      it();
 *      .
 *      .   // all the tests that use Y as a dependency
 *      .
 *      it();
 *  })
 * })
 *
 * The TestBed gets recompiled when going from one describe to the other but inside the describes it won't.
 */
export const configureWaveTesting = () => {
    const testBedApi: any = getTestBed();
    const oldTestBedReset = TestBed.resetTestingModule;

    beforeAll(() => {
        TestBed.resetTestingModule(); // recompile TestBed once.
        TestBed.resetTestingModule = () => TestBed; // Don't recompile until this function is set to default again,
                                                    // i.e. until afterAll is called.
    });

    afterEach(() => {
        testBedApi._activeFixtures.forEach((fixture: ComponentFixture<any>) => fixture.destroy()); // Do the necessary part that is done
                                                    // in resetTestingModule() manually.
        testBedApi._instantiated = false;
    });

    afterAll(() => {
        TestBed.resetTestingModule = oldTestBedReset;   // Reset the resetTestingModule function to default
        TestBed.resetTestingModule();                   // Reset the TestingModule for the next tests.
    });
};
