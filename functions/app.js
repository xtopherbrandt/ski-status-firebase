/**
Copyright (C) 2019 Christopher Brandt

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

Contact Info: xtopher.brandt at gmail
*/

'use strict';
 
const functions = require('firebase-functions');
const { dialogflow, Image, UpdatePermission, SimpleResponse, Suggestions, BasicCard, Button } = require('actions-on-google')
const Scraper = require( './whistlerpeak-scraper.js' );
const Parser = require( './epicmix-parser.js' );
const checkWeather = require( './checkWeather.js' );
const moment = require( 'moment' );

const {google} = require('googleapis');
const request = require('request');
const PATH_TO_KEY = './Whistler Status-81ad35ac7976.json'; // <--- Do not put this key into Git Hub, it is a private key
const key = require(PATH_TO_KEY);

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const app = dialogflow({debug: false});

const admin = require('firebase-admin');


app.intent('Default Welcome Intent', welcome );
app.intent('Default Fallback Intent', fallback );

app.intent('What Can You Do', help );
app.intent('Who was Dave Murray', daveMurray );

app.intent('Check Grooming Report', checkGrooming );
app.intent('Check Grooming Regular Run', checkGrooming );
app.intent('Check Another Run', checkGrooming );
app.intent('Check Grooming - yes', checkGrooming );
app.intent('Check Grooming - no', howElseCanIHelp );

app.intent('Check a Lift', checkLift );
app.intent('Check Another Lift', checkLift );
app.intent('Check a Lift - yes', checkLift );
app.intent('Check a Lift - no', howElseCanIHelp );

app.intent('Check Wait Time', checkWaitTime );
app.intent('Check Another Wait', checkWaitTime );
app.intent('Check Wait Time - yes', checkWaitTime );
app.intent('Check Wait Time - no', howElseCanIHelp );

app.intent('Check Temperature', checkWeather.start );
app.intent('Check Temperature - yes', checkWeather.start );
app.intent('Check Another Temperature', checkWeather.start );
app.intent('Check Temperature - no', howElseCanIHelp );
app.intent('Check Temperature Somewhere Else', checkWeather.unknownPlace )

app.intent('Notify When A Lift Status Changes', notifyOnLiftStatus );
app.intent('Setup Push Notifications', setupNotification );
app.intent('Finish Push Setup', finishNotificationSetup );

app.intent('Collect Grooming Report', collectGroomingReport );

const welcomeSuggestions = [
    'Grooming',
    'Wait Times',
    'Temperatures'
]

function welcome(conv) {

    console.log( 'Welcome' );

    var dayPartName = getDayPartName();

    conv.ask(new SimpleResponse({
        speech: `Good ${dayPartName} from Whistler! How can I help you?`,
        text: `Good ${dayPartName} from Whistler! How can I help you? V2019.20`
    }));
    
    conv.ask(new Suggestions(welcomeSuggestions));
}

function getDayPartName(){
    var hour = moment().utcOffset(-8, false ).hour();

    if ( hour > 2 && hour < 12 ) {
        return 'morning';
    }
    if ( hour >= 12 && hour < 18 ){
        return 'afternoon';
    }
    if ( hour >= 18 || hour <= 2 ){
        return 'evening'
    }
}

function fallback(conv) {
    
    console.log( 'Fallback' );

    conv.ask(new SimpleResponse({
        speech: `Sorry, I didn't catch that. You can ask questions like, 'Is Whiskey Jack groomed?', 'What's the wait time at Harmony' or 'What's the temperature at the Roundhouse'.`,
        text: `Here's a little help...`
    }));
        
    conv.ask( new BasicCard({
        title: `Whistler Status`,
        subtitle: `Assistant Help`,
        text: `I can tell about the status of runs, lifts and the weather at the Whistler Blackcomb ski resort. You can ask questions like:  \n *Is Bear Paw groomed?*  \n *What's the wait time at Glacier Express*  \n *What's the temperature at the Blackcomb Peak*`
    }))

    conv.ask(new Suggestions(welcomeSuggestions));
    conv.contexts.set( 'Root', 1 );
}

