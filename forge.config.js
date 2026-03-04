module.exports = {
  packagerConfig: {
    name: "Sharkord Desktop",
    icon: "public/icon",
    asar: true
  },
  rebuildConfig: {
    force: true
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
      }
    }
  ]
};
