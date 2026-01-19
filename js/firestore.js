// Simplified Firestore interactions, directly using Firebase SDK

/**
 * Fetches a single document from Firestore.
 * @param {string} collectionPath
 * @param {string} docId
 * @returns {Promise<Object | null>}
 */
async function getFirestoreDoc(collectionPath, docId) {
    try {
        const docRef = firebaseFirestore.collection(collectionPath).doc(docId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching document:", collectionPath, docId, error);
        throw error;
    }
}

/**
 * Fetches documents from a collection or query.
 * @param {string | firebase.firestore.Query} pathOrQuery
 * @param {boolean} isCollectionGroup
 * @returns {Promise<Array<Object>>}
 */
async function getFirestoreCollection(pathOrQuery, isCollectionGroup = false) {
    let queryRef;
    if (typeof pathOrQuery === 'string') {
        if (isCollectionGroup) {
            queryRef = firebaseFirestore.collectionGroup(pathOrQuery);
        } else {
            queryRef = firebaseFirestore.collection(pathOrQuery);
        }
    } else {
        queryRef = pathOrQuery; // Assume it's already a Firebase Query object
    }

    try {
        const snapshot = await queryRef.get();
        const results = [];
        snapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() });
        });
        return results;
    } catch (error) {
        console.error("Error fetching collection:", error);
        throw error;
    }
}


/**
 * Adds a document to a Firestore collection.
 * @param {string} collectionPath
 * @param {Object} data
 * @returns {Promise<string>} The ID of the new document.
 */
async function addFirestoreDoc(collectionPath, data) {
    try {
        const docRef = await firebaseFirestore.collection(collectionPath).add(data);
        return docRef.id;
    } catch (error) {
        console.error("Error adding document:", collectionPath, data, error);
        throw error;
    }
}

/**
 * Updates a Firestore document.
 * @param {string} collectionPath
 * @param {string} docId
 * @param {Object} data
 * @returns {Promise<void>}
 */
async function updateFirestoreDoc(collectionPath, docId, data) {
    try {
        const docRef = firebaseFirestore.collection(collectionPath).doc(docId);
        await docRef.update(data);
    } catch (error) {
        console.error("Error updating document:", collectionPath, docId, data, error);
        throw error;
    }
}

/**
 * Deletes a Firestore document.
 * @param {string} collectionPath
 * @param {string} docId
 * @returns {Promise<void>}
 */
async function deleteFirestoreDoc(collectionPath, docId) {
    try {
        const docRef = firebaseFirestore.collection(collectionPath).doc(docId);
        await docRef.delete();
    } catch (error) {
        console.error("Error deleting document:", collectionPath, docId, error);
        throw error;
    }
}

/**
 * Executes a batch write.
 * @param {Array<Object>} operations - Array of { type: 'delete' | 'update' | 'set', ref: DocumentReference, data?: Object }
 * @returns {Promise<void>}
 */
async function executeBatch(operations) {
    const batch = firebaseFirestore.batch();
    operations.forEach(op => {
        if (op.type === 'delete') {
            batch.delete(op.ref);
        } else if (op.type === 'update') {
            batch.update(op.ref, op.data);
        } else if (op.type === 'set') {
            batch.set(op.ref, op.data);
        }
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error executing batch:", operations, error);
        throw error;
    }
}

// Reimplement `arrayUnion` equivalent for vanilla JS updates using firebase.firestore.FieldValue
const arrayUnion = (value) => firebaseFieldValue.arrayUnion(value);