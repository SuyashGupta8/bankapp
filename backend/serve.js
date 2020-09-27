const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
var manageTransaction =  require('./manageTransaction');


var manageBank = new manageTransaction();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.post('/user/addUser', (req, res) => {

    if(!req.body.userName ||  !req.body.balance  || !req.body.accountType){
        return res.send('Invalid request');
    }
    manageBank.addUser(req.body.userName, req.body.balance, req.body.accountType, function(err, response){
        if(err){
            return res.send(err);
        }
        res.send(response);
    });
})

app.post('/transaction', (req, res) => {

    if(!req.body.fromUser || || !req.body.toUser || !req.body.balance  || !req.body.accountType){
        return res.send('Invalid request');
    }
    manageBank.moneyTransfer(req.body.userName, req.body.balance, req.body.accountType, function(err, response){
        if(err){
            return res.send(err);
        }
        res.send(response);
    });
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})