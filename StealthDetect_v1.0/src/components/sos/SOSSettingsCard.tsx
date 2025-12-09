import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { ShieldAlert, MessageSquare, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { EmergencyContactsManager } from './EmergencyContactsManager';
import { db, SOSSettings } from '../../utils/database';

export function SOSSettingsCard() {
  const [settings, setSettings] = useState<SOSSettings | null>(null);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const sosSettings = await db.getSOSSettings();
    setSettings(sosSettings);
  };

  const updateSetting = async <K extends keyof SOSSettings>(
    key: K,
    value: SOSSettings[K]
  ) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await db.updateSOSSettings({ [key]: value });
  };

  if (!settings) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Emergency SOS
          </div>
          <Badge
            variant={settings.enabled ? 'default' : 'secondary'}
            className={settings.enabled ? 'bg-green-100 text-green-700' : ''}
          >
            {settings.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Enable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable SOS Button</p>
            <p className="text-sm text-muted-foreground">
              Show emergency button on home screen
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Emergency Contacts Section */}
            <Collapsible open={isContactsOpen} onOpenChange={setIsContactsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Emergency Contacts</span>
                </div>
                {isContactsOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <EmergencyContactsManager />
              </CollapsibleContent>
            </Collapsible>

            {/* Alert Options Section */}
            <Collapsible open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Alert Options</span>
                </div>
                {isOptionsOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-4">
                {/* SMS Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Send SMS</p>
                      <p className="text-xs text-muted-foreground">
                        Text your emergency contacts
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enableSMS}
                    onCheckedChange={(checked) => updateSetting('enableSMS', checked)}
                  />
                </div>

                {/* Call Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Enable Call Option</p>
                      <p className="text-xs text-muted-foreground">
                        Option to call {settings.emergencyNumber}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enableCall}
                    onCheckedChange={(checked) => updateSetting('enableCall', checked)}
                  />
                </div>

                {/* Hold Duration */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">Hold Duration</p>
                    <span className="text-sm text-muted-foreground">
                      {(settings.holdDuration / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <Slider
                    value={[settings.holdDuration]}
                    onValueChange={(value) => updateSetting('holdDuration', value[0])}
                    min={1000}
                    max={3000}
                    step={500}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    How long to hold the button to activate
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}
