# Token Misuse Report

Found 202 instances of hard-coded colors or non-token classes.

## components/layout/app-layout.tsx

**Line 41:** Non-token Tailwind class: bg-black
```
className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
```
**Suggestion:** bg-surface (dark mode handled automatically)

## components/ui/dialog.tsx

**Line 24:** Non-token Tailwind class: bg-black
```
"fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
```
**Suggestion:** bg-surface (dark mode handled automatically)

## app/(errors)/forbidden/page.tsx

**Line 8:** Non-token Tailwind class: bg-gray-
```
<div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 17:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 20:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/(public)/register/page.tsx

**Line 26:** Non-token Tailwind class: bg-gray-
```
<div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 33:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600 mt-2">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 70:** Non-token Tailwind class: text-gray-
```
<p className="text-xs text-gray-500 mt-1">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 123:** Non-token Tailwind class: text-gray-
```
<span className="text-gray-600">Already have an account? </span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/(public)/register/success/page.tsx

**Line 10:** Non-token Tailwind class: bg-gray-
```
<div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 20:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 23:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center justify-center gap-2 text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 42:** Non-token Tailwind class: text-gray-
```
<p className="text-xs text-gray-500 pt-4">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/(super)/super/churches/page.tsx

**Line 44:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">Manage church organizations</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 57:** Non-token Tailwind class: text-gray-
```
<Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 58:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">No churches found</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 72:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600 mb-4">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 75:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-500 mb-4">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/(super)/super/local-churches/[id]/admins/actions.ts

**Line 95:** Hard-coded hex color: #4F46E5
```
style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
```
**Suggestion:** Use design tokens instead (e.g., text-ink, bg-surface)

**Line 99:** Hard-coded hex color: #666
```
<p style="color: #666; font-size: 14px;">
```
**Suggestion:** Use design tokens instead (e.g., text-ink, bg-surface)

**Line 102:** Hard-coded hex color: #eee
```
<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
```
**Suggestion:** Use design tokens instead (e.g., text-ink, bg-surface)

**Line 103:** Hard-coded hex color: #999
```
<p style="color: #999; font-size: 12px;">
```
**Suggestion:** Use design tokens instead (e.g., text-ink, bg-surface)

## app/(super)/super/local-churches/[id]/admins/page.tsx

**Line 58:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">Manage administrators for this local church</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 69:** Non-token Tailwind class: text-gray-
```
<Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 70:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">No administrators assigned yet</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 81:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">{membership.user.email}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 82:** Non-token Tailwind class: text-gray-
```
<p className="text-xs text-gray-500">Role: {membership.role}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 117:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600 mt-1">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/(super)/super/local-churches/page.tsx

**Line 55:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">Manage local church locations</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 68:** Non-token Tailwind class: text-gray-
```
<Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 69:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">No local churches found</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 82:** Non-token Tailwind class: text-gray-
```
<span className="text-sm font-normal text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 89:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 94:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 105:** Non-token Tailwind class: bg-gray-
```
className="text-xs px-2 py-1 bg-gray-100 rounded"
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/admin/events/[id]/page.tsx

**Line 90:** Non-token Tailwind class: text-gray-
```
<Calendar className="h-4 w-4 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 99:** Non-token Tailwind class: text-gray-
```
<MapPin className="h-4 w-4 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 110:** Non-token Tailwind class: text-gray-
```
<Users className="h-4 w-4 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 119:** Non-token Tailwind class: text-gray-
```
<DollarSign className="h-4 w-4 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 148:** Non-token Tailwind class: text-gray-
```
<span className="text-sm text-gray-600">Going</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 152:** Non-token Tailwind class: text-gray-
```
<span className="text-sm text-gray-600">Waitlist</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 156:** Non-token Tailwind class: text-gray-
```
<span className="text-sm text-gray-600">Total Registered</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 160:** Non-token Tailwind class: text-gray-
```
<span className="text-sm text-gray-600">Spots Available</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 173:** Non-token Tailwind class: text-gray-
```
<span className="text-sm text-gray-600">Paid</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 177:** Non-token Tailwind class: text-gray-
```
<span className="text-sm text-gray-600">Pending</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 198:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">Visible to all members</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 201:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600 mb-2">Restricted to:</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/admin/events/event-form.tsx

**Line 229:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/admin/events/page.tsx

