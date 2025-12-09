import { useState, useCallback } from 'react';
import { db, SOSSettings, SOSActivationLog } from '../utils/database';
import { geolocation, sms, phone, haptics, GeoPosition } from '../utils/native';
import { useEmergencyContacts } from './useEmergencyContacts';

export type SOSStatus =
  | 'idle'
  | 'getting-location'
  | 'sending-sms'
  | 'calling'
  | 'completed'
  | 'failed';

export interface SOSResult {
  success: boolean;
  location: GeoPosition | null;
  smsSent: boolean;
  smsRecipients: string[];
  callMade: boolean;
  error?: string;
}

export function useSOSService() {
  const [status, setStatus] = useState<SOSStatus>('idle');
  const [settings, setSettings] = useState<SOSSettings | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const { contacts, getPhoneNumbers, hasContacts } = useEmergencyContacts();

  const loadSettings = useCallback(async () => {
    const sosSettings = await db.getSOSSettings();
    setSettings(sosSettings);
    return sosSettings;
  }, []);

  const updateSettings = useCallback(async (updates: Partial<SOSSettings>) => {
    await db.updateSOSSettings(updates);
    await loadSettings();
  }, [loadSettings]);

  const formatSOSMessage = useCallback((location: GeoPosition | null): string => {
    if (location) {
      const mapsUrl = `https://maps.google.com/maps?q=${location.latitude},${location.longitude}`;
      return `I need help urgently. My location:\n${mapsUrl}\n\nPlease call me or send help.`;
    }
    return `I need help urgently. Location unavailable.\n\nPlease call me or send help.\n\nTime: ${new Date().toLocaleString()}`;
  }, []);

  const activateSOS = useCallback(async (options: {
    sendSMS?: boolean;
    makeCall?: boolean;
  } = {}): Promise<SOSResult> => {
    if (isActivating) {
      return {
        success: false,
        location: null,
        smsSent: false,
        smsRecipients: [],
        callMade: false,
        error: 'SOS already in progress'
      };
    }

    setIsActivating(true);
    const currentSettings = settings || await loadSettings();

    const sendSMS = options.sendSMS ?? currentSettings.enableSMS;
    const makeCall = options.makeCall ?? false; // Only call if explicitly requested

    const result: SOSResult = {
      success: false,
      location: null,
      smsSent: false,
      smsRecipients: [],
      callMade: false,
    };

    try {
      // Haptic feedback to confirm activation
      await haptics.notification('warning');

      // Step 1: Get location
      setStatus('getting-location');
      result.location = await geolocation.getCurrentPosition(10000);

      // Step 2: Send SMS to emergency contacts
      if (sendSMS && hasContacts) {
        setStatus('sending-sms');
        const phoneNumbers = getPhoneNumbers();
        const message = formatSOSMessage(result.location);

        const smsSent = await sms.send(phoneNumbers, message);
        result.smsSent = smsSent;
        result.smsRecipients = smsSent ? phoneNumbers : [];
      }

      // Step 3: Make emergency call if requested
      if (makeCall && currentSettings.enableCall) {
        setStatus('calling');
        result.callMade = await phone.call(currentSettings.emergencyNumber);
      }

      // Log the activation
      const logEntry: Omit<SOSActivationLog, 'id' | 'timestamp'> = {
        location: result.location,
        actions: {
          smsSent: result.smsSent,
          smsRecipients: result.smsRecipients,
          callMade: result.callMade,
          audioRecorded: false,
          photoTaken: false,
        },
        status: result.smsSent || result.callMade ? 'completed' : 'partial',
      };
      await db.addSOSActivationLog(logEntry);

      result.success = result.smsSent || result.callMade;
      setStatus('completed');
      await haptics.notification(result.success ? 'success' : 'error');

    } catch (error) {
      console.error('[SOS] Activation error:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      setStatus('failed');
      await haptics.notification('error');
    } finally {
      setIsActivating(false);
      // Reset status after a delay
      setTimeout(() => setStatus('idle'), 3000);
    }

    return result;
  }, [isActivating, settings, loadSettings, hasContacts, getPhoneNumbers, formatSOSMessage]);

  const cancelSOS = useCallback(() => {
    setIsActivating(false);
    setStatus('idle');
  }, []);

  return {
    status,
    settings,
    isActivating,
    contacts,
    hasContacts,
    loadSettings,
    updateSettings,
    activateSOS,
    cancelSOS,
  };
}
