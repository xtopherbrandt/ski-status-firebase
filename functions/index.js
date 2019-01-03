// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const Scraper = require( './whistlerpeak-scraper.js' );
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
    function welcome(agent) {
        agent.add(`Welcome to my agent!`);
    }
 
    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }

    // // Uncomment and edit to make your own intent handler
    // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    function checkGrooming(agent) {
    
        var scraper = new Scraper( console );

        var groomingPromise = scraper.statusQuery( agent.parameters.runName );
    
        groomingPromise.then( (grooming) => {
            console.log( `input RunName: ${agent.parameters.runName}`);
            console.log( `output Grooming: ${grooming.groomedRuns}`);
            console.log(`Number of groomed runs: ${grooming.groomedRuns.length}`);
            
            switch (grooming.groomedRuns.length) {
                case 0 :{
                    agent.add(`No ${agent.parameters.runName} is not groomed today.`);
                }
                case 1 : {
                    agent.add( `Yes, ${agent.parameters.runName} is groomed today.`);
                    console.log('YES');
                }
                default : {
                    agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
                }
            }
        });
    
        
    /**        
            agent.add(new Card({
                title: `Title: this is a card title`,
                imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
                text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
                buttonText: 'This is a button',
                buttonUrl: 'https://assistant.google.com/'
            })
            );
            agent.add(new Suggestion(`Quick Reply`));
            agent.add(new Suggestion(`Suggestion`));
            agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
        });
    */
        agent.setContext({ name: 'grooming', lifespan: 2, parameters: { runName: `${agent.parameters.runName}` }});
        return groomingPromise;
    }

  // Uncomment and edit to make your own Google Assistant intent handler
  // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // below to get this function to be run when a Dialogflow intent is matched
  function test(agent) {
    let conv = agent.conv(); // Get Actions on Google library conv instance
    conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
    agent.add(conv); // Add Actions on Google library responses to your agent's response
  }
  // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  // intentMap.set('your intent name here', yourFunctionHandler);
  intentMap.set('is this run groomed', checkGrooming);
  agent.handleRequest(intentMap);
});
