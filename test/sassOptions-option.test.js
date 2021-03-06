import path from 'path';

import semver from 'semver';
import nodeSass from 'node-sass';
import dartSass from 'sass';
import Fiber from 'fibers';

import {
  compile,
  getTestId,
  getCodeFromBundle,
  getCodeFromSass,
  getImplementationByName,
} from './helpers';
import customImporter from './helpers/customImporter';
import customFunctions from './helpers/customFunctions';

const implementations = [nodeSass, dartSass];
const syntaxStyles = ['scss', 'sass'];

describe('sassOptions option', () => {
  beforeEach(() => {
    // The `sass` (`Dart Sass`) package modify the `Function` prototype, but the `jest` lose a prototype
    Object.setPrototypeOf(Fiber, Function.prototype);
  });

  implementations.forEach((implementation) => {
    const [implementationName] = implementation.info.split('\t');

    syntaxStyles.forEach((syntax) => {
      it(`should work when the option like "Object" (${implementationName}) (${syntax})`, async () => {
        const testId = getTestId('language', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: {
            indentWidth: 10,
          },
        };
        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');
      });

      it(`should work when the option is empty "Object" (${implementationName}) (${syntax})`, async () => {
        const testId = getTestId('language', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: {},
        };
        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');
      });

      it(`should work when the option like "Function" (${implementationName}) (${syntax})`, async () => {
        expect.assertions(6);

        const testId = getTestId('language', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: (loaderContext) => {
            expect(loaderContext).toBeDefined();

            return {
              indentWidth: 10,
            };
          },
        };
        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');
      });

      it(`should work when the option like "Function" and never return (${implementationName}) (${syntax})`, async () => {
        expect.assertions(6);

        const testId = getTestId('language', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: (loaderContext) => {
            expect(loaderContext).toBeDefined();
          },
        };
        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');
      });

      it(`should work with the "importer" option (${implementationName}) (${syntax})`, async () => {
        const testId = getTestId('custom-importer', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: {
            importer: customImporter,
          },
        };
        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');
      });

      it(`should work with the "functions" option (${implementationName}) (${syntax})`, async () => {
        const testId = getTestId('custom-functions', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: {
            functions: customFunctions(implementation),
          },
        };
        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');
      });

      it(`should work with the "includePaths" option (${implementationName}) (${syntax})`, async () => {
        const testId = getTestId('import-include-paths', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: {
            includePaths: [path.resolve(__dirname, syntax, 'includePath')],
          },
        };
        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');
      });

      it(`should work with the "fiber" option (${implementationName}) (${syntax})`, async () => {
        const dartSassSpy = jest.spyOn(dartSass, 'render');
        const testId = getTestId('language', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: {},
        };

        if (
          implementationName === 'dart-sass' &&
          semver.satisfies(process.version, '>= 10')
        ) {
          // eslint-disable-next-line global-require
          options.sassOptions.fiber = Fiber;
        }

        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        if (
          implementationName === 'dart-sass' &&
          semver.satisfies(process.version, '>= 10')
        ) {
          expect(dartSassSpy.mock.calls[0][0]).toHaveProperty('fiber');
        }

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');

        dartSassSpy.mockRestore();
      });

      it(`should use the "fibers" package if it is possible (${implementationName}) (${syntax})`, async () => {
        const dartSassSpy = jest.spyOn(dartSass, 'render');
        const testId = getTestId('language', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: {},
        };

        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        if (
          implementationName === 'dart-sass' &&
          semver.satisfies(process.version, '>= 10')
        ) {
          expect(dartSassSpy.mock.calls[0][0]).toHaveProperty('fiber');
        }

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');

        dartSassSpy.mockRestore();
      });

      it(`should don't use the "fibers" package when the "fiber" option is "false" (${implementationName}) (${syntax})`, async () => {
        const dartSassSpy = jest.spyOn(dartSass, 'render');
        const testId = getTestId('language', syntax);
        const options = {
          implementation: getImplementationByName(implementationName),
          sassOptions: { fiber: false },
        };

        const stats = await compile(testId, { loader: { options } });
        const codeFromBundle = getCodeFromBundle(stats);
        const codeFromSass = getCodeFromSass(testId, options);

        if (
          implementationName === 'dart-sass' &&
          semver.satisfies(process.version, '>= 10')
        ) {
          expect(dartSassSpy.mock.calls[0][0]).not.toHaveProperty('fiber');
        }

        expect(codeFromBundle.css).toBe(codeFromSass.css);
        expect(codeFromBundle.css).toMatchSnapshot('css');
        expect(stats.compilation.warnings).toMatchSnapshot('warnings');
        expect(stats.compilation.errors).toMatchSnapshot('errors');

        dartSassSpy.mockRestore();
      });
    });
  });
});
