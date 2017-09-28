const giphy = require("../src/giphy-api");
require("dotenv").config();

test("Giphy Test", (done) => {
    const giphyAccessor = new giphy.GiphyAPI(process.env.GIPHY_API_KEY);
    giphyAccessor.search("cat").then(payload => {
        console.log("JSON: " + JSON.stringify(payload, null, 2));
        done();
    });
});

test("Giphy Test For Dog", (done) => {
    const giphyAccessor = new giphy.GiphyAPI(process.env.GIPHY_API_KEY);
    giphyAccessor.search("dog").then(payload => {
        console.log("JSON: " + JSON.stringify(payload, null, 2));
        done();
    });
});