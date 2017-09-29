require("dotenv").config();
const virtualAlexa = require("virtual-alexa");
const alexa = virtualAlexa.VirtualAlexa.Builder()
    .handler("src/index.handler") // Lambda function file and name
    .intentSchemaFile("./speechAssets/IntentSchema.json") // Path to IntentSchema.json
    .sampleUtterancesFile("./speechAssets/SampleUtterances.txt") // Path to SampleUtterances
    .create();

describe("Giftionary Tests", () => {
    test("Plays once", (done) => {
        alexa.launch().then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("What is the search term for it");
            return alexa.utter("incorrect guess");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Nice try");
            return alexa.utter("incorrect guess");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("That is not correct");
            return alexa.utter("incorrect guess");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("No more guesses");
            return alexa.utter("no");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Goodbye");
            done();

        });
    });

    test("Launches and get helps", (done) => {
        alexa.launch().then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("What is the search term for it");
            return alexa.utter("help");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Take a guess at the image displayed");
            return alexa.utter("cancel");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Goodbye");
            expect(payload.response.shouldEndSession).toBe(true);
            done();

        });
    });

    test("Cancels", (done) => {
        alexa.launch().then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("What is the search term for it");
            return alexa.utter("cancel");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Goodbye");
            expect(payload.response.shouldEndSession).toBe(true);
            done();

        });
    });
});
