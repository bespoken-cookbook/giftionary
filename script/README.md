# Simple Load Tester
This is a template for running load tests against Alexa skills.  
You can make a copy of this file and use it for testing your own skill.

## Pre-requisites  
**Requires an HTTP endpoint for hitting your skill**  
If you are using Lambdas, configuring an API Gateway will do the trick.

Settng this up [is explained here](http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-create-api-as-simple-proxy-for-lambda.html).  

If you already have your Lambda, you can skip down to this step in the docs:  
*Create an API with Lambda Proxy Integration*

You should then have a URL than can directly hit your Lambda. Insert the URL here:  
https://github.com/bespoken/giftionary/blob/LoadTest/script/load-tester.js#L67

**Requires these packages**  
expect - For Jasmine style expectations  
virtual-alexa - For generating JSON payloads for testing

## Configuration
The key parameters are below:
```
const TEST_COUNT = 100; // The number of tests to run in total
const TEST_CONCURRENCY = 20; // The number of test to run concurrently
const TEST_OFFSET = 10; // Milliseconds to offset starting each test
const TEST_START = Date.now(); // The start time for the tests as a whole
```

Replace the `test` method with particular test sequence for your skill.
