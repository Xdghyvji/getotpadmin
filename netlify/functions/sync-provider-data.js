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
    const { profitPercentage } = JSON.parse(event.body);
    const profitMargin = (profitPercentage / 100) || 0.20; // Default to 20% if not provided

    // 1. Get the provider API key and base URL from Firestore
    const providerRef = db.collection('api_providers').where('name', '==', '5sim');
    const providerSnapshot = await providerRef.get();
    if (providerSnapshot.empty) {
      return { statusCode: 404, body: JSON.stringify({ error: '5sim provider not found in Firestore.' }) };
    }
    const { apiKey, baseUrl } = providerSnapshot.docs[0].data();

    // 2. Fetch all services, countries, and prices in a single call.
    // This is the most efficient way to get all the data required.
    const pricesUrl = `${baseUrl}/guest/prices`;
    const countriesUrl = `${baseUrl}/guest/countries`;

    const [pricesResponse, countriesResponse] = await Promise.all([
        fetch(pricesUrl, { headers: { 'Accept': 'application/json' } }),
        fetch(countriesUrl, { headers: { 'Accept': 'application/json' } })
    ]);

    if (!pricesResponse.ok || !countriesResponse.ok) {
        throw new Error(`Failed to fetch data from 5sim.net. Prices: ${pricesResponse.statusText}, Countries: ${countriesResponse.statusText}`);
    }

    const pricesData = await pricesResponse.json();
    const countriesData = await countriesResponse.json();
    
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
    
    // 3. Process countries data to get ISO codes
    const countryMap = {};
    for (const countryName in countriesData) {
        const countryInfo = countriesData[countryName];
        if (countryInfo.iso && Object.keys(countryInfo.iso).length > 0) {
            const iso = Object.keys(countryInfo.iso)[0];
            countryMap[countryName] = { 
              location: countryInfo.text_en, 
              iso: iso 
            };
        }
    }

    // 4. Process prices data and prepare batch writes
    for (const countryName in pricesData) {
      const countryInfo = countryMap[countryName];
      const location = countryInfo?.location || countryName.toUpperCase();
      const iso = countryInfo?.iso || '';

      if (!existingServers[countryName]) {
        // Add new country (server)
        const newServerRef = serversRef.doc();
        batch.set(newServerRef, {
          name: countryName,
          location,
          iso,
          status: 'active'
        });
        existingServers[countryName] = newServerRef.id;
        serverCount++;
      }

      for (const serviceName in pricesData[countryName]) {
        const operators = pricesData[countryName][serviceName];
        
        // Find the lowest price across all operators for this service/country pair
        let minPrice = Infinity;
        for (const operator in operators) {
            if (operators[operator].cost !== undefined) {
                minPrice = Math.min(minPrice, operators[operator].cost);
            }
        }
        
        // If a valid price was found, and the service doesn't exist, create it
        if (minPrice !== Infinity && !existingServices[serviceName]) {
            const finalPrice = minPrice * (1 + profitMargin);
            const newServiceRef = servicesRef.doc();
            batch.set(newServiceRef, {
              name: serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
              price: parseFloat(finalPrice.toFixed(2)),
              originalPrice: minPrice,
              provider: '5sim',
              status: 'active'
            });
            existingServices[serviceName] = newServiceRef.id;
            serviceCount++;
        }
      }
    }

    // 5. Commit the batch
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
