/**
 * Native-like UI Components for Universal Use
 * 
 * These components provide a native app experience across all platforms:
 * - Web browsers (desktop & mobile)
 * - PWA (Progressive Web App)
 * - All screen sizes and input methods
 * 
 * Features:
 * - Touch-optimized interactions (44px+ targets)
 * - Haptic feedback integration
 * - Spring-based animations
 * - Responsive design
 * - Accessibility compliance
 * - Cross-platform consistency
 */

export { NativeButton } from "./native-button";
export type { NativeButtonProps } from "./native-button";

export {
  NativeCard,
  NativeCardHeader,
  NativeCardTitle,
  NativeCardDescription,
  NativeCardContent,
  NativeCardFooter,
} from "./native-card";
export type { NativeCardProps } from "./native-card";

export { NativeInput } from "./native-input";
export type { NativeInputProps } from "./native-input";

export { NativeList, NativeListItem } from "./native-list";
export type { NativeListProps, NativeListItemProps } from "./native-list";

/**
 * Usage Examples:
 * 
 * ```tsx
 * import { NativeButton, NativeCard, NativeInput } from "@/components/ui/native";
 * 
 * // Native button with haptic feedback
 * <NativeButton 
 *   variant="default" 
 *   size="default"
 *   hapticFeedback={true}
 *   rippleEffect={true}
 *   onClick={handleClick}
 * >
 *   Submit Form
 * </NativeButton>
 * 
 * // Interactive card
 * <NativeCard interactive pressable onClick={handleCardClick}>
 *   <NativeCard.Header>
 *     <NativeCard.Title>Event Title</NativeCard.Title>
 *     <NativeCard.Description>Event description here</NativeCard.Description>
 *   </NativeCard.Header>
 * </NativeCard>
 * 
 * // Floating label input
 * <NativeInput
 *   label="Email Address"
 *   type="email"
 *   floatingLabel={true}
 *   hapticFeedback={true}
 * />
 * ```
 */