function help(conv) {
    
    console.log( 'Help' );

    conv.ask(new SimpleResponse({
        speech: `I can tell you about the status of runs, lifts and the weather at the Whistler Blackcomb ski resort. You can ask questions like, 'Is Whiskey Jack groomed?', 'What's the wait time at Harmony' or 'What's the temperature at the Roundhouse'. What would you like to do?`,
        text: `Here's a little help...`
    }));
    
    conv.ask( new BasicCard({
        title: `Whistler Status`,
        subtitle: `Assistant Help`,
        text: `I can tell about the status of runs, lifts and the weather at the Whistler Blackcomb ski resort. You can ask questions like:  \n *Is Bear Paw groomed?*  \n *What's the wait time at Glacier Express*  \n *What's the temperature at the Blackcomb Peak*`
    }))

    conv.ask(new Suggestions(welcomeSuggestions));
    conv.contexts.set( 'Root', 1 );
}

function daveMurray(conv) {
    
    console.log( 'Dave Murray' );

    conv.ask(new SimpleResponse({
        speech: `Dave Murray was an alpine ski racer. He was noted for being a member of the Crazy Canucks, the Canadian downhill racers of the late 1970s and early 1980s known for their fearless racing style. His teammates in the group were Ken Read, Dave Irwin, and Steve Podborski. He has been memorialized at Whistler, with his name on one of the best downhill ski runs around. How else can I help?`,
        text: `Here's a what I know...`,
    }));
    
    conv.ask( new BasicCard({
        title: `Whistler Status`,
        subtitle: `Dave Murray`,
        text: `Dave Murray was an alpine ski racer. He was noted for being a member of the Crazy Canucks, the Canadian downhill racers of the late 1970s and early 1980s known for their fearless racing style. His teammates in the group were Ken Read, Dave Irwin, and Steve Podborski. He has been memorialized at Whistler, with his name on one of the best downhill ski runs around.`,
        buttons: new Button({
            title: `Canadian Ski Museum`,
            url: `http://www.skimuseum.ca/biodata.php?lang=en&id=102`
        })
    }))

    conv.ask(new Suggestions(welcomeSuggestions));
    conv.contexts.set( 'Root', 1 );
}

function howElseCanIHelp(conv) {

    console.log( 'How Else Can I Help' );

    conv.ask(new SimpleResponse({
        speech: `Ok. Is there anyting else I can help with?`,
        text: `Ok. Is there anyting else I can help with?`,
    }));
    
    conv.ask(new Suggestions(welcomeSuggestions));
    conv.contexts.set( 'Root', 1 );
}

function collectGroomingReport( conv ){

    console.log( 'Collect Grooming' );

    return collectGroomingReportPromise().then( () => {
        console.log( 'Collected' );
        conv.close();
    })
}

function collectGroomingReportPromise( ) {

    var scraper = new Scraper( console );
    
    var groomingPromise = scraper.collectGroomingReport( );

    return groomingPromise;
}

function checkGrooming( conv ){

    console.log( 'Check Grooming' );

    var inputRunName = getInputRunName( conv );

    if ( inputRunName ){

        console.log( inputRunName );

        return getGroomingPromise( inputRunName ).then( (grooming) => {
            
            conv.ask( groomingResponse( inputRunName, grooming) ); 
            
            exampleRunSuggestions( conv );

        }); 
    }
    else{
        
        conv.ask(new SimpleResponse({
            speech: `Alright. Which Run?`,
            text: `Alright. Which Run?`,
        }));

        exampleRunSuggestions( conv );
    }

}

function getGroomingPromise( queryRunName ) {

    var scraper = new Scraper( console );
    
    var groomingPromise = scraper.runGroomingQuery( queryRunName );

    return groomingPromise;
}

function getInputRunName( conv ){
    return conv.parameters.runName;
}

function getInputRunNameInTitleCase( conv ){
    return toTitleCase( getInputRunName( conv ) );
}

