const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { profitPercentage } = JSON.parse(event.body);
        const apiKey = process.env.FIVESIM_VENDOR_API_KEY; // Use a dedicated vendor API key

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: 'FIVESIM_VENDOR_API_KEY is not set.' }) };
        }

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
        };

        // Fetch prices from the vendor API
        const pricesResponse = await fetch('https://5sim.net/v1/vendor/prices', { headers });
        if (!pricesResponse.ok) {
            const errorText = await pricesResponse.text();
            throw new Error(`Failed to fetch prices from 5sim.net: ${pricesResponse.status} ${pricesResponse.statusText} - ${errorText}`);
        }
        const pricesData = await pricesResponse.json();

        // Fetch countries list
        const countriesResponse = await fetch('https://5sim.net/v1/guest/countries', { headers: { 'Accept': 'application/json' } });
        if (!countriesResponse.ok) {
            const errorText = await countriesResponse.text();
            throw new Error(`Failed to fetch countries from 5sim.net: ${countriesResponse.status} ${countriesResponse.statusText} - ${errorText}`);
        }
        const countriesData = await countriesResponse.json();
        
        if (pricesData.error) {
            throw new Error(pricesData.error);
        }

        const batch = db.batch();

        // 1. Process and save services
        const servicesCollectionRef = db.collection('services');
        const uniqueServices = new Set();
        pricesData.Prices.forEach(price => uniqueServices.add(price.ProductName));

        for (const serviceName of Array.from(uniqueServices)) {
            const serviceRef = servicesCollectionRef.doc(serviceName);
            batch.set(serviceRef, {
                name: serviceName,
                // Assuming services don't have icons from the API, manual ones can be added later
                icon: null,
                provider: '5sim',
                status: 'active',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }

        // 2. Process and save countries (servers)
        const serversCollectionRef = db.collection('servers');
        const servers = Object.keys(countriesData).map(key => ({
            name: key,
            location: countriesData[key].text_en,
            iso: Object.keys(countriesData[key].iso)[0],
            status: 'active',
        }));
        
        servers.forEach(server => {
            const serverRef = serversCollectionRef.doc(server.name);
            batch.set(serverRef, server, { merge: true });
        });

        // Commit the batch writes
        await batch.commit();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Successfully synced ${uniqueServices.size} services and ${servers.length} countries.` }),
        };

    } catch (error) {
        console.error('Sync function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'An internal server error occurred during sync.' }),
        };
    }
};
