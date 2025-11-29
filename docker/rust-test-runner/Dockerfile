# Rust Test Execution Container
FROM rust:1.75-slim

# Install necessary packages
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pre-warm the cargo registry and install common dependencies
RUN cargo install --list || true
RUN mkdir -p /tmp/cargo-cache
WORKDIR /tmp/cargo-cache

# Create a temporary project to pre-download common dependencies
RUN echo '[package]\nname="warmup"\nversion="0.1.0"\nedition="2021"\n\n[dependencies]\nserde = { version = "1.0", features = ["derive"] }\nserde_json = "1.0"\ntokio = { version = "1.0", features = ["full"] }' > Cargo.toml
RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo build --release || true
RUN cargo clean

# Create a non-root user for security
RUN groupadd -r testuser && useradd -r -g testuser testuser

# Set up working directory
WORKDIR /workspace

# Create test execution directories
RUN mkdir -p /workspace/src /workspace/tests /workspace/output
RUN chown -R testuser:testuser /workspace

# Copy cargo registry cache to user directory
RUN cp -r /usr/local/cargo /home/testuser/.cargo || true
RUN chown -R testuser:testuser /home/testuser/.cargo || true

# Switch to non-root user
USER testuser

# Create a basic Cargo.toml template
COPY --chown=testuser:testuser cargo-template.toml /workspace/Cargo.toml

# Set environment for optimized builds
ENV RUST_BACKTRACE=1
ENV CARGO_NET_RETRY=3
ENV CARGO_NET_TIMEOUT=30
ENV CARGO_NET_OFFLINE=false
ENV CARGO_TARGET_DIR=/workspace/target

# Default command
CMD ["cargo", "test", "--", "--nocapture"]
