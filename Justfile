# DataGuard Project Commands

# Build and start mail demo
demo-build:
    cd mail-demo && yarn build

demo-start:
    cd mail-demo && yarn start

demo-dev:
    cd mail-demo && yarn dev

# Build and start extension
extension-build:
    cd extension && yarn build

extension-dev:
    cd extension && yarn dev

# Install dependencies
install:
    cd extension && yarn install

# Clean build artifacts
clean:
    cd extension && rm -rf dist
