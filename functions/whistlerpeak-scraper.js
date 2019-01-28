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

module.exports = class WhistlerPeakScraper {
    constructor ( console ){
        this.urlBase = 'http://www.whistlerpeak.com';
        this.console = console;
    }
    
    queryPromiseError( error ){
        this.console.log( "There was an error getting the requested status" );
        this.console.log( error );
    }

    //Grooming

    groomingQuery( runName ){

        var getUri = `${this.urlBase}/block-grooming.php`;

        var jsDompromise = JSDOM.fromURL( getUri);

        jsDompromise.then( dom => this.groomingQueryPromiseFulfilled( dom, runName ), error => this.queryPromiseError( error ) );

        return new Promise((resolve, reject) => {this.resolve = resolve; this.reject = reject;} );

    }

    groomingQueryPromiseFulfilled( dom, runName ) { 
        try{
            const { window } = dom.window;
            const $ = require( 'jquery' )(window);
            var grooming = {};
            grooming.searchedName = runName;

            grooming.groomedRuns = this.getRunGroomingStatus( $, runName );
            //grooming.lastUpdated = this.getGroomingLastUpdatedTime( $ );
            this.console.log( grooming );
            this.resolve( grooming );
        }
        catch( e ){
            this.reject( e );
        }
    }


    getRunGroomingStatus( $, requestedRun ){
        var runs = $(`[data-alert]:contains('${requestedRun}')`);
        
        var foundRuns = [];
        runs.each( function(index) {
            foundRuns.push( $(this).text() );
        })
            
        return foundRuns;
    }

    //Lifts

    liftQuery( liftName ){
        var whistlerQueryPromise = this.whistlerLiftQuery( liftName );
        var blackcombQueryPromise = this.blackcombLiftQuery( liftName );

        return Promise.all( [whistlerQueryPromise, blackcombQueryPromise] );
    }

    whistlerLiftQuery( liftName ){

        var getUri = `${this.urlBase}/block-lift-status-whistler-2019.php`;

        var jsDompromise = JSDOM.fromURL( getUri);

        return jsDompromise.then( dom => this.liftQueryPromiseFulfilled( dom, liftName ), error => this.queryPromiseError( error ) );

    }

    blackcombLiftQuery( liftName ){
        var getUri = `${this.urlBase}/block-lift-status-blackcomb-2019.php`;
        
        var jsDompromise = JSDOM.fromURL( getUri);

        return jsDompromise.then( dom => this.liftQueryPromiseFulfilled( dom, liftName ), error => this.queryPromiseError( error ) );

    }

    liftQueryPromiseFulfilled( dom, liftName ) { 
        try{
            const { window } = dom.window;
            const $ = require( 'jquery' )(window);
            var lifts = {};
            lifts.searchedName = liftName;

            lifts = this.getLiftStatus( $, liftName );
            //lifts.lastUpdated = this.getLiftsLastUpdatedTime( $ );
            console.log( lifts );
            
            return lifts
        }
        catch( e ){
            
            throw e;
        }
    }


    getLiftStatus( $, requestedLift ){
        var escapedLiftName = this.escapeApostrophes( requestedLift );
        console.log( escapedLiftName );
        var lifts = $(`[data-alert]:contains('${escapedLiftName}')`);
        console.log( lifts[0] );
        var foundLifts = [];

        lifts.each( function(index) {
            var text = $(this).text();

            var liftName = text.match(/^([\w\s'-]+)(?=Open|Closed|Standby)/g);
            var liftStatus = text.match(/(Open|Closed|Standby)/);
            
            if ( liftName ){
                var liftInfo = { 
                    "name" : liftName[0],
                    "status" : WhistlerPeakScraper.normalizeLiftStatus( liftStatus[0] ) };
                    
                foundLifts.push( liftInfo );
            }
 
        })
            
        return foundLifts;
    }

    escapeApostrophes( name ){
        return name.replace( "'", "\\'" );
    }
    static normalizeLiftStatus(status){
        switch (status){
            case 'Open':
                return status;
            case 'Closed':
                return status;
            case 'Standby':
                return 'on Standby'
        }
    }

    getGrape( $ ){
        return $("span.icon-grape" ).next().children("a").text();
    }

    getRegion( $ ){
        var regionText = $("span.icon-region" ).next().children("a").text();
        return this.separateRegion( regionText );
    }

    getVintage( $ ){
        return $("#top_header" ).children("[itemprop='model']").text();
    }

    getLabelName( $ ){
        var labelName

        labelName = $("#top_header" ).children("[itemprop='name']").text().split(',')[0];

        if ( !labelName ){
            labelName = $("#top_header" ).text().split(',')[0].trim();
        }

        return labelName;
    }

    getLabelImageUrl( $ ){
        return $( "#imgThumb" ).attr("src");
    }

    getCriticScore( $ ){
        return $("span[itemprop='ratingValue']").text();
    }

    getStyle( $ ){
        return $("div.icon-style").next().children("a").text();
    }

    getFoodPairing( $ ){
        return $("div.icon-food").next().children("span.sidepanel-text").children("a").text();
    }

    getAveragePrice( $ ){
        var priceText = $("span.icon-avgp").next().children("b").text();
        return priceText.replace(/\s/g,'');
    }


}