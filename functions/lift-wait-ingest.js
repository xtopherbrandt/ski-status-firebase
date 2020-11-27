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
const admin = require('firebase-admin');
const Lifts = require('./lifts');
const Parser = require('./epicmix-parser');
const moment = require( 'moment' ); 

admin.initializeApp( functions.config().firebase, 'wait-ingest' );
let db = admin.firestore();

module.exports = function( context ){
    console.log('Lift Wait Ingester');
    var lifts = new Lifts();
    var waitTimePromiseArray;
    waitTimePromiseArray = lifts.lifts.map( startLiftQuery );
    Promise.all( waitTimePromiseArray ).then( (liftInfoArray)=>{
        console.log( 'Ingestion Finished.'); 
        var liftWaits = {}
        liftInfoArray.map( storeCurrentWaitTimeForALift, liftWaits );
        console.log( liftWaits );
        var docName = moment().toISOString();
        db.collection('waitTime').doc(docName).set( liftWaits );
     });
    return null;
}

function startLiftQuery( queryliftName ){
    var parser = new Parser( console );

    console.log( queryliftName );
    
    return parser.liftQuery( queryliftName );
}

function storeCurrentWaitTimeForALift( liftInfo ){

    var responseMessage;

    if ( liftInfo ){

        var liftName = liftInfo.Name;
        var dataPoint = {};
        
        switch (liftInfo.LiftStatus){
            case "Closed" : {
                responseMessage = `${liftName} is Closed.`;
                dataPoint.status = 'Closed';
                dataPoint.wait = 0;
                break;
            }
            case "Hold" : {
                responseMessage = `${liftName} is on Standby. Wait time: ${ liftInfo.WaitTimeInMinutes }`;
                dataPoint.status = 'Standby';
                dataPoint.wait = liftInfo.WaitTimeInMinutes;
                break;
            }
            case "Open" : {
                responseMessage = `${liftName} is Open. Wait time: ${ liftInfo.WaitTimeInMinutes }`;
                dataPoint.status = 'Open';
                dataPoint.wait = liftInfo.WaitTimeInMinutes;
                break;
            }
            
        }
        
        this[liftName] = dataPoint;

    }
    else{
        responseMessage = `**************** Bad lift name.`;
    }
            
    console.log( responseMessage );

}