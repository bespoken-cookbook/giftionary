const https = require("https");

exports.GiphyAPI = class {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    search(phrase) {
        const baseURL = "https://api.giphy.com";
        const path = "/v1/gifs/search";
        const url = baseURL + path +
            "?api_key=" + this.apiKey +
            "&fmt=json" +
            "&q=" + phrase +
            "&rating=g";

        let payload = "";
        console.time("Giphy");
        return new Promise((resolve, reject) => {
            https.get(url, response => {
                console.timeEnd("Giphy");
                console.log("statusCode:", response.statusCode);
                //console.log("headers:", response.headers);

                response.on("data", data => {
                    payload += data;
                });

                response.on("end", () => {
                    const json = JSON.parse(payload);
                    //console.log("Giphy Payload:" + JSON.stringify(json, null, 2));
                    const giphyPayload = this.grabImage(json);
                    resolve(giphyPayload);
                });

                response.on("error", error => {
                    reject(error);
                });
            });
        });
    }

    grabImage(payload) {
        let jpegURL;
        let gifURL;
        let embedURL;

        for (let i=0;i<payload.data.length;i++) {
            const data = payload.data[i];
            embedURL = data.embed_url;
            // Take the first image that has a JPEG and a GIF
            if ("480w_still" in data.images && "fixed_width" in data.images) {
                if (!data.images["480w_still"].url.startsWith("http")) {
                    continue;
                }

                jpegURL = data.images["480w_still"].url;
                jpegURL = this.cleanURL(jpegURL);


                gifURL = data.images["fixed_width"].url;
                gifURL = this.cleanURL(gifURL);
                break;
            }
        }
        return {
            embedURL: embedURL,
            gifURL: gifURL,
            jpegURL: jpegURL,
        }
    }

    cleanURL(url) {
        url = url.replace("media0", "i");
        url = url.replace("media1", "i");
        url = url.replace("media2", "i");
        url = url.replace("media3", "i");
        return url;
    }

    searchApi(phrase) {
        const giphy = require("giphy-api")({
            apiKey: this.apiKey,
            https: true,
            timeout: 30
        });

        return giphy.search({
            fmt: "json",
            q: phrase,
            rating: "g",
        }).then(response => {
            return Promise.resolve(response);
        }).catch(error => {
            console.error(error);
        });

    }
};