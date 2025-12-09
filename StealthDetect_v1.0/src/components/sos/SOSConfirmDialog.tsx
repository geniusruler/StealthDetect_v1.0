import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { ShieldAlert, Phone, MessageSquare, X } from 'lucide-react';

interface SOSConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onSendAlert: () => void;
  onSendAlertAndCall: () => void;
  hasContacts: boolean;
  onAddContacts?: () => void;
}

export function SOSConfirmDialog({
  open,
  onClose,
  onSendAlert,
  onSendAlertAndCall,
  hasContacts,
  onAddContacts,
}: SOSConfirmDialogProps) {
  if (!hasContacts) {
    return (
      <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <AlertDialogContent className="max-w-[340px] rounded-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-lg">No Emergency Contacts</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm">
              You haven't added any emergency contacts yet. Add trusted contacts to send them alerts in an emergency.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            {onAddContacts && (
              <Button onClick={onAddContacts} className="w-full">
                Add Contacts
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent className="max-w-[340px] rounded-xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-lg">Emergency Alert</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm">
            This will send your location to your emergency contacts. Choose an action below.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onSendAlert}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Alert Only
          </Button>
          <Button
            onClick={onSendAlertAndCall}
            variant="destructive"
            className="w-full"
          >
            <Phone className="w-4 h-4 mr-2" />
            Send Alert + Call 911
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
