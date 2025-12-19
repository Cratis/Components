module.exports = {
  stories: ['../**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  core: { builder: '@storybook/builder-vite' },
  staticDirs: ['../public']
};
