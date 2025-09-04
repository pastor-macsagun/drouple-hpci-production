#!/bin/bash

# iOS Testing Script for Drouple Mobile
# Supports both iOS Simulator and Physical Device testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SIMULATOR_NAME="iPhone 16"
IOS_VERSION="18.6"
TIMEOUT=300
RETRY_COUNT=3

print_header() {
    echo -e "${BLUE}======================================"
    echo -e "🧪 Drouple Mobile - iOS Testing"  
    echo -e "======================================${NC}"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "iOS testing requires macOS"
        exit 1
    fi
    
    # Check Xcode
    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode command line tools not found. Install with: xcode-select --install"
        exit 1
    fi
    
    # Check iOS Simulator
    if ! command -v xcrun &> /dev/null; then
        print_error "xcrun not found. Please install Xcode"
        exit 1
    fi
    
    # Check Detox
    if ! command -v npx &> /dev/null; then
        print_error "npx not found. Please install Node.js"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

setup_simulator() {
    print_step "Setting up iOS Simulator..."
    
    # Get available simulators - handle new iOS format where version is on separate line
    SIMULATOR_UDID=$(xcrun simctl list devices available | sed -n "/-- iOS $IOS_VERSION --/,/-- iOS/p" | grep "$SIMULATOR_NAME" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\).*/\1/')
    
    if [ -z "$SIMULATOR_UDID" ]; then
        print_error "Simulator '$SIMULATOR_NAME' with iOS $IOS_VERSION not found"
        print_warning "Available simulators:"
        xcrun simctl list devices available | grep iPhone
        exit 1
    fi
    
    print_step "Using simulator: $SIMULATOR_UDID"
    
    # Boot simulator if not already running
    SIMULATOR_STATE=$(xcrun simctl list devices | grep "$SIMULATOR_UDID" | sed -E 's/.*\(([A-Za-z]+)\).*/\1/')
    
    if [ "$SIMULATOR_STATE" != "Booted" ]; then
        print_step "Booting iOS Simulator..."
        xcrun simctl boot "$SIMULATOR_UDID"
        
        # Wait for simulator to boot
        timeout=$TIMEOUT
        while [ $timeout -gt 0 ]; do
            if xcrun simctl list devices | grep "$SIMULATOR_UDID" | grep -q "Booted"; then
                break
            fi
            sleep 2
            timeout=$((timeout-2))
        done
        
        if [ $timeout -le 0 ]; then
            print_error "Simulator failed to boot within $TIMEOUT seconds"
            exit 1
        fi
    fi
    
    print_success "iOS Simulator ready"
}

check_physical_device() {
    print_step "Checking for connected iOS devices..."
    
    # Get connected devices
    CONNECTED_DEVICES=$(xcrun xctrace list devices 2>/dev/null | grep -E "iPhone|iPad" | grep -v Simulator || true)
    
    if [ -z "$CONNECTED_DEVICES" ]; then
        print_warning "No physical iOS devices connected"
        return 1
    fi
    
    print_success "Found connected iOS devices:"
    echo "$CONNECTED_DEVICES"
    return 0
}

prebuild_ios() {
    print_step "Running Expo prebuild for iOS..."
    
    if [ ! -d "ios" ]; then
        npx expo prebuild --platform ios --clean
    else
        print_warning "iOS directory already exists. Skipping prebuild."
    fi
    
    print_success "iOS prebuild completed"
}

build_ios_app() {
    local config=$1
    print_step "Building iOS app for configuration: $config"
    
    # Ensure ios directory exists
    if [ ! -d "ios" ]; then
        prebuild_ios
    fi
    
    # Build using Detox
    npx detox build --configuration "$config"
    
    print_success "iOS app built successfully"
}

run_tests() {
    local config=$1
    local test_pattern=${2:-""}
    
    print_step "Running E2E tests with configuration: $config"
    
    if [ -n "$test_pattern" ]; then
        print_step "Test pattern: $test_pattern"
        npx detox test --configuration "$config" --testNamePattern="$test_pattern"
    else
        npx detox test --configuration "$config"
    fi
    
    print_success "E2E tests completed"
}

cleanup() {
    print_step "Cleaning up..."
    
    # Kill any hanging processes
    pkill -f "Simulator" || true
    pkill -f "xctest" || true
    
    print_success "Cleanup completed"
}

show_usage() {
    echo "Usage: $0 [OPTIONS] [TEST_PATTERN]"
    echo ""
    echo "Options:"
    echo "  -s, --simulator     Run tests on iOS Simulator (default)"
    echo "  -d, --device        Run tests on connected physical device"  
    echo "  -i, --ipad          Run tests on iPad Simulator"
    echo "  -b, --build-only    Only build the app, don't run tests"
    echo "  -c, --clean         Clean build and prebuild iOS"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --simulator                    # Run all tests on iPhone Simulator"
    echo "  $0 --device                       # Run all tests on connected device"
    echo "  $0 --ipad                         # Run all tests on iPad Simulator"  
    echo "  $0 --simulator \"login.*\"          # Run login tests on Simulator"
    echo "  $0 --build-only --simulator       # Build iOS app for Simulator"
    echo "  $0 --clean --simulator            # Clean build and run tests"
}

# Main execution
main() {
    local test_target="simulator"
    local build_only=false
    local clean_build=false
    local test_pattern=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -s|--simulator)
                test_target="simulator"
                shift
                ;;
            -d|--device)
                test_target="device"
                shift
                ;;
            -i|--ipad)
                test_target="ipad"
                shift
                ;;
            -b|--build-only)
                build_only=true
                shift
                ;;
            -c|--clean)
                clean_build=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                test_pattern="$1"
                shift
                ;;
        esac
    done
    
    print_header
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    check_prerequisites
    
    # Clean build if requested
    if [ "$clean_build" = true ]; then
        print_step "Cleaning previous builds..."
        rm -rf ios/build
        rm -rf ios/Pods
        npx expo prebuild --platform ios --clean
    fi
    
    # Determine configuration
    local config
    case $test_target in
        "simulator")
            config="ios.sim.debug"
            setup_simulator
            ;;
        "device")
            config="ios.device.debug"
            if ! check_physical_device; then
                print_error "No physical iOS devices connected. Connect a device and trust this computer."
                exit 1
            fi
            ;;
        "ipad")
            config="ios.ipad.debug"
            setup_simulator
            ;;
    esac
    
    # Build the app
    build_ios_app "$config"
    
    if [ "$build_only" = true ]; then
        print_success "Build completed successfully!"
        exit 0
    fi
    
    # Run tests
    run_tests "$config" "$test_pattern"
    
    print_success "iOS testing completed successfully! 🎉"
}

# Execute main function with all arguments
main "$@"