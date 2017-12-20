const virtualAlexa = require("virtual-alexa");
const expect = require("expect");

const TEST_COUNT = 100; // The number of tests to run in total
const TEST_CONCURRENCY = 20; // The number of test to run concurrently
const TEST_OFFSET = 10; // Milliseconds to offset starting each test
const TEST_START = Date.now(); // The start time for the tests as a whole

let concurrentCalls = TEST_CONCURRENCY;
let calls = 0;
let callsCompleted = 0;
let errors = 0;
let totalTime = 0;
let completed = false;

const loadTest = function () {

    setTimeout(() => {
        tester();
        concurrentCalls--;
        if (concurrentCalls > 0) {
            loadTest();
        }
    }, TEST_OFFSET);
}

const loadTestCompleted = function () {
    if (completed) {
        return;
    }

    completed = true;
    const testTime = Date.now() - TEST_START ;
    const totalCompletedCalls = calls - errors;
    let throughput = totalCompletedCalls / (testTime / 1000);
    throughput = Math.round(throughput * 100) / 100; // Round to two decimals
    const average = totalTime/totalCompletedCalls;

    console.log("Average Time: " + average);
    console.log("Errors: " + errors);
    console.log("Total Test Time: " + testTime);
    console.log("Throughput: " + throughput + " Per Second");
}

const tester = function () {
    calls++;
    test().then((output) => {
        if (typeof output === "number") {
            console.log("Call finished:  " + callsCompleted + " Time: " + output);
            totalTime += output;
        } else {
            console.error("Call finished: " + callsCompleted + " Error: " + output);
            errors++;
        }

        callsCompleted++;
        if (TEST_COUNT > calls) {
            tester();
        } else if (callsCompleted >= TEST_COUNT) {
            loadTestCompleted();
        }
    });
}

const test = function () {
    const alexa = virtualAlexa.VirtualAlexa.Builder()
        .skillURL("https://modest-lewis.bespoken.link/") // Lambda function file and name
        .intentSchemaFile("./speechAssets/IntentSchema.json") // Path to IntentSchema.json
        .sampleUtterancesFile("./speechAssets/SampleUtterances.txt") // Path to SampleUtterances
        .create();

    const startTime = Date.now();
    return alexa.launch().then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("We show you images we got from Giphy");
        return alexa.utter("yes");

    }).then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("Take a look at this image");
        return alexa.utter("cancel");

    }).then((payload) => {
        expect(payload.response.outputSpeech.ssml).toContain("Goodbye");
        expect(payload.response.shouldEndSession).toBe(true);
        return Date.now() - startTime;

    }).catch((e) => {
        return e;
    });

};

loadTest();