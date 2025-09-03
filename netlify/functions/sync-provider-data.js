// Netlify Function: functions/sync-provider-data.js
// Description: Fetches services and countries from the 5sim.net API and saves them to Firestore.

const admin = require('firebase-admin');
let db;

async function initializeFirebase() {
  if (db) return; // Already initialized
  try {
    if (!admin.apps.length) {
      const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
      if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        throw new Error("Missing Firebase Admin environment variables.");
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    db = admin.firestore();
  } catch (e) {
    console.error('Firebase Admin initialization error:', e);
    throw e;
  }
}

exports.handler = async function(event) {
  try {
    await initializeFirebase();
  
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { profitPercentage } = JSON.parse(event.body);
    const profitMargin = (profitPercentage / 100) || 0.20;

    const providerRef = db.collection('api_providers').where('name', '==', '5sim');
    const providerSnapshot = await providerRef.get();
    if (providerSnapshot.empty) {
      return { statusCode: 404, body: JSON.stringify({ error: '5sim provider not found in Firestore.' }) };
    }
    const { baseUrl } = providerSnapshot.docs[0].data();

    const pricesUrl = `${baseUrl}/guest/prices`;

    const pricesResponse = await fetch(pricesUrl, { headers: { 'Accept': 'application/json' } });

    if (!pricesResponse.ok) {
        throw new Error(`Failed to fetch data from 5sim.net. Status: ${pricesResponse.statusText}`);
    }

    const pricesData = await pricesResponse.json();
    
    const batch = db.batch();
    const servicesRef = db.collection('services');
    const serversRef = db.collection('servers');
    
    const existingServices = {};
    const servicesSnapshot = await servicesRef.get();
    servicesSnapshot.docs.forEach(doc => {
      existingServices[doc.data().name.toLowerCase()] = doc.id;
    });

    const existingServers = {};
    const serversSnapshot = await serversRef.get();
    serversSnapshot.docs.forEach(doc => {
      existingServers[doc.data().name.toLowerCase()] = { id: doc.id, data: doc.data() };
    });

    let serviceCount = 0;
    let serverCount = 0;
    
    // Process prices data and prepare batch writes
    for (const countryName in pricesData) {
      const normalizedCountryName = countryName.toLowerCase();
      // Assume countryName is sufficient for now, no separate countries API needed with this approach.
      const location = countryName.toUpperCase();
      const iso = normalizedCountryName.substring(0, 2); // Simple ISO approximation from country name

      if (!existingServers[normalizedCountryName]) {
        const newServerRef = serversRef.doc();
        batch.set(newServerRef, { name: normalizedCountryName, location, iso, status: 'active' });
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
            serviceCount++;
        }
      }
    }

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
