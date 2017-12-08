require("dotenv").config();
const virtualAlexa = require("virtual-alexa");
let alexa = virtualAlexa.VirtualAlexa.Builder()
    .handler("src/index.handler") // Lambda function file and name
    .intentSchemaFile("./speechAssets/IntentSchema.json") // Path to IntentSchema.json
    .sampleUtterancesFile("./speechAssets/SampleUtterances.txt") // Path to SampleUtterances
    .create();

describe("Giftionary Tests", () => {
    beforeEach(() => {
        require("mock-alexa-dynamo").enable();
    });

    test("Plays once", (done) => {
        alexa.utter("get started").then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Ready to play?");
            return alexa.utter("yes");

        }).then((payload) => {
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

    test("Launches and plays", (done) => {
        alexa.launch().then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("We show you images we got from Giphy");
            return alexa.utter("yes");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Take a look at this image");
            return alexa.utter("cancel");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Goodbye");
            expect(payload.response.shouldEndSession).toBe(true);
            done();

        });
    });

    test("Plays and get helps", (done) => {
        alexa.utter("get started").then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("We show you images");
            return alexa.utter("help");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("We show you images");
            return alexa.utter("cancel");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Goodbye");
            expect(payload.response.shouldEndSession).toBe(true);
            done();

        });
    });

    test("Cancels", (done) => {
        alexa.utter("get started").then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("We show you images");
            return alexa.utter("Cancel");

        }).then((payload) => {
            expect(payload.response.outputSpeech.ssml).toContain("Goodbye");
            expect(payload.response.shouldEndSession).toBe(true);
            done();

        });
    });
});
