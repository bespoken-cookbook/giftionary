const fs = require("fs");

module.exports = {
    load: function () {
        const data = fs.readFileSync("./speechAssets/TermsSlot.txt");
        const lines = data.toString().split("\n");
        for (const line of lines) {
            this.terms.push(line);
        }
    },

    newTerm: function() {
        const selection = Math.floor(Math.random() * this.terms.length);
        console.log("SELECTION: " + selection);
        const term = this.terms[selection];
        return term;
    },

    terms: [],
}