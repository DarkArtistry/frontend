#!/bin/bash
set -e

echo "Starting Next.js build..."

# Function to check if build artifacts are complete
check_build_complete() {
  if [ ! -d ".next" ]; then
    echo "ERROR: .next directory not found"
    return 1
  fi

  if [ ! -f ".next/BUILD_ID" ]; then
    echo "ERROR: BUILD_ID not found"
    return 1
  fi

  if [ ! -d ".next/static" ]; then
    echo "ERROR: static directory not found"
    return 1
  fi

  if [ ! -d ".next/server" ]; then
    echo "ERROR: server directory not found"
    return 1
  fi

  echo "✓ Build artifacts are complete"
  return 0
}

# Disable ESLint for build
export NEXT_PUBLIC_DISABLE_LINTER=true

# Run yarn build and capture output
yarn build 2>&1 | tee /tmp/build.log &
BUILD_PID=$!

# Monitor for trace collection hang
TIMEOUT=400
TRACE_TIMEOUT=60
ELAPSED=0
LAST_OUTPUT=""
TRACE_DETECTED=0

echo "Monitoring build progress (timeout: ${TIMEOUT}s)..."

while kill -0 $BUILD_PID 2>/dev/null; do
  sleep 5
  ELAPSED=$((ELAPSED + 5))

  # Check for trace collection in output
  if grep -q "Collecting build traces" /tmp/build.log && [ $TRACE_DETECTED -eq 0 ]; then
    echo "⚠ Trace collection detected, will timeout in ${TRACE_TIMEOUT}s if it hangs..."
    TRACE_DETECTED=1
    TRACE_START=$ELAPSED
  fi

  # If trace collection has been running too long, kill it
  if [ $TRACE_DETECTED -eq 1 ]; then
    TRACE_ELAPSED=$((ELAPSED - TRACE_START))
    if [ $TRACE_ELAPSED -ge $TRACE_TIMEOUT ]; then
      echo "⚠ Trace collection hung for ${TRACE_ELAPSED}s, terminating build process..."
      kill $BUILD_PID 2>/dev/null || true
      sleep 2
      kill -9 $BUILD_PID 2>/dev/null || true
      break
    fi
  fi

  # Overall timeout
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "⚠ Build timeout (${TIMEOUT}s), terminating..."
    kill $BUILD_PID 2>/dev/null || true
    sleep 2
    kill -9 $BUILD_PID 2>/dev/null || true
    break
  fi
done

# Wait for process to fully terminate
wait $BUILD_PID 2>/dev/null || BUILD_EXIT_CODE=$?

echo "Build process ended after ${ELAPSED}s"

# Check if build artifacts are complete
if check_build_complete; then
  echo "✅ Build successful - artifacts are complete!"
  exit 0
else
  echo "❌ Build failed - artifacts are incomplete"
  exit 1
fi
