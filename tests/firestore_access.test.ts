import { expect, test, beforeAll, afterAll } from "vitest";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import * as fs from "fs"; // Need to read your rules file
import firebaseConfig from "../firebase.json";

const PROJECT_ID = "systemcraft-bms";

// Declare a variable to hold the test environment
let testEnv: RulesTestEnvironment;

// --- Setup/Teardown Hooks ---
beforeAll(async () => {
  // 1. Initialize the Test Environment
  // Ensure your firestore.rules file exists in the root of your project
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(firebaseConfig.firestore.rules, "utf8"),
    },
  });
});

afterAll(async () => {
  // 2. Clean up resources after all tests have run
  await testEnv.cleanup();
});

// --- Your Test ---
test("should successfully initialize a Firestore context", () => {
  // 3. Get an unauthenticated context
  const unauthContext = testEnv.unauthenticatedContext();

  // Get the Firestore instance associated with the context
  const db = unauthContext.firestore();

  expect(db).toBeTruthy();
});
