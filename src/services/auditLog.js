import { db } from './firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import axios from 'axios';

/**
 * Audit Log Service
 */

const getIpAddress = async () => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        return response.data.ip;
    } catch (error) {
        console.warn('Failed to fetch IP address:', error);
        return 'unknown';
    }
};

/**
 * Record an audit entry in Firestore
 * @param {Object} params
 * @param {string} params.action - 'CREATE', 'UPDATE', 'DELETE', 'REVERT'
 * @param {string} params.entity - 'PROJECT', 'PROPERTY', 'REWARD', 'DOC', 'INCIDENT', 'TREE', 'INVENTORY'
 * @param {string} params.entityId - ID of the entity
 * @param {Object} params.before - State before changes (null for CREATE)
 * @param {Object} params.after - State after changes (null for DELETE)
 * @param {Object} params.user - User object (uid, email)
 * @param {string} [params.justification] - Mandatory for REVERT
 */
export const recordAudit = async ({ action, entity, entityId, before, after, user, justification }) => {
    try {
        const ip = await getIpAddress();

        const logEntry = {
            action,
            entity,
            entityId,
            before: before ? JSON.parse(JSON.stringify(before)) : null,
            after: after ? JSON.parse(JSON.stringify(after)) : null,
            userId: user?.uid || 'anonymous',
            userEmail: user?.email || 'anonymous',
            ip,
            timestamp: serverTimestamp(),
            justification: justification || null
        };

        const docRef = await addDoc(collection(db, 'audit_logs'), logEntry);
        console.log('Audit log entry created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error recording audit log:', error);
        return null;
    }
};

export const fetchAuditLogs = async () => {
    try {
        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
        }));
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
};
