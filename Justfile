# DataGuard Project Commands

# Build and start mail demo
demo:build:
    cd mail-demo && yarn build

demo:start:
    cd mail-demo && yarn start

demo:dev:
    cd mail-demo && yarn dev

# Build and start extension
extension:build:
    cd extension && yarn build

extension:dev:
    cd extension && yarn dev

# Install dependencies
install:
    cd mail-demo && yarn install
    cd extension && yarn install

# Clean build artifacts
clean:
    cd mail-demo && rm -rf dist
    cd extension && rm -rf dist
