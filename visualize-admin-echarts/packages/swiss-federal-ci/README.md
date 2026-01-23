# Swiss Federal CI

This is a library that contains React components that adhere to the corporate identity guidelines of the Swiss Confederation.

## Installing

To install and use in your project, run `npm install @interactivethings/swiss-federal-ci`. The package uses ES modules, so it can be used both in the Node.js environment as well as directly in the browser with `type="module"`.

```ts
import { CookieBanner } from "@interactivethings/swiss-federal-ci/dist/components";

return <CookieBanner />;
```

> ⚠️ The package requires that the app it's imported into contains the packages specified in `peerDependencies`. This means that it is compatible with Next.js apps that use Material UI.

### App router vs Pages router

The library supports both app and pages routers, which means that for some components that require router-specific logic you need to import the appropriate version depending on the router you use.

```ts
// App router
import { LocaleSwitcher } from "@interactivethings/swiss-federal-ci/dist/components/app-router";

const App = () => {
  return <LocaleSwitcher locales={["de", "en", "fr", "it", "rm"]} />;
};
```

```ts
// Pages router
import { LocaleSwitcher } from "@interactivethings/swiss-federal-ci/dist/components/pages-router";

const App = () => {
  return <LocaleSwitcher locales={["de", "en", "fr", "it", "rm"]} />;
};
```

For components that don't require router-specific logic, you can import them directly from the main package.

```ts
import { Footer } from "@interactivethings/swiss-federal-ci/dist/components";

return <Footer />;
```

## Contributing

Before contributing, please read the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## Development

First, run the `yarn install` command to install the dependencies.

In this project, Storybook is used both as a documentation site and as an environment to develop and test the components. Run the `yarn storybook` command to start the Storybook server.

Automated screenshots are made from the storybook and [uploaded to Argos](https://app.argos-ci.com/interactive-things/swiss-federal-ci)
for regression testing.

## Publishing

Publishing is done automatically through `semantic-release` via a GitHub action job,
from the branch main. Commit prefixes will trigger different types of versions
and we use the default commit analyzer.

- 'fix:' commits will trigger a patch version
- 'feat:' commits will trigger a minor version
- 'BREAKING CHANGE:' in the body of a commit will trigger a major version

`semantic-release` also automatically updates `CHANGELOG.md` when a new version is published.
