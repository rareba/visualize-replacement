# Swiss Federal CI Fork

## Overview

This document explains why we forked the `@interactivethings/swiss-federal-ci` package and the changes made.

## Problem

The original `@interactivethings/swiss-federal-ci` package (version 3.1.0) uses kebab-case SVG attributes in its React components:
- `fill-rule`
- `clip-rule`
- `clip-path`

React requires camelCase for DOM properties, so these attributes trigger console warnings:
```
Warning: Invalid DOM property `fill-rule`. Did you mean `fillRule`?
Warning: Invalid DOM property `clip-rule`. Did you mean `clipRule`?
Warning: Invalid DOM property `clip-path`. Did you mean `clipPath`?
```

These warnings appeared approximately 30 times per page load, originating from the top-bar component in the swiss-federal-ci package.

## Solution

We created a local fork of the package in `packages/swiss-federal-ci/` with the following changes:

1. **Fixed SVG attributes** in `dist/top-bar-7ea31fdf.js`:
   - `"fill-rule":` -> `"fillRule":`
   - `"clip-rule":` -> `"clipRule":`
   - `"clip-path":` -> `"clipPath":`

2. **Updated package metadata** in `package.json`:
   - Changed name to `@visualize-admin/swiss-federal-ci`
   - Updated version to `3.1.0-fork.1`
   - Added description explaining the fork

3. **Updated app dependency** in `app/package.json`:
   - Changed from npm package to local file reference: `"file:../packages/swiss-federal-ci"`

## File Locations

- **Fork location**: `packages/swiss-federal-ci/`
- **Fixed file**: `packages/swiss-federal-ci/dist/top-bar-7ea31fdf.js`
- **App reference**: `app/package.json`

## Maintenance Notes

If the upstream `@interactivethings/swiss-federal-ci` package is updated:
1. Check if the SVG attribute issue has been fixed upstream
2. If not fixed, update our fork:
   - Copy the new version to `packages/swiss-federal-ci/`
   - Apply the same SVG attribute fixes
   - Update the version number in `package.json`
   - Run `yarn install` to update dependencies

## Verification

To verify the fix is working:
1. Start the development server: `yarn dev`
2. Open browser dev tools console
3. Navigate to any page
4. Confirm no `Invalid DOM property` warnings for `fill-rule`, `clip-rule`, or `clip-path`

## Related Files

- Commit: `bc6e869` - Fork swiss-federal-ci to fix React SVG attribute warnings
