#!/bin/bash
# Drouple Mobile Release Script
# Automated release process with version management and deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VERSION_FILE="$PROJECT_ROOT/version.json"
PACKAGE_JSON="$PROJECT_ROOT/package.json"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Drouple Mobile Release Script

Usage: $0 [OPTIONS] COMMAND

Commands:
    prepare     Prepare release (bump version, update changelog)
    build       Build the application
    test        Run full test suite
    deploy      Deploy to specified environment
    publish     Publish to app stores
    rollback    Rollback to previous version

Options:
    -e, --env ENV           Environment (development|staging|production)
    -t, --type TYPE         Release type (patch|minor|major)
    -v, --version VERSION   Specific version number
    -p, --platform PLATFORM Target platform (ios|android|all)
    -s, --skip-tests        Skip test execution
    -f, --force             Force deployment without confirmation
    -h, --help              Show this help message

Examples:
    $0 prepare --type minor
    $0 build --env staging --platform ios
    $0 deploy --env production --platform all
    $0 publish --platform android
    $0 rollback --env staging

Environment Variables:
    EXPO_TOKEN              Expo authentication token
    SENTRY_AUTH_TOKEN       Sentry authentication token
    SLACK_WEBHOOK_URL       Slack notification webhook
    DRY_RUN                 Set to 'true' for dry run mode
EOF
}

# Parse command line arguments
ENVIRONMENT="staging"
RELEASE_TYPE="patch"
PLATFORM="all"
SKIP_TESTS=false
FORCE=false
DRY_RUN=${DRY_RUN:-false}

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--type)
            RELEASE_TYPE="$2"
            shift 2
            ;;
        -v|--version)
            SPECIFIC_VERSION="$2"
            shift 2
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        prepare|build|test|deploy|publish|rollback)
            COMMAND="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate command
if [[ -z "$COMMAND" ]]; then
    log_error "No command specified"
    show_help
    exit 1
fi

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Validate platform
case $PLATFORM in
    ios|android|all)
        ;;
    *)
        log_error "Invalid platform: $PLATFORM"
        exit 1
        ;;
esac

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [[ ! -f "$PACKAGE_JSON" ]]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    # Check for required tools
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed."; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed."; exit 1; }
    command -v git >/dev/null 2>&1 || { log_error "git is required but not installed."; exit 1; }
    
    # Check if Expo CLI is available
    if ! command -v expo >/dev/null 2>&1; then
        log_warning "Expo CLI not found. Installing globally..."
        npm install -g @expo/cli
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        if [[ "$FORCE" != true ]]; then
            log_error "You have uncommitted changes. Commit them first or use --force."
            exit 1
        else
            log_warning "Proceeding with uncommitted changes (--force used)"
        fi
    fi
    
    log_success "Prerequisites check passed"
}

# Get current version
get_current_version() {
    if [[ -f "$VERSION_FILE" ]]; then
        VERSION=$(node -p "require('$VERSION_FILE').version")
    else
        VERSION=$(node -p "require('$PACKAGE_JSON').version")
    fi
    echo "$VERSION"
}

# Bump version
bump_version() {
    local version_type="$1"
    local current_version
    current_version=$(get_current_version)
    
    log_info "Current version: $current_version"
    
    if [[ -n "$SPECIFIC_VERSION" ]]; then
        NEW_VERSION="$SPECIFIC_VERSION"
    else
        # Use npm version to bump
        NEW_VERSION=$(npm version "$version_type" --no-git-tag-version --preid=beta | sed 's/^v//')
    fi
    
    log_info "New version: $NEW_VERSION"
    
    # Update version.json if it exists
    if [[ -f "$VERSION_FILE" ]]; then
        node -e "
            const fs = require('fs');
            const version = require('$VERSION_FILE');
            version.version = '$NEW_VERSION';
            version.buildNumber = (version.buildNumber || 0) + 1;
            version.lastUpdated = new Date().toISOString();
            fs.writeFileSync('$VERSION_FILE', JSON.stringify(version, null, 2));
        "
    fi
    
    echo "$NEW_VERSION"
}

# Update changelog
update_changelog() {
    local version="$1"
    local changelog_file="$PROJECT_ROOT/CHANGELOG.md"
    
    log_info "Updating changelog for version $version"
    
    # Create changelog if it doesn't exist
    if [[ ! -f "$changelog_file" ]]; then
        cat > "$changelog_file" << EOF
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

EOF
    fi
    
    # Add new version entry
    local date=$(date +%Y-%m-%d)
    local temp_file=$(mktemp)
    
    # Get recent commit messages for changelog
    local commits=$(git log --oneline --since="2 weeks ago" --pretty=format:"- %s" | head -10)
    
    cat > "$temp_file" << EOF
# Changelog

All notable changes to this project will be documented in this file.

## [$version] - $date

### Added
- New features and improvements

### Changed
- Updates to existing functionality

### Fixed
- Bug fixes and improvements

### Recent commits:
$commits

$(tail -n +6 "$changelog_file")
EOF
    
    mv "$temp_file" "$changelog_file"
    log_success "Changelog updated"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log_warning "Skipping tests (--skip-tests used)"
        return
    fi
    
    log_info "Running test suite..."
    
    # Install dependencies
    npm ci
    
    # Run linting
    log_info "Running linter..."
    npm run lint
    
    # Run type checking
    log_info "Running type check..."
    npm run type-check
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test:unit -- --coverage --watchAll=false
    
    # Run integration tests
    log_info "Running integration tests..."
    npm run test:integration
    
    # Run security audit
    log_info "Running security audit..."
    npm audit --audit-level=moderate
    
    log_success "All tests passed"
}

