"use strict";
const _ = require("lodash");
const shuffle = require('shuffle-array');
const owjs = require('overwatch-js');
const config = require("../config.json");
const GAME_SIZE = config.gameSize;
const GROUP_SIZE = GAME_SIZE / 2;
const DEFAULT_RANK = config.defaultRank;
const REGION = config.region;
const PLATFORM = config.platform;

module.exports = {
    getInstance: getInstance
};

class QueueMngr {

    constructor() {
        this.waitingQueue = [];
    }

    getQueueSize() {
        return this.waitingQueue.length;
    }

    addPlayerToQueue(addPlayerData) {
        let promise = new Promise(function (resolve, reject) {
            let resultAddPlayer = false;

            let playerExist = _.findIndex(this.waitingQueue, function (player) {
                return player.discordTag == addPlayerData.discordTag;
            });

            if (playerExist < 0) {
                resultAddPlayer = true;

                if (addPlayerData.battleTag && addPlayerData.battleTag !== "") {
                    owjs.getOverall(PLATFORM, REGION, addPlayerData.battleTag.replace("#", "-")).then(function (playerOwData) {
                        addPlayerData.rank = (playerOwData && playerOwData.profile && playerOwData.profile.rank ? playerOwData.profile.rank : DEFAULT_RANK);
                        this.waitingQueue.push(addPlayerData);
                        resolve(resultAddPlayer);
                    }).catch(reject);
                }
                else {
                    reject("missing battle.net tag");
                }
            }
            else {
                resolve(resultAddPlayer);
            }
        });
        return promise;
    }

    removeUser(discordUser) {
        return _.remove(this.waitingQueue, function (user) {
            return user.discordTag == discordUser.tag;
        });
    }
}

class gameMatchMaker {

    constructor() {
        this.currentGameStatus = null;
        this.gameQueue = new QueueMngr();
    }

    register(discordUser, battleTag) {

        let promise = new Promise(function (resolve, reject) {
            let result = {
                addedPlayer: false,
                matchDetails: null
            };

            var addPlayerData = {
                "discordTag": discordUser.tag,
                "discordUser": discordUser,
                "battleTag": battleTag
            };

            addPlayerToQueue(addPlayerData).then(function (addedResult) {
                result.addedPlayer = addedResult;
                if (this.gameQueue.getQueueSize() == GAME_SIZE) {
                    result.matchDetails = this.prepareMatch();
                }

                resolve(result);

            }).catch(reject)

        });

        return promise;
    }

    unregister(discordAuthor, battleTag) {
        return this.gameQueue.removeUser(discordAuthor);
    }

    status() {
        return {
            "currentStatus": this.currentGameStatus,
            "waitingQueue": this.formatPlayersCollectionForDisplay(this.gameQueue.getWaitingQueue()),
        };
    }

    prepareMatch() {
        let gameCollection = this.waitingQueue.slice(0, GAME_SIZE);
        this.waitingQueue = this.waitingQueue.slice(GAME_SIZE + 1, this.waitingQueue.length);
        shuffle(gameCollection);
        this.saveLastGame(gameCollection);
        return this.currentGameStatus;
    }

    formatPlayersCollectionForDisplay(collection) {
        let displayGameCollection = [];
        collection.forEach(player => {
            displayGameCollection.push(player.discordUser + " SR " + player.rank);
        });

        return displayGameCollection;
    }

    saveLastGame(gameCollection) {
        let gameCollectionForDisplay = formatPlayersCollectionForDisplay(gameCollection);
        let currentGame = {
            "TeamBlue": [].concat(gameCollectionForDisplay).slice(0, GROUP_SIZE),
            "TeamRed": [].concat(gameCollectionForDisplay).slice(GROUP_SIZE, GAME_SIZE),
        };

        this.currentGameStatus = currentGame;
    }
}

function getInstance() {
    var matchMaker = new gameMatchMaker();
    return matchMaker;
}


//////////////////////////////////////////////////
/*
function getInstance() {
    var self = this;
    let waitingQueue = [];
    let currentGameStatus = null;

    function prepareMatch() {
        let gameCollection = waitingQueue.slice(0, GAME_SIZE);
        waitingQueue = waitingQueue.slice(GAME_SIZE + 1, waitingQueue.length);
        shuffle(gameCollection);
        saveLastGame(gameCollection);
        return currentGameStatus;
    }

    function formatPlayersCollectionForDisplay(collection) {
        let displayGameCollection = [];
        collection.forEach(player => {
            displayGameCollection.push(player.discordUser + " SR " + player.rank);
        });

        return displayGameCollection;
    }

    function saveLastGame(gameCollection) {
        let gameCollectionForDisplay = formatPlayersCollectionForDisplay(gameCollection);
        let currentGame = {
            "TeamBlue": [].concat(gameCollectionForDisplay).slice(0, GROUP_SIZE),
            "TeamRed": [].concat(gameCollectionForDisplay).slice(GROUP_SIZE, GAME_SIZE),
        }

        currentGameStatus = currentGame;
    }

    function addPlayerToQueue(addPlayerData) {
        let promise = new Promise(function (resolve, reject) {
            let resultAddPlayer = false;

            let playerExist = _.findIndex(waitingQueue, function (player) {
                return player.discordTag == addPlayerData.discordTag;
            })
            if (playerExist < 0) {
                resultAddPlayer = true;

                if (addPlayerData.battleTag && addPlayerData.battleTag !== "") {
                    owjs.getOverall('pc', 'eu', addPlayerData.battleTag.replace("#", "-")).then(function (playerOwData) {
                        addPlayerData.rank = (playerOwData && playerOwData.profile && playerOwData.profile.rank ? playerOwData.profile.rank : DEFAULT_RANK);
                        waitingQueue.push(addPlayerData);
                        resolve(resultAddPlayer)
                    })
                        .catch(reject)
                }
                else {
                    reject("missing battle.net tag");
                }
            }
            else {
                resolve(resultAddPlayer)
            }
        })
        return promise;
    }

    self.register = function (discordUser, battleTag) {
        let promise = new Promise(function (resolve, reject) {
            let result = {
                addedPlayer: false,
                matchDetails: null
            };

            var addPlayerData = {
                "discordTag": discordUser.tag,
                "discordUser": discordUser,
                "battleTag": battleTag
            };

            addPlayerToQueue(addPlayerData).then(function (addedResult) {
                result.addedPlayer = addedResult;
                if (waitingQueue.length == GAME_SIZE) {
                    result.matchDetails = prepareMatch();
                }

                resolve(result);
            })
                .catch(reject)

        });

        return promise;
    }

    let removefromArray = function (collection, discordAuthor, battleTag) {
        return _.remove(collection, function (user) {
            return user.discordTag == discordAuthor.tag;
        });
    };

    self.unregister = function (discordAuthor, battleTag) {
        var removed;
        removed = removefromArray(waitingQueue, discordAuthor, battleTag);
        return removed
    }

    self.status = function () {
        return {
            "currentStatus": currentGameStatus,
            "waitingQueue": formatPlayersCollectionForDisplay(waitingQueue),
        };
    }

    return self
}*/
