
'use strict';


const request = require( 'request' );

module.exports = class EpicMixParser {
    constructor ( console ){
        this.urlBase = 'http://www.epicmix.com';
        this.console = console;
    }

    liftQuery( liftName ){
        return new Promise((resolve, reject) => {
            this.getLiftStatus( liftName, resolve, reject );
        });
    }

    getLiftStatus( liftName, resolve, reject ){
        var requestUrl = this.urlBase + '/VailResorts/sites/epicmix/api/Time/WaitTimeByResort.ashx?deviceType=android&resortID=13&ipCode=23117945';
        request( requestUrl, ( error, response, body ) => {
            var resortLiftInfo;
            var liftInfo;
            resortLiftInfo = this.getLiftResponse( error, response, body );
            
            liftInfo = this.findLiftInResort( liftName, resortLiftInfo );
            resolve( liftInfo );

        } );
    }

    getLiftResponse( error, response, body ){
        
        var resortLiftInfo;

        if ( error ){
            console.log('error retrieving lift information:', error);
        }
        else if ( response.statusCode >= 400 ) {
            console.log('problem retriving lift information. statusCode:', response && response.statusCode); // Print the response status code if a response was received
        }
        else if ( body ){
            resortLiftInfo = JSON.parse( body );
        }
          
        return resortLiftInfo;

    }

    findLiftInResort( liftName, resortLiftInfo ){
        var groomingAreas = this.getGroomingAreas( resortLiftInfo );
        for( var i = 0; i < groomingAreas.length; i++ ){
            var locations = this.getGroomingAreaLocations( groomingAreas[ i ] );
            var liftInGroomingArea = this.findLiftInLocationSet( liftName, locations );
            if ( liftInGroomingArea.length > 0 ){
                return liftInGroomingArea[0];
            }
        }
    }

    getGroomingAreas( resortLiftInfo ){
        return resortLiftInfo.GroomingAreas;
    }

    getGroomingAreaLocations( groomingArea ){
        return groomingArea.Locations;
    }

    findLiftInLocationSet( liftName, locations ){
        return locations.filter( location => location.Name == liftName );
    }
}