
/**
 * 
 *Table format
 * 
 * {
 *    accountID: value,
 *    name : value,
 *    balance : value,
 *    accounttype: value,
 *    balance : value,
 *    ts : value,
 *    userValid: value
 *    
 * }
 */

import {v4 as uuidv4} from 'uuid';

const mongoClient = require('./mongoClient');
var async = require('async');


/**
 * 
 * @param {*} user 
 * @param {*} openingBalance 
 * @param {*} accountType 
 */

function manageBank(){

}

manageBank.prototype.addUser = function(userName, openingBalance, accountType, cb){

    let uuid = uuidv4();
    let validation = validateUser(accountType, openingBalance);
    if(validation !== 'validated'){
        return validation;
    }

    this.userExist(userName, function(err, res){
        if(res){
            console.log('user already exist');
        }
        else{
            mongoClient.getCollection('user', 'account', function(collection){
                collection.inserOne({
                    name:userName,
                    balance:openingBalance,
                    accountType: accountType,
                    ts: new Date(),
                    accountId : uuid
                    
                })
            },
            function(err, res){
                if(err){
                    return cb(err);
                }
                console.log(`add user response with uid is ${uuid} is `, res);
                cb(null, res);
            });
        }
    });
    
}


manageBank.prototype.userExist = function (accountId, cb){
    mongoClient.getCollection('users', 'account', function(collection){
        collection.find({accountId: accountId}).then(res =>{
            if(res){
                cb(null, res);
            }
        }).catch(err =>{
            if(err){
                cb(err);
            }
        });
    }, function(res){
        console.log('user exist', res);
    });
}

manageBank.prototype.moneyTransfer = function(fromUseraccountId, toUserAccountId, balance, callback){
    let _this = this;
    
    async.waterfall([
        function(cb){
            _this.userExist(fromUseraccountId, function(err,res){
                if(res && res.balance > balance){
                    cb(null, res);
                }else{
                    cb('in sufficient balance error');
                }
            })},
            function(res, cb){

                if(fromUseraccountId === toUserAccountId){
                    return cb('cannot transact in same account');
                }

                mongoClient.getCollection('user', 'account', function (collection){
                    collection.update({
                        accountId:fromUseraccountId,
                    },
                    {$set:{
                        balance: (res.balance - balance),
                        ts: new Date()
                    }});

                }, function(err, res){
                    if(err){
                        return cb(err);
                    }
                    console.log(`money deducted ${balance} from account ${fromUseraccountId} `)
                    cb();
                });
            },

            function (cb){
                mongoClient.getCollection('user', 'account', function (collection){
                    collection.update({
                        accountId:toUserAccountId,
                    },
                    {$addToSet:{
                        balance: (res.balance - balance),
                        ts: new Date()
                    }});

                }, function(err, res){
                    if(err){
                        return cb(err);
                    }
                    console.log(`money add ${balance} in account ${toUserAccountId} `)
                    cb();
                });
            }
    ],
        function(err){
            if(err){
                return callback (err);
            }
        callback(null, 'ammount transfered successfully');
        });
}

let validateUser = function(accountType, openingBalance){
    if(accountType === 'BasicSavings' && openingBalance > 50000){
        return 'Basic savings cannot be more than 50,000';
    }
    return 'validated';
}

exports.manageBank = manageBank;