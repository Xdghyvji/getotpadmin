// Netlify Function: functions/sync-provider-data.js
// Description: Fetches services and countries from the 5sim.net API and saves them to Firestore.

const fetch = require('node-fetch');
const admin = require('firebase-admin');
const { getDocs, collection } = require('firebase-admin/firestore');

// --- Initialize Firebase Admin SDK ---
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
    const providerSnapshot = await db.collection('api_providers').where('name', '==', '5sim').limit(1).get();
    if (providerSnapshot.empty) {
      return { statusCode: 404, body: JSON.stringify({ error: '5sim provider not found in Firestore.' }) };
    }
    const { apiKey, baseUrl } = providerSnapshot.docs[0].data();

    // 2. Fetch all services and countries from the API
    const servicesUrl = `${baseUrl}/guest/products`;
    const countriesUrl = `${baseUrl}/guest/countries`;

    const [servicesResponse, countriesResponse] = await Promise.all([
      fetch(servicesUrl, { headers: { 'Accept': 'application/json' } }),
      fetch(countriesUrl, { headers: { 'Accept': 'application/json' } })
    ]);

    if (!servicesResponse.ok || !countriesResponse.ok) {
      throw new Error(`Failed to fetch data from 5sim.net. Services: ${servicesResponse.statusText}, Countries: ${countriesResponse.statusText}`);
    }

    const servicesData = await servicesResponse.json();
    const countriesData = await countriesResponse.json();
    
    // Prepare batch writes and a map for faster lookups
    const batch = db.batch();
    const servicesRef = db.collection('services');
    const serversRef = db.collection('servers');
    
    // --- Clear existing collections to avoid duplicates ---
    const existingServicesSnapshot = await servicesRef.get();
    existingServicesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    const existingServersSnapshot = await serversRef.get();
    existingServersSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    // --- Process and write countries (servers) ---
    const countryMap = {};
    for (const name in countriesData) {
      const { iso, text_en } = countriesData[name];
      const isoCode = iso ? Object.keys(iso)[0] : '';
      const location = text_en || name;
      const newServerRef = serversRef.doc();
      batch.set(newServerRef, { name, location, iso: isoCode, status: 'active' });
      countryMap[name] = { id: newServerRef.id, location, iso: isoCode };
    }

    // --- Process and write services ---
    for (const countryName in servicesData) {
      const servicesByCountry = servicesData[countryName];
      for (const serviceName in servicesByCountry) {
        const serviceInfo = servicesByCountry[serviceName];
        const price = serviceInfo.Price;
        const finalPrice = price * (1 + profitMargin);
        
        const newServiceRef = servicesRef.doc(serviceName); // Use serviceName as doc ID for uniqueness
        batch.set(newServiceRef, {
          name: serviceName,
          price: parseFloat(finalPrice.toFixed(2)),
          originalPrice: price,
          provider: '5sim',
          status: 'active'
        }, { merge: true }); // Use merge to avoid overwriting existing manual entries
      }
    }

    // 5. Commit the batch
    await batch.commit();

    console.log(`Successfully synced data from 5sim.net.`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Successfully synced data from 5sim.net.` }),
    };

  } catch (error) {
    console.error('Sync function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal server error occurred: ${error.message}` }),
    };
  }
};
