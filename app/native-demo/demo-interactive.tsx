"use client";

import { useState } from "react";
import {
  NativeButton,
  NativeCard,
  NativeCardHeader,
  NativeCardTitle,
  NativeCardDescription,
  NativeCardContent,
  NativeCardFooter,
  NativeInput,
  NativeList,
  NativeListItem
} from "@/components/ui/native";
import { triggerHapticFeedback } from "@/lib/mobile-utils";
import { 
  Heart, 
  Star, 
  Share,
  User,
  Settings,
  Bell
} from "lucide-react";

export function DemoInteractive() {
  const [liked, setLiked] = useState(false);
  const [starred, setStarred] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    triggerHapticFeedback(liked ? "tap" : "success");
  };

  const handleStar = () => {
    setStarred(!starred);
    triggerHapticFeedback(starred ? "tap" : "success");
  };

  const handleSubmit = async () => {
    setLoading(true);
    triggerHapticFeedback("tap");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    triggerHapticFeedback("success");
    alert("Form submitted successfully!");
  };

  const handleShare = () => {
    triggerHapticFeedback("tap");
    if (navigator.share) {
      navigator.share({
        title: "Native Component Demo",
        text: "Check out these native-like web components!",
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Interactive Buttons */}
      <NativeCard>
        <NativeCardHeader>
          <NativeCardTitle>Interactive Actions</NativeCardTitle>
          <NativeCardDescription>
            Buttons with haptic feedback and native animations
          </NativeCardDescription>
        </NativeCardHeader>
        <NativeCardContent className="space-y-3">
          <div className="flex gap-3 flex-wrap">
            <NativeButton 
              onClick={handleLike}
              variant={liked ? "default" : "secondary"}
              className="flex-1 min-w-[120px]"
            >
              <Heart className={`w-4 h-4 mr-2 ${liked ? "fill-current" : ""}`} />
              {liked ? "Liked!" : "Like"}
            </NativeButton>
            
            <NativeButton 
              onClick={handleStar}
              variant={starred ? "default" : "secondary"}
              className="flex-1 min-w-[120px]"
            >
              <Star className={`w-4 h-4 mr-2 ${starred ? "fill-current" : ""}`} />
              {starred ? "Starred!" : "Star"}
            </NativeButton>
            
            <NativeButton 
              onClick={handleShare}
              variant="secondary"
              className="flex-1 min-w-[120px]"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </NativeButton>
          </div>
        </NativeCardContent>
      </NativeCard>

      {/* Native Form */}
      <NativeCard>
        <NativeCardHeader>
          <NativeCardTitle>Native Form Components</NativeCardTitle>
          <NativeCardDescription>
            Touch-optimized inputs with native styling
          </NativeCardDescription>
        </NativeCardHeader>
        <NativeCardContent className="space-y-4">
          <NativeInput
            label="Your Name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
          />
          <NativeInput
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
          />
          <NativeInput
            label="Message"
            placeholder="Enter your message"
            value={formData.message}
            onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
          />
        </NativeCardContent>
        <NativeCardFooter>
          <NativeButton 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full"
            
          >
            {loading ? "Submitting..." : "Submit Form"}
          </NativeButton>
        </NativeCardFooter>
      </NativeCard>

      {/* Native List */}
      <NativeCard>
        <NativeCardHeader>
          <NativeCardTitle>Native List Items</NativeCardTitle>
          <NativeCardDescription>
            iOS/Android style list with touch feedback
          </NativeCardDescription>
        </NativeCardHeader>
        <NativeCardContent className="p-0">
          <NativeList>
            <NativeListItem
              icon={<User className="w-5 h-5 text-accent" />}
              title="Profile Settings"
              subtitle="Manage your account information"
              onClick={() => triggerHapticFeedback("tap")}
              showChevron
            />
            <NativeListItem
              icon={<Bell className="w-5 h-5 text-accent" />}
              title="Notifications"
              subtitle="Configure your notification preferences"
              onClick={() => triggerHapticFeedback("tap")}
              showChevron
            />
            <NativeListItem
              icon={<Settings className="w-5 h-5 text-accent" />}
              title="App Settings"
              subtitle="Customize your app experience"
              onClick={() => triggerHapticFeedback("tap")}
              showChevron
            />
          </NativeList>
        </NativeCardContent>
      </NativeCard>
    </div>
  );
}