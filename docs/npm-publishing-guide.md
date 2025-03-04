# NPM Publishing Guide

This guide provides step-by-step instructions for publishing and updating the DreamHost Deployer package on npm.

## Prerequisites

- Node.js and npm installed on your machine
- An npm account (create one at [npmjs.com](https://www.npmjs.com/signup))
- Git repository set up for your project

## First-Time Publishing

### 1. Prepare Your Package

Ensure your `package.json` file is properly configured:

```json
{
  "name": "dreamhost-deployer",
  "version": "0.1.0",
  "description": "A CLI tool for deploying websites to DreamHost servers via SSH",
  "main": "deploy.js",
  "bin": {
    "dreamhost-deployer": "./bin/cli.js"
  },
  "keywords": ["dreamhost", "deploy", "ssh", "cli"],
  "author": "jakerains",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/jakerains/dreamhost-deployer"
  }
}
```

### 2. Login to npm

```bash
npm login
```

Enter your npm username, password, and email when prompted.

### 3. Test Your Package Locally

Before publishing, test your package locally:

```bash
# Create a tarball of your package
npm pack

# This creates a file like dreamhost-deployer-0.1.0.tgz
```

You can install this locally to test:

```bash
npm install -g ./dreamhost-deployer-0.1.0.tgz
```

### 4. Publish Your Package

Once you're satisfied with your package, publish it:

```bash
npm publish
```

If your package name is scoped (e.g., `@jakerains/dreamhost-deployer`), use:

```bash
npm publish --access public
```

## Updating Your Package

### 1. Update Your Code

Make your code changes and commit them to your repository.

### 2. Update CHANGELOG.md

Document your changes in `docs/CHANGELOG.md`:

```markdown
## [0.2.0] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Change description

### Fixed
- Bug fix description
```

### 3. Update Version Number

Update the version in `package.json` following [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.0.0): incompatible API changes
- **MINOR** version (0.1.0): add functionality in a backward-compatible manner
- **PATCH** version (0.0.1): backward-compatible bug fixes

You can use npm to update the version automatically:

```bash
# For patch updates (0.1.0 -> 0.1.1)
npm version patch

# For minor updates (0.1.0 -> 0.2.0)
npm version minor

# For major updates (0.1.0 -> 1.0.0)
npm version major
```

This will:
- Update the version in `package.json`
- Create a git commit with the new version
- Create a git tag for the version

### 4. Push Changes to GitHub

```bash
git push
git push --tags
```

### 5. Publish the Update

```bash
npm publish
```

## Publishing Beta/Release Candidates

For pre-release versions:

```bash
# Beta version
npm version 0.2.0-beta.0
npm publish --tag beta

# Release candidate
npm version 0.2.0-rc.0
npm publish --tag rc
```

Users can install these versions with:

```bash
npm install dreamhost-deployer@beta
npm install dreamhost-deployer@rc
```

## Managing Package Visibility

### Private Packages

To make a package private (requires npm paid account):

```bash
npm publish --access private
```

### Public Packages

To make a scoped package public:

```bash
npm publish --access public
```

## Deprecating a Version

If you need to deprecate a version:

```bash
npm deprecate dreamhost-deployer@"0.1.0" "Critical bug found, please update to 0.1.1"
```

## Unpublishing a Package

You can unpublish a version within 72 hours of publishing:

```bash
npm unpublish dreamhost-deployer@0.1.0
```

To unpublish the entire package (only if no dependents):

```bash
npm unpublish dreamhost-deployer --force
```

## Common Issues and Solutions

### Name Already Taken

If the package name is already taken, consider:
- Using a scoped name: `@jakerains/dreamhost-deployer`
- Choosing a different name

### Version Already Exists

You cannot publish over an existing version. Always increment the version number.

### Authentication Issues

If you encounter authentication issues:
1. Run `npm logout`
2. Run `npm login` again
3. Check your npm profile settings

## Useful npm Commands

```bash
# View package info
npm view dreamhost-deployer

# List all versions
npm view dreamhost-deployer versions

# Check who owns the package
npm owner ls dreamhost-deployer

# Add an owner
npm owner add username dreamhost-deployer

# Remove an owner
npm owner rm username dreamhost-deployer
```

## Best Practices

1. **Always update the CHANGELOG.md** with each release
2. **Follow Semantic Versioning** for version numbers
3. **Test your package locally** before publishing
4. **Create git tags** for each release
5. **Include comprehensive documentation**
6. **Set up CI/CD** for automated testing and publishing

## References

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm Package.json](https://docs.npmjs.com/cli/v8/configuring-npm/package-json) 