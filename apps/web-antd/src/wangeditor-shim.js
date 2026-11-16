/* eslint-disable no-var, vars-on-top, prefer-rest-params, eqeqeq, @typescript-eslint/no-this-alias, no-cond-assign, unicorn/no-this-assignment */
import * as t from 'vue';

import {
  createEditor as e,
  DomEditor as o,
  createToolbar as r,
} from '@wangeditor/editor';
/* ! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */ let n =
  function () {
    return (
      (n =
        Object.assign ||
        function (t) {
          for (var e, o = 1, r = arguments.length; o < r; o++)
            for (const n in (e = arguments[o]))
              Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
          return t;
        }),
      Reflect.apply(n, this, arguments)
    );
  };
function i(t) {
  let e = "请使用 '@".concat(t, "' 事件，不要放在 props 中");
  return (e += "\nPlease use '@".concat(t, "' event instead of props"));
}
const a = t.extend({
  render(t) {
    return t('div', { ref: 'box' });
  },
  name: 'Editor',
  data() {
    return { curValue: '', editor: null };
  },
  props: ['defaultContent', 'defaultConfig', 'mode', 'defaultHtml', 'value'],
  mounted() {
    this.create();
  },
  watch: {
    value(t) {
      t === this.curValue || this.setHtml(t);
    },
  },
  methods: {
    setHtml(t) {
      const e = this.editor;
      e != null && e.setHtml(t);
    },
    create() {
      const t = this;
      if (this.$refs.box != null) {
        const o = this.defaultConfig || {};
        const r = JSON.stringify(
          Array.isArray(this.defaultContent) ? this.defaultContent : [],
        );
        e({
          selector: this.$refs.box,
          html: this.defaultHtml || this.value || '',
          config: n(n({}, o), {
            onCreated(e) {
              if (
                ((t.editor = Object.seal(e)),
                t.$emit('onCreated', e),
                o.onCreated)
              ) {
                const r = i('onCreated');
                throw new Error(r);
              }
            },
            onChange(e) {
              const r = e.getHtml();
              if (
                ((t.curValue = r),
                t.$emit('input', r),
                t.$emit('onChange', e),
                o.onChange)
              ) {
                const n = i('onChange');
                throw new Error(n);
              }
            },
            onDestroyed(e) {
              if ((t.$emit('onDestroyed', e), o.onDestroyed)) {
                const r = i('onDestroyed');
                throw new Error(r);
              }
            },
            onMaxLength(e) {
              if ((t.$emit('onMaxLength', e), o.onMaxLength)) {
                const r = i('onMaxLength');
                throw new Error(r);
              }
            },
            onFocus(e) {
              if ((t.$emit('onFocus', e), o.onFocus)) {
                const r = i('onFocus');
                throw new Error(r);
              }
            },
            onBlur(e) {
              if ((t.$emit('onBlur', e), o.onBlur)) {
                const r = i('onBlur');
                throw new Error(r);
              }
            },
            customAlert(e, r) {
              if ((t.$emit('customAlert', e, r), o.customAlert)) {
                const n = i('customAlert');
                throw new Error(n);
              }
            },
            customPaste(e, r) {
              if (o.customPaste) {
                const n = i('customPaste');
                throw new Error(n);
              }
              let a;
              return (
                t.$emit('customPaste', e, r, (t) => {
                  a = t;
                }),
                a
              );
            },
          }),
          content: JSON.parse(r),
          mode: this.mode || 'default',
        });
      }
    },
  },
});
const u = t.extend({
  name: 'Toolbar',
  render(t) {
    return t('div', { ref: 'box' });
  },
  props: ['editor', 'defaultConfig', 'mode'],
  methods: {
    create(t) {
      this.$refs.box != null &&
        t != null &&
        (o.getToolbar(t) ||
          r({
            editor: t,
            selector: this.$refs.box,
            config: this.defaultConfig || {},
            mode: this.mode || 'default',
          }));
    },
  },
  watch: {
    editor: {
      handler(t) {
        t != null && this.create(t);
      },
      immediate: !0,
    },
  },
});
export { a as Editor, u as Toolbar };
// # sourceMappingURL=index.esm.js.map
