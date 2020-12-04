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


const jsdom = require( 'jsdom' );
const { JSDOM } = jsdom;
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const moment = require( 'moment' );
const stations = {
    "Whistler Peak" : "weather-station-peak.php",
    "Roundhouse" : "weather-station-rhl.php",
    "Rendezvous" : "weather-station-rendezvous.php",
    "Pig Alley" : "weather-station-pig.php",
    "Crystal Ridge" : "weather-station-crystal.php",
    "Catskinner" : "weather-station-cat.php",
    "Whistler Village" : "weather-station-village.php",
    "Harmony" : "weather-station-harmony.php",
    "Symphony" : "weather-station-symphony.php"
};

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

/**
 * This code is required to ensure that timestamps stored in Cloud Firestore will be read back as
Firebase Timestamp objects instead of as system Date objects. So you will also
need to update code expecting a Date to instead expect a Timestamp. For example:

  // Old:
  const date = snapshot.get('created_at');
  // New:
  const timestamp = snapshot.get('created_at');
  const date = timestamp.toDate();
 */
const Firestore = require('@google-cloud/firestore');
const firestore = new Firestore();
const settings = {timestampsInSnapshots: true};
firestore.settings(settings);

module.exports = class WhistlerPeakScraper {
    constructor ( console ){
        this.urlBase = 'http://www.whistlerpeak.com';
        this.console = console;
    }
    
    queryPromiseError( error ){
        this.console.error( "There was an error getting the requested status" );
        this.console.error( error );

        throw error;
    }

    //Grooming

    runGroomingQuery( runName ){

        var getUri = `${this.urlBase}/block-grooming.php`;

        var jsDompromise = JSDOM.fromURL( getUri );

        return jsDompromise.then( dom => this.runGroomingQueryPromiseFulfilled( dom, runName ), error => this.queryPromiseError( error ) );

    }

    runGroomingQueryPromiseFulfilled( dom, runName ) { 
        try{
            const { window } = dom.window;
            const $ = require( 'jquery' )(window);
            var grooming = {};

            grooming.searchedName = runName;

            grooming.groomedRuns = this.getRunGroomingStatus( $, runName );

            return grooming;
        }
        catch( e ){
 
            console.error( `An error occurred in groomingQueryPromiseFulfilled: ${e}`);
            throw e;
        }
    }


    getRunGroomingStatus( $, requestedRun ){
        var runs = $(`.alert-box:contains("${requestedRun}")`);
        
        var foundRuns = [];
        runs.each( function(index) {
            foundRuns.push( $(this).text() );
        })
            
        return foundRuns;
    }
    
    collectGroomingReport( ){

        var getUri = `${this.urlBase}/block-grooming.php`;

        var jsDomPromise = JSDOM.fromURL( getUri );

        return jsDomPromise.then( dom => this.groomingReportQueryPromiseFulfilled( dom ), error => this.queryPromiseError( error ) )
                            .then( grooming => this.saveGroomingReport( grooming ), error => this.queryPromiseError( error ) );

    }
    
    groomingReportQueryPromiseFulfilled( dom ) { 
        try{
            const { window } = dom.window;
            const $ = require( 'jquery' )(window);
            var grooming = {};

            grooming.groomedRuns = this.getGroomingReport( $ );

            return grooming;
        }
        catch( e ){
 
            console.error( `An error occurred in groomingReportQueryPromiseFulfilled: ${e}`);
            throw e;
        }
    }

    getGroomingReport( $ ){
        var runs = $(`.alert-box`);
        
        var foundRuns = [];
        runs.each( function(index) {
            foundRuns.push( $(this).text() );
        })
            
        return foundRuns;
    }

    saveGroomingReport( grooming ){
        try{
            var dateKey = moment().toJSON();
            var groomingDocRef = db.collection( 'grooming' ).doc( dateKey );
    
            groomingDocRef.set( grooming );
        }
        catch( e ){
             
            console.error( `An error occurred in saveGroomingReport: ${e}`);
            throw e;
        }
 
    }

    //Lifts

    liftQuery( liftName ){
        var openLiftPromise = this.whistlerBlackcombOpenLifts();

        return openLiftPromise.then( lifts => this.getLiftStatus(lifts, this.escapeApostrophes( liftName )), error => this.queryPromiseError( error ) );
    }

    whistlerBlackcombOpenLifts(){

        var getUri = `${this.urlBase}/lifts/block-lifts-grid.php`;

        var jsDompromise = JSDOM.fromURL( getUri );

        return jsDompromise.then( dom => this.openLiftPromiseFulfilled( dom ), error => this.queryPromiseError( error ) );

    }

    openLiftPromiseFulfilled( dom ){
        try{
            const { window } = dom.window;
            const $ = require( 'jquery' )(window);
            var lifts = {};

            lifts = this.getOpenLifts( $ );
            
            return lifts
        }
        catch( e ){
            
            throw e;
        }
    }

    getOpenLifts( $ ){

        var liftCards = $(`.card-lifts`);

        var foundLifts = [];

        liftCards.each( function (index, element) {

            var liftName = $(this).next().children(`.openLift`).text();
            var liftWait = $(this).next().children(`.waitTime`).text().slice(0,-1);
            
            if ( liftName ){
                var liftInfo = { 
                    "Name" : liftName,
                    "WaitTimeInMinutes" : liftWait,
                    "LiftStatus" : "Open"
                } 
                    
                foundLifts.push( liftInfo );
            }
 
        } );
            
        return foundLifts;
    }

    getOpenLiftName( $ ){
        return $(`.openLift`).text();
    }

    getOpenLiftWaitTimeInMinutes( $ ){
        // return the time, slicing off the last character which is expected to be an 'm'
        return $(`.waitTime`).text().slice(0,-1)
    }

    getLiftStatus( lifts, liftName ){
        var lift = lifts.filter( currentValue => currentValue.Name == liftName );
        if ( lift.length == 0 ){
            lift.push({
                Name: liftName,
                WaitTimeInMinutes: 0,
                LiftStatus: "Closed"
            });
        }
        return  lift[0];
      }

    escapeApostrophes( name ){
        return name.replace( "'", "\\'" );
    }

    // Current Weather

    weatherReport(){

        var reportPromises = [];

        for ( var stationName in stations ) {
            var stationUriPart = this.getWesatherStationUriPart( stationName );

            if ( stationUriPart ){
            
                var getUri = `${this.urlBase}/${stationUriPart}`;
    
                // wrap the jsdom promise in another promise so that we can tie the station name to the promise result
                var jsDompromise = new Promise( (resolve, reject ) => {
                    var response = {
                        "domPromise" : JSDOM.fromURL( getUri ),
                        "stationName" : stationName
                    }
                    resolve( response );
                })
                
                var stationReport = jsDompromise.then( response => response.domPromise.then( dom => this.currentWeatherQueryPromiseFulfilled( dom, response.stationName ), error => this.queryPromiseError( error ) )  );
                reportPromises.push( stationReport );
            }
            else{
                throw new Error( `Station ${stationName} is unknown.` );
            }
        };

        return Promise.all( reportPromises );
    }

    currentWeatherQuery( stationName ){

        var stationUriPart = this.getWesatherStationUriPart( stationName );

        if ( stationUriPart ){
        
            var getUri = `${this.urlBase}/${stationUriPart}`;

            var jsDompromise = JSDOM.fromURL( getUri );

            return jsDompromise.then( dom => this.currentWeatherQueryPromiseFulfilled( dom, stationName ), error => this.queryPromiseError( error ) );
        }
        else{
            throw new Error( `Station ${stationName} is unknown.` );
        }
    }

    currentWeatherQueryPromiseFulfilled( dom, stationName ) { 
        try{
            const { window } = dom.window;
            const $ = require( 'jquery' )(window);
            var station = {};

            station.name = stationName;

            station.temperature = this.getTemperature( $ );
            station.wind = this.getWind( $ );

            return station;
        }
        catch( e ){
 
            console.error( `An error occurred in currentWeatherQueryPromisFulFilled: ${e}`);
            throw e;
        }
    }


    getTemperature( $ ){
        var temperature = $(".alert-box").first().find('H3').first().html( function(){
            $('span').remove()
        }).text();
            
        return this.parseTemperatureText( temperature );
    }

    parseTemperatureText( temperatureText ){
        var regex = /(\S*)°C/;
        var matches = temperatureText.match( regex );
    
        if (matches){
            return matches[1];
        }
        else{
            return null;
        }
    }

    getWind( $ ){
        var windText = $("h6.show-for-small-up.hide-for-medium-up").first().text();

        return this.parseWindText( windText );
    }

    parseWindText( windText ){

        var regex = /Ave: ([\d\.]*)km\/h\s*Max: ([\d\.]*)km\/h\s*Dir: (\w{1,3})/;
        var matches = windText.match( regex );

        var wind;

        if ( matches ){
            wind = {};
            wind.average = matches[1];
            wind.maximum = matches[2];
            wind.direction = matches[3];
        }

        return wind;
    }

    getWesatherStationUriPart( stationName ){
        
        return stations[stationName];
    }

    /// Snow ///

    snowReport(){
        
        var getUri = `${this.urlBase}/snow/block-snow-grid.php`;

        var jsDompromise = JSDOM.fromURL( getUri );

        return jsDompromise.then( dom => this.snowReportQueryPromiseFulfilled( dom ), error => this.queryPromiseError( error ) );
        
    }

    snowReportQueryPromiseFulfilled( dom ) { 
        try{
            const { window } = dom.window;
            const $ = require( 'jquery' )(window);
            var report = this.getSnowReport( $ );

            return report;
        }
        catch( e ){
 
            console.error( `An error occurred in snowReportQueryPromiseFulfilled: ${e}`);
            throw e;
        }
    }

    getSnowReport ( $ ){
        var snowContainer = $(`.snow-container`);
        var newSnowCards = [];
        var snowAmountPeriods = snowContainer.children(`div`);
        snowAmountPeriods.each( function (index, element) {
            var period = $(this).children(`p`).text();
            if ( $(this).hasClass(`baseReading`) ){
                var amount = $(this).children(`div.snowAmount`).first().text().trim();
            }
            else{
                var amount = $(this).children(`div`).children(`div.snowAmount`).first().text().trim();
            }
            newSnowCards.push( {
                "period" : period,
                "amount" : amount
            } );
        });

        return newSnowCards;
    }
}