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

async function createReservation(client, userEmail, nameOfListing, reservationDates, reservationDetails) {
 
    const usersCollection = client.db("sample_airbnb").collection("users");
    const listingsAndReviewsCollection = client.db("sample_airbnb").collection("listingsAndReviews");
 
    const reservation = createReservationDocument(nameOfListing, reservationDates, reservationDetails);
 
    const session = client.startSession();
 
    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };
    
 
    try {
        const transactionResults = await session.withTransaction(async () => {
 
            const usersUpdateResults = await usersCollection.updateOne(
                { email: userEmail },
                { $addToSet: { reservations: reservation } },
                { session });
            console.log(`${usersUpdateResults.matchedCount} document(s) found in the users collection with the email address ${userEmail}.`);
            console.log(`${usersUpdateResults.modifiedCount} document(s) was/were updated to include the reservation.`);
 
 
            const isListingReservedResults = await listingsAndReviewsCollection.findOne(
                { name: nameOfListing, datesReserved: { $in: reservationDates } },
                { session });
            if (isListingReservedResults) {
                await session.abortTransaction();
                console.error("This listing is already reserved for at least one of the given dates. The reservation could not be created.");
                console.error("Any operations that already occurred as part of this transaction will be rolled back.");
                return;
            }
 
            const listingsAndReviewsUpdateResults = await listingsAndReviewsCollection.updateOne(
                { name: nameOfListing },
                { $addToSet: { datesReserved: { $each: reservationDates } } },
                { session });
            console.log(`${listingsAndReviewsUpdateResults.matchedCount} document(s) found in the listingsAndReviews collection with the name ${nameOfListing}.`);
            console.log(`${listingsAndReviewsUpdateResults.modifiedCount} document(s) was/were updated to include the reservation dates.`);
 
        }, transactionOptions);
 
        if (transactionResults) {
            console.log("The reservation was successfully created.");
        } else {
            console.log("The transaction was intentionally aborted.");
        }
    } catch(e){
        console.log("The transaction was aborted due to an unexpected error: " + e);
    } finally {
        await session.endSession();
    }
 
}