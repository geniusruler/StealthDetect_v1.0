import { useState, useEffect, useCallback } from 'react';
import { db, EmergencyContact } from '../utils/database';

export function useEmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await db.getEmergencyContacts();
      setContacts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load emergency contacts');
      console.error('[useEmergencyContacts] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const addContact = useCallback(async (
    contact: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      const newContact = await db.addEmergencyContact(contact);
      await loadContacts();
      return newContact;
    } catch (err) {
      setError('Failed to add contact');
      console.error('[useEmergencyContacts] Add error:', err);
      throw err;
    }
  }, [loadContacts]);

  const updateContact = useCallback(async (
    id: string,
    updates: Partial<Omit<EmergencyContact, 'id' | 'createdAt'>>
  ) => {
    try {
      await db.updateEmergencyContact(id, updates);
      await loadContacts();
    } catch (err) {
      setError('Failed to update contact');
      console.error('[useEmergencyContacts] Update error:', err);
      throw err;
    }
  }, [loadContacts]);

  const deleteContact = useCallback(async (id: string) => {
    try {
      await db.deleteEmergencyContact(id);
      await loadContacts();
    } catch (err) {
      setError('Failed to delete contact');
      console.error('[useEmergencyContacts] Delete error:', err);
      throw err;
    }
  }, [loadContacts]);

  const getPrimaryContact = useCallback(() => {
    return contacts.find(c => c.isPrimary) || contacts[0] || null;
  }, [contacts]);

  const getPhoneNumbers = useCallback(() => {
    return contacts.map(c => c.phoneNumber);
  }, [contacts]);

  return {
    contacts,
    loading,
    error,
    addContact,
    updateContact,
    deleteContact,
    getPrimaryContact,
    getPhoneNumbers,
    refresh: loadContacts,
    hasContacts: contacts.length > 0,
  };
}
