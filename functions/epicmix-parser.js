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


const request = require( 'request' );

module.exports = class EpicMixParser {
    constructor ( console ){
        this.urlBase = 'http://www.epicmix.com';
        this.console = console;
    }

    liftQuery( liftName ){
        return new Promise((resolve, reject) => {
            this.getLiftInfo( liftName, resolve, reject );
        });
    }

    getLiftInfo( liftName, resolve, reject ){
        var requestUrl = `https://xtopherbrandt.builtwithdark.com/liftstatus?liftName=${liftName}`;
        request( requestUrl, ( error, response, body ) => {
            
            var liftInfo;

            if ( error ){
                console.error('error retrieving lift information:', error);
            }
            else if ( response.statusCode >= 400 ) {
                console.error('problem retriving lift information. statusCode:', response && response.statusCode); // Print the response status code if a response was received
            }
            else if ( body ){
                liftInfo = JSON.parse( body );
            }
              
            resolve( liftInfo );

        } );
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
            console.error('error retrieving lift information:', error);
        }
        else if ( response.statusCode >= 400 ) {
            console.error('problem retriving lift information. statusCode:', response && response.statusCode); // Print the response status code if a response was received
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