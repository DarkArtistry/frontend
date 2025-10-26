#!/bin/sh
# Retry yarn install with exponential backoff

max_attempts=3
attempt=1
wait_time=10

while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts..."
    
    if yarn --frozen-lockfile --network-timeout 300000; then
        echo "✅ Yarn install successful!"
        exit 0
    fi
    
    if [ $attempt -lt $max_attempts ]; then
        echo "⚠️  Yarn install failed. Waiting ${wait_time}s before retry..."
        sleep $wait_time
        wait_time=$((wait_time * 2))
    fi
    
    attempt=$((attempt + 1))
done

echo "❌ Yarn install failed after $max_attempts attempts"
exit 1