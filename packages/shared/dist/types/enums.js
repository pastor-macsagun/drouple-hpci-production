// Shared enums that match the Prisma schema
export var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["PASTOR"] = "PASTOR";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["VIP"] = "VIP";
    UserRole["LEADER"] = "LEADER";
    UserRole["MEMBER"] = "MEMBER";
})(UserRole || (UserRole = {}));
export var ProfileVisibility;
(function (ProfileVisibility) {
    ProfileVisibility["PUBLIC"] = "PUBLIC";
    ProfileVisibility["MEMBERS"] = "MEMBERS";
    ProfileVisibility["LEADERS"] = "LEADERS";
    ProfileVisibility["PRIVATE"] = "PRIVATE";
})(ProfileVisibility || (ProfileVisibility = {}));
export var BelieverStatus;
(function (BelieverStatus) {
    BelieverStatus["ACTIVE"] = "ACTIVE";
    BelieverStatus["INACTIVE"] = "INACTIVE";
    BelieverStatus["COMPLETED"] = "COMPLETED";
})(BelieverStatus || (BelieverStatus = {}));
export var MemberStatus;
(function (MemberStatus) {
    MemberStatus["PENDING"] = "PENDING";
    MemberStatus["ACTIVE"] = "ACTIVE";
    MemberStatus["INACTIVE"] = "INACTIVE";
})(MemberStatus || (MemberStatus = {}));
export var MembershipStatus;
(function (MembershipStatus) {
    MembershipStatus["ACTIVE"] = "ACTIVE";
    MembershipStatus["INACTIVE"] = "INACTIVE";
    MembershipStatus["LEFT"] = "LEFT";
})(MembershipStatus || (MembershipStatus = {}));
export var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["APPROVED"] = "APPROVED";
    RequestStatus["REJECTED"] = "REJECTED";
})(RequestStatus || (RequestStatus = {}));
export var EventScope;
(function (EventScope) {
    EventScope["LOCAL_CHURCH"] = "LOCAL_CHURCH";
    EventScope["WHOLE_CHURCH"] = "WHOLE_CHURCH";
})(EventScope || (EventScope = {}));
export var RsvpStatus;
(function (RsvpStatus) {
    RsvpStatus["GOING"] = "GOING";
    RsvpStatus["WAITLIST"] = "WAITLIST";
    RsvpStatus["CANCELLED"] = "CANCELLED";
})(RsvpStatus || (RsvpStatus = {}));
export var PathwayType;
(function (PathwayType) {
    PathwayType["ROOTS"] = "ROOTS";
    PathwayType["VINES"] = "VINES";
    PathwayType["RETREAT"] = "RETREAT";
})(PathwayType || (PathwayType = {}));
export var EnrollmentStatus;
(function (EnrollmentStatus) {
    EnrollmentStatus["ENROLLED"] = "ENROLLED";
    EnrollmentStatus["COMPLETED"] = "COMPLETED";
    EnrollmentStatus["DROPPED"] = "DROPPED";
})(EnrollmentStatus || (EnrollmentStatus = {}));
export var AnnouncementScope;
(function (AnnouncementScope) {
    AnnouncementScope["PUBLIC"] = "PUBLIC";
    AnnouncementScope["MEMBERS"] = "MEMBERS";
    AnnouncementScope["LEADERS"] = "LEADERS";
    AnnouncementScope["ADMINS"] = "ADMINS";
})(AnnouncementScope || (AnnouncementScope = {}));
export var AnnouncementPriority;
(function (AnnouncementPriority) {
    AnnouncementPriority["LOW"] = "LOW";
    AnnouncementPriority["NORMAL"] = "NORMAL";
    AnnouncementPriority["HIGH"] = "HIGH";
    AnnouncementPriority["URGENT"] = "URGENT";
})(AnnouncementPriority || (AnnouncementPriority = {}));
