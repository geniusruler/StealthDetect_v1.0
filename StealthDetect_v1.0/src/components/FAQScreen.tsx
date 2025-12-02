import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ArrowLeft, HelpCircle, Shield, Smartphone, Lock, AlertTriangle } from "lucide-react";

interface FAQScreenProps {
  onNavigate: (screen: string) => void;
}

export function FAQScreen({ onNavigate }: FAQScreenProps) {
  return (
    <div className="w-full max-w-[800px] mx-auto min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("home")}
          className="text-foreground hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-medium text-foreground">Help & FAQ</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Getting Started */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-medium">Getting Started</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is StealthDetect?</AccordionTrigger>
              <AccordionContent>
                StealthDetect is a privacy-first security app that helps you detect stalkerware, 
                spyware, and other security threats on your device. All scanning is done locally 
                on your device - your data never leaves your phone.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How do I run my first scan?</AccordionTrigger>
              <AccordionContent>
                From the home screen, tap "Start Security Scan" to begin. The scan will check 
                your installed apps, network connections, and system files for known threats. 
                Your first scan may take a few minutes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What are the PIN and Duress PIN?</AccordionTrigger>
              <AccordionContent>
                Your main PIN protects access to the real dashboard. The duress PIN is a safety 
                feature - if you're forced to unlock the app, entering the duress PIN will show 
                a fake "system utility" screen instead of your actual security data.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Security & Privacy */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-medium">Security & Privacy</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-4">
              <AccordionTrigger>Is my data sent to the cloud?</AccordionTrigger>
              <AccordionContent>
                No. StealthDetect uses local-only processing. Your PINs, scan results, and 
                personal data never leave your device. We do download threat intelligence 
                databases (lists of known malware), but we never upload your data.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Where are my PINs stored?</AccordionTrigger>
              <AccordionContent>
                Your PINs are hashed using SHA-256 encryption and stored locally on your device 
                using secure storage (Capacitor Preferences on iOS, encrypted by the system). 
                The original PINs cannot be recovered from the hashes.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>Can someone detect that I'm using this app?</AccordionTrigger>
              <AccordionContent>
                The app icon and name appear as "StealthDetect" on your home screen. If you're 
                concerned about someone seeing it, you can use iOS's App Library to hide it 
                from your home screen, or put it in a folder with other security/utility apps.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Scanning & Detection */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="w-5 h-5 text-primary" />
            <h2 className="font-medium">Scanning & Detection</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-7">
              <AccordionTrigger>What does a scan check for?</AccordionTrigger>
              <AccordionContent>
                Scans check for: (1) Known stalkerware apps using SpyGuard's database, 
                (2) Suspicious network connections to command & control servers, 
                (3) File hashes matching known malware, and (4) App permission patterns 
                associated with spyware.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger>How often should I scan?</AccordionTrigger>
              <AccordionContent>
                We recommend scanning at least once per week. You can enable auto-scan in 
                Settings to run daily scans automatically. Also scan if you notice unusual 
                battery drain, data usage, or device behavior.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-9">
              <AccordionTrigger>What if a threat is detected?</AccordionTrigger>
              <AccordionContent>
                The scan report will show details about detected threats including severity, 
                type, and description. For stalkerware apps, we recommend documenting the 
                findings and consulting with a trusted security professional or domestic 
                violence support organization before taking action.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Troubleshooting */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h2 className="font-medium">Troubleshooting</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-10">
              <AccordionTrigger>The scan is taking a long time</AccordionTrigger>
              <AccordionContent>
                First scans typically take 2-5 minutes. Deep scans with network monitoring 
                may take longer. If a scan is stuck, you can tap "Stop & View Results" to 
                see what was found so far, then try scanning again.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-11">
              <AccordionTrigger>I forgot my PIN</AccordionTrigger>
              <AccordionContent>
                For security reasons, PINs cannot be recovered. On the PIN entry screen, 
                tap "Reset App" to clear all data and start over. This will delete your 
                scan history and settings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-12">
              <AccordionTrigger>Network monitoring isn't working</AccordionTrigger>
              <AccordionContent>
                Network monitoring requires system permissions. On iOS, you may need to 
                install a VPN profile (the app will guide you). Make sure "Network Monitoring" 
                is enabled in Settings. Note: Network monitoring is experimental and may not 
                catch all threats.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Support */}
        <div className="bg-muted/50 rounded-lg p-4 text-center space-y-3">
          <p className="font-medium">Need More Help?</p>
          <p className="text-sm text-muted-foreground">
            For safety resources and domestic violence support, visit:
          </p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full" asChild>
              <a href="https://www.thehotline.org" target="_blank" rel="noopener noreferrer">
                National Domestic Violence Hotline
              </a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href="https://stealthsecuritylab.org" target="_blank" rel="noopener noreferrer">
                Coalition Against Stalkerware
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Emergency: Call 911 (US) or your local emergency number
          </p>
        </div>
      </div>
    </div>
  );
}
