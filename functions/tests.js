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
//test_VillageGondolaUpper()
//test_VillageGondolaLower()
//testGrooming();
//testSpecificRunGrooming();
//testLifts()

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

 function test_VillageGondolaUpper(){
   var scraper = new Scraper( console );
   var lifts = scraper.liftQuery( "Village Gondola Upper" );
   lifts.then( liftarray => { console.log (liftarray );} );

}

function test_VillageGondolaLower(){
   var scraper = new Scraper( console );
   var lifts = scraper.liftQuery( "Village Gondola Lower" );
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

function testLifts(){
   var scraper = new Scraper( console );
   var lifts = scraper.whistlerBlackcombOpenLifts_TestInput( '../newLifts.html');
  
   lifts.then( liftarray => {
      if (liftarray.length != 26)
      {
         console.log ( `** Test Failure ** --> found ${liftarray.length} lifts. There are 26 lifts.` );
      }
      
      console.log (liftarray );
   } );

}

function testGrooming(){
   
   var scraper = new Scraper( console );
   var runs = scraper.whistlerBlackcombGroomingReport_TestInput( '../groomingTest.html');
   runs.then( runList => { console.log("test All Grooming" ); console.log ( runList );} );

}

function testSpecificRunGrooming(){
   
   var scraper = new Scraper( console );
   var runs = scraper.whistlerBlackcombSpecificRunGrooming_TestInput( '../groomingTest.html', 'Dave Murray');
   runs.then( runList => { console.log("test Specific Run Grooming" ); console.log ( runList );} );

}