/** Scope the bundled vendor palettes so both can coexist without runtime loads. */
module.exports = () => ({
  postcssPlugin: "theme-scope",
  Once(root) {
    root.walkRules((rule) => {
      const file = rule.source?.input.file?.replace(/\\/g, "/") ?? "";
      let theme;
      if (/\/gitalk-react\/dist\/gitalk-(light|dark)\.css$/.test(file)) {
        theme = file.endsWith("gitalk-light.css") ? "light" : "dark";
      } else if (
        /\/prismjs\/themes\/prism(?:-tomorrow)?\.min\.css$/.test(file)
      ) {
        theme = file.endsWith("prism.min.css") ? "light" : "dark";
      }
      if (!theme) return;
      // Animation steps aren't selectors and must not receive a theme prefix.
      if (rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name))
        return;
      rule.selectors = rule.selectors.map(
        (selector) => `html[data-theme="${theme}"] ${selector}`,
      );
    });
  },
});
module.exports.postcss = true;
