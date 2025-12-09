import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2, MapPin, MessageSquare, Phone, X } from 'lucide-react';
import { Button } from '../ui/button';
import { SOSStatus, SOSResult } from '../../hooks/useSOSService';

interface SOSActivationOverlayProps {
  status: SOSStatus;
  result: SOSResult | null;
  onClose: () => void;
  canCancel?: boolean;
}

const statusMessages: Record<SOSStatus, { icon: React.ReactNode; text: string }> = {
  'idle': { icon: null, text: '' },
  'getting-location': {
    icon: <MapPin className="w-8 h-8 text-white animate-pulse" />,
    text: 'Getting your location...'
  },
  'sending-sms': {
    icon: <MessageSquare className="w-8 h-8 text-white animate-pulse" />,
    text: 'Sending SMS alerts...'
  },
  'calling': {
    icon: <Phone className="w-8 h-8 text-white animate-pulse" />,
    text: 'Connecting to emergency services...'
  },
  'completed': {
    icon: <ShieldCheck className="w-12 h-12 text-green-400" />,
    text: 'Alert sent successfully'
  },
  'failed': {
    icon: <ShieldAlert className="w-12 h-12 text-red-400" />,
    text: 'Alert failed'
  },
};

export function SOSActivationOverlay({
  status,
  result,
  onClose,
  canCancel = false,
}: SOSActivationOverlayProps) {
  const [showCancel, setShowCancel] = useState(canCancel);

  useEffect(() => {
    // Hide cancel button after 5 seconds
    if (canCancel) {
      const timer = setTimeout(() => setShowCancel(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [canCancel]);

  if (status === 'idle') return null;

  const currentStatus = statusMessages[status];
  const isInProgress = ['getting-location', 'sending-sms', 'calling'].includes(status);
  const isComplete = status === 'completed' || status === 'failed';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
      <div className="bg-card rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {isInProgress ? (
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-white/20 animate-spin" />
              </div>
              <div className="relative z-10 p-4">
                {currentStatus.icon}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-card-foreground/5 rounded-full">
              {currentStatus.icon}
            </div>
          )}
        </div>

        {/* Status Text */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {currentStatus.text}
        </h2>

        {/* Result details */}
        {isComplete && result && (
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            {result.smsSent && result.smsRecipients.length > 0 && (
              <p className="flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" />
                SMS sent to {result.smsRecipients.length} contact{result.smsRecipients.length > 1 ? 's' : ''}
              </p>
            )}
            {result.location && (
              <p className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                Location shared
              </p>
            )}
            {result.callMade && (
              <p className="flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                Emergency call initiated
              </p>
            )}
            {result.error && (
              <p className="text-red-400 mt-2">{result.error}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 space-y-2">
          {isComplete && (
            <Button onClick={onClose} className="w-full">
              Dismiss
            </Button>
          )}
          {showCancel && isInProgress && (
            <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>

        {/* Help message */}
        {status === 'completed' && result?.success && (
          <p className="mt-4 text-xs text-muted-foreground">
            Help is on the way. Stay safe.
          </p>
        )}
      </div>
    </div>
  );
}
