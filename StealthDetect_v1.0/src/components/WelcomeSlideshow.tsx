import { useState } from "react";
import { Button } from "./ui/button";
import { Shield, Lock, Eye, Activity, Wifi, ChevronRight } from "lucide-react";

const slides = [
  {
    id: "welcome",
    title: "Welcome to StealthDetect",
    subtitle: "Privacy-first system that checks your device for stalkerware.",
    icon: <Shield className="w-16 h-16 text-primary" />,
    content: (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          Your privacy matters. StealthDetect keeps your data secure while monitoring your system health.
        </p>
      </div>
    ),
  },
  {
    id: "local",
    title: "Local-only Mode",
    subtitle: "Your data stays on this device.",
    icon: <Lock className="w-16 h-16 text-primary" />,
    content: (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          Everything is stored locally on your device. No cloud sync, no external servers, complete privacy for you.
        </p>
      </div>
    ),
  },
  {
    id: "secure",
    title: "Secure Access",
    subtitle: "PIN + Duress PIN for safe, controlled unlock.",
    icon: <Eye className="w-16 h-16 text-primary" />,
    content: (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          Quick access with fingerprint or Face ID, backed by PIN security for complete protection.
        </p>
      </div>
    ),
  },
  {
    id: "encrypted",
    title: "Encrypted Storage",
    subtitle: "Credentials protected with device-level encryption.",
    icon: <Shield className="w-16 h-16 text-primary" />,
    content: (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          All sensitive data is protected using your device's full disk encryption.
        </p>
      </div>
    ),
  },
  {
    id: "health",
    title: "System Health",
    subtitle: "A neutral Dashboard with key signals at a glance.",
    icon: <Activity className="w-16 h-16 text-primary" />,
    content: (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          Monitor CPU, memory, storage, and network activity with clean, actionable insights.
        </p>
      </div>
    ),
  },
  {
    id: "future",
    title: "Detection Ready",
    subtitle: "VPN monitor stub for upcoming network insights.",
    icon: <Wifi className="w-16 h-16 text-primary" />,
    content: (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          Built with extensibility in mind. VPN monitoring to check for Indicators of Compromise
        </p>
      </div>
    ),
  },
];

interface WelcomeSlideshowProps {
  onGetStarted: () => void;
  onShowExplainer: () => void;
  onQuickSetup: () => void;
}

export function WelcomeSlideshow({ onGetStarted, onShowExplainer, onQuickSetup }: WelcomeSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 h-14">
        <h1 className="font-medium text-foreground">StealthDetect</h1>
        <span className="text-sm text-muted-foreground">v0.1</span>
      </div>

      {/* Slide Content */}
      <div className="flex-1 px-5 py-8 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
          {/* Icon */}
          <div className="mb-4">{currentSlideData.icon}</div>

          {/* Title & Subtitle */}
          <div className="space-y-2 max-w-sm">
            <h2 className="text-2xl font-medium text-foreground">
              {currentSlideData.title}
            </h2>
            <p className="text-muted-foreground">
              {currentSlideData.subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="max-w-sm">
            {currentSlideData.content}
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {currentSlide === slides.length - 1 ? (
            <>
              <Button
                onClick={onGetStarted}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl"
              >
                Get Started
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={onShowExplainer}
              >
                Learn More
              </Button>
              <button
                onClick={onQuickSetup}
                className="w-full text-sm text-muted-foreground py-2"
              >
                Quick Setup (Skip to PINs)
              </button>
            </>
          ) : (
            <Button
              onClick={nextSlide}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Identify, Report, Secure
        </p>
      </div>
    </div>
  );
}