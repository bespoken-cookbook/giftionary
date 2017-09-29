const Alexa = require("alexa-sdk");
const bst = require("bespoken-tools");
const TextUtils = Alexa.utils.TextUtils;
const ImageUtils = Alexa.utils.ImageUtils;

require("dotenv").config();

let APP_ID;
const giphy = require("./giphy-api");
const giphyAPI = new giphy.GiphyAPI(process.env.GIPHY_API_KEY);
const termGenerator = require("./term-generator");
const users = [];

let states = {
    DONE_MODE: "DONE_MODE", // User is trying to guess the number.
    EXIT_MODE: "EXIT_MODE", // User is trying to exit
    GUESS_MODE: "GUESS_MODE", // User is trying to guess the number.
    HELP_MODE: "HELP_MODE", // User needs help.
    PLAY_AGAIN_MODE: "PLAY_AGAIN_MODE", // User wants to play again.
    START_MODE: "START_MODE", // User is starting out.
};

termGenerator.load();

const alexaFunction = function(event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    // alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers,
        exitHandler,
        startHandler,
        guessHandler,
        playAgainHandler,
        helpHandler,
        doneHandler);
    alexa.execute();
};

module.exports.handler = bst.Logless.capture(process.env.LOGLESS_KEY, alexaFunction);

const newSessionHandlers = {
    "LaunchRequest": function () {
        const userID = this.event.session.user.userId;
        const newUser = !users.includes(userID);
        if (newUser) {
            this.handler.state = states.HELP_MODE;
            this.emitWithState("AMAZON.HelpIntent", true);
        } else {
            this.handler.state = states.START_MODE;
            this.emitWithState("Play");
        }

    },
    "Play": function () {
        this.handler.state = states.START_MODE;
        this.emitWithState("Play");
    },
    "SessionEndedRequest": function () {
        console.log("SessionEndedRequest");
    }
};

const startHandler = Alexa.CreateStateHandler(states.START_MODE, {
    "AMAZON.CancelIntent": function() {
        this.handler.state = states.EXIT_MODE;
        this.emitWithState("AMAZON.StopIntent");
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = states.HELP_MODE;
        this.emitWithState("AMAZON.HelpIntent");
    },
    "AMAZON.StopIntent": function() {
        this.handler.state = states.EXIT_MODE;
        this.emitWithState("AMAZON.StopIntent");
    },
    "Play": function () {
        const term = termGenerator.newTerm();
        this.attributes["term"] = term;
        this.attributes["incorrect"] = 0;

        giphyAPI.search(term).then((payload) => {
            console.log("JSON: " + JSON.stringify(payload, null, 2));
            let cardTitle = "Giftionary";
            let cardContent = "Guess the search term for this image!";
            let imageURL = payload.jpegURL;
            if (this.event.skillbot && this.event.skillbot.source === "SLACK") {
                imageURL = payload.gifURL;
            }


            console.log("ImageURL: " + imageURL);

            let imageObj = {
                largeImageUrl: imageURL,
                smallImageUrl: imageURL,
            };

            const builder = new Alexa.templateBuilders.BodyTemplate6Builder();

            try {
                let template = builder.setTitle("My BodyTemplate1")
                    .setBackButtonBehavior("HIDDEN")
                    .setBackgroundImage(ImageUtils.makeImage(payload.jpegURL))
                    .setTextContent(TextUtils.makeRichText("Guess the search term!<br/>" +
                        //"<img src='https://s3.amazonaws.com/giftionary/Poweredby_640px-Black_HorizLogo.png' width='400' height='52'/>"))
                        "<img src='https://s3.amazonaws.com/giftionary/PoweredBy_200px-Black_HorizLogo.png' width='200' height='26'/>"))
                    .build();
                this.response.hint("ask giftionary, is it a *your guess*?");
                this.response.speak("Take a look at this image <break time='3s' /> What is the search term for it?")
                    .listen("Take another look <break time='3s' /> what search term did we use?")
                    .cardRenderer(cardTitle, cardContent, imageObj)
                    .renderTemplate(template);
            } catch (e) {
                console.error(e);
            }

            this.handler.state = states.GUESS_MODE;
            this.emit(":responseReady");
        });
    },
    "Unhandled": function () {
        this.emit(":ask", "Sorry, I did not understand. Please say help or play.", "Say help or play");
    }
});

