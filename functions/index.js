// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const { dialogflow, Image, UpdatePermission, SimpleResponse, Suggestions } = require('actions-on-google')
const Scraper = require( './whistlerpeak-scraper.js' );
const Parser = require( './epicmix-parser.js' );

const {google} = require('googleapis');
const request = require('request');
const PATH_TO_KEY = '../Whistler Status-81ad35ac7976.json'; // <--- Do not put this key into Git Hub, it is a private key
const key = require(PATH_TO_KEY);

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const app = dialogflow({debug: true});

app.intent('Default Welcome Intent', welcome );
app.intent('Default Fallback Intent', fallback );

app.intent('Check Grooming', checkGrooming );
app.intent('Check Another Run', checkGrooming );
app.intent('Check a Lift', checkLift );
app.intent('Check Another Lift', checkLift );
app.intent('Notify When A Lift Status Changes', notifyOnLiftStatus );
app.intent('Setup Push Notifications', setupNotification );
app.intent('Finish Push Setup', finishNotificationSetup );

const welcomeSuggestions = [
    'Check Grooming',
    'Check a Lift'
]

function welcome(conv) {
    conv.ask(new SimpleResponse({
        speech: 'Welcome to Whistler Status! How can I help you?',
        text: 'Welcome to Whistler Status! How can I help you?',
    }));
    
    conv.ask(new Suggestions(welcomeSuggestions));
}

function fallback(conv) {
    conv.ask(new SimpleResponse({
        speech: `Sorry, I didn't understand. Please try again.`,
        text: `Sorry, I didn't understand.`,
    }));
    
    conv.ask(new Suggestions(welcomeSuggestions));
}

function checkGrooming( conv ){

    var inputRunName = getInputRunNameInTitleCase( conv );

    return getGroomingPromise( inputRunName ).then( (grooming) => {
        
        conv.ask( groomingResponse( inputRunName, grooming) ); 
        conv.contexts.set( 'grooming', 2 );
    }); 
}

function getGroomingPromise( queryRunName ) {

    var scraper = new Scraper( console );
    
    var groomingPromise = scraper.groomingQuery( queryRunName );

    return groomingPromise;
}

function getInputRunNameInTitleCase( conv ){
    return toTitleCase( conv.parameters.runName );
}

function groomingResponse( inputRunName, grooming ){
    
    var numberOfRuns = getNumberOfGroomedRuns( grooming );
    var responseMessage;

    console.log( `output Grooming: ${grooming.groomedRuns}`);
    console.log(`Number of groomed runs: ${numberOfRuns}`);

    if ( inputRunName ){

        responseMessage = selectGroomingResponse( inputRunName, grooming );
    }
    else{
        responseMessage = `There are ${numberOfRuns} runs groomed on Whistler and Blackcomb today. `;
    }

    return new SimpleResponse({
        speech: responseMessage,
        text: responseMessage
    });
}

function getNumberOfGroomedRuns( grooming ){
    return  grooming.groomedRuns.length;
}

function selectGroomingResponse( inputRunName, grooming ){

    var responseMessage;
    var numberOfRuns = getNumberOfGroomedRuns( grooming );

    switch (numberOfRuns) {
        case 0 :{
            responseMessage = `No ${inputRunName} is not groomed today. Would you like to check another?`;
            break;
        }
        case 1 : {
            responseMessage = `Yes, ${inputRunName} is groomed today. Would you like to check another?`;
            break;
        }
        default : {
            responseMessage = 'Yes';
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
        }
    }

    return responseMessage;
}

function checkLift( conv ) {

    var parser = new Parser( console );
    var queryLiftName = conv.parameters.liftName;
    var liftInfoPromise = parser.liftQuery( queryLiftName );

    liftInfoPromise.then((liftInfo) => {
        var responseMessage;
        console.log( `input Lift Name: ${queryLiftName}`);

        if ( liftInfo ){
            console.log ( `lift found: ${JSON.stringify( liftInfo.Name )}` );

            switch (liftInfo.LiftStatus){
                case "Closed" : {
                    responseMessage = `${liftInfo.Name} is Closed. Would you like to check another?`;
                    break;
                }
                case "Standby" : {
                    responseMessage = `${liftInfo.Name} is On Standby. Would you like to check another?`;
                    break;
                }
                case "Open" : {
                    responseMessage = `${liftInfo.Name} is Open. The wait time is currently ${liftInfo.WaitTimeInMinutes} minutes. Would you like to check another?`;
                    break;
                }
                
            }
 
        }
        else{
            responseMessage = `Sorry, I could not find a lift named ${queryLiftName}. Would you like to check another?`;
        }
                    
        conv.ask(new SimpleResponse({
            speech: responseMessage,
            text: responseMessage,
        }));

        conv.contexts.set( 'CheckaLift-followup', 2 );
    });
    
    return liftInfoPromise;
}

function responseWhenNoLiftNameSpecified(){
    return `Which lift would you like to check?`;
}

function getLiftsFromMountain( mountains ){
    for ( var i = 0; i < mountains.length; i++){
        if ( mountains[i].length > 0 ){
            return mountains[i];
        }
    }
    return [];
}

function notifyOnLiftStatus( conv ){
    console.log( 'Notify When A Lift Status Changes');
}

function setupNotification( conv ){
    console.log( 'Setup Push Notifications' );
    conv.ask(new UpdatePermission({intent: 'Check a Lift'}));
}

function finishNotificationSetup( conv ){
    console.log('Finish Push Setup');

    if (conv.arguments.get('PERMISSION')) {
      const userID = conv.arguments.get('UPDATES_USER_ID');
      // code to save intent and userID in your db
      conv.close(`Ok, I'll start alerting you.`);
      
    } else {
      conv.close(`Ok, I won't alert you.`);
    }
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function testNotification(){
    var userID = 'ABwppHGKZe_sxq25BB-UesIt1AMqK8eAbMWXMUvrFm5HdjKHVKx1rr9HAjuF7fOvHSBhQEXoZq4TgT9k5tvndZKTBMos7Ra9';
    sendNotifcation( userID, 'Check a Lift');
}

function sendNotifcation( userId, intent ){ 
    let jwtClient = new google.auth.JWT(
        key.client_email, null, key.private_key,
        ['https://www.googleapis.com/auth/actions.fulfillment.conversation'],
        null
    );
    
    jwtClient.authorize((err, tokens ) => {
    
        // code to retrieve target userId and intent
        let notif = {
            userNotification: {
            title: 'Harmony is Open',
            },
            target: {
            userId: userId,
            intent: intent,
            // Expects a IETF BCP-47 language code (i.e. en-US)
            locale: 'en-US'
            },
        };

        request.post('https://actions.googleapis.com/v2/conversations:send', {
            'auth': {
            'bearer': tokens.access_token,
            },
            'json': true,
            'body': {'customPushMessage': notif},
        }, (err, httpResponse, body) => {
            console.log( 'notifcation post: ' + httpResponse.statusCode + ': ' + httpResponse.statusMessage);
        });
    });
}

exports.fulfillment = functions.https.onRequest(app);
