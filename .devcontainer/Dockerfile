# Use Node.js 22 as the base image (matches package.json engines requirement)
FROM node:22-bookworm-slim

# Set Python interpreter for `node-gyp` to use
ENV PYTHON=/usr/bin/python3

# Install system dependencies needed for development
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    # Build tools for native modules
    python3 \
    g++ \
    build-essential \
    make \
    # SQLite dependencies
    libsqlite3-dev \
    # Git for version control
    git \
    # Curl for API testing
    curl \
    # Vim for quick edits
    vim \
    # Process tools
    procps \
    # Network tools
    net-tools \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /workspace
# Set up Yarn configuration
RUN yarn config set enableGlobalCache false && \
    yarn config set enableTelemetry false

# Set environment variables for development
ENV NODE_ENV=development
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV YARN_ENABLE_IMMUTABLE_INSTALLS=false

# Expose ports for Backstage
EXPOSE 3000 7007

# Set the default command
CMD ["bash", "-l"]

