
'use strict';


const jsdom = require( 'jsdom' );
const { JSDOM } = jsdom;

module.exports = class WhistlerPeakScraper {
    constructor ( console ){
        this.url = 'http://www.whistlerpeak.com/block-grooming.php';
        this.console = console;
    }
    
    statusQuery( runName ){

        var getUri = `${this.url}`;

        var jsDompromise = JSDOM.fromURL( getUri);

        jsDompromise.then( dom => this.queryPromiseFulfilled( dom, runName ), error => this.queryPromiseError( error ) );

        return new Promise((resolve, reject) => {this.resolve = resolve; this.reject = reject;} );

    }

    queryPromiseFulfilled( dom, runName ) { 
        try{
            const { window } = dom.window;
            const $ = require( 'jQuery' )(window);
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

    queryPromiseError( error ){
        this.console.log( "There was an error getting grooming status" );
        this.console.log( error );
    }

    getRunGroomingStatus( $, requestedRun ){
        var runs = $(`[data-alert]:contains('${requestedRun}')`);
        
        var foundRuns = [];
        runs.each( function(index) {
            foundRuns.push( $(this).text() );
        })
            
        return foundRuns;
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