function groomingResponse( inputRunName, grooming ){
    
    var numberOfRuns = getNumberOfGroomedRuns( grooming );
    var responseMessage;

    if ( inputRunName ){

        responseMessage = selectGroomingResponse( inputRunName, grooming );
    }
    else{
        responseMessage = `Cool. Which run?`;
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
            responseMessage = `No, ${inputRunName} is not groomed today. Would you like to check another?`;
            break;
        }
        case 1 : {
            responseMessage = `Yes, ${grooming.groomedRuns[0]} is groomed today. Would you like to check another?`;
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

function exampleRunSuggestions( conv ){

    var runExamples = ['Dave Murray', 'Cruiser', 'Unsanctioned'];
    conv.ask( new Suggestions( runExamples ) );
    conv.contexts.set( 'CheckGrooming', 3 );
}

function checkWaitTime( conv ){

    console.log( 'Check Wait Time' );

    var queryLiftName = conv.parameters.liftName;

    if ( queryLiftName ){

        console.log( queryLiftName );

        return getLiftInfoPromise( queryLiftName ).then( (liftInfo) => {
            
            conv.ask( waitTimeResponse( queryLiftName, liftInfo) ); 
            exampleLiftSuggestions( conv );
            conv.contexts.set( 'CheckWaitTime', 3 );
        }); 
    }
    else {
        
        conv.ask(new SimpleResponse({
            speech: `Cool. Which Lift?`,
            text: `Cool. Which Lift?`,
        }));

        conv.contexts.set( 'CheckWaitTime', 3 );

        exampleLiftSuggestions( conv );
/**        
        var lifts = new Lifts();

        // Create a list
        conv.ask(new List({
            title: 'Whistler Blackcomb Lifts',
            items: {
            // Add the first item to the list
            "Whistler Village Gondola Lower": {
                synonyms: [
                "Whistler Village Gondola Lower"
                ],
                title: "Whistler Village Gondola Lower"

                },
            "Whistler Village Gondola Upper": {
                synonyms: [
                "Whistler Village Gondola Upper"
                ],
                title: "Whistler Village Gondola Upper"

                }
            }
        }));
*/
    }

}

function exampleLiftSuggestions( conv ){

    var liftExamples = ['Creekside', 'Village Gondola', 'Wizlar'];
    conv.ask( new Suggestions( liftExamples ) );
    
}

function getLiftInfoPromise( queryLiftName ){

    var parser = new Parser( console );
    return parser.liftQuery( queryLiftName );

}

function waitTimeResponse( queryLiftName, liftInfo ){
    
    var responseMessage;

    if ( liftInfo ){

        responseMessage = selectWaitTimeResponse( liftInfo );
    }
    else{
        responseMessage = `Sorry, I could not find a lift named ${queryLiftName}. Would you like to check another?`;
    }

    return new SimpleResponse({
        speech: responseMessage,
        text: responseMessage,
    });
}

function selectWaitTimeResponse( liftInfo ){

    var responseMessage;
    var liftName = liftInfo.Name;

    switch (liftInfo.LiftStatus){
        case "Closed" : {
            if (liftInfo.WaitTimeInMinutes > 0 ){
                responseMessage = `${liftInfo.Name} is Closed, and there's already a ${liftInfo.WaitTimeInMinutes} minute wait. Would you like to check another?`;
            }
            else{
                responseMessage = `${liftInfo.Name} is Closed. Would you like to check another?`;
            }
            
            break;
        }
        case "Hold" : {
            var waitTimeText = getTextForStandbyLiftWait( liftInfo.WaitTimeInMinutes, liftName );
            responseMessage = `${waitTimeText} Would you like to check another?`;
            break;
        }
        case "Open" : {
            var waitTimeText = getTextForOpenLiftWait( liftInfo.WaitTimeInMinutes, liftName );
            responseMessage = `${ waitTimeText } Would you like to check another?`;
            break;
        }
        
    }

    return responseMessage;
}

function checkLift( conv ) {

    console.log( 'Check Lift' );

    var parser = new Parser( console );
    var queryLiftName = conv.parameters.liftName;

    if ( !queryLiftName ){
        
        conv.ask(new SimpleResponse({
            speech: `Excellent. Which Lift?`,
            text: `Excellent. Which Lift?`,
        }));

        exampleLiftSuggestions( conv );
        conv.contexts.set( 'CheckLift', 3 );
        return;
    }

    console.log( queryLiftName );
    
    var liftInfoPromise = parser.liftQuery( queryLiftName );

    liftInfoPromise.then((liftInfo) => {
        var responseMessage;

        if ( liftInfo ){

            var liftName = liftInfo.Name;

            switch (liftInfo.LiftStatus){
                case "Closed" : {
                    responseMessage = `${liftName} is Closed. Would you like to check another?`;
                    break;
                }
                case "Hold" : {
                    var waitTimeText = getTextForStandbyLiftCheck( liftInfo.WaitTimeInMinutes, liftName );
                    responseMessage = `${ waitTimeText } Would you like to check another?`;
                    break;
                }
                case "Open" : {
                    var waitTimeText = getTextForOpenLiftCheck( liftInfo.WaitTimeInMinutes, liftName );
                    responseMessage = `${ waitTimeText } Would you like to check another?`;
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

        exampleLiftSuggestions( conv );
        conv.contexts.set( 'CheckLift', 3 );
    });
    
    return liftInfoPromise;
}

function getTextForStandbyLiftWait( waitTimeInMinutes, liftName ){
    var responseText;

    if ( waitTimeInMinutes == 0 ){
            responseText = `${liftName} is on Stand-by, but there is currently no line (or the lift isn't telling me something).`;
    }
    else if ( waitTimeInMinutes == 1 ){
        responseText = `${liftName} is on Stand-by, but there's only a 1 minute wait.`;
    }
    else if ( waitTimeInMinutes > 1 && waitTimeInMinutes < 5 ){
        responseText = `There is only a ${waitTimeInMinutes} minute wait at ${liftName}. But it is on Stand-by.`
    }
    else if ( waitTimeInMinutes >= 5 && waitTimeInMinutes < 20 ){
        responseText = `Man, ${liftName} is on Stand-by, and it already has a ${waitTimeInMinutes} minute wait.`
    }
    else{
        responseText = `There is a ${waitTimeInMinutes} minute wait at ${liftName}. And it's still on Stand-by. That's crazy!`
    }

    return responseText;
}

function getTextForOpenLiftWait( waitTimeInMinutes, liftName ){
    var responseText;

    if ( waitTimeInMinutes == 0 ){
            responseText = `There is currently no line at ${liftName} (or the lift isn't telling me something).`;
    }
    else if ( waitTimeInMinutes == 1 ){
        responseText = `There's only a 1 minute wait at ${liftName}. Awesome!`;
    }
    else if ( waitTimeInMinutes > 1 && waitTimeInMinutes < 5 ){
        responseText = `There is only a ${waitTimeInMinutes} minute wait at ${liftName}.`;
    }
    else if ( waitTimeInMinutes >= 5 && waitTimeInMinutes < 20 ){
        responseText = `${liftName} currently has a ${waitTimeInMinutes} minute wait.`;
    }
    else{
        responseText = `The wait at ${liftName} is ${waitTimeInMinutes} minutes. It is running, just busy!`;
    }

    return responseText;
}

function getTextForStandbyLiftCheck( waitTimeInMinutes, liftName ){
    var responseText;

    if ( waitTimeInMinutes == 0 ){
        responseText = `${liftName} is on Stand-by, but there is currently no line (or the lift isn't telling me something).`;
    }
    else if ( waitTimeInMinutes == 1 ){
        responseText = `${liftName} is on Stand-by, but there's only a 1 minute wait.`;
    }
    else if ( waitTimeInMinutes > 1 && waitTimeInMinutes < 5 ){
        responseText = `${liftName} is on Stand-by and has a ${waitTimeInMinutes} minute line.`
    }
    else if ( waitTimeInMinutes >= 5 && waitTimeInMinutes < 20 ){
        responseText = `Boy, ${liftName} is on Stand-by, and it already has a ${waitTimeInMinutes} minute wait.`
    }
    else{
        responseText = `${liftName} is on Stand-by and there is a massive ${waitTimeInMinutes} minute wait. Brutal!`
    }

    return responseText;
}

function getTextForOpenLiftCheck( waitTimeInMinutes, liftName ){
    var responseText;

    if ( waitTimeInMinutes == 0 ){
        responseText = `${liftName} is Open and reporting no line. Can't be sure if that's correct.`;
    }
    else if ( waitTimeInMinutes == 1 ){
        responseText = `Yup ${liftName} is Open and vacant. There's only a 1 minute wait.`;
    }
    else if ( waitTimeInMinutes > 1 && waitTimeInMinutes < 5 ){
        responseText = `${liftName} is Open and there's only a ${waitTimeInMinutes} minute wait.`;
    }
    else if ( waitTimeInMinutes >= 5 && waitTimeInMinutes < 20 ){
        responseText = `${liftName} is Open and currently has a ${waitTimeInMinutes} minute wait.`;
    }
    else{
        responseText = `${liftName} is running but the line is ${waitTimeInMinutes} minutes. Wow!`;
    }

    return responseText;
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

        admin.initializeApp(functions.config().firebase);

        var db = admin.firestore();
        var userReference = db.collection('users').doc(userID).set({'notify' : true});
        var anyLiftReference = db.collection('notifications').doc('anyLiftUsers').set(userReference);


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

app.catch( (conv, e) => {
    console.error( `An unhandled exception was caught:\n ${e}` );
    conv.close( 'Oops. Something went really sideways. Kind of like I was riding fakey and caught an edge. Give me a minute to get myself back up, then try again.' );
  });

module.exports = app;
