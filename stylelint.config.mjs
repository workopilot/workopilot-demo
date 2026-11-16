export default {
  extends: ['@vben/stylelint-config'],
  overrides: [
    {
      files: ['*.css', '**/*.css'],
      rules: {
        'selector-pseudo-class-no-unknown': [
          true,
          {
            ignorePseudoClasses: ['global', 'deep', 'slotted'],
          },
        ],
        'selector-pseudo-element-no-unknown': [
          true,
          {
            ignorePseudoElements: ['v-deep', 'v-global', 'v-slotted'],
          },
        ],
      },
    },
  ],
  root: true,
};
