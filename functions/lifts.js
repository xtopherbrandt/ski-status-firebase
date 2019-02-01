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

module.exports = class Lifts {

    constructor(){

        this.lifts = [
            "Whistler Village Gondola Lower",
            "Whistler Village Gondola Upper",
            "Fitzsimmons Express",
            "Garbanzo Express",
            "Creekside Gondola",
            "Big Red Express",
            "Emerald 6 Express",
            "Olympic Chair",
            "Franz's Chair",
            "Peak To Peak Gondola",
            "Peak Express",
            "Harmony 6 Express",
            "Symphony Express",
            "T-Bars","T-bars","T bar",
            "Blackcomb Gondola Lower",
            "Blackcomb Gondola Upper",
            "Excalibur Gondola Lower",
            "Excalibur Gondola Upper",
            "Excelerator Express",
            "Magic Chair",
            "Jersey Cream Express",
            "Catskinner Express",
            "Crystal Ridge Express",
            "Glacier Express",
            "7th Heaven Express",
            "Showcase T-Bar",
            "Horstman T-Bar"
        ];

        this.liftCount = this.lifts.length;
    }

    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }

    getRandomIntSet( length, min, max ){
        var set = [];

        while( set.length < length ){
            var r = this.getRandomInt( min, max );
            if( set.indexOf(r) === -1) set.push(r);
        }

        return set;
    }

    randomLifts( length ){
        var liftNumbers = this.getRandomIntSet( length, 0, this.liftCount );
        var liftSet = [];
        
        for ( var i = 0; i < length; i++ ){
            liftSet.push( this.lifts[ liftNumbers[ i ] ] );
        }

        return liftSet;
    }

}

