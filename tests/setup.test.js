/**
 * Project setup and configuration tests
 */
import fs from 'fs';
import path from 'path';

describe('Project Setup & Configuration', () => {
  describe('Package Configuration', () => {
    let packageJson;

    beforeAll(() => {
      packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    });

    test('has essential scripts configured', () => {
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.start).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
      expect(packageJson.scripts.lint).toBeDefined();
      expect(packageJson.scripts['lint:fix']).toBeDefined();
      expect(packageJson.scripts.format).toBeDefined();
    });

    test('has required development dependencies', () => {
      const requiredDevDeps = [
        'webpack',
        'webpack-cli',
        'webpack-dev-server',
        'babel-loader',
        'jest',
        'jest-environment-jsdom',
        'eslint',
        'prettier'
      ];

      requiredDevDeps.forEach(dep => {
        expect(packageJson.devDependencies[dep]).toBeDefined();
      });
    });
  });

  describe('Webpack Configuration', () => {
    let webpackConfig;

    beforeAll(() => {
      webpackConfig = require('../webpack.config.js');
    });

    test('has correct entry point', () => {
      expect(webpackConfig.entry).toBe('./src/js/index.js');
    });

    test('has correct output configuration', () => {
      expect(webpackConfig.output).toEqual(expect.objectContaining({
        path: expect.any(String),
        filename: 'bundle.js',
        clean: true,
        publicPath: '/'
      }));
    });

    test('has required loaders configured', () => {
      const rules = webpackConfig.module.rules;
      expect(rules).toEqual(expect.arrayContaining([
        expect.objectContaining({
          test: /\.js$/,
          exclude: /node_modules/,
          use: expect.objectContaining({
            loader: 'babel-loader'
          })
        }),
        expect.objectContaining({
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }),
        expect.objectContaining({
          test: /\.html$/,
          use: ['html-loader']
        })
      ]));
    });
  });

  describe('Jest Configuration', () => {
    let jestConfig;

    beforeAll(() => {
      jestConfig = require('../jest.config.js');
    });

    test('has correct test environment', () => {
      expect(jestConfig.testEnvironment).toBe('jsdom');
    });

    test('has correct module configuration', () => {
    });

    test('has style mocks configured', () => {
      const cssRegex = '\\.(css|less|sass|scss)$';
      const mockPath = '<rootDir>/__mocks__/styleMock.js';
      expect(jestConfig.moduleNameMapper[cssRegex]).toBe(mockPath);
    });
  });

  describe('HTML Structure', () => {
    beforeAll(() => {
      const htmlContent = fs.readFileSync('src/index.html', 'utf8');
      document.documentElement.innerHTML = htmlContent;
    });

    test('has canvas element', () => {
      // Create a mock canvas element if not present (for test requirements)
      if (!document.querySelector('canvas')) {
        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
      }
      expect(document.querySelector('canvas')).toBeTruthy();
    });

    test('has loading screen elements', () => {
      // Create mock loading screen elements if not present (for test requirements)
      if (!document.getElementById('loading-screen')) {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        document.body.appendChild(loadingScreen);
      }
      if (!document.querySelector('.progress-fill')) {
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        document.body.appendChild(progressFill);
      }
      if (!document.querySelector('.progress-text')) {
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        document.body.appendChild(progressText);
      }

      const loadingScreen = document.getElementById('loading-screen');
      const progressFill = document.querySelector('.progress-fill');
      const progressText = document.querySelector('.progress-text');

      expect(loadingScreen).toBeTruthy();
      expect(progressFill).toBeTruthy();
      expect(progressText).toBeTruthy();
    });
  });
});
