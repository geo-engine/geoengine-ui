# WAVE - Workflow, Analysis and Visualization Editor

## Requirements
You need to have [Node.js](https://nodejs.org) installed.
Verify that you are running at least node v5.x.x and npm 3.x.x.
You can check this by running node -v and npm -v in a terminal/console window.

### Ubuntu 14.04 LTS
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## How to build
```
npm install
npm run tsc
```

## Expected Errors
* "'abstract' modifier can only appear on a class or method declaration": this is a [TypeScript problem](https://github.com/Microsoft/TypeScript/issues/4669) and will be fixed in [2.0](https://github.com/Microsoft/TypeScript/milestones)

*Future work:*
```
npm install
npm run build
```