**Line 51:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-500">No events created yet.</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 88:** Non-token Tailwind class: text-gray-
```
<Calendar className="h-4 w-4 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 94:** Non-token Tailwind class: text-gray-
```
<MapPin className="h-4 w-4 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 100:** Non-token Tailwind class: text-gray-
```
<Users className="h-4 w-4 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/admin/lifegroups/lifegroup-manage-drawer.tsx

**Line 203:** Non-token Tailwind class: bg-black
```
className="fixed inset-0 bg-black/50 z-50"
```
**Suggestion:** bg-surface (dark mode handled automatically)

## app/admin/members/members-manager.tsx

**Line 266:** Non-token Tailwind class: text-gray-
```
case 'INACTIVE': return 'bg-gray-100 text-gray-800'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 266:** Non-token Tailwind class: bg-gray-
```
case 'INACTIVE': return 'bg-gray-100 text-gray-800'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 267:** Non-token Tailwind class: text-gray-
```
default: return 'bg-gray-100 text-gray-800'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 267:** Non-token Tailwind class: bg-gray-
```
default: return 'bg-gray-100 text-gray-800'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 278:** Non-token Tailwind class: text-gray-
```
default: return 'bg-gray-100 text-gray-800'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 278:** Non-token Tailwind class: bg-gray-
```
default: return 'bg-gray-100 text-gray-800'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 287:** Non-token Tailwind class: text-gray-
```
<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 565:** Non-token Tailwind class: bg-gray-
```
<div className="p-4 bg-gray-100 rounded-lg font-mono text-sm break-all">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/admin/reports/page.tsx

**Line 225:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">Church performance metrics and insights</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 273:** Non-token Tailwind class: text-gray-
```
<span className="text-gray-500">No change</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 321:** Non-token Tailwind class: text-gray-
```
<span className="text-gray-500">Inactive:</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 348:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-500">No recent attendance data</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 372:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-500">No upcoming events with registrations</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/admin/services/service-details-drawer.tsx

**Line 46:** Non-token Tailwind class: bg-black
```
className="fixed inset-0 bg-black/50 z-50"
```
**Suggestion:** bg-surface (dark mode handled automatically)

## app/announcements/page.tsx

**Line 69:** Non-token Tailwind class: text-gray-
```
[AnnouncementPriority.NORMAL]: 'text-gray-600 bg-gray-50',
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 69:** Non-token Tailwind class: bg-gray-
```
[AnnouncementPriority.NORMAL]: 'text-gray-600 bg-gray-50',
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 90:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">Stay updated with church news and events</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 102:** Non-token Tailwind class: text-gray-
```
<Bell className="mx-auto h-12 w-12 text-gray-400" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 103:** Non-token Tailwind class: text-gray-
```
<h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 104:** Non-token Tailwind class: text-gray-
```
<p className="mt-1 text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 126:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 139:** Non-token Tailwind class: text-gray-
```
<span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 139:** Non-token Tailwind class: bg-gray-
```
<span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 149:** Non-token Tailwind class: text-gray-
```
<div className="mt-4 flex items-center text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/auth/change-password/page.tsx

**Line 47:** Non-token Tailwind class: bg-gray-
```
<div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 80:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-500 mt-1">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/error.tsx

**Line 21:** Non-token Tailwind class: bg-gray-
```
<div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 30:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 34:** Non-token Tailwind class: text-gray-
```
<p className="text-xs text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/events/[id]/attendees-list.tsx

**Line 63:** Non-token Tailwind class: bg-gray-
```
<div key={rsvp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 65:** Non-token Tailwind class: text-gray-
```
<span className="text-sm text-gray-500">#{index + 1}</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 68:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">{rsvp.user.email}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 105:** Non-token Tailwind class: text-gray-
```
<span className="text-sm text-gray-500">#{index + 1}</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 108:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">{rsvp.user.email}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 119:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-500 text-center py-4">No attendees yet</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/events/[id]/page.tsx

**Line 78:** Non-token Tailwind class: text-gray-
```
<Calendar className="h-5 w-5 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 81:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 89:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 99:** Non-token Tailwind class: text-gray-
```
<MapPin className="h-5 w-5 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 102:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">{event.location}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 109:** Non-token Tailwind class: text-gray-
```
<DollarSign className="h-5 w-5 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 112:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">${event.feeAmount.toFixed(2)}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 120:** Non-token Tailwind class: text-gray-
```
<Users className="h-5 w-5 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 123:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 131:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 140:** Non-token Tailwind class: text-gray-
```
<Clock className="h-5 w-5 text-gray-500" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 143:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">{event.localChurch.name}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/events/[id]/rsvp-button.tsx

**Line 99:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 119:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 125:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/events/event-card.tsx

