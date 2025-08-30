// Netlify Function: functions/sync-provider-data.js
// Description: Fetches services and countries from the 5sim.net API and saves them to Firestore.

const fetch = require('node-fetch');
const admin = require('firebase-admin');

// --- Initialize Firebase Admin SDK ---
// IMPORTANT: Ensure your Netlify environment variables for Firebase Admin SDK
// are correctly set. This function needs full read/write access to Firestore.
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (e) {
  console.error('Firebase Admin initialization error:', e);
}

const db = admin.firestore();

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!admin.apps.length) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error: Firebase Admin not initialized.' }) };
  }

  try {
    // 1. Get the provider API key and base URL from Firestore
    const providerRef = db.collection('api_providers').where('name', '==', '5sim');
    const providerSnapshot = await providerRef.get();
    if (providerSnapshot.empty) {
      return { statusCode: 404, body: JSON.stringify({ error: '5sim provider not found in Firestore.' }) };
    }
    const { apiKey, baseUrl } = providerSnapshot.docs[0].data();

    // 2. Fetch all prices (and implicitly, services and countries)
    const pricesUrl = `${baseUrl}/guest/prices`;
    const pricesResponse = await fetch(pricesUrl, { headers: { 'Accept': 'application/json' } });
    if (!pricesResponse.ok) {
      throw new Error(`Failed to fetch prices from 5sim.net: ${pricesResponse.statusText}`);
    }
    const pricesData = await pricesResponse.json();

    const batch = db.batch();
    const servicesRef = db.collection('services');
    const serversRef = db.collection('servers');
    const existingServices = {};
    const existingServers = {};
    
    // Fetch all existing services and servers to check for duplicates before saving
    const servicesSnapshot = await servicesRef.get();
    servicesSnapshot.docs.forEach(doc => {
      existingServices[doc.data().name] = doc.id;
    });

    const serversSnapshot = await serversRef.get();
    serversSnapshot.docs.forEach(doc => {
      existingServers[doc.data().name] = doc.id;
    });

    let serviceCount = 0;
    let serverCount = 0;
    
    // 3. Process data and prepare batch writes
    for (const countryName in pricesData) {
      if (!existingServers[countryName]) {
        // Add new country (server)
        const newServerRef = serversRef.doc();
        batch.set(newServerRef, {
          name: countryName,
          location: countryName.toUpperCase(), // Simple placeholder, could be improved
          status: 'active'
        });
        existingServers[countryName] = newServerRef.id;
        serverCount++;
      }

      for (const serviceName in pricesData[countryName]) {
        if (!existingServices[serviceName]) {
          // Add new service
          const newServiceRef = servicesRef.doc();
          batch.set(newServiceRef, {
            name: serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
            price: 0, // Price is dynamic, we just need the service list
            provider: '5sim',
            status: 'active'
          });
          existingServices[serviceName] = newServiceRef.id;
          serviceCount++;
        }
      }
    }

    // 4. Commit the batch
    await batch.commit();

    console.log(`Successfully synced ${serviceCount} new services and ${serverCount} new servers.`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Successfully synced ${serviceCount} new services and ${serverCount} new servers.` }),
    };

  } catch (error) {
    console.error('Sync function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal server error occurred: ${error.message}` }),
    };
  }
};
