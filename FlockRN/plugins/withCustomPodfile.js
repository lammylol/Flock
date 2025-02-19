// This file enforces podfile to use_frameworks! :linkage => :static each time ios project is cleaned or rebuilt. 
// Referenced in app.json

const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withCustomPodfile(config) {
  return withDangerousMod(config, ["ios", (config) => {
    const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");

    if (fs.existsSync(podfilePath)) {
      let podfile = fs.readFileSync(podfilePath, "utf-8");

      // Remove existing `use_frameworks!` lines that reference variables
      podfile = podfile.replace(
        /use_frameworks! :linkage => podfile_properties\['ios.useFrameworks'\]\.to_sym if podfile_properties\['ios.useFrameworks'\]\n?/g,
        ""
      );
      podfile = podfile.replace(
        /use_frameworks! :linkage => ENV\['USE_FRAMEWORKS'\]\.to_sym if ENV\['USE_FRAMEWORKS'\]\n?/g,
        ""
      );

      // Ensure "use_frameworks! :linkage => :static" is present
      if (!podfile.includes("use_frameworks! :linkage => :static")) {
        podfile = podfile.replace(
          "use_expo_modules!", 
          "use_expo_modules!\n  use_frameworks! :linkage => :static"
        );
      }

      fs.writeFileSync(podfilePath, podfile);
    }
    
    return config;
  }]);
};