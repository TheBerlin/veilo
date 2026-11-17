// setup.ts: runs before every test file. An agreed exception to the test mirror, as in the other
// packages. Starts Angular's test environment without zone.js: the tests run zoneless, which is
// also how the library's `NgZone` use behaves in a zoneless app.

import "@angular/compiler";
import { getTestBed, TestBed } from "@angular/core/testing";
import { BrowserTestingModule, platformBrowserTesting } from "@angular/platform-browser/testing";
import { afterEach } from "vitest";

getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting(), {
  teardown: { destroyAfterEach: true },
});

// Angular resets the testing module after each test only when test globals exist, which they do
// not here.
afterEach(() => {
  TestBed.resetTestingModule();
});
