# Move Test Execution Container
FROM ubuntu:22.04

# Install necessary packages
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (required for Move CLI)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Move CLI and ensure it's accessible system-wide
RUN cargo install --git https://github.com/move-language/move move-cli
RUN cp /root/.cargo/bin/move /usr/local/bin/move
RUN chmod +x /usr/local/bin/move

# Clone Move repository for stdlib
RUN git clone https://github.com/move-language/move.git /opt/move
RUN chown -R root:root /opt/move

# Create a non-root user for security
RUN groupadd -r testuser && useradd -r -g testuser testuser

# Set up working directory
WORKDIR /workspace

# Create test execution directories
RUN mkdir -p /workspace/sources /workspace/tests /workspace/output
RUN chown -R testuser:testuser /workspace

# Create a basic Move.toml template
COPY --chown=testuser:testuser move-template.toml /workspace/Move.toml

# Switch to non-root user
USER testuser

# Verify move CLI is accessible
RUN move --version || echo "Move CLI installation check"

# Default command
CMD ["move", "test"]
