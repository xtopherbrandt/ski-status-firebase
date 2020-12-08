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

const Scraper = require( './whistlerpeak-scraper.js' );

//test1();
//test2();
//testClosedLift();
//testSnowReport();
//testWeatherReport();
//testFile();

 function test1(){
    var scraper = new Scraper( console );
    var lifts = scraper.whistlerBlackcombOpenLifts();
    lifts.then( liftarray => { console.log (liftarray );} );
 }

 function test2(){
    var scraper = new Scraper( console );
    var lifts = scraper.liftQuery( "Emerald 6 Express" );
    lifts.then( liftarray => { console.log (liftarray );} );

 }

 function testClosedLift(){
    var scraper = new Scraper( console );
    var lifts = scraper.liftQuery( "Solar Coaster" );
    lifts.then( liftarray => { console.log (liftarray );} );
 }
 
 function testSnowReport(){
   var scraper = new Scraper( console );
   var snow = scraper.snowReport( );
   snow.then( liftarray => { console.log (liftarray );} );
}

function testWeatherReport(){
   var scraper = new Scraper( console );
   var weather = scraper.weatherReport( );
   weather.then( weatherArray => { console.log (weatherArray );} );
}

function testFile(){
   var scraper = new Scraper( console );
   var lifts = scraper.whistlerBlackcombOpenLifts_TestInput( '../newLifts.html');
   lifts.then( liftarray => { console.log (liftarray );} );

}