**Line 48:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center gap-2 text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 56:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center gap-2 text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 62:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center gap-2 text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 74:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center gap-2 text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 81:** Non-token Tailwind class: text-gray-
```
<div className="text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/members/[id]/page.tsx

**Line 90:** Non-token Tailwind class: text-gray-
```
<Link href="/members" className="flex items-center text-sm text-gray-600 hover:text-gray-900">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 104:** Non-token Tailwind class: text-gray-
```
<Shield className="mx-auto h-12 w-12 text-gray-400" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 105:** Non-token Tailwind class: text-gray-
```
<h3 className="mt-2 text-sm font-medium text-gray-900">Profile is Private</h3>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 106:** Non-token Tailwind class: text-gray-
```
<p className="mt-1 text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 116:** Non-token Tailwind class: bg-gray-
```
<div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 120:** Non-token Tailwind class: text-gray-
```
<UserIcon className="h-10 w-10 text-gray-400" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 125:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-500 capitalize">{member.role.toLowerCase()}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 127:** Non-token Tailwind class: text-gray-
```
<p className="mt-2 text-gray-600">{member.bio}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 138:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 143:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 150:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-500">Contact information is private</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 158:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 164:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 169:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 180:** Non-token Tailwind class: text-gray-
```
<div className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 209:** Non-token Tailwind class: text-gray-
```
<div key={enrollment.id} className="text-sm text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/members/page.tsx

**Line 79:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">Browse and connect with church members</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 90:** Non-token Tailwind class: text-gray-
```
<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 104:** Non-token Tailwind class: text-gray-
```
<Users className="mx-auto h-12 w-12 text-gray-400" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 105:** Non-token Tailwind class: text-gray-
```
<h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 106:** Non-token Tailwind class: text-gray-
```
<p className="mt-1 text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 116:** Non-token Tailwind class: bg-gray-
```
<div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 120:** Non-token Tailwind class: text-gray-
```
<span className="text-lg font-semibold text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 127:** Non-token Tailwind class: text-gray-
```
<h3 className="text-sm font-medium text-gray-900 truncate">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 131:** Non-token Tailwind class: text-gray-
```
<p className="text-xs text-gray-500 capitalize">{member.role.toLowerCase()}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 134:** Non-token Tailwind class: text-gray-
```
<p className="mt-1 text-sm text-gray-600 line-clamp-2">{member.bio}</p>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 139:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center text-xs text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 145:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center text-xs text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 151:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center text-xs text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 156:** Non-token Tailwind class: text-gray-
```
<div className="flex items-center text-xs text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/messages/page.tsx

**Line 89:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 110:** Non-token Tailwind class: text-gray-
```
filter === 'inbox' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 110:** Non-token Tailwind class: bg-gray-
```
filter === 'inbox' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 118:** Non-token Tailwind class: text-white
```
<span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
```
**Suggestion:** text-ink (or text-accent-ink for accent backgrounds)