const guessHandler = Alexa.CreateStateHandler(states.GUESS_MODE, {
    "AMAZON.CancelIntent": function() {
        this.handler.state = states.EXIT_MODE;
        this.emitWithState("AMAZON.StopIntent");
    },
    "AMAZON.HelpIntent": function() {
        this.emit(":ask", "Take a guess at the image displayed. Open your Alexa app on your phone to see the card. " +
            "Go ahead and take a guess!");
    },
    "AMAZON.StopIntent": function() {
        this.handler.state = states.EXIT_MODE;
        this.emitWithState("AMAZON.StopIntent");
    },
    "GiveUp": function () {
        const term = this.attributes["term"];
        const message = "That was a tough one! It was " + term + ". Do you want to play again?";
        this.emit(":ask", message, "Play again?");
    },
    "Guess": function () {
        const guessIntent = this.event.request.intent;
        let guessValue;
        if (guessIntent && guessIntent.slots && guessIntent.slots.Term) {
            guessValue = guessIntent.slots.Term.value;
        }
        console.log("Guess: " + guessValue);
        let incorrect = this.attributes["incorrect"];
        const term = this.attributes["term"];
        if (guessValue === term) {
            this.handler.state = states.PLAY_AGAIN_MODE;
            this.emitWithState("Success");
        } else {
            const reprompt = "Take another guess";
            incorrect++;
            this.attributes["incorrect"] = incorrect;
            if (incorrect == 1) {
                this.emit(":ask", "Nice try, but that is not correct. Guess again.", reprompt);
            } else if (incorrect == 2) {
                this.emit(":ask", "That is not correct. One more guess.", reprompt);
            } else if (incorrect >= 3) {
                this.handler.state = states.PLAY_AGAIN_MODE;
                this.emitWithState("Failure");
            }
        }
    },
    "Unhandled": function () {
        console.log("Unhandled")
        this.emitWithState("Guess");
    }
});

const playAgainHandler = Alexa.CreateStateHandler(states.PLAY_AGAIN_MODE, {
    "AMAZON.CancelIntent": function() {
        this.handler.state = states.EXIT_MODE;
        this.emitWithState("AMAZON.StopIntent");
    },
    "AMAZON.NoIntent": function() {
        this.handler.state = states.DONE_MODE;
        this.emitWithState("Done");
    },
    // "AMAZON.StartOverIntent": function() {
    //     this.handler.state = GAME_STATES.START;
    //     this.emitWithState("StartGame", true);
    // },
    "AMAZON.StopIntent": function() {
        this.handler.state = states.EXIT_MODE;
        this.emitWithState("AMAZON.StopIntent");
    },
    "AMAZON.YesIntent": function() {
        this.handler.state = states.START_MODE;
        this.emitWithState("Play");
    },
    "Failure": function() {
        const term = this.attributes["term"];
        const message = "No more guesses! It was " + term + "<break time='500ms' />. Do you want to play again?";
        this.emit(":ask", message, "Play again?");
    },
    "Success": function() {
        const message = "You got it! Nice job! Do you want to play again?";
        this.emit(":ask", message, "Play again?");
    },
    "Unhandled": function () {
        this.emit(":ask", "Sorry, I did not understand. Please say yes or no to play again.",
            "Please say yes or no");
    }

});

const doneHandler = Alexa.CreateStateHandler(states.DONE_MODE, {
    "Done": function () {
        this.emit(":tell", "Thanks for playing! Goodbye.");
    },
});

const helpHandler = Alexa.CreateStateHandler(states.HELP_MODE, {
    "AMAZON.CancelIntent": function() {
        this.handler.state = states.EXIT_MODE;
        this.emitWithState("AMAZON.StopIntent");
    },
    "AMAZON.HelpIntent": function () {
        this.emit(":ask", "We show you images we got from Giphy. " +
            "You guess what search term generated them. " +
            "Easy, right? You get three guesses per image! " +
            "If you do not have an Echo Show, just open the Home screen in your Alexa app - the images are there. " +
            "Ready to play?");
    },
    "AMAZON.NoIntent": function() {
        this.handler.state = states.DONE_MODE;
        this.emitWithState("Done", true);
    },
    "AMAZON.StopIntent": function() {
        this.handler.state = states.EXIT_MODE;
        this.emitWithState("AMAZON.StopIntent");
    },
    "AMAZON.YesIntent": function() {
        this.handler.state = states.START_MODE;
        this.emitWithState("Play", true);
    }
});

const exitHandler = Alexa.CreateStateHandler(states.EXIT_MODE, {
    "AMAZON.StopIntent": function() {
        this.emit(":tell", "Thanks for playing and please come again! Goodbye.");
    },

});