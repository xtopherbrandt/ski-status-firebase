/**
Copyright (C) 2020 Christopher Brandt

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
 
const express = require('express');
const cors = require('cors');
const WhistlerPeakScraper = require('./whistlerpeak-scraper');
const { stringify } = require('actions-on-google/dist/common');

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

// Add middleware to authenticate requests
//app.use(myMiddleware);

// build multiple CRUD interfaces:
//app.get('/:id', (req, res) => res.send(Widgets.getById(req.params.id)));
app.get('/', (req, res) => getOverallStatus( req, res ));
app.get('/lift', (req, res) => getLiftStatus( req, res ));
app.get('/snow', (req, res) => getSnowReport( req, res ));

/// Lift ////
function getLiftName( req ){
    if ( req.query.liftName ){
        return req.query.liftName;
    }
    else{
        return '';
    }
}

function getLiftStatus( req, res ){

    var liftName = getLiftName( req );

    if (liftName == ''){
        getAllLiftStatus( req, res );
    }
    else{
        startWhistlerPeakLiftQuery( liftName ).then( liftInfo => {
            console.log( `   ${stringify(liftInfo)}`);
            var responseText = `${liftInfo.Name} is ${liftInfo.LiftStatus}`
            res.send( liftInfo );
            return responseText;
        },reason => {
            console.log ( `Look up failed` );
            console.log( reason );
            var responseText = `Sorry, I couldn't find any information on a ${liftName}`
            res.send( responseText );
        }).catch( error => {
            console.log ( `Look up error` );
            console.log( error );
            var responseText = `Sorry, I couldn't find any information on a ${liftName}`
            res.send( responseText );
        });
    }

}

function startWhistlerPeakLiftQuery( liftName ){
    var whistlerPeakScraper = new WhistlerPeakScraper();
   
    console.log( `Looking up: ${liftName}` );

    return whistlerPeakScraper.liftQuery(liftName);

}

function getAllLiftStatus( req, res ){

    startWhistlerPeakAllLiftStatus( ).then( liftInfo => {
        console.log( `   ${stringify(liftInfo)}`);
        var responseText = ``
        res.send( liftInfo );
        return responseText;
    },reason => {
        console.log ( `Look up failed` );
        console.log( reason );
        var responseText = `Sorry, my lookup failed.`
        res.send( responseText );
    }).catch( error => {
        console.log ( `Look up error` );
        console.log( error );
        var responseText = `Sorry, my lookup failed.`
        res.send( responseText );
    });
}

function startWhistlerPeakAllLiftStatus( ){
    var whistlerPeakScraper = new WhistlerPeakScraper();
   
    console.log( `Looking up all open lifts` );

    return whistlerPeakScraper.whistlerBlackcombOpenLifts();

}

/// Snow ////

function getSnowReport( req, res ){

    startWhistlerPeakSnowReport( ).then( snowReport => {
        console.log( `   ${stringify(snowReport)}`);
        var responseText = ``
        res.send( snowReport );
        return responseText;
    },reason => {
        console.log ( `Look up failed` );
        console.log( reason );
        var responseText = `Sorry, my lookup failed.`
        res.send( responseText );
    }).catch( error => {
        console.log ( `Look up error` );
        console.log( error );
        var responseText = `Sorry, my lookup failed.`
        res.send( responseText );
    });
}

function startWhistlerPeakSnowReport( ){
    var whistlerPeakScraper = new WhistlerPeakScraper();
   
    console.log( `Looking up all open lifts` );

    return whistlerPeakScraper.snowReport();

}

// Expose Express API as a single Cloud Function:
module.exports = app;