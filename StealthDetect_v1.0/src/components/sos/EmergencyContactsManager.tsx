import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { User, Phone, Trash2, Plus, Star, Edit2 } from 'lucide-react';
import { EmergencyContact } from '../../utils/database';
import { useEmergencyContacts } from '../../hooks/useEmergencyContacts';

interface ContactFormData {
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
}

export function EmergencyContactsManager() {
  const {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
  } = useEmergencyContacts();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phoneNumber: '',
    relationship: '',
    isPrimary: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      relationship: '',
      isPrimary: false,
    });
    setEditingContact(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phoneNumber) return;

    try {
      if (editingContact) {
        await updateContact(editingContact.id, formData);
      } else {
        await addContact(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact(id);
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Loading contacts...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contact List */}
      {contacts.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No emergency contacts added yet.
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{contact.name}</span>
                    {contact.isPrimary && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{contact.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(contact)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(contact.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      <Button
        variant="outline"
        onClick={openAddDialog}
        className="w-full"
        disabled={contacts.length >= 5}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Contact
      </Button>
      {contacts.length >= 5 && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum 5 emergency contacts allowed
        </p>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mom, Partner, Friend..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1 234 567 8900"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship (optional)</Label>
              <Input
                id="relationship"
                value={formData.relationship}
                onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                placeholder="Family, Friend, Shelter..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="isPrimary" className="text-sm font-normal cursor-pointer">
                Set as primary contact
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name || !formData.phoneNumber}>
              {editingContact ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
