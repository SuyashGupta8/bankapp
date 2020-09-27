const {MongoClient} = require('mongodb');
const uri = "mmongodb://localhost:27017";
const client = new MongoClient(uri);


async function initializeMongoDB(){

    try{
        await client.connect();
        let dbs =  await client.db().admin().listDatabases();
        console.log(dbs);
        return client;
    }catch(e){
        console.log(e);
    }
}

function closeConnection(){
    client.close().then( res =>{
        console.log('data base connection closed', res);
    }).catch(err =>{
        console.log('Error while closing  the connections', err);
    });
}


(function (){

    initializeMongoDB().then( MongoClient => {
        client = MongoClient;
    }).catch(err =>{
        console.log(err);
    });

}());

function getCollection(dbName, collection, crudOperation, result){
    let usersCollection = client.db(dbName).collection(collection),
    session = client.startSession();

    let transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };

    session.withTransaction(async () =>{
       await crudOperation(usersCollection);
    }, transactionOptions).then((res) =>{
        if(res){
            result(null, res);
        }

        session.endSession().then((res)=>{
            console.log("session successfully closed", res);
        }).catch(err => {
            console.log("session successfully closed", res);
        })
    }).catch(err =>{
        result(err);
    });
}


module.exports = {
    getCollection: getCollection,
    closeConnection : closeConnection
};
