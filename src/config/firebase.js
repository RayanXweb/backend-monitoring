const admin = require('firebase-admin');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const createCustomToken = async (uid, claims = {}) => {
  try {
    const token = await admin.auth().createCustomToken(uid, claims);
    return token;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
};

const verifyIdToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

const getUserByEmail = async (email) => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    return user;
  } catch (error) {
    return null;
  }
};

module.exports = {
  admin,
  createCustomToken,
  verifyIdToken,
  getUserByEmail,
};