# Build application
build_app() {
    local env="$1"
    local platform="$2"
    
    log_info "Building application for $env environment ($platform)"
    
    # Set environment variables
    export APP_VARIANT="$env"
    export NODE_ENV="$env"
    
    case $platform in
        ios)
            build_ios "$env"
            ;;
        android)
            build_android "$env"
            ;;
        all)
            build_ios "$env"
            build_android "$env"
            ;;
    esac
    
    log_success "Build completed for $platform"
}

# Build iOS
build_ios() {
    local env="$1"
    log_info "Building iOS for $env..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would build iOS for $env"
        return
    fi
    
    case $env in
        development)
            eas build --platform ios --profile development --non-interactive
            ;;
        staging)
            eas build --platform ios --profile staging --non-interactive
            ;;
        production)
            eas build --platform ios --profile production --non-interactive
            ;;
    esac
}

# Build Android
build_android() {
    local env="$1"
    log_info "Building Android for $env..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would build Android for $env"
        return
    fi
    
    case $env in
        development)
            eas build --platform android --profile development --non-interactive
            ;;
        staging)
            eas build --platform android --profile staging --non-interactive
            ;;
        production)
            eas build --platform android --profile production --non-interactive
            ;;
    esac
}

# Deploy to environment
deploy_app() {
    local env="$1"
    local platform="$2"
    
    log_info "Deploying to $env environment ($platform)"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would deploy to $env"
        return
    fi
    
    # Confirm deployment in production
    if [[ "$env" == "production" && "$FORCE" != true ]]; then
        echo -n "Are you sure you want to deploy to PRODUCTION? (yes/no): "
        read confirmation
        if [[ "$confirmation" != "yes" ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Update over-the-air
    case $env in
        staging)
            expo publish --release-channel staging
            ;;
        production)
            expo publish --release-channel production
            ;;
    esac
    
    log_success "Deployment to $env completed"
}

# Publish to app stores
publish_stores() {
    local platform="$1"
    
    log_info "Publishing to app stores ($platform)"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would publish to stores"
        return
    fi
    
    # Confirm store publication
    if [[ "$FORCE" != true ]]; then
        echo -n "Are you sure you want to publish to app stores? (yes/no): "
        read confirmation
        if [[ "$confirmation" != "yes" ]]; then
            log_info "Publication cancelled"
            exit 0
        fi
    fi
    
    case $platform in
        ios)
            eas submit --platform ios --profile production
            ;;
        android)
            eas submit --platform android --profile production
            ;;
        all)
            eas submit --platform ios --profile production
            eas submit --platform android --profile production
            ;;
    esac
    
    log_success "Store publication completed"
}

# Send notifications
send_notification() {
    local message="$1"
    local status="$2"
    
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local emoji="✅"
        local color="good"
        
        if [[ "$status" == "error" ]]; then
            emoji="❌"
            color="danger"
        elif [[ "$status" == "warning" ]]; then
            emoji="⚠️"
            color="warning"
        fi
        
        local payload="{
            \"channel\": \"#deployments\",
            \"username\": \"Release Bot\",
            \"text\": \"$emoji $message\",
            \"color\": \"$color\"
        }"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
}

# Rollback functionality
rollback() {
    local env="$1"
    
    log_warning "Rolling back $env environment"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would rollback $env"
        return
    fi
    
    # Get previous version from git
    local previous_version
    previous_version=$(git tag -l --sort=-version:refname | head -2 | tail -1)
    
    if [[ -z "$previous_version" ]]; then
        log_error "No previous version found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to version: $previous_version"
    
    # Checkout previous version
    git checkout "$previous_version"
    
    # Rebuild and redeploy
    build_app "$env" "$PLATFORM"
    deploy_app "$env" "$PLATFORM"
    
    log_success "Rollback to $previous_version completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    # Add any cleanup tasks here
}

# Set up trap for cleanup
trap cleanup EXIT

# Main execution
main() {
    log_info "Starting release process: $COMMAND"
    log_info "Environment: $ENVIRONMENT, Platform: $PLATFORM"
    
    if [[ "$DRY_RUN" == true ]]; then
        log_warning "Running in DRY RUN mode - no actual changes will be made"
    fi
    
    check_prerequisites
    
    case $COMMAND in
        prepare)
            NEW_VERSION=$(bump_version "$RELEASE_TYPE")
            update_changelog "$NEW_VERSION"
            git add -A
            git commit -m "chore: bump version to $NEW_VERSION"
            git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
            send_notification "Version $NEW_VERSION prepared for release" "info"
            ;;
        build)
            build_app "$ENVIRONMENT" "$PLATFORM"
            send_notification "Build completed for $ENVIRONMENT ($PLATFORM)" "success"
            ;;
        test)
            run_tests
            send_notification "All tests passed" "success"
            ;;
        deploy)
            run_tests
            build_app "$ENVIRONMENT" "$PLATFORM"
            deploy_app "$ENVIRONMENT" "$PLATFORM"
            send_notification "Deployment to $ENVIRONMENT completed successfully" "success"
            ;;
        publish)
            publish_stores "$PLATFORM"
            send_notification "Published to app stores ($PLATFORM)" "success"
            ;;
        rollback)
            rollback "$ENVIRONMENT"
            send_notification "Rollback completed for $ENVIRONMENT" "warning"
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            exit 1
            ;;
    esac
    
    log_success "Release process completed successfully!"
}

# Run main function
main "$@"