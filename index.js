const Alexa = require('ask-sdk-core');

const SKILL_NAME = "Fun Liners";
const GET_FACT_MESSAGE = "Here's a tongue twister for you...";      // Alexa is to say this first

const CONTINUE_REPROMPT = " Would you like another tongue twister or would you like me to repeat the last one?";
const REPEAT_MESSAGE = "Sure, here it is... ";      // said on repeat intent

const CANT_REPEAT_PROMPT = "There is nothing to repeat. Do you want to hear a new tongue twister?";
const CANT_REPEAT_REPROMPT = " Do you want to hear a new tongue twister?";       // NB *re*-prompt after a while

const HELP_REPROMPT = " Do you want to hear a tongue twister?";
const HELP_MESSAGE = "Welcome to Fun Liners. You can say, ask fun liners for a tongue twister or you can say, give me a tongue twister from fun liners!";

const FALLBACK_REPROMPT = " Do you want to hear a tongue twister?";
const FALLBACK_MESSAGE = "The Fun Liners skill can't help you with that. It can tell you different tongue twisters. Simply say, ask fun liners for a tongue twister!";

const STOP_MESSAGE = " Thank you for using Fun Liners! I look forward to seeing you again soon!";
const ERROR_MESSAGE = "Sorry, an error occurred. Please try again after some time."

const DATA = [
    "Tiny tiger tied her tie tighter to tidy her tiny tail.",
    "She sells sea shells at the sea shore.",
    "How much pot, could a pot roast roast, if a pot roast could roast pot.",
    "Which wristwatches are Swiss wristwatches?",
    "How much wood would a woodchuck chuck, if a woodchuck could chuck wood?",
    "Synonym for a cinnamon is a cinammon synonym",
    "Peter Piper picked a peck of pickled peppers",
    "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn’t fuzzy, was he?",
    "Can you can a can as a canner can can a can?",
    "I have got a date at a quarter to eight; I’ll see you at the gate, so don’t be late",
    "You know New York, you need New York, you know you need unique New York",
    "I saw a kitten eating chicken in the kitchen",
    "If a dog chews shoes, whose shoes does he choose?",
    "I thought I thought of thinking of thanking you",
    "I wish to wash my Irish wristwatch",
    "Near an ear, a nearer ear, a nearly eerie ear" // copied from https://www.engvid.com/english-resource/50-tongue-twisters-improve-pronunciation/
];

const HelpHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
        && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
        .speak(HELP_MESSAGE + HELP_REPROMPT)
        .reprompt(HELP_REPROMPT)
        .getResponse();
    }
};

const FallbackHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
        && request.intent.name === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
        .speak(FALLBACK_MESSAGE + FALLBACK_REPROMPT)
        .reprompt(FALLBACK_REPROMPT)
        .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
        && (request.intent.name === 'AMAZON.CancelIntent'
            || request.intent.name === 'AMAZON.StopIntent'
            || request.intent.name === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
        .speak(STOP_MESSAGE)
        .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
        .speak(ERROR_MESSAGE)
        .getResponse();
    }
};

// TODO: Add Custom Handler Definitions
// 17-273 Writing the GetNewFact Intent handler
// Handle both Intent requests ("tell me a fun liner") and Launch requests ("start fun liners")
const GetNewFactHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'LaunchRequest' ||  (request.type === 'IntentRequest'
        && (request.intent.name === 'GetNewFactIntent' || request.intent.name === 'AnotherFunLinerFactIntent' || request.intent.name === 'AMAZON.YesIntent'));
        // get new fact intent or another fun liner fact intent (cf 17-268 custom interaction) or Yes intent
    },
    async handle(handlerInput) {

        const randomFact = await getTongueTwister();

        // Use AttributeManager to save response (in session data) in case asked for a repeat (17-274)
        const attributesManager = handlerInput.attributesManager;
        let sessionAttributes = attributesManager.getSessionAttributes();
        sessionAttributes.lastSpeech = randomFact;      // store the random fun-liner in suitably named session variable (17-274)
        attributesManager.setSessionAttributes(sessionAttributes);      // finally save session data thus


        // Nicely assemble something for Alexa to say
        const speechOutput = GET_FACT_MESSAGE + randomFact + CONTINUE_REPROMPT;

        return handlerInput.responseBuilder
        .speak(speechOutput)
        .withSimpleCard(SKILL_NAME, randomFact)     // visual 'card' added in Alexa dashboard for the device
        .reprompt(HELP_REPROMPT)
        .getResponse();
    }
};

// Bespoke function - Return random element from array of tongue twisters 17-273
const getTongueTwister = async () => {
    let length = DATA.length;
    const selectedIndex = Math.floor(Math.random() * length);   // random index
    let result = DATA[selectedIndex];
    return result;
} 

// TODO: Add Custom Handler Definitions
// 17-274 Writing the Repeat Intent handler
// Handle both Intent requests ("tell me a fun liner") and Launch requests ("start fun liners")
const RepeatHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.RepeatIntent';
        // logic simpler here - just the Repeat intent request
    },
    handle(handlerInput) {

        const attributesManager = handlerInput.attributesManager;
        let sessionAttributes = attributesManager.getSessionAttributes();
        let randomFact = sessionAttributes.lastSpeech;      
        // Use variable used for saving previous Alexa speech in GetNewFactHandler

        if (randomFact)
        {
            return handlerInput.responseBuilder
            .speak(REPEAT_MESSAGE + randomFact + CONTINUE_REPROMPT) 
            .reprompt(CONTINUE_REPROMPT)
            .getResponse()
        }
        else
        {
            return handlerInput.responseBuilder
            .speak(CANT_REPEAT_PROMPT)
            .reprompt(CANT_REPEAT_REPROMPT)
            .getResponse()            
        }
    }
};








let skill;

exports.handler = async (event, context) => {
    console.log("REQUEST", JSON.stringify(event));
    if (!skill) {
        skill = Alexa.SkillBuilders.custom()        // Alexa Skill SDK (ask-sdk-core) used here
        .addRequestHandlers(
            // TODO: Add Custom Handlers            // code to be written for these Intents (both custom and built-in)
            GetNewFactHandler,
            RepeatHandler,
            HelpHandler,
            FallbackHandler,
            CancelAndStopIntentHandler,
            SessionEndedRequestHandler
        )
        .addErrorHandlers(ErrorHandler)             // error handlers here
        .create();
    }

    const response = await skill.invoke(event, context);    // event will contain which intent is to be invoked
    console.log("RESPONSE", JSON.stringify(response));      // NB logging for debugging
    return response;
};
