#!/bin/bash

# Drouple Mobile Build Script
# Automated build script for different environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
PLATFORM="both"
BUILD_TYPE="build"
UPLOAD=false
VERBOSE=false

# Function to display help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment   Environment (development|staging|production) [default: development]"
    echo "  -p, --platform      Platform (ios|android|both) [default: both]"
    echo "  -t, --type         Build type (build|submit) [default: build]"
    echo "  -u, --upload       Upload to app stores after build"
    echo "  -v, --verbose      Enable verbose output"
    echo "  -h, --help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e production -p ios -t build"
    echo "  $0 -e staging -p android --upload"
    echo "  $0 --environment production --platform both --type submit"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -t|--type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        -u|--upload)
            UPLOAD=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be development, staging, or production${NC}"
    exit 1
fi

# Validate platform
if [[ ! "$PLATFORM" =~ ^(ios|android|both)$ ]]; then
    echo -e "${RED}Error: Invalid platform. Must be ios, android, or both${NC}"
    exit 1
fi

# Validate build type
if [[ ! "$BUILD_TYPE" =~ ^(build|submit)$ ]]; then
    echo -e "${RED}Error: Invalid build type. Must be build or submit${NC}"
    exit 1
fi

# Function to log messages
log() {
    local level=$1
    shift
    local message="$@"
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
}

# Function to run commands with optional verbose output
run_command() {
    local description=$1
    shift
    local command="$@"
    
    log "INFO" "🔄 $description"
    
    if [[ "$VERBOSE" == true ]]; then
        echo -e "${YELLOW}Running: $command${NC}"
        eval $command
    else
        if eval $command > /dev/null 2>&1; then
            log "SUCCESS" "✅ $description completed"
        else
            log "ERROR" "❌ $description failed"
            exit 1
        fi
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log "INFO" "🔍 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log "ERROR" "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log "ERROR" "npm is not installed"
        exit 1
    fi
    
    # Check EAS CLI
    if ! command -v eas &> /dev/null; then
        log "WARNING" "EAS CLI is not installed globally. Installing..."
        run_command "Installing EAS CLI" "npm install -g @expo/eas-cli"
    fi
    
    # Check Expo CLI
    if ! command -v expo &> /dev/null; then
        log "WARNING" "Expo CLI is not installed globally. Installing..."
        run_command "Installing Expo CLI" "npm install -g @expo/cli"
    fi
    
    # Check if logged in to Expo
    if ! expo whoami &> /dev/null; then
        log "ERROR" "Not logged in to Expo. Please run 'expo login' first"
        exit 1
    fi
    
    log "SUCCESS" "✅ All prerequisites met"
}

# Function to setup environment
setup_environment() {
    log "INFO" "🔧 Setting up $ENVIRONMENT environment..."
    
    # Set environment variables
    export APP_VARIANT=$ENVIRONMENT
    
    case $ENVIRONMENT in
        "development")
            export EXPO_PUBLIC_API_URL="https://api-dev.drouple.com"
            ;;
        "staging")
            export EXPO_PUBLIC_API_URL="https://api-staging.drouple.com"
            ;;
        "production")
            export EXPO_PUBLIC_API_URL="https://api.drouple.com"
            ;;
    esac
    
    log "SUCCESS" "✅ Environment configured for $ENVIRONMENT"
}

# Function to install dependencies
install_dependencies() {
    run_command "Installing dependencies" "npm ci"
}

# Function to run pre-build checks
run_pre_build_checks() {
    log "INFO" "🧪 Running pre-build checks..."
    
    # Type checking
    if [[ "$ENVIRONMENT" != "development" ]]; then
        run_command "TypeScript type checking" "npm run type-check"
    fi
    
    # Linting
    if [[ "$ENVIRONMENT" != "development" ]]; then
        run_command "ESLint checking" "npm run lint"
    fi
    
    # Tests (only for production builds)
    if [[ "$ENVIRONMENT" == "production" ]]; then
        run_command "Running unit tests" "npm run test"
    fi
    
    log "SUCCESS" "✅ Pre-build checks passed"
}

# Function to build for specific platform
build_platform() {
    local platform=$1
    
    log "INFO" "🏗️ Building for $platform ($ENVIRONMENT)..."
    
    case $BUILD_TYPE in
        "build")
            run_command "Building $platform app" "eas build --platform $platform --profile $ENVIRONMENT --non-interactive"
            ;;
        "submit")
            if [[ "$ENVIRONMENT" == "production" ]]; then
                run_command "Submitting $platform app to store" "eas submit --platform $platform --profile $ENVIRONMENT --non-interactive"
            else
                log "WARNING" "Submit is only available for production builds"
            fi
            ;;
    esac
}

# Function to upload builds
upload_builds() {
    if [[ "$UPLOAD" == true && "$BUILD_TYPE" == "build" ]]; then
        log "INFO" "📤 Uploading builds..."
        
        case $PLATFORM in
            "ios")
                build_platform "ios"
                if [[ "$ENVIRONMENT" == "production" ]]; then
                    run_command "Submitting iOS app to App Store" "eas submit --platform ios --profile production --non-interactive"
                fi
                ;;
            "android")
                build_platform "android"
                if [[ "$ENVIRONMENT" == "production" ]]; then
                    run_command "Submitting Android app to Play Store" "eas submit --platform android --profile production --non-interactive"
                fi
                ;;
            "both")
                build_platform "ios"
                build_platform "android"
                if [[ "$ENVIRONMENT" == "production" ]]; then
                    run_command "Submitting iOS app to App Store" "eas submit --platform ios --profile production --non-interactive"
                    run_command "Submitting Android app to Play Store" "eas submit --platform android --profile production --non-interactive"
                fi
                ;;
        esac
    fi
}

# Function to cleanup
cleanup() {
    log "INFO" "🧹 Cleaning up..."
    
    # Clean up any temporary files
    rm -rf .expo/
    rm -rf node_modules/.cache/
    
    log "SUCCESS" "✅ Cleanup completed"
}

# Function to display build summary
show_summary() {
    echo ""
    echo "=============================================="
    echo "           BUILD SUMMARY"
    echo "=============================================="
    echo "Environment:     $ENVIRONMENT"
    echo "Platform:        $PLATFORM"
    echo "Build Type:      $BUILD_TYPE"
    echo "Upload:          $UPLOAD"
    echo "Timestamp:       $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=============================================="
    echo ""
}

# Main execution
main() {
    log "INFO" "🚀 Starting Drouple Mobile build process..."
    
    # Show configuration
    echo ""
    echo "Configuration:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Platform: $PLATFORM"
    echo "  Build Type: $BUILD_TYPE"
    echo "  Upload: $UPLOAD"
    echo "  Verbose: $VERBOSE"
    echo ""
    
    # Execute build pipeline
    check_prerequisites
    setup_environment
    install_dependencies
    run_pre_build_checks
    
    # Build based on platform
    case $PLATFORM in
        "ios")
            build_platform "ios"
            ;;
        "android")
            build_platform "android"
            ;;
        "both")
            build_platform "ios"
            build_platform "android"
            ;;
    esac
    
    upload_builds
    cleanup
    show_summary
    
    log "SUCCESS" "🎉 Build process completed successfully!"
}

# Trap to cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"