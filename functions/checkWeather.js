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
const { dialogflow, Image, UpdatePermission, SimpleResponse, Suggestions, List, BasicCard } = require('actions-on-google')
const Scraper = require( './whistlerpeak-scraper.js' );


const stationSuggestions = [
    'Whistler Peak',
    'Roundhouse',
    'Valley'
]

function getInputStationName( conv ){
    return conv.parameters.stationName;
}

function getCurrentWeatherPromise( queryStationName ) {

    var scraper = new Scraper( console );
    
    var currentWeatherPromise = scraper.currentWeatherQuery( queryStationName );

    return currentWeatherPromise;
}

function currentWeatherResponse( station ){
    
    var textResponseMessage;
    var speechResponseMessage;

    if ( station ){
        var temperatureCelsius = station.temperature;
        
        var temperatureSpeechResponse = getTemperatureSpeechResponse( temperatureCelsius );
        var windSpeechResponse = getWindSpeechResponse( station );


        speechResponseMessage = `${temperatureSpeechResponse} at the ${station.name}. ${windSpeechResponse} Would you like to check another station?`;
        textResponseMessage = `Latest Report`;
        
    }
    else{
        speechResponseMessage = "Sorry, I couldn't find that station. Try again?";
        textResponseMessage = "Sorry, I couldn't find that station. Try again?";
    }


    return new SimpleResponse({
        speech: speechResponseMessage,
        text: textResponseMessage
    });
}

function getCardResponse( station ){

    if ( station ){
        var card;
        var subtitle = getTemperatureTextResponse( station.temperature );
        var textBody = getWindTextResponse(station);
        
        card = new BasicCard({
            title: station.name,
            subtitle: subtitle,
            text: textBody
        });
    
        return card;
    }
    else{
        return new BasicCard({});
    }
}

function getTemperatureSpeechResponse( temperatureCelsius ){
        
    var speechResponseMessage;

    if ( temperatureCelsius ){
        speechResponseMessage = `It is ${temperatureCelsius} degrees Celsius`;
    }
    else{
        speechResponseMessage = `The current temperature is not available.`;
    }

    return speechResponseMessage;
}

function getTemperatureTextResponse( temperatureCelsius ){
        
    var textResponseMessage;

    if ( temperatureCelsius ){
        textResponseMessage = `${temperatureCelsius}°C`;
    }
    else{
        textResponseMessage = `Current temperature is not available.`;
    }

    return textResponseMessage;
}

function getWindSpeechResponse( station ){
        
    var speechResponseMessage;
    var directionWords;
    var windSpeed;
    var windInfo = station.wind;

    if ( windInfo ){
        if ( isWind( windInfo ) ){
            directionWords = getDirectionWords( windInfo.direction );
            windSpeed = windInfo.average;
    
            speechResponseMessage = `The wind is from the ${directionWords} at ${windSpeed} kilometers per hour.`;
    
            speechResponseMessage += getGustSpeechResponse( windInfo );
    
            speechResponseMessage += getWindChillTemperatureSpeechResponse( station );
        }
        else{
            speechResponseMessage = 'The wind is calm.';
        }

    }
    else{
        speechResponseMessage = '';
    }

    return speechResponseMessage;
}

function isWind( windInfo ){
    return windInfo.average > 0;
}

function getWindTextResponse( station ){
        
    var textResponseMessage;
    var windInfo = station.wind;

    if ( windInfo ){
        if ( isWind( windInfo ) ){
            textResponseMessage = `**Wind** : ${windInfo.direction} @ ${windInfo.average} km/h`;

            var gustText = getGustTextResponse( windInfo );
    
            if ( gustText.length > 0 ){
                textResponseMessage += `  \n${gustText}`;
            }
            
            var windChillText = getWindChillTemperatureTextResponse( station );
            if ( windChillText.length > 0 ){
                textResponseMessage += `  \n${windChillText}`;
            }
        }
        else{
            textResponseMessage = '**Wind** is calm';
        }
    }
    else{
        textResponseMessage = 'No wind information available.';
    }
    
    return textResponseMessage;
}

function getGustSpeechResponse( windInfo ){
    
    var responseMessage;

    if ( isGusty( windInfo ) ){
        responseMessage = ` Gusting to ${windInfo.maximum}.`;
    }
    else{
        responseMessage = '';
    }

    return responseMessage;
}

function getGustTextResponse( windInfo ){
    
    var responseMessage;

    if ( isGusty( windInfo ) ){
        responseMessage = `**Gusting** to ${windInfo.maximum} km/h`;
    }
    else{
        responseMessage = '';
    }

    return responseMessage;
}

function isGusty( windInfo ){
    return ( windInfo.maximum - windInfo.average ) > 15;
}

function getWindChillTemperatureSpeechResponse( station ){
    var responseMessage;
    var windChillTemperature = getWindChillTemperature( station );

    if ( isWindChill( station ) ){
        responseMessage = ` The wind chill temperature is ${windChillTemperature} degrees Celsius.`;
    }
    else{
        responseMessage = '';
    }

    return responseMessage;
}

function getWindChillTemperatureTextResponse( station ){
    var responseMessage;
    var windChillTemperature = getWindChillTemperature( station );

    if ( isWindChill( station ) ){
        responseMessage = `**Wind Chill** : ${windChillTemperature}°C`;
    }
    else{
        responseMessage = '';
    }

    return responseMessage;
}

function isWindChill( station ){
    return station.temperature < 10 && station.wind.average > 5;
}

function getWindChillTemperature( station ){
    var temperature = station.temperature;
    var windSpeed = station.wind.average;
    var f1 = 0.6215 * temperature;
    var f2 = 11.37 * Math.pow( windSpeed, 0.16 );
    var f3 = 0.3965 * temperature * Math.pow( windSpeed, 0.16 );
    
    var windChillTemperature = 13.12 + f1 - f2 + f3;

    return Math.round( windChillTemperature );
}

function getDirectionWords( directionAbbreviation ){
    var directions = {
        'N' : 'North',
        'NNE' : 'North Northeast',
        'NE' : 'Northeast',
        'ENE' : 'East Northeast',
        'E' : 'East',
        'ESE' : 'East Southeast',
        'SE' : 'Southeast',
        'SSE' : 'South Southeast',
        'S' : 'South',
        'SSW' : 'South Southwest',
        'SW' : 'Southwest',
        'WSW' : 'West Southwest',
        'W' : 'West',
        'WNW' : 'West Northwest',
        'NW' : 'Northwest',
        'NNW' : 'North Northwest'
    }

    return directions[ directionAbbreviation ];
}

exports.start = function checkCurrentWeather( conv ){

    var stationName = getInputStationName( conv );

    if ( stationName ){
        return getCurrentWeatherPromise( stationName ).then( (station) => {
            
            conv.ask( currentWeatherResponse( station ) ); 
            conv.ask( getCardResponse( station ));
 
            conv.ask(new Suggestions(stationSuggestions));
            conv.contexts.set( 'CheckTemperature', 3 );
        }); 
    }
    else{
        
        conv.ask(new SimpleResponse({
            speech: `Alright. Which station?`,
            text: `Alright. Which station?`,
        }));
 
        conv.ask(new Suggestions(stationSuggestions));
        conv.contexts.set( 'CheckTemperature', 3 );
    }

}