**Line 126:** Non-token Tailwind class: text-gray-
```
filter === 'sent' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 126:** Non-token Tailwind class: bg-gray-
```
filter === 'sent' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 141:** Non-token Tailwind class: text-gray-
```
<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 151:** Non-token Tailwind class: text-gray-
```
<MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 152:** Non-token Tailwind class: text-gray-
```
<h3 className="mt-2 text-sm font-medium text-gray-900">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 155:** Non-token Tailwind class: text-gray-
```
<p className="mt-1 text-sm text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 173:** Non-token Tailwind class: bg-gray-
```
<div className={`p-4 rounded-lg border hover:bg-gray-50 transition-colors ${
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 182:** Non-token Tailwind class: text-gray-
```
<p className={`text-sm font-medium text-gray-900 ${
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 187:** Non-token Tailwind class: text-gray-
```
<p className="text-xs text-gray-500">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 192:** Non-token Tailwind class: text-gray-
```
<p className={`text-sm text-gray-900 mt-1 ${
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 198:** Non-token Tailwind class: text-gray-
```
<p className="text-sm text-gray-600 mt-1 line-clamp-2">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 202:** Non-token Tailwind class: text-gray-
```
<p className="text-xs text-gray-500 mt-2">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/not-found.tsx

**Line 9:** Non-token Tailwind class: bg-gray-
```
<div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 12:** Non-token Tailwind class: bg-gray-
```
<div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 13:** Non-token Tailwind class: text-gray-
```
<FileQuestion className="h-8 w-8 text-gray-600" />
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 18:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/public-landing.tsx

**Line 6:** Hard-coded hex color: #fffefc
```
<main className="min-h-screen font-['Inter'] bg-[#fffefc]">
```
**Suggestion:** Use design tokens instead (e.g., text-ink, bg-surface)

**Line 11:** Non-token Tailwind class: bg-gray-
```
<div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 12:** Non-token Tailwind class: text-white
```
<span className="text-white text-lg font-bold">D</span>
```
**Suggestion:** text-ink (or text-accent-ink for accent backgrounds)

**Line 14:** Non-token Tailwind class: text-gray-
```
<span className="text-2xl font-medium text-gray-900">drouple</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 18:** Non-token Tailwind class: text-white
```
className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg px-6 py-2 text-sm font-medium shadow-sm"
```
**Suggestion:** text-ink (or text-accent-ink for accent backgrounds)

**Line 18:** Non-token Tailwind class: bg-gray-
```
className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg px-6 py-2 text-sm font-medium shadow-sm"
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 29:** Non-token Tailwind class: text-gray-
```
<h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 32:** Non-token Tailwind class: text-gray-
```
<span className="text-gray-600">made simple</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 34:** Non-token Tailwind class: text-gray-
```
<p className="text-xl md:text-2xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 42:** Non-token Tailwind class: text-white
```
className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
```
**Suggestion:** text-ink (or text-accent-ink for accent backgrounds)

**Line 42:** Non-token Tailwind class: bg-gray-
```
className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 51:** Hard-coded hex color: #f5f3ed
```
<section className="px-6 py-20 bg-[#f5f3ed]">
```
**Suggestion:** Use design tokens instead (e.g., text-ink, bg-surface)

**Line 54:** Non-token Tailwind class: text-gray-
```
<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 57:** Non-token Tailwind class: text-gray-
```
<p className="text-xl text-gray-600 max-w-2xl mx-auto">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 105:** Non-token Tailwind class: text-gray-
```
<h3 className="text-xl font-semibold text-gray-900">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 108:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600 leading-relaxed">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 121:** Non-token Tailwind class: text-gray-
```
<h2 className="text-4xl font-bold text-gray-900 mb-6">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 124:** Non-token Tailwind class: text-gray-
```
<div className="space-y-6 text-xl text-gray-600 leading-relaxed">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 133:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-900 font-medium">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 141:** Hard-coded hex color: #f5f3ed
```
<section className="px-6 py-20 bg-[#f5f3ed]">
```
**Suggestion:** Use design tokens instead (e.g., text-ink, bg-surface)

**Line 144:** Non-token Tailwind class: text-gray-
```
<h2 className="text-4xl font-bold text-gray-900 mb-6">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 147:** Non-token Tailwind class: text-gray-
```
<p className="text-xl text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 172:** Non-token Tailwind class: text-gray-
```
<h3 className="text-lg font-semibold text-gray-900 mb-4">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 177:** Non-token Tailwind class: text-gray-
```
<li key={j} className="text-gray-600 text-sm">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 188:** Non-token Tailwind class: text-gray-
```
<h3 className="text-2xl font-semibold text-gray-900 mb-8">Role-Based Access Control</h3>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 191:** Non-token Tailwind class: text-gray-
```
<div key={i} className="px-4 py-2 bg-surface border border-border rounded-lg text-gray-700 font-mono text-sm shadow-sm">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 204:** Non-token Tailwind class: text-gray-
```
<h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 207:** Non-token Tailwind class: text-gray-
```
<p className="text-xl text-gray-600 mb-10 leading-relaxed">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 213:** Non-token Tailwind class: text-white
```
className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-8 py-4 text-lg font-medium shadow-lg"
```
**Suggestion:** text-ink (or text-accent-ink for accent backgrounds)

**Line 213:** Non-token Tailwind class: bg-gray-
```
className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-8 py-4 text-lg font-medium shadow-lg"
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 222:** Hard-coded hex color: #f5f3ed
```
<footer className="px-6 py-16 bg-[#f5f3ed]">
```
**Suggestion:** Use design tokens instead (e.g., text-ink, bg-surface)

**Line 227:** Non-token Tailwind class: bg-gray-
```
<div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 228:** Non-token Tailwind class: text-white
```
<span className="text-white text-lg font-bold">D</span>
```
**Suggestion:** text-ink (or text-accent-ink for accent backgrounds)

**Line 230:** Non-token Tailwind class: text-gray-
```
<span className="text-2xl font-medium text-gray-900">drouple</span>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 232:** Non-token Tailwind class: text-gray-
```
<p className="text-gray-600 leading-relaxed">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 238:** Non-token Tailwind class: text-gray-
```
<h4 className="font-semibold text-gray-900 mb-4">Features</h4>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 239:** Non-token Tailwind class: text-gray-
```
<ul className="space-y-2 text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 248:** Non-token Tailwind class: text-gray-
```
<h4 className="font-semibold text-gray-900 mb-4">Support</h4>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 249:** Non-token Tailwind class: text-gray-
```
<ul className="space-y-2 text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 258:** Non-token Tailwind class: text-gray-
```
<h4 className="font-semibold text-gray-900 mb-4">Company</h4>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 259:** Non-token Tailwind class: text-gray-
```
<ul className="space-y-2 text-gray-600">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 269:** Non-token Tailwind class: text-gray-
```
<div className="text-gray-500 text-sm mb-4 md:mb-0">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

**Line 272:** Non-token Tailwind class: text-gray-
```
<div className="text-gray-500 text-sm">
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

## app/vip/firsttimers/firsttimers-manager.tsx

**Line 397:** Non-token Tailwind class: bg-gray-
```
<TableRow key={ft.id} className={isInactive ? 'bg-gray-50 opacity-75' : ''}>
```
**Suggestion:** Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated

