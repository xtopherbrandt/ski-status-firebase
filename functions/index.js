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
        agent.add(`Welcome to Whistler Status! How can I help you?`);
        agent.add(new Suggestion(`Check Grooming`));
        agent.add(new Suggestion(`Check a Lift`));
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
        var queryRunName = agent.parameters.runName;
        var runNameTitleCase = toTitleCase( queryRunName );
        var groomingPromise = scraper.groomingQuery( runNameTitleCase );
    
        groomingPromise.then( (grooming) => {
            console.log( `input RunName: ${runNameTitleCase}`);
            console.log( `output Grooming: ${grooming.groomedRuns}`);
            console.log(`Number of groomed runs: ${grooming.groomedRuns.length}`);
            
            var numberOfRuns = grooming.groomedRuns.length;

            if ( runNameTitleCase ){

                switch (numberOfRuns) {
                    case 0 :{
                        agent.add(`No ${runNameTitleCase} is not groomed today. Would you like to check another?`);
                        break;
                    }
                    case 1 : {
                        agent.add( `Yes, ${runNameTitleCase} is groomed today. Would you like to check another?`);

                        break;
                    }
                    default : {
                        var responseMessage = 'Yes';
                        for( var i = 0; i < numberOfRuns; i++ ){
                            if ( i == numberOfRuns - 1 ){
                                responseMessage += ` and `;
                            }
                            else{
                                responseMessage += `, `;
                            }
                            responseMessage += grooming.groomedRuns[i];
                        }
                        
                        responseMessage += ' are groomed today. Would you like to check another?';
                        agent.add( responseMessage );
                    }
                }
            }
            else{
                agent.add( `There are ${numberOfRuns} runs groomed on Whistler and Blackcomb today.`);
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
        agent.setContext({ name: 'grooming', lifespan: 2, parameters: { runName: `${runNameTitleCase}` }});
        return groomingPromise;
    }

    // // Uncomment and edit to make your own intent handler
    // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
    // // below to get this function to be run when a Dialogflow intent is matched
    function checkLift(agent) {
    
        var scraper = new Scraper( console );
        var queryLiftName = agent.parameters.liftName;
        var liftPromise = scraper.liftQuery( queryLiftName );
    
        liftPromise.then( (mountainLifts) => {
            console.log( `input Lift Name: ${queryLiftName}`);
            console.log( `output Mountain Lifts: ${JSON.stringify(mountainLifts)}`);
            console.log( `Number of mountains: ${mountainLifts.length}`);
            
            var lifts = getLiftsFromMountain( mountainLifts );

            console.log( `output Lifts: ${JSON.stringify(lifts)}`);

            var numberOfLifts = lifts.length;

            if ( queryLiftName ){

                switch (numberOfLifts) {
                    case 0 :{
                        agent.add(`Sorry, I could not find a lift named ${queryLiftName}. Would you like to check another?`);
                        break;
                    }
                    case 1 : {
                        agent.add( `${queryLiftName} is ${lifts[0].status}. Would you like to check another?`);
                        break;
                    }
                    default : {
                        var responseMessage = '';
                        for( var i = 0; i < numberOfLifts; i++ ){
                            
                            if ( i == numberOfLifts - 1 ){
                                responseMessage += ` and `;
                            }
                            else{
                                responseMessage += `, `;
                            }
                            responseMessage += `${lifts[i].name} is ${lifts[i].status}`;
                        }
                        
                        responseMessage += ' right now. Would you like to check another?';
                        agent.add( responseMessage );
                    }
                }
            }
            else{
                agent.add( `There are ${numberOfLifts} lifts open on Whistler and Blackcomb right now.`);
            }
        });

        agent.setContext({ name: 'CheckaLift-followup', lifespan: 2 });
        return liftPromise;
    }

    function getLiftsFromMountain( mountains ){
        for ( var i = 0; i < mountains.length; i++){
            if ( mountains[i].length > 0 ){
                return mountains[i];
            }
        }
        return [];
    }
    
  // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);

  intentMap.set('Check Grooming', checkGrooming);
  intentMap.set('Check Another Run', checkGrooming);
  intentMap.set('Check a Lift', checkLift);
  intentMap.set('Check Another Lift', checkLift);
  agent.handleRequest(intentMap);
});

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}
