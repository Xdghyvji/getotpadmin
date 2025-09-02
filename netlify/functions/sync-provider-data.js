// Netlify Function: functions/sync-provider-data.js
// Description: Fetches services and countries from the 5sim.net API and saves them to Firestore.

import admin from 'firebase-admin';

// --- Initialize Firebase Admin SDK ---
// IMPORTANT: Use the single Base64-encoded environment variable.
let db;

async function initializeFirebase() {
  if (db) return; // Already initialized
  try {
    const { FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 } = process.env;
    if (!FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 environment variable.");
    }
    
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(Buffer.from(FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    db = admin.firestore();
  } catch (e) {
    console.error('Firebase Admin initialization error:', e);
    throw e;
  }
}

exports.handler = async function(event) {
  await initializeFirebase();
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
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
    const { baseUrl } = providerSnapshot.docs[0].data();

    // 2. Fetch all services, countries, and prices in a single call.
    const pricesUrl = `${baseUrl}/guest/prices`;
    const countriesUrl = `${baseUrl}/guest/countries`;

    const [pricesResponse, countriesResponse] = await Promise.all([
        fetch(pricesUrl, { headers: { 'Accept': 'application/json' } }),
        fetch(countriesUrl, { headers: { 'Accept': 'application/json' } })
    ]);

    if (!pricesResponse.ok || !countriesResponse.ok) {
        const pricesError = !pricesResponse.ok ? `Prices: ${pricesResponse.statusText}` : '';
        const countriesError = !countriesResponse.ok ? `Countries: ${countriesResponse.statusText}` : '';
        throw new Error(`Failed to fetch data from 5sim.net. ${pricesError} ${countriesError}`.trim());
    }

    const pricesData = await pricesResponse.json();
    const countriesData = await countriesResponse.json();
    
    // Create a new batch write for efficient operations
    const batch = db.batch();
    const servicesRef = db.collection('services');
    const serversRef = db.collection('servers');
    
    // Pre-fetch all existing services and servers to check for duplicates
    const existingServices = {};
    const servicesSnapshot = await servicesRef.get();
    servicesSnapshot.docs.forEach(doc => {
      existingServices[doc.data().name.toLowerCase()] = doc.id;
    });

    const existingServers = {};
    const serversSnapshot = await serversRef.get();
    serversSnapshot.docs.forEach(doc => {
      existingServers[doc.data().name.toLowerCase()] = doc.id;
    });

    let serviceCount = 0;
    let serverCount = 0;
    
    // 3. Process countries data to get ISO codes and locations
    const countryMap = {};
    for (const countryName in countriesData) {
        const countryInfo = countriesData[countryName];
        if (countryInfo.iso && Object.keys(countryInfo.iso).length > 0) {
            const iso = Object.keys(countryInfo.iso)[0];
            countryMap[countryName.toLowerCase()] = { 
                location: countryInfo.text_en, 
                iso: iso 
            };
        }
    }

    // 4. Process prices data and prepare batch writes
    for (const countryName in pricesData) {
      const normalizedCountryName = countryName.toLowerCase();
      const countryInfo = countryMap[normalizedCountryName];
      const location = countryInfo?.location || countryName.toUpperCase();
      const iso = countryInfo?.iso || '';

      if (!existingServers[normalizedCountryName]) {
        const newServerRef = serversRef.doc();
        batch.set(newServerRef, {
          name: normalizedCountryName,
          location,
          iso,
          status: 'active'
        });
        existingServers[normalizedCountryName] = newServerRef.id;
        serverCount++;
      }

      for (const serviceName in pricesData[countryName]) {
        const normalizedServiceName = serviceName.toLowerCase();
        const operators = pricesData[countryName][serviceName];
        
        let minPrice = Infinity;
        for (const operator in operators) {
            if (operators[operator].cost !== undefined) {
                minPrice = Math.min(minPrice, operators[operator].cost);
            }
        }
        
        if (minPrice !== Infinity && !existingServices[normalizedServiceName]) {
            const finalPrice = minPrice * (1 + profitMargin);
            const newServiceRef = servicesRef.doc();
            batch.set(newServiceRef, {
              name: serviceName,
              price: parseFloat(finalPrice.toFixed(2)),
              originalPrice: minPrice,
              provider: '5sim',
              status: 'active'
            });
            existingServices[normalizedServiceName] = newServiceRef.id;
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
